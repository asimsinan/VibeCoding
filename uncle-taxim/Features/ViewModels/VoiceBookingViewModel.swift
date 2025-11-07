import Foundation
import Combine
import SwiftUI
import AVFoundation
import Speech
import FirebaseAuth
import FirebaseFirestore

class VoiceBookingViewModel: BaseViewModel {
    @Published var isRecording: Bool = false
    @Published var voiceResult: VoiceProcessResponse?
    @Published var isProcessing: Bool = false
    @Published var recognizedText: String = ""
    @Published var bookingSuccess: Bool = false
    @Published var bookingMessage: String?
    @Published var currentRide: Ride? // Store the booked ride
    @Published var currentDriver: Driver? // Store the driver info for the current ride
    @Published var savedAddresses: [SavedAddress] = [] // Saved addresses for quick selection
    @Published var showActiveRideAlert: Bool = false // Alert when trying to book with active ride
    @Published var pendingBookingRequest: VoiceProcessResponse? // Store booking request when blocked by active ride
    @Published var showPaymentMethodRequiredAlert: Bool = false // Alert when no payment method is available
    @Published var currentSuggestion: RideSuggestion? // Store the created suggestion with waypoints for map display
    
    private var currentSuggestionId: String? // Store the ID of the suggestion we just created
    
    private let voiceService: VoiceProcessingServiceProtocol
    private let dataService: FirebaseDataService
    private var audioEngine: AVAudioEngine?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    // Supported languages for voice recognition
    enum VoiceLanguage: String, CaseIterable {
        case english = "en-US"
        case turkish = "tr-TR"
        
        var displayName: String {
            switch self {
            case .english:
                return "English"
            case .turkish:
                return "Türkçe"
            }
        }
        
        var locale: Locale {
            Locale(identifier: self.rawValue)
        }
    }
    
    // User-selected language for voice recognition (defaults to device language or English)
    @Published var selectedLanguage: VoiceLanguage = {
        // Check if user has a saved preference
        if let savedLanguage = UserDefaults.standard.string(forKey: "voiceRecognitionLanguage"),
           let language = VoiceLanguage(rawValue: savedLanguage) {
            return language
        }
        // Otherwise, try to detect from device language
        let preferredLocale = Locale.preferredLanguages.first ?? "en-US"
        if preferredLocale.hasPrefix("tr") {
            return .turkish
        }
        return .english
    }()
    
    // Support multiple languages: English and Turkish
    // Note: Turkish support depends on device model and iOS version
    // On-device recognition may not be available for Turkish on older devices
    private var speechRecognizer: SFSpeechRecognizer? {
        // Use the user-selected language
        let locale = selectedLanguage.locale
        if let recognizer = SFSpeechRecognizer(locale: locale) {
            // Check if the selected language is available
            if recognizer.isAvailable {
                return recognizer
            }
            // Even if not available on-device, it might work with internet
            // Return it anyway - the system will handle fallback
            return recognizer
        }
        
        // Fallback: try the other language
        let fallbackLanguage: VoiceLanguage = selectedLanguage == .turkish ? .english : .turkish
        if let fallbackRecognizer = SFSpeechRecognizer(locale: fallbackLanguage.locale) {
            return fallbackRecognizer
        }
        
        // Last resort: return default recognizer
        return SFSpeechRecognizer()
    }
    
    // Current language being used for recognition (computed from selectedLanguage)
    var currentLanguage: String {
        selectedLanguage.rawValue
    }
    
    /// Change the voice recognition language
    func setLanguage(_ language: VoiceLanguage) {
        selectedLanguage = language
        UserDefaults.standard.set(language.rawValue, forKey: "voiceRecognitionLanguage")
    }
    private var recordingStartTime: Date?
    private var rideStatusListener: ListenerRegistration?
    
    /// Load active ride for the current user
    func loadActiveRide() {
        guard let userId = Auth.auth().currentUser?.uid else {
            return
        }
        
        Task {
            do {
                let rides = try await dataService.getUserRides(userId: userId)
                // Find the most recent active ride (pending, accepted, or in_progress)
                // Sort by createdAt descending to get the most recent one first
                let activeRide = rides
                    .filter { ride in
                        ride.status == .pending || ride.status == .accepted || ride.status == .inProgress
                    }
                    .sorted(by: { $0.createdAt > $1.createdAt })
                    .first
                
                await MainActor.run {
                    self.currentRide = activeRide
                    if let ride = activeRide {
                        #if DEBUG
                        print("✅ [DEBUG] VoiceBookingViewModel - Loaded active ride: ID=\(ride.id ?? "nil"), Status=\(ride.status)")
                        #endif
                        
                        // Load driver info if driver is assigned
                        if let driverId = ride.driverId {
                            Task {
                                await loadDriverInfo(driverId: driverId)
                            }
                        }
                    }
                }
            } catch {
                print("❌ [ERROR] VoiceBookingViewModel - Failed to load active ride: \(error)")
            }
        }
    }
    
    /// Load driver information for the current ride
    func loadDriverInfo(driverId: String) async {
        do {
            let driver = try await dataService.getDriver(driverId: driverId)
            await MainActor.run {
                self.currentDriver = driver
            }
        } catch {
            // Error loading driver info - silently fail
        }
    }
    
    /// Load saved addresses for quick selection
    func loadSavedAddresses() {
        guard let userId = Auth.auth().currentUser?.uid else {
            return
        }
        
        Task {
            do {
                let addresses = try await dataService.getSavedAddresses(userId: userId)
                await MainActor.run {
                    self.savedAddresses = addresses
                }
            } catch {
                // Error loading saved addresses - silently fail
            }
        }
    }
    
    /// Find saved address by name or address (case-insensitive, partial match)
    private func findSavedAddress(by locationString: String) -> SavedAddress? {
        let lowercasedString = locationString.lowercased().trimmingCharacters(in: .whitespaces)
        return savedAddresses.first { address in
            // Match by name
            address.name.lowercased() == lowercasedString ||
            address.name.lowercased().contains(lowercasedString) ||
            lowercasedString.contains(address.name.lowercased()) ||
            // Match by address
            address.address.lowercased() == lowercasedString ||
            address.address.lowercased().contains(lowercasedString) ||
            lowercasedString.contains(address.address.lowercased())
        }
    }
    
    /// Resolve location string to LocationWithAddress, checking saved addresses first
    private func resolveLocation(_ locationString: String?) -> LocationWithAddress? {
        guard let locationString = locationString else { return nil }
        
        // Check if it's a saved address name
        if let savedAddress = findSavedAddress(by: locationString) {
            return savedAddress.toLocationWithAddress()
        }
        
        return nil
    }
    
