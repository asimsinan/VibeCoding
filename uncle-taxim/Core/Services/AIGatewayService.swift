import Foundation

protocol AIGatewayServiceProtocol {
    func processVoice(request: VoiceProcessRequest) async throws -> VoiceProcessResponse
    func sendChatMessage(request: ChatMessageRequest) async throws -> ChatMessageResponse
    func extractRideBookingInfo(from text: String, userId: String) async throws -> VoiceProcessResponse
}

class AIGatewayService: AIGatewayServiceProtocol {
    private let baseURL: String
    private let apiKey: String
    private let session: URLSession
    
    init(baseURL: String? = nil, apiKey: String? = nil, session: URLSession = .shared) {
        let environment = Environment.current
        self.baseURL = baseURL ?? environment.vercelAIGatewayBaseURL
        self.apiKey = apiKey ?? environment.vercelAIGatewayAPIKey
        self.session = session
    }
    
    // MARK: - Voice Processing
    
    func processVoice(request: VoiceProcessRequest) async throws -> VoiceProcessResponse {
        
        // Try OpenAI-compatible Whisper API endpoint
        // If this doesn't work, the backend may need to implement a custom voice processing endpoint
        let url = URL(string: "\(baseURL)/audio/transcriptions")!
        
        // Build OpenAI-compatible request
        // Note: OpenAI Whisper expects multipart/form-data, but we'll try JSON first
        // If that doesn't work, we may need to switch to multipart
        struct WhisperRequest: Encodable {
            let file: String // Base64 encoded audio
            let model: String
            let language: String?
            let prompt: String?
            let response_format: String?
        }
        
        // Auto-detect language or use provided language
        // Whisper supports Turkish (tr) and many other languages
        let detectedLanguage = request.language ?? "auto" // "auto" lets Whisper detect, or specify "tr" for Turkish, "en" for English
        
        let whisperRequest = WhisperRequest(
            file: request.audio,
            model: "whisper-1",
            language: detectedLanguage == "auto" ? nil : detectedLanguage, // nil = auto-detect
            prompt: nil,
            response_format: "json"
        )
        
        var urlRequest = try NetworkRequestBuilder.buildRequest(
            url: url,
            method: .POST,
            apiKey: apiKey,
            body: whisperRequest
        )
        
        // Vercel AI Gateway expects Authorization header (Bearer token) instead of X-API-Key
        urlRequest.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        urlRequest.setValue(nil, forHTTPHeaderField: "X-API-Key")
        
        let (data, response) = try await session.data(for: urlRequest)
        
        
        // Log response body for debugging
        
        
        try NetworkRequestBuilder.handleHTTPResponse(response, data: data)
        
        // Parse OpenAI Whisper response format
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        let text = json?["text"] as? String ?? ""
        
        // Create VoiceProcessResponse from Whisper transcription
        // Note: This is a simplified response - you may need to adjust based on your API
        let voiceResponse = VoiceProcessResponse(
            success: true,
            transcript: text,
            intent: "book_ride", // Default intent, could be extracted from text
            entities: nil,
            rideSuggestion: nil
        )
        
        
        return voiceResponse
    }
    
    // MARK: - Chat Message
    
    func sendChatMessage(request: ChatMessageRequest) async throws -> ChatMessageResponse {
        
        // Try OpenAI-compatible endpoint (common for Vercel AI Gateway)
        // If this doesn't work, we might need to check the actual API documentation
        let url = URL(string: "\(baseURL)/chat/completions")!
        
        // Build system prompt with RAG context
        var systemPrompt = """
        You are a helpful ride-hailing assistant. You can help users with:
        - Booking rides (extract pickup, dropoff, waypoints, ride type)
        - Viewing their ride history
        - Viewing their transaction/payment history
        - Getting information about specific rides
        - General questions about the service
        
        IMPORTANT: You have access to the user's actual ride and transaction data. Use this information to provide accurate, personalized responses.
        
        """
        
        // Add retrieved context if available
        if let context = request.context, !context.isEmpty {
            systemPrompt += """
            === USER'S DATA ===
            \(context)
            
            CRITICAL RULES:
            1. ONLY reference rides and transactions that are explicitly listed above
            2. DO NOT make up, invent, or hallucinate any rides or transactions
            3. If a ride or transaction is not in the data above, it does NOT exist
            4. When referencing rides, use the exact details from the data (ID, addresses, dates, prices)
            5. If the user asks about something not in the data, clearly state that you don't have that information
            
            Use the above information to answer the user's questions accurately. Reference specific rides or transactions when relevant. Include details like dates, locations, prices, and status when answering.
            
            """
        } else {
            systemPrompt += """
            === USER'S DATA ===
            No ride history or transaction history available for this user.
            
            CRITICAL: The user has no rides or transactions in the system. Do NOT make up or invent any rides or transactions. If asked about ride history, clearly state that the user has no rides yet.
            
            """
        }
        
        systemPrompt += """
        === BOOKING INSTRUCTIONS ===
        When the user wants to book a ride, extract the following information:
        - pickupLocation: Starting address or location name. If the user doesn't specify a pickup location (e.g., "I want to go to Ankara"), use "Current Location" or "My Location" as the pickupLocation. This means the ride should start from the user's current GPS location.
        - dropoffLocation: Destination address or location name (REQUIRED)
        - waypoints: Array of intermediate stops (if any), e.g., ["Ankara"] for "via Ankara"
        - rideType: "standard", "premium", or "shared" (default: "standard")
        
        IMPORTANT PICKUP LOCATION RULES:
        - If user says "I want to go to [location]" or "Take me to [location]" without mentioning a pickup, set pickupLocation to "Current Location"
        - If user says "from [location] to [location]", use the first location as pickup
        - If user explicitly says "from my location" or "from here", set pickupLocation to "Current Location"
        - Examples:
          * "I want to go to Ankara" → pickupLocation: "Current Location", dropoffLocation: "Ankara"
          * "Take me to Istanbul" → pickupLocation: "Current Location", dropoffLocation: "Istanbul"
          * "Ankara'ya gitmek istiyorum" → pickupLocation: "Current Location", dropoffLocation: "Ankara"
        
        For booking requests, return a JSON object with:
        {
            "intent": "book_ride",
            "entities": {
                "pickupLocation": "address or location or 'Current Location' if not specified",
                "dropoffLocation": "address or location",
                "waypoints": ["waypoint1", "waypoint2"] or null,
                "rideType": "standard" | "premium" | "shared" or null
            },
            "reply": "I'll help you book a ride from [pickup] to [dropoff].",
            "rideSuggestion": {
                "pickupLocation": "address or 'Current Location'",
                "dropoffLocation": "address",
                "estimatedPrice": 0.0,
                "estimatedDuration": 0,
                "estimatedDistance": 0.0,
                "rideType": "standard"
            }
        }
        
        === GENERAL RESPONSES ===
        For non-booking queries, return:
        {
            "intent": "general" | "view_rides" | "view_transactions",
            "entities": {},
            "reply": "Your natural, helpful response here based on the user's data and question."
        }
        
        IMPORTANT: Remember previous conversation context. If the user refers to something mentioned earlier, use that context.
        """
        
        // Build OpenAI-compatible request body
        struct OpenAIRequest: Encodable {
            let model: String
            let messages: [Message]
            let user: String
            let max_tokens: Int
            let temperature: Double
            
            struct Message: Encodable {
                let role: String
                let content: String
            }
        }
        
        // Build messages array with conversation history
        var messages: [OpenAIRequest.Message] = [
            OpenAIRequest.Message(role: "system", content: systemPrompt)
        ]
        
        // Add conversation history if available
        if let history = request.conversationHistory, !history.isEmpty {
            // Limit to last 10 messages to avoid token limits
            let recentHistory = Array(history.suffix(10))
            for histMessage in recentHistory {
                messages.append(OpenAIRequest.Message(
                    role: histMessage.role,
                    content: histMessage.content
                ))
            }
        }
        
        // Add current user message
        messages.append(OpenAIRequest.Message(role: "user", content: request.message))
        
        let openAIRequest = OpenAIRequest(
            model: "openai/gpt-4.1",
            messages: messages,
            user: request.userId,
            max_tokens: 1500, // Increased for booking responses
            temperature: 0.3
        )
        
        var urlRequest = try NetworkRequestBuilder.buildRequest(
            url: url,
            method: .POST,
            apiKey: apiKey,
            body: openAIRequest
        )
        
        // Vercel AI Gateway expects Authorization header (Bearer token) instead of X-API-Key
        urlRequest.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        urlRequest.setValue(nil, forHTTPHeaderField: "X-API-Key")
        
        let (data, response) = try await session.data(for: urlRequest)
        
        // Validate data is not empty
        guard !data.isEmpty else {
            throw NetworkError.decodingError(NSError(domain: "AIGatewayService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Empty response from server"]))
        }
        