    /// Sets up real-time listener for ride status changes (when driver accepts)
    private func setupRideStatusListener(rideId: String?) {
        guard let rideId = rideId else { return }
        
        // Remove existing listener
        rideStatusListener?.remove()
        
        // Add a small delay to ensure the document is fully committed
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
            
            let db = Firestore.firestore()
            rideStatusListener = db.collection("rides").document(rideId)
                .addSnapshotListener { [weak self] snapshot, error in
                    guard let self = self else { return }
                    
                    if let error = error {
                        // Log error but don't update UI synchronously
                        Task { @MainActor in
                            // Only log permission errors, don't show to user as it's expected during setup
                            if let nsError = error as NSError?,
                               nsError.domain == "FIRFirestoreErrorDomain",
                               nsError.code == 7 {
                                // Permission denied - this might happen if document doesn't exist yet
                                // or user doesn't have access. Silently handle it.
                                return
                            }
                        }
                        return
                    }
                    
                    guard let snapshot = snapshot,
                          snapshot.exists,
                          let ride = try? snapshot.data(as: Ride.self) else {
                        return
                    }
                    
                    Task { @MainActor in
                        // Update current ride
                        self.currentRide = ride
                        
                        // If driver was just assigned, load driver info
                        if let driverId = ride.driverId,
                           self.currentDriver == nil {
                            await self.loadDriverInfo(driverId: driverId)
                        }
                        
                        // Update ride status
                    }
                }
        }
    }
    
    deinit {
        rideStatusListener?.remove()
    }
    
    init(
        voiceService: VoiceProcessingServiceProtocol? = nil,
        dataService: FirebaseDataService? = nil
    ) {
        let aiGateway = AIGatewayService()
        self.voiceService = voiceService ?? VoiceProcessingService(aiGateway: aiGateway)
        self.dataService = dataService ?? FirebaseDataService()
        super.init()
        setupAudioSession()
    }
    
    private func setupAudioSession() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playAndRecord, mode: .default)
            try audioSession.setActive(true)
        } catch {
            // Error setting up audio session - silently fail
        }
    }
    
    @MainActor
    func startRecording() {
        
        // Request speech recognition permission first
        SFSpeechRecognizer.requestAuthorization { [weak self] authStatus in
            guard let self = self else { return }
            
            Task { @MainActor in
                switch authStatus {
                case .authorized:
                    // Request microphone permission
                    AVAudioSession.sharedInstance().requestRecordPermission { granted in
                        if granted {
                            Task { @MainActor in
                                await self.startSpeechRecognition()
                            }
                        } else {
                            Task { @MainActor in
                                self.errorMessage = "Microphone permission denied. Please enable it in Settings."
                            }
                        }
                    }
                case .denied, .restricted, .notDetermined:
                    self.errorMessage = "Speech recognition permission denied. Please enable it in Settings."
                @unknown default:
                    self.errorMessage = "Unknown speech recognition authorization status"
                }
            }
        }
    }
    
    @MainActor
    private func startSpeechRecognition() async {
        
        // Cancel any existing recognition task
        recognitionTask?.cancel()
        recognitionTask = nil
        
        // Stop and reset audio engine if it exists
        if let existingEngine = audioEngine {
            existingEngine.stop()
            existingEngine.inputNode.removeTap(onBus: 0)
        }
        audioEngine = nil
        
        // Reset recognized text
        recognizedText = ""
        errorMessage = nil
        
        do {
            // Ensure audio session is active
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
            
            // Create audio engine
            let audioEngine = AVAudioEngine()
            self.audioEngine = audioEngine
            
            // Get recognizer first to ensure it's available and to set the language
            guard let recognizer = speechRecognizer, recognizer.isAvailable else {
                errorMessage = "Speech recognizer is not available. Please check your language settings."
                audioEngine.stop()
                audioEngine.inputNode.removeTap(onBus: 0)
                isRecording = false
                return
            }
            
            // Update selected language to match the recognizer's locale (if different)
            let recognizerLocaleId = recognizer.locale.identifier
            if let language = VoiceLanguage(rawValue: recognizerLocaleId),
               language != selectedLanguage {
                // Only update if the recognizer is using a different language than selected
                // This can happen if the selected language isn't available and it fell back
            }
            
            // Create recognition request
            // Note: The locale is automatically set by the recognizer when creating the recognition task
            let recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
            recognitionRequest.shouldReportPartialResults = true
            self.recognitionRequest = recognitionRequest
            
            // Get audio input node
            let inputNode = audioEngine.inputNode
            let recordingFormat = inputNode.outputFormat(forBus: 0)
            
            // Install tap on input node (must be done before starting engine)
            inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
                guard let self = self else { return }
                // Always append - the recognition request will handle if it's ended
                self.recognitionRequest?.append(buffer)
            }
            
            // Prepare and start audio engine
            audioEngine.prepare()
            try audioEngine.start()
            
            // Set recording state BEFORE starting recognition task
            isRecording = true
            recordingStartTime = Date()
            
            recognitionTask = recognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
                guard let self = self else { return }
                
                if let result = result {
                    Task { @MainActor in
                        self.recognizedText = result.bestTranscription.formattedString
                        
                        // Check 
                    }
                }
                
                if let error = error {
                    Task { @MainActor in
                        let nsError = error as NSError
                        
                        // Don't stop recording for cancellation errors (user stopped intentionally)
                        if nsError.code == 216 || nsError.code == 1700 {
                            // Cancellation or recognition not available - user likely stopped
                            return
                        }
                        
                        // Handle "no speech detected" error (code 1110)
                        if nsError.code == 1110 && nsError.domain == "kAFAssistantErrorDomain" {
                            // Don't set error message for this - it's expected if user didn't speak
                            // The stopRecording() method will handle showing appropriate message
                            return
                        }
                        
                        // Only show error if we're still supposed to be recording
                        if self.isRecording {
                            self.errorMessage = "Recognition error: \(error.localizedDescription)"
                            self.isRecording = false
                        }
                    }
                }
            }
        } catch {
            errorMessage = "Failed to start speech recognition: \(error.localizedDescription)"
            isRecording = false
        }
    }
    
    @MainActor
    func cancelRecording() {
        guard isRecording else {
            return
        }
        
        // Mark as stopping immediately
        isRecording = false
        
        // Cancel recognition task immediately (don't wait for results)
        recognitionTask?.cancel()
        recognitionTask = nil
        
        // Stop recognition request
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        
        // Stop audio engine immediately
        audioEngine?.stop()
        audioEngine?.inputNode.removeTap(onBus: 0)
        audioEngine = nil
        
        // Clear recognized text and reset state
        recognizedText = ""
        isProcessing = false
        isLoading = false
        errorMessage = nil
    }
    
    @MainActor
    func stopRecording() {
        
        guard isRecording else {
            return
        }
        
        // Prevent stopping immediately after starting (within 0.5 seconds)
        if let startTime = recordingStartTime {
            let elapsed = Date().timeIntervalSince(startTime)
            if elapsed < 0.5 {
                return
            }
        }
        
        
        // Mark as stopping first
        isRecording = false
        
        // Stop recognition request (this will trigger final results)
        recognitionRequest?.endAudio()
        
        // Give a moment for final recognition results
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
            
            // Stop audio engine
            audioEngine?.stop()
            audioEngine?.inputNode.removeTap(onBus: 0)
            audioEngine = nil
            
            // Clean up recognition
            recognitionRequest = nil
            recognitionTask?.cancel()
            recognitionTask = nil
            
            // Process the recognized text
            if !recognizedText.isEmpty {
                processRecognizedText(recognizedText)
            } else {
                errorMessage = "No speech was detected. Please speak clearly into the microphone and try again."
                // Reset processing state
                isProcessing = false
                isLoading = false
            }
        }
    }
    
    @MainActor
    func processRecognizedText(_ text: String) {
        // Clear previous suggestion when starting a new voice command
        currentSuggestion = nil
        currentSuggestionId = nil
        
        guard let userId = Auth.auth().currentUser?.uid else {
            errorMessage = "User not authenticated. Please sign in."
            return
        }
        
        isProcessing = true
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                // Send the transcribed text to the AI service for intent/entity extraction
                // The AI service will automatically detect and handle Turkish or English text
                
                // Use AIGatewayService to extract ride booking information
                let aiGateway = AIGatewayService()
                var voiceResponse = try await aiGateway.extractRideBookingInfo(from: text, userId: userId)
                
                print("🔍 [DEBUG] processRecognizedText - Voice response received")
                print("🔍 [DEBUG] Voice response entities pickup: \(voiceResponse.entities?.pickupLocation ?? "nil")")
                print("🔍 [DEBUG] Voice response entities dropoff: \(voiceResponse.entities?.dropoffLocation ?? "nil")")
                print("🔍 [DEBUG] Voice response entities waypoints: \(voiceResponse.entities?.waypoints ?? [])")
                
                // Resolve saved addresses if entities contain location names
                if var entities = voiceResponse.entities {
                    // Check if pickup location matches a saved address
                    if let pickupLocation = entities.pickupLocation,
                       let resolvedPickup = resolveLocation(pickupLocation) {
                        entities.pickupLocation = resolvedPickup.address
                    }
                    
                    // Check if dropoff location matches a saved address
                    if let dropoffLocation = entities.dropoffLocation,
                       let resolvedDropoff = resolveLocation(dropoffLocation) {
                        entities.dropoffLocation = resolvedDropoff.address
                    }
                    
                    // Update voice response with resolved entities
                    voiceResponse.entities = entities
                    print("🔍 [DEBUG] After resolving saved addresses, waypoints: \(entities.waypoints ?? [])")
                }
                
                
                
                // Create a RideSuggestion automatically when entities are extracted
                // This makes the suggestion appear in Tab 2 (Suggestions)
                if var entities = voiceResponse.entities,
                   let dropoffLocation = entities.dropoffLocation {
                    // If pickup location is not specified, default to "Current Location"
                    if entities.pickupLocation == nil || entities.pickupLocation?.isEmpty == true {
                        entities.pickupLocation = "Current Location"
                        print("✅ [DEBUG] VoiceBookingViewModel - Pickup location not specified, using Current Location")
                    }
                    // Update voice response with defaulted pickup location
                    voiceResponse.entities = entities
                    await createRideSuggestionFromEntities(entities: entities, userId: userId)
                }
                
                await MainActor.run {
                    self.voiceResult = voiceResponse
                    print("🔍 [DEBUG] Stored voiceResult with waypoints: \(voiceResponse.entities?.waypoints ?? [])")
                    print("🔍 [DEBUG] currentSuggestion waypoints: \(self.currentSuggestion?.waypoints.count ?? 0)")
                    self.isProcessing = false
                    self.handleSuccess()
                }
            } catch {
                
                await MainActor.run {
                    self.isProcessing = false
                    
                    // Provide user-friendly error message
                    if let networkError = error as? NetworkError {
                        switch networkError {
                        case .httpError(let code):
                            if code == 405 {
                                self.errorMessage = "Voice processing endpoint not available. The API may not support voice processing yet."
                            } else if code == 401 {
                                self.errorMessage = "Authentication failed. Please check your API configuration."
                            } else {
                                self.errorMessage = "Server error (code \(code)). Please try again later."
                            }
                        case .apiError(let message, let code):
                            self.errorMessage = "API error: \(message)"
                        default:
                            self.errorMessage = error.localizedDescription
                        }
                    } else {
                        self.errorMessage = "Failed to process voice command: \(error.localizedDescription)"
                    }
                    
                    self.handleError(error)
                }
            }
        }
    }
    
    // MARK: - Suggestion Creation
    
    /// Creates a RideSuggestion from extracted entities
    private func createRideSuggestionFromEntities(entities: VoiceProcessEntities, userId: String) async {
        guard let dropoffLocation = entities.dropoffLocation else {
            return
        }
        
        do {
            let pickupAddress = entities.pickupLocation ?? "Current Location"
            
            // Geocode addresses to get coordinates
            let locationService = LocationService()
            
            var pickupLocation: LocationWithAddress
            var dropoffLocationWithCoords: LocationWithAddress
            
            // Check if pickup is "Current Location" - use GPS
            if pickupAddress.lowercased() == "current location" {
                do {
                    if let currentLocation = try await locationService.getCurrentLocation() {
                        pickupLocation = currentLocation
                    } else {
                        pickupLocation = LocationWithAddress(
                            latitude: 0.0,
                            longitude: 0.0,
                            address: pickupAddress
                        )
                    }
                } catch {
                    pickupLocation = LocationWithAddress(
                        latitude: 0.0,
                        longitude: 0.0,
                        address: pickupAddress
                    )
                }
            } else if let savedPickup = findSavedAddress(by: pickupAddress) {
                // Check if pickup is a saved address
                pickupLocation = savedPickup.toLocationWithAddress()
                // Validate saved address has valid coordinates
                if pickupLocation.latitude == 0.0 || pickupLocation.longitude == 0.0 {
                    // Saved address has invalid coordinates, try to geocode the address
                    do {
                        if let geocoded = try await locationService.geocodeAddress(savedPickup.address) {
                            pickupLocation = geocoded
                            // Update the saved address with valid coordinates if geocoding succeeds
                            if geocoded.latitude != 0.0 && geocoded.longitude != 0.0 {
                                var updatedAddress = savedPickup
                                updatedAddress.latitude = geocoded.latitude
                                updatedAddress.longitude = geocoded.longitude
                                updatedAddress.address = geocoded.address // Update with normalized address
                                updatedAddress.updatedAt = Date()
                                // Update in Firestore (fire and forget)
                                Task {
                                    try? await dataService.updateSavedAddress(updatedAddress)
                                }
                            }
                        }
                    } catch {
                        // If geocoding fails, we'll validate later
                    }
                }
            } else {
                // Geocode the address
                do {
                    if let geocodedPickup = try await locationService.geocodeAddress(pickupAddress) {
                        pickupLocation = geocodedPickup
                    } else {
                        pickupLocation = LocationWithAddress(
                            latitude: 0.0,
                            longitude: 0.0,
                            address: pickupAddress
                        )
                    }
                } catch {
                    pickupLocation = LocationWithAddress(
                        latitude: 0.0,
                        longitude: 0.0,
                        address: pickupAddress
                    )
                }
            }
            
            // Check if dropoff is a saved address first
            if let savedDropoff = findSavedAddress(by: dropoffLocation) {
                dropoffLocationWithCoords = savedDropoff.toLocationWithAddress()
                // Validate saved address has valid coordinates
                if dropoffLocationWithCoords.latitude == 0.0 || dropoffLocationWithCoords.longitude == 0.0 {
                    // Saved address has invalid coordinates, try to geocode the address
                    do {
                        if let geocoded = try await locationService.geocodeAddress(savedDropoff.address) {
                            dropoffLocationWithCoords = geocoded
                            // Update the saved address with valid coordinates if geocoding succeeds
                            // This helps fix addresses that were saved with invalid coordinates
                            if geocoded.latitude != 0.0 && geocoded.longitude != 0.0 {
                                var updatedAddress = savedDropoff
                                updatedAddress.latitude = geocoded.latitude
                                updatedAddress.longitude = geocoded.longitude
                                updatedAddress.address = geocoded.address // Update with normalized address
                                updatedAddress.updatedAt = Date()
                                // Update in Firestore (fire and forget)
                                Task {
                                    try? await dataService.updateSavedAddress(updatedAddress)
                                }
                            }
                        }
                    } catch {
                        // If geocoding fails, we'll validate later
                    }
                }
            } else {
                do {
                    if let geocodedDropoff = try await locationService.geocodeAddress(dropoffLocation) {
                        dropoffLocationWithCoords = geocodedDropoff
                    } else {
                        dropoffLocationWithCoords = LocationWithAddress(
                            latitude: 0.0,
                            longitude: 0.0,
                            address: dropoffLocation
                        )
                    }
                } catch {
                    dropoffLocationWithCoords = LocationWithAddress(
                        latitude: 0.0,
                        longitude: 0.0,
                        address: dropoffLocation
                    )
                }
            }
            
            // Validate coordinates before creating suggestion
            guard pickupLocation.latitude != 0.0 && pickupLocation.longitude != 0.0,
                  dropoffLocationWithCoords.latitude != 0.0 && dropoffLocationWithCoords.longitude != 0.0 else {
                return
            }
            
            // Geocode waypoints if provided
            var waypointLocations: [LocationWithAddress] = []
            print("🔍 [DEBUG] createSuggestionFromVoiceResult - Checking for waypoints in entities")
            print("🔍 [DEBUG] entities.waypoints: \(entities.waypoints ?? [])")
            if let waypointAddresses = entities.waypoints, !waypointAddresses.isEmpty {
                print("🔍 [DEBUG] Found \(waypointAddresses.count) waypoint addresses: \(waypointAddresses)")
                for waypointAddress in waypointAddresses {
                    print("🔍 [DEBUG] Processing waypoint: \(waypointAddress)")
                    // Check if waypoint is a saved address
                    if let savedWaypoint = findSavedAddress(by: waypointAddress) {
                        print("🔍 [DEBUG] Waypoint found in saved addresses")
                        var waypointLocation = savedWaypoint.toLocationWithAddress()
                        // Validate and geocode if needed
                        if waypointLocation.latitude == 0.0 || waypointLocation.longitude == 0.0 {
                            print("🔍 [DEBUG] Waypoint has invalid coordinates, geocoding...")
                            if let geocoded = try? await locationService.geocodeAddress(savedWaypoint.address) {
                                waypointLocation = geocoded
                                print("🔍 [DEBUG] Geocoded waypoint: \(geocoded.address) at (\(geocoded.latitude), \(geocoded.longitude))")
                            }
                        }
                        if waypointLocation.latitude != 0.0 && waypointLocation.longitude != 0.0 {
                            waypointLocations.append(waypointLocation)
                            print("🔍 [DEBUG] Added waypoint location: \(waypointLocation.address)")
                        } else {
                            print("⚠️ [DEBUG] Waypoint still has invalid coordinates after geocoding")
                        }
                    } else {
                        print("🔍 [DEBUG] Waypoint not in saved addresses, geocoding...")
                        // Geocode the waypoint address
                        if let geocodedWaypoint = try? await locationService.geocodeAddress(waypointAddress) {
                            waypointLocations.append(geocodedWaypoint)
                            print("🔍 [DEBUG] Geocoded and added waypoint: \(geocodedWaypoint.address) at (\(geocodedWaypoint.latitude), \(geocodedWaypoint.longitude))")
                        } else {
                            print("⚠️ [DEBUG] Failed to geocode waypoint: \(waypointAddress)")
                        }
                    }
                }
                print("🔍 [DEBUG] Total waypoint locations after processing: \(waypointLocations.count)")
            } else {
                print("⚠️ [DEBUG] No waypoints found in entities or waypoints array is empty")
            }
            
            // Determine ride type
            let rideType: RideType
            if let rideTypeString = entities.rideType?.lowercased() {
                switch rideTypeString {
                case "premium", "luxury":
                    rideType = .premium
                case "shared", "pool":
                    rideType = .shared
                default:
                    rideType = .standard
                }
            } else {
                rideType = .standard
            }
            
            // Calculate price, duration, and distance (with waypoints)
            let pricingService = RidePricingService()
            let waypointAddresses = waypointLocations.map { $0.address }
            let (price, duration, distance) = await pricingService.calculateEstimateFromAddresses(
                pickup: entities.pickupLocation,
                dropoff: dropoffLocation,
                waypoints: waypointAddresses,
                rideType: rideType
            )
            
            print("🔍 [DEBUG] Calculated values for suggestion:")
            print("   - Price: $\(String(format: "%.2f", price))")
            print("   - Duration: \(duration) minutes")
            print("   - Distance: \(String(format: "%.2f", distance)) km")
            print("   - Waypoints: \(waypointAddresses.count)")
            
            // Create the suggestion
            print("🔍 [DEBUG] Creating RideSuggestion with \(waypointLocations.count) waypoints")
            let suggestion = RideSuggestion(
                userId: userId,
                pickupLocation: pickupLocation,
                dropoffLocation: dropoffLocationWithCoords,
                waypoints: waypointLocations,
                estimatedPrice: price,
                estimatedDuration: duration,
                estimatedDistance: distance,
                rideType: rideType,
                suggestedDrivers: [],
                source: .voice,
                expiresAt: Calendar.current.date(byAdding: .day, value: 1, to: Date()) ?? Date().addingTimeInterval(86400),
                isAccepted: false
            )
            print("🔍 [DEBUG] RideSuggestion created locally:")
            print("   - Price: $\(String(format: "%.2f", suggestion.estimatedPrice))")
            print("   - Duration: \(suggestion.estimatedDuration) minutes")
            print("   - Distance: \(String(format: "%.2f", suggestion.estimatedDistance)) km")
            print("   - Waypoints: \(suggestion.waypoints.map { $0.address })")
            
            // Save to Firestore
            let createdSuggestion = try await dataService.createRideSuggestion(suggestion)
            print("🔍 [DEBUG] RideSuggestion saved to Firestore with ID: \(createdSuggestion.id ?? "nil")")
            print("🔍 [DEBUG] Created suggestion from Firestore:")
            print("   - Price: $\(String(format: "%.2f", createdSuggestion.estimatedPrice))")
            print("   - Duration: \(createdSuggestion.estimatedDuration) minutes")
            print("   - Distance: \(String(format: "%.2f", createdSuggestion.estimatedDistance)) km")
            print("   - Waypoints count: \(createdSuggestion.waypoints.count)")
            print("   - Waypoints: \(createdSuggestion.waypoints.map { $0.address })")
            
            // Store the created suggestion ID and the full suggestion for later use
            await MainActor.run {
                self.currentSuggestionId = createdSuggestion.id
                self.currentSuggestion = createdSuggestion // Store full suggestion with waypoints for map display
                print("🔍 [DEBUG] Stored currentSuggestionId: \(self.currentSuggestionId ?? "nil")")
                print("🔍 [DEBUG] Stored currentSuggestion with \(self.currentSuggestion?.waypoints.count ?? 0) waypoints")
            }
            
        } catch {
            // Don't fail the voice processing if suggestion creation fails
        }
    }
    
    /// Marks the most recent matching RideSuggestion as accepted
    private func markSuggestionAsAccepted(userId: String, pickupAddress: String, dropoffAddress: String, rideId: String?) async {
        guard let rideId = rideId else {
            return
        }
        
        do {
            // Get all unaccepted suggestions for this user
            let db = Firestore.firestore()
            let snapshot = try await db.collection("rideSuggestions")
                .whereField("userId", isEqualTo: userId)
                .whereField("isAccepted", isEqualTo: false)
                .order(by: "createdAt", descending: true)
                .limit(to: 5)
                .getDocuments()
            
            // Find the suggestion that matches this ride (by dropoff address)
            for doc in snapshot.documents {
                do {
                    var suggestion = try doc.data(as: RideSuggestion.self)
                    
                    // Ensure the ID is set from the document ID
                    if suggestion.id == nil {
                        suggestion.id = doc.documentID
                    }
                    
                    // Check if this suggestion matches the ride
                    if suggestion.dropoffLocation.address.lowercased().contains(dropoffAddress.lowercased()) ||
                       dropoffAddress.lowercased().contains(suggestion.dropoffLocation.address.lowercased()) {
                        // Mark as accepted
                        suggestion.isAccepted = true
                        suggestion.acceptedRideId = rideId
                        
                        try await dataService.updateRideSuggestion(suggestion)
                        return
                    }
                } catch {
                    continue
                }
            }
            
        } catch {
            // Don't fail the booking if suggestion update fails
        }
    }
    
    // MARK: - Booking
    
    @MainActor
    func bookRide(from voiceResult: VoiceProcessResponse) {
        
        guard let userId = Auth.auth().currentUser?.uid else {
            Task { @MainActor in
                self.errorMessage = "Please sign in to book a ride."
            }
            return
        }
        
        guard let entities = voiceResult.entities,
              let dropoffAddress = entities.dropoffLocation else {
            Task { @MainActor in
                self.errorMessage = "Dropoff location is required to book a ride."
            }
            return
        }
        
        // Check for active ride before allowing new booking
        if let activeRide = currentRide,
           activeRide.status == .pending || activeRide.status == .accepted || activeRide.status == .inProgress {
            // Store the booking request for later
            self.pendingBookingRequest = voiceResult
            self.showActiveRideAlert = true
            return
        }
        
        // Update state asynchronously to avoid view update warnings
        Task { @MainActor in
            self.isLoading = true
            self.isProcessing = true
            self.errorMessage = nil
            self.bookingSuccess = false
            self.bookingMessage = nil
        }
        
        Task {
            do {
                // Get pickup location (use current location or provided pickup)
                let pickupAddress = entities.pickupLocation ?? "Current Location"
                
                // Try to get coordinates from the Firestore RideSuggestion first (it has geocoded coordinates)
                var pickupLocation: LocationWithAddress
                var dropoffLocation: LocationWithAddress
                var waypointLocations: [LocationWithAddress] = []
                var waypointAddresses: [String] = []
                
                // First, try to fetch the suggestion we just created (it has geocoded coordinates)
                let suggestionId = await MainActor.run { self.currentSuggestionId }
                print("🔍 [DEBUG] bookRide - Looking for suggestion with ID: \(suggestionId ?? "nil")")
                
                if let suggestionId = suggestionId {
                    do {
                        if let firestoreSuggestion = try await dataService.getRideSuggestion(suggestionId: suggestionId) {
                            print("🔍 [DEBUG] Found Firestore suggestion with \(firestoreSuggestion.waypoints.count) waypoints")
                            print("🔍 [DEBUG] Firestore suggestion waypoints: \(firestoreSuggestion.waypoints.map { $0.address })")
                            // Use coordinates directly from the Firestore suggestion (already geocoded)
                            pickupLocation = firestoreSuggestion.pickupLocation
                            dropoffLocation = firestoreSuggestion.dropoffLocation
                            // Also use waypoints from the suggestion
                            waypointLocations = firestoreSuggestion.waypoints
                            waypointAddresses = firestoreSuggestion.waypoints.map { $0.address }
                            print("🔍 [DEBUG] Set waypointLocations from Firestore: \(waypointLocations.count) waypoints")
                            print("🔍 [DEBUG] Set waypointAddresses from Firestore: \(waypointAddresses)")
                            
                        } else {
                            print("⚠️ [DEBUG] Suggestion not found in Firestore")
                            throw NSError(domain: "SuggestionNotFound", code: 404)
                        }
                    } catch {
                        print("⚠️ [DEBUG] Error fetching suggestion from Firestore: \(error.localizedDescription)")
                        // Fall through to geocoding or saved address lookup
                        let locationService = LocationService()
                        
                        // Check if pickup is "Current Location" - use GPS
                        if pickupAddress.lowercased() == "current location" {
                            do {
                                if let currentLocation = try await locationService.getCurrentLocation() {
                                    pickupLocation = currentLocation
                                } else {
                                    pickupLocation = LocationWithAddress(latitude: 0.0, longitude: 0.0, address: pickupAddress)
                                }
                            } catch {
                                pickupLocation = LocationWithAddress(latitude: 0.0, longitude: 0.0, address: pickupAddress)
                            }
                        } else if let savedPickup = findSavedAddress(by: pickupAddress) {
                            // Check if pickup is a saved address
                            pickupLocation = savedPickup.toLocationWithAddress()
                        } else {
                            // Geocode the address
                            do {
                                if let geocodedPickup = try await locationService.geocodeAddress(pickupAddress) {
                                    pickupLocation = geocodedPickup
                                } else {
                                    pickupLocation = LocationWithAddress(latitude: 0.0, longitude: 0.0, address: pickupAddress)
                                }
                            } catch {
                                pickupLocation = LocationWithAddress(latitude: 0.0, longitude: 0.0, address: pickupAddress)
                            }
                        }
                        
                        // Check if dropoff is a saved address first
                        if let savedDropoff = findSavedAddress(by: dropoffAddress) {
                            dropoffLocation = savedDropoff.toLocationWithAddress()
                        } else {
                            do {
                                if let geocodedDropoff = try await locationService.geocodeAddress(dropoffAddress) {
                                    dropoffLocation = geocodedDropoff
                                } else {
                                    dropoffLocation = LocationWithAddress(latitude: 0.0, longitude: 0.0, address: dropoffAddress)
                                }
                            } catch {
                                dropoffLocation = LocationWithAddress(latitude: 0.0, longitude: 0.0, address: dropoffAddress)
                            }
                        }
                    }
                } else {
                    // No suggestion ID, check saved addresses first, then geocode
                    let locationService = LocationService()
                    
                    // Check if pickup is "Current Location" - use GPS
                    if pickupAddress.lowercased() == "current location" {
                        do {
                            if let currentLocation = try await locationService.getCurrentLocation() {
                                pickupLocation = currentLocation
                            } else {
                                pickupLocation = LocationWithAddress(latitude: 0.0, longitude: 0.0, address: pickupAddress)
                            }
                        } catch {
                            pickupLocation = LocationWithAddress(latitude: 0.0, longitude: 0.0, address: pickupAddress)
                        }
                    } else if let savedPickup = findSavedAddress(by: pickupAddress) {
                        // Check if pickup is a saved address
                        pickupLocation = savedPickup.toLocationWithAddress()
                    } else {
                        // Geocode the address
                        do {
                            if let geocodedPickup = try await locationService.geocodeAddress(pickupAddress) {
                                pickupLocation = geocodedPickup
                            } else {
                                pickupLocation = LocationWithAddress(latitude: 0.0, longitude: 0.0, address: pickupAddress)
                            }
                        } catch {
                            pickupLocation = LocationWithAddress(latitude: 0.0, longitude: 0.0, address: pickupAddress)
                        }
                    }
                    
                    // Check if dropoff is a saved address first
                    if let savedDropoff = findSavedAddress(by: dropoffAddress) {
                        dropoffLocation = savedDropoff.toLocationWithAddress()
                    } else {
                        do {
                            if let geocodedDropoff = try await locationService.geocodeAddress(dropoffAddress) {
                                dropoffLocation = geocodedDropoff
                            } else {
                                dropoffLocation = LocationWithAddress(latitude: 0.0, longitude: 0.0, address: dropoffAddress)
                            }
                        } catch {
                            dropoffLocation = LocationWithAddress(latitude: 0.0, longitude: 0.0, address: dropoffAddress)
                        }
                    }
                }
                
                // Validate coordinates
                if pickupLocation.latitude == 0.0 || pickupLocation.longitude == 0.0 ||
                   dropoffLocation.latitude == 0.0 || dropoffLocation.longitude == 0.0 {
                    // If coordinates are invalid, try to geocode one more time as a fallback
                    let locationService = LocationService()
                    
                    // Try to geocode dropoff if it's still invalid
                    if dropoffLocation.latitude == 0.0 || dropoffLocation.longitude == 0.0 {
                        if let savedDropoff = findSavedAddress(by: dropoffAddress) {
                            dropoffLocation = savedDropoff.toLocationWithAddress()
                            // If saved address still has invalid coordinates, try geocoding
                            if dropoffLocation.latitude == 0.0 || dropoffLocation.longitude == 0.0 {
                                do {
                                    if let geocoded = try await locationService.geocodeAddress(savedDropoff.address) {
                                        dropoffLocation = geocoded
                                        // Update saved address with valid coordinates
                                        if geocoded.latitude != 0.0 && geocoded.longitude != 0.0 {
                                            var updatedAddress = savedDropoff
                                            updatedAddress.latitude = geocoded.latitude
                                            updatedAddress.longitude = geocoded.longitude
                                            updatedAddress.address = geocoded.address
                                            updatedAddress.updatedAt = Date()
                                            Task {
                                                try? await dataService.updateSavedAddress(updatedAddress)
                                            }
                                        }
                                    }
                                } catch {
                                    // Fall through to error
                                }
                            }
                        } else {
                            do {
                                if let geocoded = try await locationService.geocodeAddress(dropoffAddress) {
                                    dropoffLocation = geocoded
                                }
                            } catch {
                                // Fall through to error
                            }
                        }
                    }
                    
                    // Try to geocode pickup if it's still invalid
                    if pickupLocation.latitude == 0.0 || pickupLocation.longitude == 0.0 {
                        if pickupAddress.lowercased() == "current location" {
                            do {
                                if let currentLocation = try await locationService.getCurrentLocation() {
                                    pickupLocation = currentLocation
                                }
                            } catch {
                                // Fall through to error
                            }
                        } else if let savedPickup = findSavedAddress(by: pickupAddress) {
                            pickupLocation = savedPickup.toLocationWithAddress()
                            // If saved address still has invalid coordinates, try geocoding
                            if pickupLocation.latitude == 0.0 || pickupLocation.longitude == 0.0 {
                                do {
                                    if let geocoded = try await locationService.geocodeAddress(savedPickup.address) {
                                        pickupLocation = geocoded
                                        // Update saved address with valid coordinates
                                        if geocoded.latitude != 0.0 && geocoded.longitude != 0.0 {
                                            var updatedAddress = savedPickup
                                            updatedAddress.latitude = geocoded.latitude
                                            updatedAddress.longitude = geocoded.longitude
                                            updatedAddress.address = geocoded.address
                                            updatedAddress.updatedAt = Date()
                                            Task {
                                                try? await dataService.updateSavedAddress(updatedAddress)
                                            }
                                        }
                                    }
                                } catch {
                                    // Fall through to error
                                }
                            }
                        } else {
                            do {
                                if let geocoded = try await locationService.geocodeAddress(pickupAddress) {
                                    pickupLocation = geocoded
                                }
                            } catch {
                                // Fall through to error
                            }
                        }
                    }
                    
                    // Final validation after fallback attempts
                    guard pickupLocation.latitude != 0.0 && pickupLocation.longitude != 0.0,
                          dropoffLocation.latitude != 0.0 && dropoffLocation.longitude != 0.0 else {
                        await MainActor.run {
                            self.errorMessage = "Could not determine locations. Please check that your saved addresses have valid coordinates, or try again with more specific addresses."
                            self.isLoading = false
                            self.isProcessing = false
                        }
                        return
                    }
                }
                
                // Determine ride type
                let rideType: RideType
                if let rideTypeString = entities.rideType?.lowercased() {
                    switch rideTypeString {
                    case "premium":
                        rideType = .premium
                    case "shared", "pool":
                        rideType = .shared
                    default:
                        rideType = .standard
                    }
                } else {
                    rideType = .standard
                }
                
                // Get waypoints from entities if not already set from Firestore suggestion
                // (waypoints may have been set earlier from firestoreSuggestion)
                print("🔍 [DEBUG] bookRide - Checking waypoints. Current waypointLocations count: \(waypointLocations.count)")
                print("🔍 [DEBUG] bookRide - entities.waypoints: \(entities.waypoints ?? [])")
                if waypointLocations.isEmpty, let waypoints = entities.waypoints, !waypoints.isEmpty {
                    print("🔍 [DEBUG] WaypointLocations is empty, geocoding from entities.waypoints: \(waypoints)")
                    // Extract waypoints from entities and geocode them
                    let locationService = LocationService()
                    waypointAddresses = waypoints
                    // Geocode waypoints
                    for waypointAddress in waypoints {
                        print("🔍 [DEBUG] Geocoding waypoint from entities: \(waypointAddress)")
                        if let savedWaypoint = findSavedAddress(by: waypointAddress) {
                            print("🔍 [DEBUG] Waypoint found in saved addresses")
                            var waypointLocation = savedWaypoint.toLocationWithAddress()
                            if waypointLocation.latitude == 0.0 || waypointLocation.longitude == 0.0 {
                                if let geocoded = try? await locationService.geocodeAddress(savedWaypoint.address) {
                                    waypointLocation = geocoded
                                    print("🔍 [DEBUG] Geocoded saved waypoint: \(geocoded.address)")
                                }
                            }
                            if waypointLocation.latitude != 0.0 && waypointLocation.longitude != 0.0 {
                                waypointLocations.append(waypointLocation)
                                print("🔍 [DEBUG] Added waypoint location: \(waypointLocation.address)")
                            }
                        } else if let geocodedWaypoint = try? await locationService.geocodeAddress(waypointAddress) {
                            waypointLocations.append(geocodedWaypoint)
                            print("🔍 [DEBUG] Geocoded and added waypoint: \(geocodedWaypoint.address)")
                        } else {
                            print("⚠️ [DEBUG] Failed to geocode waypoint: \(waypointAddress)")
                        }
                    }
                    print("🔍 [DEBUG] After geocoding, waypointLocations count: \(waypointLocations.count)")
                } else {
                    print("🔍 [DEBUG] Waypoints already set from Firestore or no waypoints in entities")
                }
                
                // Get price, duration, and distance from suggestion or calculate from addresses
                var estimatedPrice: Double
                var estimatedDuration: Int
                var estimatedDistance: Double
                
                // Get price, duration, and distance from suggestion or calculate from addresses
                if let suggestion = voiceResult.rideSuggestion {
                    estimatedPrice = suggestion.estimatedPrice
                    estimatedDuration = suggestion.estimatedDuration
                    estimatedDistance = suggestion.estimatedDistance ?? 0.0
                    
                    // If we have waypoints but suggestion doesn't account for them, recalculate
                    if !waypointAddresses.isEmpty {
                        let pricingService = RidePricingService()
                        let (price, duration, distance) = await pricingService.calculateEstimateFromAddresses(
                            pickup: entities.pickupLocation,
                            dropoff: dropoffAddress,
                            waypoints: waypointAddresses,
                            rideType: rideType
                        )
                        estimatedPrice = price
                        estimatedDuration = duration
                        estimatedDistance = distance
                    }
                } else {
                    // Calculate estimate from addresses using pricing service with MapKit
                    let pricingService = RidePricingService()
                    let (price, duration, distance) = await pricingService.calculateEstimateFromAddresses(
                        pickup: entities.pickupLocation,
                        dropoff: dropoffAddress,
                        waypoints: waypointAddresses,
                        rideType: rideType
                    )
                    estimatedPrice = price
                    estimatedDuration = duration
                    estimatedDistance = distance
                }
                
                // Validate payment method before booking
                let paymentMethods: [PaymentMethod]
                do {
                    paymentMethods = try await dataService.getPaymentMethods(userId: userId)
                } catch {
                    await MainActor.run {
                        self.errorMessage = "Failed to load payment methods. Please try again."
                        self.isLoading = false
                        self.isProcessing = false
                    }
                    return
                }
                
                // Check if user has any payment methods
                guard !paymentMethods.isEmpty else {
                    await MainActor.run {
                        self.showPaymentMethodRequiredAlert = true
                        self.isLoading = false
                        self.isProcessing = false
                    }
                    return
                }
                
                // Find a valid (non-expired) payment method
                let validPaymentMethods = paymentMethods.filter { !$0.isExpired }
                
                guard !validPaymentMethods.isEmpty else {
                    await MainActor.run {
                        self.errorMessage = "All your payment methods have expired. Please add a new payment method to continue."
                        self.showPaymentMethodRequiredAlert = true
                        self.isLoading = false
                        self.isProcessing = false
                    }
                    return
                }
                
                // Get default payment method, or use the first valid one
                let defaultPaymentMethod = validPaymentMethods.first { $0.isDefault } ?? validPaymentMethods.first
                guard let paymentMethodId = defaultPaymentMethod?.id else {
                    await MainActor.run {
                        self.errorMessage = "No valid payment method found. Please add a payment method to continue."
                        self.showPaymentMethodRequiredAlert = true
                        self.isLoading = false
                        self.isProcessing = false
                    }
                    return
                }
                
                // Create the ride with waypoints
                print("🔍 [DEBUG] Creating Ride with \(waypointLocations.count) waypoints")
                print("🔍 [DEBUG] Ride waypoints: \(waypointLocations.map { $0.address })")
                let ride = Ride(
                    userId: userId,
                    status: .pending,
                    pickupLocation: pickupLocation,
                    dropoffLocation: dropoffLocation,
                    waypoints: waypointLocations,
                    scheduledTime: entities.scheduledTime,
                    estimatedPrice: estimatedPrice,
                    estimatedDuration: estimatedDuration,
                    estimatedDistance: estimatedDistance,
                    rideType: rideType,
                    paymentMethodId: paymentMethodId
                )
                print("🔍 [DEBUG] Ride created with waypoints: \(ride.waypoints.map { $0.address })")
                
                
                // Save to Firestore (ride starts as pending, waiting for driver to accept)
                let createdRide = try await dataService.createRide(ride)
                print("🔍 [DEBUG] Ride saved to Firestore with ID: \(createdRide.id ?? "nil")")
                print("🔍 [DEBUG] Created ride waypoints count: \(createdRide.waypoints.count)")
                print("🔍 [DEBUG] Created ride waypoints: \(createdRide.waypoints.map { $0.address })")
                
                
                // Set up real-time listener for ride status changes
                setupRideStatusListener(rideId: createdRide.id)
                
                // Mark the corresponding RideSuggestion as accepted (if one exists)
                // Find the most recent unaccepted suggestion matching this ride
                await markSuggestionAsAccepted(
                    userId: userId,
                    pickupAddress: pickupAddress,
                    dropoffAddress: dropoffAddress,
                    rideId: createdRide.id
                )
                
                // Update state asynchronously to avoid view update warnings
                // Use Task to ensure we're not in a view update cycle
                Task { @MainActor in
                    self.isLoading = false
                    self.isProcessing = false
                    self.errorMessage = nil
                    self.currentRide = createdRide // Store the created ride
                    self.bookingSuccess = true
                    self.bookingMessage = "Ride booked successfully! Your driver will be notified."
                }
                
                // Clear the voice result after successful booking (after a delay)
                // But keep the currentRide so user can see their active ride
                Task { @MainActor in
                    try? await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds
                    self.voiceResult = nil
                    self.bookingSuccess = false
                    self.bookingMessage = nil
                }
            } catch {
                
                await MainActor.run {
                    self.isLoading = false
                    self.isProcessing = false
                    self.errorMessage = "Failed to book ride: \(error.localizedDescription)"
                    self.handleError(error)
                }
            }
        }
    }
    
    /// Cancel the active ride and retry the pending booking
    func cancelActiveRideAndRetryBooking() {
        guard let activeRide = currentRide,
              let pendingRequest = pendingBookingRequest else {
            return
        }
        
        Task {
            do {
                print("🔍 [DEBUG] VoiceBookingViewModel - cancelActiveRideAndRetryBooking called")
                print("   - Active ride ID: \(activeRide.id ?? "nil")")
                
                // Try to get ride ID from the ride object first
                var rideId: String? = activeRide.id
                
                // If ride ID is nil, try to find the ride by querying Firestore
                // We can use userId and status to find it
                if rideId == nil {
                    print("⚠️ [DEBUG] VoiceBookingViewModel - Ride ID is nil, searching for active ride in Firestore...")
                    guard let userId = Auth.auth().currentUser?.uid else {
                        await MainActor.run {
                            self.errorMessage = "Failed to cancel active ride: User not authenticated"
                            self.showActiveRideAlert = false
                        }
                        return
                    }
                    
                    // Fetch user's rides and find the active one
                    // Try multiple strategies to find the ride
                    let rides = try await dataService.getUserRides(userId: userId)
                    
                    // Strategy 1: Find by matching addresses (exact match)
                    if let foundRide = rides.first(where: { ride in
                        (ride.status == .pending || ride.status == .accepted || ride.status == .inProgress) &&
                        ride.pickupLocation.address == activeRide.pickupLocation.address &&
                        ride.dropoffLocation.address == activeRide.dropoffLocation.address
                    }) {
                        rideId = foundRide.id
                        print("✅ [DEBUG] VoiceBookingViewModel - Found active ride by address match with ID: \(rideId ?? "nil")")
                    }
                    // Strategy 2: Find by matching coordinates (if addresses don't match but locations are close)
                    else if let foundRide = rides.first(where: { ride in
                        (ride.status == .pending || ride.status == .accepted || ride.status == .inProgress) &&
                        abs(ride.pickupLocation.latitude - activeRide.pickupLocation.latitude) < 0.001 &&
                        abs(ride.pickupLocation.longitude - activeRide.pickupLocation.longitude) < 0.001 &&
                        abs(ride.dropoffLocation.latitude - activeRide.dropoffLocation.latitude) < 0.001 &&
                        abs(ride.dropoffLocation.longitude - activeRide.dropoffLocation.longitude) < 0.001
                    }) {
                        rideId = foundRide.id
                        print("✅ [DEBUG] VoiceBookingViewModel - Found active ride by coordinate match with ID: \(rideId ?? "nil")")
                    }
                    // Strategy 3: Find the most recent active ride (fallback)
                    else if let foundRide = rides
                        .filter({ $0.status == .pending || $0.status == .accepted || $0.status == .inProgress })
                        .sorted(by: { $0.createdAt > $1.createdAt })
                        .first {
                        rideId = foundRide.id
                        print("✅ [DEBUG] VoiceBookingViewModel - Found most recent active ride with ID: \(rideId ?? "nil")")
                    }
                }
                
                guard let finalRideId = rideId else {
                    print("⚠️ [WARNING] VoiceBookingViewModel - Could not find ride ID, attempting to reload active ride...")
                    
                    // Last resort: Try to reload the active ride from Firestore
                    // This might help if the ride was just created or updated
                    guard let userId = Auth.auth().currentUser?.uid else {
                        await MainActor.run {
                            self.errorMessage = "Failed to cancel active ride: User not authenticated"
                            self.showActiveRideAlert = false
                        }
                        return
                    }
                    
                    do {
                        // Reload active rides
                        let rides = try await dataService.getUserRides(userId: userId)
                        if let mostRecentActiveRide = rides
                            .filter({ $0.status == .pending || $0.status == .accepted || $0.status == .inProgress })
                            .sorted(by: { $0.createdAt > $1.createdAt })
                            .first,
                           let reloadedRideId = mostRecentActiveRide.id {
                            
                            print("✅ [DEBUG] VoiceBookingViewModel - Found ride ID after reload: \(reloadedRideId)")
                            
                            // Update currentRide with the reloaded ride (which should have a valid ID)
                            await MainActor.run {
                                self.currentRide = mostRecentActiveRide
                            }
                            
                            // Use the reloaded ride ID
                            let reloadedFinalRideId = reloadedRideId
                            
                            // Fetch the latest version of the ride from Firestore
                            guard var rideToCancel = try await dataService.getRide(rideId: reloadedFinalRideId) else {
                                await MainActor.run {
                                    self.errorMessage = "Failed to cancel active ride: Ride not found in Firestore"
                                    self.showActiveRideAlert = false
                                }
                                return
                            }
                            
                            print("✅ [DEBUG] VoiceBookingViewModel - Fetched ride from Firestore, canceling...")
                            
                            // Cancel the ride
                            try rideToCancel.cancel()
                            try await dataService.updateRide(rideToCancel, rideId: reloadedFinalRideId)
                            
                            print("✅ [DEBUG] VoiceBookingViewModel - Ride canceled successfully")
                            
                            // Clear the active ride
                            await MainActor.run {
                                self.currentRide = nil
                                self.currentDriver = nil
                                self.showActiveRideAlert = false
                            }
                            
                            // Retry the booking
                            await MainActor.run {
                                self.bookRide(from: pendingRequest)
                                self.pendingBookingRequest = nil
                            }
                            
                            return // Success, exit early
                        }
                    } catch {
                        print("❌ [ERROR] VoiceBookingViewModel - Failed to reload active ride: \(error)")
                    }
                    
                    // If we still can't find it, show error
                    await MainActor.run {
                        self.errorMessage = "Failed to cancel active ride: Could not find ride ID. Please try again or cancel the ride manually."
                        self.showActiveRideAlert = false
                    }
                    return
                }
                
                // Fetch the latest version of the ride from Firestore to ensure we have a valid ID
                guard var rideToCancel = try await dataService.getRide(rideId: finalRideId) else {
                    await MainActor.run {
                        self.errorMessage = "Failed to cancel active ride: Ride not found in Firestore"
                        self.showActiveRideAlert = false
                    }
                    return
                }
                
                print("✅ [DEBUG] VoiceBookingViewModel - Fetched ride from Firestore, canceling...")
                
                // Cancel the ride using the proper cancel method
                try rideToCancel.cancel()
                
                // Update the ride in Firestore (pass rideId as parameter in case @DocumentID was lost)
                try await dataService.updateRide(rideToCancel, rideId: finalRideId)
                
                print("✅ [DEBUG] VoiceBookingViewModel - Ride canceled successfully")
                
                // Clear the active ride
                await MainActor.run {
                    self.currentRide = nil
                    self.currentDriver = nil
                    self.showActiveRideAlert = false
                }
                
                // Retry the booking
                await MainActor.run {
                    self.bookRide(from: pendingRequest)
                    self.pendingBookingRequest = nil
                }
            } catch {
                print("❌ [ERROR] VoiceBookingViewModel - Failed to cancel active ride: \(error)")
                await MainActor.run {
                    self.errorMessage = "Failed to cancel active ride: \(error.localizedDescription)"
                    self.showActiveRideAlert = false
                }
            }
        }
    }
    
    /// Dismiss the active ride alert without canceling
    func dismissActiveRideAlert() {
        showActiveRideAlert = false
        pendingBookingRequest = nil
    }
}