        // Log raw response for debugging (first 500 chars)
        let responsePreview = String(data: data.prefix(500), encoding: .utf8) ?? "Unable to decode response"
        print("🔍 [DEBUG] AIGatewayService - Raw response preview: \(responsePreview)")
        
        try NetworkRequestBuilder.handleHTTPResponse(response, data: data)
        
        // Parse OpenAI-compatible response
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            let errorMessage = "Failed to parse response as JSON. Response: \(responsePreview)"
            print("❌ [ERROR] AIGatewayService - \(errorMessage)")
            throw NetworkError.decodingError(NSError(domain: "AIGatewayService", code: -1, userInfo: [NSLocalizedDescriptionKey: errorMessage]))
        }
        
        guard let choices = json["choices"] as? [[String: Any]],
              let firstChoice = choices.first,
              let message = firstChoice["message"] as? [String: Any],
              let content = message["content"] as? String else {
            let errorMessage = "Missing content in AI response. JSON structure: \(json.keys.joined(separator: ", "))"
            print("❌ [ERROR] AIGatewayService - \(errorMessage)")
            throw NetworkError.decodingError(NSError(domain: "AIGatewayService", code: -2, userInfo: [NSLocalizedDescriptionKey: errorMessage]))
        }
        
        // Try to extract intent and entities from response
        var intent = "general"
        var reply = content.trimmingCharacters(in: .whitespacesAndNewlines)
        var extractedEntities: [String: Any]? = nil
        
        // Ensure we have a valid reply (fallback to content if empty)
        if reply.isEmpty {
            reply = "I received your message, but couldn't generate a response. Please try again."
        }
        
        // Try to parse JSON from content if it contains structured data
        var rideSuggestion: RideSuggestionResponse? = nil
        
        if let jsonData = content.data(using: .utf8),
           let parsedJson = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
            // Extract reply - use content as fallback if reply is missing
            if let extractedReply = parsedJson["reply"] as? String, !extractedReply.isEmpty {
                reply = extractedReply
            }
            intent = parsedJson["intent"] as? String ?? "general"
            extractedEntities = parsedJson["entities"] as? [String: Any]
            
            // Extract rideSuggestion if present (for booking)
            if let suggestionDict = parsedJson["rideSuggestion"] as? [String: Any] {
                rideSuggestion = RideSuggestionResponse(
                    estimatedPrice: suggestionDict["estimatedPrice"] as? Double ?? 0.0,
                    estimatedDuration: suggestionDict["estimatedDuration"] as? Int ?? 0,
                    estimatedDistance: suggestionDict["estimatedDistance"] as? Double,
                    rideType: suggestionDict["rideType"] as? String ?? "standard",
                    pickupLocation: suggestionDict["pickupLocation"] as? String,
                    dropoffLocation: suggestionDict["dropoffLocation"] as? String
                )
            }
        } else {
            // Try to extract JSON from markdown code blocks if present
            // Look for JSON code blocks (```json ... ``` or ``` ... ```)
            let codeBlockPattern = #"```(?:json)?\s*(\{.*?\})\s*```"#
            if let codeBlockRange = content.range(of: codeBlockPattern, options: .regularExpression) {
                let jsonString = String(content[codeBlockRange])
                    .replacingOccurrences(of: "```json", with: "")
                    .replacingOccurrences(of: "```", with: "")
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                
                if let jsonData = jsonString.data(using: String.Encoding.utf8),
                   let parsedJson = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
                    if let extractedReply = parsedJson["reply"] as? String, !extractedReply.isEmpty {
                        reply = extractedReply
                    }
                    intent = parsedJson["intent"] as? String ?? "general"
                    extractedEntities = parsedJson["entities"] as? [String: Any]
                    
                    // Extract rideSuggestion from code block
                    if let suggestionDict = parsedJson["rideSuggestion"] as? [String: Any] {
                        rideSuggestion = RideSuggestionResponse(
                            estimatedPrice: suggestionDict["estimatedPrice"] as? Double ?? 0.0,
                            estimatedDuration: suggestionDict["estimatedDuration"] as? Int ?? 0,
                            estimatedDistance: suggestionDict["estimatedDistance"] as? Double,
                            rideType: suggestionDict["rideType"] as? String ?? "standard",
                            pickupLocation: suggestionDict["pickupLocation"] as? String,
                            dropoffLocation: suggestionDict["dropoffLocation"] as? String
                        )
                    }
                }
            } else if let jsonMatch = content.range(of: #"\{[^{}]*"intent"[^{}]*\}"#, options: .regularExpression) {
                // Fallback: try simple JSON pattern
                let jsonString = String(content[jsonMatch])
                if let jsonData = jsonString.data(using: .utf8),
                   let parsedJson = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
                    if let extractedReply = parsedJson["reply"] as? String, !extractedReply.isEmpty {
                        reply = extractedReply
                    }
                    intent = parsedJson["intent"] as? String ?? "general"
                    extractedEntities = parsedJson["entities"] as? [String: Any]
                    
                    if let suggestionDict = parsedJson["rideSuggestion"] as? [String: Any] {
                        rideSuggestion = RideSuggestionResponse(
                            estimatedPrice: suggestionDict["estimatedPrice"] as? Double ?? 0.0,
                            estimatedDuration: suggestionDict["estimatedDuration"] as? Int ?? 0,
                            estimatedDistance: suggestionDict["estimatedDistance"] as? Double,
                            rideType: suggestionDict["rideType"] as? String ?? "standard",
                            pickupLocation: suggestionDict["pickupLocation"] as? String,
                            dropoffLocation: suggestionDict["dropoffLocation"] as? String
                        )
                    }
                }
            }
            
            // If no structured JSON found, use the content as-is (AI generated natural response)
            // This is fine for RAG - the AI should generate natural language responses
        }
        
        // Create ChatMessageResponse from OpenAI response with extracted entities
        // Ensure all required fields are present
        let chatResponse = ChatMessageResponse(
            success: true,
            reply: reply.isEmpty ? "I received your message, but couldn't generate a response. Please try again." : reply,
            intent: intent,
            suggestedActions: [],
            rideSuggestion: rideSuggestion, // Include ride suggestion if extracted
            entities: extractedEntities
        )
        
        return chatResponse
    }
    
    // MARK: - Voice Text Processing (Intent & Entity Extraction)
    
    func extractRideBookingInfo(from text: String, userId: String) async throws -> VoiceProcessResponse {
        
        let url = URL(string: "\(baseURL)/chat/completions")!
        
        // Create a structured prompt to extract ride booking information
        // Support both English and Turkish (and other languages)
        let systemPrompt = """
        You are a ride-hailing assistant that extracts booking information from voice commands in multiple languages.
        
        ===== CRITICAL: WAYPOINT DETECTION RULES =====
        
        A waypoint is ANY intermediate location mentioned between pickup and dropoff. You MUST identify ALL waypoints.
        
        WAYPOINT INDICATORS (any of these phrases means the location is a waypoint):
        
        ENGLISH:
        - "via [location]" → waypoint
        - "through [location]" → waypoint
        - "by way of [location]" → waypoint
        - "stopping at [location]" → waypoint
        - "stop at [location]" → waypoint
        - "passing through [location]" → waypoint
        - "by giving a break in [location]" → waypoint
        - "with a stop in [location]" → waypoint
        - Any location mentioned between pickup and dropoff that is NOT the pickup or dropoff → waypoint
        
        TURKISH:
        - "[location] üzerinden" → waypoint (e.g., "Ankara üzerinden" = via Ankara)
        - "[location] aracılığıyla" → waypoint (through [location])
        - "[location]'de mola vererek" → waypoint (giving a break in [location])
        - "[location]'dan geçerek" → waypoint (passing through [location])
        - "[location]'de durarak" → waypoint (stopping at [location])
        - Any location mentioned between pickup and dropoff that is NOT the pickup or dropoff → waypoint
        
        EXTRACTION RULES:
        1. Identify ALL location names mentioned in the command
        2. If user says "I want to go to [location]" or "Take me to [location]" WITHOUT mentioning a pickup location, set pickupLocation to "Current Location" (user's GPS location)
        3. If user explicitly mentions a pickup location (e.g., "from [location]"), use that as pickupLocation
        4. The LAST location mentioned (that is not a waypoint) is usually dropoffLocation
        5. ANY location mentioned BETWEEN pickup and dropoff is a waypoint
        6. If a location appears with waypoint indicators (via, üzerinden, etc.), it's definitely a waypoint
        7. If multiple locations are mentioned in sequence, identify which are waypoints based on context
        
        EXAMPLES:
        
        English:
        - "I want to go to Los Angeles"
          → pickupLocation: "Current Location", dropoffLocation: "Los Angeles"
        
        - "Take me to the airport"
          → pickupLocation: "Current Location", dropoffLocation: "airport"
        
        - "I want to go from New York to Los Angeles via Chicago" 
          → pickupLocation: "New York", waypoints: ["Chicago"], dropoffLocation: "Los Angeles"
        
        - "Take me from Home to Airport through Downtown" 
          → pickupLocation: "Home", waypoints: ["Downtown"], dropoffLocation: "Airport"
        
        - "Drive from Boston to Miami stopping at Atlanta and then Charlotte"
          → pickupLocation: "Boston", waypoints: ["Atlanta", "Charlotte"], dropoffLocation: "Miami"
        
        - "I want to go to Miami via Atlanta"
          → pickupLocation: "Current Location", waypoints: ["Atlanta"], dropoffLocation: "Miami"
        
        Turkish:
        - "Ankara'ya gitmek istiyorum"
          → pickupLocation: "Current Location", dropoffLocation: "Ankara"
        
        - "İstanbul'a git"
          → pickupLocation: "Current Location", dropoffLocation: "İstanbul"
        
        - "Antalyadan istanbula ankara üzerinden gitmek istiyorum"
          → pickupLocation: "Antalya", waypoints: ["Ankara"], dropoffLocation: "İstanbul"
        
        - "Ankara'dan İstanbul'a Eskişehir'de mola vererek gitmek istiyorum"
          → pickupLocation: "Ankara", waypoints: ["Eskişehir"], dropoffLocation: "İstanbul"
        
        - "İzmir'den Ankara'ya Bursa üzerinden git"
          → pickupLocation: "İzmir", waypoints: ["Bursa"], dropoffLocation: "Ankara"
        
        - "İstanbul'dan Antalya'ya Bursa ve Eskişehir üzerinden gitmek istiyorum"
          → pickupLocation: "İstanbul", waypoints: ["Bursa", "Eskişehir"], dropoffLocation: "Antalya"
        
        - "Ankara'ya Eskişehir üzerinden gitmek istiyorum"
          → pickupLocation: "Current Location", waypoints: ["Eskişehir"], dropoffLocation: "Ankara"
        
        ===== OUTPUT FORMAT =====
        
        You MUST return ONLY a valid JSON object (no markdown, no code blocks, no explanations):
        {
            "intent": "book_ride" | "cancel_ride" | "modify_ride" | "check_status" | "general",
            "entities": {
                "pickupLocation": "address or location name or null",
                "dropoffLocation": "address or location name or null",
                "waypoints": ["intermediate stop 1", "intermediate stop 2", ...] or null,
                "rideType": "standard" | "premium" | "luxury" | "pool" | null,
                "scheduledTime": "ISO8601 date string or null"
            }
        }
        
        CRITICAL REMINDERS:
        - waypoints MUST be an array of strings, even if there's only one waypoint: ["Ankara"] not "Ankara"
        - If no waypoints are mentioned, use null: "waypoints": null
        - Extract waypoints even if the user doesn't use explicit waypoint words - if a location is between pickup and dropoff, it's a waypoint
        - Pay attention to word order: locations mentioned in the middle are likely waypoints
        - Return ONLY the JSON object, nothing else
        """
        
        let userPrompt = """
        Extract ride booking information from this voice command: "\(text)"
        
        Return only valid JSON, no markdown, no code blocks, no explanations.
        """
        
        struct OpenAIRequest: Encodable {
            let model: String
            let messages: [Message]
            let user: String
            let max_tokens: Int
            let temperature: Double
            
            struct Message: Encodable {
                let role: String
                let content: String
            }
        }
        
        let openAIRequest = OpenAIRequest(
            model: "openai/gpt-4.1",
            messages: [
                OpenAIRequest.Message(role: "system", content: systemPrompt),
                OpenAIRequest.Message(role: "user", content: userPrompt)
            ],
            user: userId,
            max_tokens: 500,
            temperature: 0.3 // Lower temperature for more consistent extraction
        )
        
        var urlRequest = try NetworkRequestBuilder.buildRequest(
            url: url,
            method: .POST,
            apiKey: apiKey,
            body: openAIRequest
        )
        
        // Vercel AI Gateway expects Authorization header (Bearer token)
        urlRequest.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        urlRequest.setValue(nil, forHTTPHeaderField: "X-API-Key")
        
        let (data, response) = try await session.data(for: urlRequest)
        
        
        // Log response body for debugging
        
        
        try NetworkRequestBuilder.handleHTTPResponse(response, data: data)
        
        
        // Parse OpenAI-compatible response
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        let choices = json?["choices"] as? [[String: Any]]
        let firstChoice = choices?.first
        let message = firstChoice?["message"] as? [String: Any]
        let content = message?["content"] as? String ?? "{}"
        
        
        // Clean the content - remove markdown code blocks if present
        var cleanedContent = content.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // Remove markdown code blocks (```json ... ``` or ``` ... ```)
        // First, try to find JSON between code block markers
        if cleanedContent.contains("```") {
            // Pattern 1: ```json\n{...}\n```
            if let jsonStart = cleanedContent.range(of: "```json"),
               let afterJsonStart = cleanedContent.range(of: "{", range: jsonStart.upperBound..<cleanedContent.endIndex) {
                // Find the closing ```
                if let codeBlockEnd = cleanedContent.range(of: "```", range: afterJsonStart.upperBound..<cleanedContent.endIndex) {
                    cleanedContent = String(cleanedContent[afterJsonStart.lowerBound..<codeBlockEnd.lowerBound])
                }
            }
            // Pattern 2: ```\n{...}\n```
            else if let codeBlockStart = cleanedContent.range(of: "```"),
                     let jsonStart = cleanedContent.range(of: "{", range: codeBlockStart.upperBound..<cleanedContent.endIndex) {
                if let codeBlockEnd = cleanedContent.range(of: "```", range: jsonStart.upperBound..<cleanedContent.endIndex) {
                    cleanedContent = String(cleanedContent[jsonStart.lowerBound..<codeBlockEnd.lowerBound])
                }
            }
            // Pattern 3: Fallback - extract everything between first { and last }
            else if let jsonStart = cleanedContent.range(of: "{"),
                     let jsonEnd = cleanedContent.range(of: "}", options: .backwards) {
                cleanedContent = String(cleanedContent[jsonStart.lowerBound...jsonEnd.upperBound])
            }
        }
        
        // Clean up any remaining whitespace
        cleanedContent = cleanedContent.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // Parse the JSON response
        guard let contentData = cleanedContent.data(using: .utf8),
              let extractedJson = try? JSONSerialization.jsonObject(with: contentData) as? [String: Any] else {
            
            // Try to extract basic information from the text as fallback
            let intent = text.lowercased().contains("cancel") ? "cancel_ride" :
                        text.lowercased().contains("modify") || text.lowercased().contains("change") ? "modify_ride" :
                        text.lowercased().contains("status") || text.lowercased().contains("check") ? "check_status" :
                        "book_ride"
            
            // Try to extract dropoff location (common pattern: "go to X", "take me to X")
            var dropoffLocation: String? = nil
            if let toIndex = text.lowercased().range(of: "to ") {
                let afterTo = String(text[toIndex.upperBound...]).trimmingCharacters(in: .whitespaces)
                if !afterTo.isEmpty && afterTo.count > 2 {
                    dropoffLocation = afterTo
                }
            }
            
            return VoiceProcessResponse(
                success: true,
                transcript: text,
                intent: intent,
                entities: VoiceProcessEntities(
                    pickupLocation: nil,
                    dropoffLocation: dropoffLocation,
                    rideType: nil,
                    scheduledTime: nil
                ),
                rideSuggestion: nil
            )
        }
        
        // Extract intent
        let intent = extractedJson["intent"] as? String ?? "book_ride"
        
        // Extract entities
        var entities: VoiceProcessEntities?
        if let entitiesDict = extractedJson["entities"] as? [String: Any] {
            // Extract waypoints array
            var waypoints: [String]? = nil
            if let waypointsArray = entitiesDict["waypoints"] as? [String] {
                waypoints = waypointsArray
            } else if let waypointsArray = entitiesDict["waypoints"] as? [Any] {
                // Handle case where waypoints might be in different format
                waypoints = waypointsArray.compactMap { $0 as? String }
            }
            
            entities = VoiceProcessEntities(
                pickupLocation: entitiesDict["pickupLocation"] as? String,
                dropoffLocation: entitiesDict["dropoffLocation"] as? String,
                waypoints: waypoints,
                rideType: entitiesDict["rideType"] as? String,
                scheduledTime: nil // Parse date if needed
            )
            
            // Parse scheduled time if present
            if let scheduledTimeString = entitiesDict["scheduledTime"] as? String {
                let formatter = ISO8601DateFormatter()
                entities?.scheduledTime = formatter.date(from: scheduledTimeString)
            }
            
            // Debug: Log extracted waypoints
            print("🔍 [DEBUG] AIGatewayService - Extracted waypoints from AI: \(waypoints ?? [])")
        }
        
        
        
        // Generate ride suggestion if we have locations
        var rideSuggestion: RideSuggestionResponse? = nil
        if let entities = entities,
           let dropoff = entities.dropoffLocation {
            // Generate a ride suggestion with estimated price and duration using MapKit
            rideSuggestion = await generateRideSuggestion(
                pickup: entities.pickupLocation,
                dropoff: dropoff,
                rideType: entities.rideType ?? "standard"
            )
        }
        
        // Create VoiceProcessResponse with extracted information
        let voiceResponse = VoiceProcessResponse(
            success: true,
            transcript: text,
            intent: intent,
            entities: entities,
            rideSuggestion: rideSuggestion
        )
        
        
        return voiceResponse
    }
    
    // MARK: - Helper: Generate Ride Suggestion
    
    private let pricingService = RidePricingService()
    
    private func generateRideSuggestion(pickup: String?, dropoff: String, rideType: String) async -> RideSuggestionResponse {
        // Determine ride type enum
        let rideTypeEnum: RideType
        switch rideType.lowercased() {
        case "premium", "luxury":
            rideTypeEnum = .premium
        case "pool", "shared":
            rideTypeEnum = .shared
        default:
            rideTypeEnum = .standard
        }
        
        // Calculate estimate using MapKit (with real distance and duration)
        let (estimatedPrice, estimatedDuration, estimatedDistance) = await pricingService.calculateEstimateFromAddresses(
            pickup: pickup,
            dropoff: dropoff,
            rideType: rideTypeEnum
        )
        
        
        return RideSuggestionResponse(
            estimatedPrice: estimatedPrice,
            estimatedDuration: estimatedDuration,
            estimatedDistance: estimatedDistance,
            rideType: rideType.capitalized,
            pickupLocation: pickup,
            dropoffLocation: dropoff
        )
    }
}

// MARK: - Error Handling

extension NetworkError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case .invalidResponse(let message):
            return "Invalid response: \(message)"
        case .httpError(let code):
            return "HTTP error: \(code)"
        case .apiError(let message, let code):
            return "API error [\(code)]: \(message)"
        case .encodingError(let error):
            return "Encoding error: \(error.localizedDescription)"
        case .decodingError(let error):
            return "Decoding error: \(error.localizedDescription)"
        }
    }
}
