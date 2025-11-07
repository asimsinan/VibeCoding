import Foundation
import FirebaseAuth

/// Service for retrieving relevant rides and transactions for RAG (Retrieval-Augmented Generation)
class ChatRetrievalService {
    private let dataService: FirebaseDataService
    
    init(dataService: FirebaseDataService = FirebaseDataService()) {
        self.dataService = dataService
    }
    
    /// Retrieves relevant rides and transactions based on the user's query
    /// Uses keyword matching and semantic understanding to find relevant documents
    func retrieveRelevantDocuments(userId: String, query: String) async throws -> RetrievedContext {
        // Fetch all user's rides, transactions, and trip summaries
        let rides = try await dataService.getUserRides(userId: userId)
        let transactions = try await dataService.getUserTransactions(userId: userId)
        
        // Fetch trip summaries for completed rides (to get CO2 emissions)
        var tripSummaries: [TripSummary] = []
        do {
            tripSummaries = try await dataService.getUserTripSummaries(userId: userId)
        } catch {
            // If trip summaries can't be fetched, continue without them
            print("⚠️ [DEBUG] ChatRetrievalService - Could not fetch trip summaries: \(error)")
        }
        
        // Create a map of rideId -> TripSummary for quick lookup
        let tripSummaryMap = Dictionary(uniqueKeysWithValues: tripSummaries.map { ($0.rideId, $0) })
        
        // Normalize query for matching
        let normalizedQuery = query.lowercased()
        
        // Retrieve relevant rides (simple text matching + recency)
        let relevantRides = retrieveRelevantRides(rides: rides, query: normalizedQuery)
        
        // Retrieve relevant transactions (simple text matching + recency)
        let relevantTransactions = retrieveRelevantTransactions(transactions: transactions, query: normalizedQuery)
        
        return RetrievedContext(
            rides: relevantRides,
            transactions: relevantTransactions,
            tripSummaryMap: tripSummaryMap
        )
    }
    
    // MARK: - Private Methods
    
    private func retrieveRelevantRides(rides: [Ride], query: String) -> [Ride] {
        var scoredRides: [(ride: Ride, score: Double)] = []
        
        for ride in rides {
            var score: Double = 0.0
            
            // Build searchable text from ride
            let searchableText = buildSearchableText(from: ride).lowercased()
            
            // Score based on query text matching (simple substring matching)
            // The AI will handle semantic understanding, we just do basic text matching
            if searchableText.contains(query) {
                score += 10.0
            } else {
                // Partial matches - check if any significant words from query appear
                let queryWords = query.components(separatedBy: CharacterSet.whitespacesAndNewlines.union(CharacterSet.punctuationCharacters))
                    .filter { $0.count > 2 } // Only words longer than 2 chars
                
                for word in queryWords {
                    if searchableText.contains(word) {
                        score += 1.0
                    }
                }
            }
            
            // Boost score for exact address matches
            if query.contains(ride.pickupLocation.address.lowercased()) || 
               query.contains(ride.dropoffLocation.address.lowercased()) {
                score += 10.0
            }
            
            // Boost for waypoint matches
            for waypoint in ride.waypoints {
                if query.contains(waypoint.address.lowercased()) {
                    score += 5.0
                }
            }
            
            // Boost for CO2/emission queries (completed rides with trip summaries)
            if query.contains("co2") || query.contains("emission") || query.contains("carbon") || query.contains("footprint") {
                if ride.status == .completed {
                    score += 20.0
                }
            }
            
            // Boost for active rides (if query suggests current/active)
            if query.contains("current") || query.contains("active") || query.contains("ongoing") {
                if ride.status == .pending || ride.status == .accepted || ride.status == .inProgress {
                    score += 50.0
                }
            }
            
            // Boost for recent rides (if query suggests last/recent/latest)
            if query.contains("last") || query.contains("recent") || query.contains("latest") {
                let daysSince = Date().timeIntervalSince(ride.createdAt) / 86400
                score += max(0, 10.0 - daysSince) // Higher score for more recent rides
            } else {
                // Default: prefer recent rides slightly
                let daysSince = Date().timeIntervalSince(ride.createdAt) / 86400
                score += max(0, 3.0 - daysSince)
            }
            
            if score > 0 {
                scoredRides.append((ride: ride, score: score))
            }
        }
        
        // Sort by score (descending) and return top results
        let sortedRides = scoredRides.sorted { $0.score > $1.score }
        
        // Return top 10 most relevant rides
        return Array(sortedRides.prefix(10).map { $0.ride })
    }
    
    private func retrieveRelevantTransactions(transactions: [Transaction], query: String) -> [Transaction] {
        var scoredTransactions: [(transaction: Transaction, score: Double)] = []
        
        for transaction in transactions {
            var score: Double = 0.0
            
            // Build searchable text from transaction
            let searchableText = buildSearchableText(from: transaction).lowercased()
            
            // Score based on query text matching (simple substring matching)
            // The AI will handle semantic understanding, we just do basic text matching
            if searchableText.contains(query) {
                score += 10.0
            } else {
                // Partial matches - check if any significant words from query appear
                let queryWords = query.components(separatedBy: CharacterSet.whitespacesAndNewlines.union(CharacterSet.punctuationCharacters))
                    .filter { $0.count > 2 } // Only words longer than 2 chars
                
                for word in queryWords {
                    if searchableText.contains(word) {
                        score += 1.0
                    }
                }
            }
            
            // Boost for status matches
            if query.contains("successful") || query.contains("succeeded") {
                if transaction.status == .succeeded {
                    score += 50.0
                }
            }
            
            if query.contains("failed") || query.contains("error") {
                if transaction.status == .failed {
                    score += 50.0
                }
            }
            
            // Boost for recent transactions (if query suggests last/recent/latest)
            if query.contains("last") || query.contains("recent") || query.contains("latest") {
                let daysSince = Date().timeIntervalSince(transaction.createdAt) / 86400
                score += max(0, 10.0 - daysSince)
            } else {
                // Default: prefer recent transactions slightly
                let daysSince = Date().timeIntervalSince(transaction.createdAt) / 86400
                score += max(0, 3.0 - daysSince)
            }
            
            if score > 0 {
                scoredTransactions.append((transaction: transaction, score: score))
            }
        }
        
        // Sort by score (descending) and return top results
        let sortedTransactions = scoredTransactions.sorted { $0.score > $1.score }
        
        // Return top 10 most relevant transactions
        return Array(sortedTransactions.prefix(10).map { $0.transaction })
    }
    
    private func buildSearchableText(from ride: Ride) -> String {
        var text = ""
        text += ride.pickupLocation.address + " "
        text += ride.dropoffLocation.address + " "
        for waypoint in ride.waypoints {
            text += waypoint.address + " "
        }
        text += ride.status.rawValue + " "
        text += ride.status.displayName + " "
        text += ride.rideType.rawValue + " "
        text += String(format: "%.2f", ride.actualPrice ?? ride.estimatedPrice) + " "
        text += String(format: "%.1f", ride.actualDistance ?? ride.estimatedDistance) + " "
        
        // Add date information
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        text += formatter.string(from: ride.createdAt) + " "
        
        return text
    }
    
    private func buildSearchableText(from transaction: Transaction) -> String {
        var text = ""
        text += transaction.type.rawValue + " "
        text += transaction.status.rawValue + " "
        text += transaction.status.displayName + " "
        text += String(format: "%.2f", transaction.amount) + " "
        text += transaction.currency + " "
        
        if let description = transaction.description {
            text += description + " "
        }
        
        // Add date information
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        text += formatter.string(from: transaction.createdAt) + " "
        
        return text
    }
}

// MARK: - Supporting Types

struct RetrievedContext {
    let rides: [Ride]
    let transactions: [Transaction]
    let tripSummaryMap: [String: TripSummary]
    
    /// Formats the context as a string for inclusion in AI prompts
    func formatForPrompt() -> String {
        var context = ""
        
        if !rides.isEmpty {
            context += "=== USER'S RIDE HISTORY ===\n"
            context += "Total rides: \(rides.count)\n"
            context += "IMPORTANT: Only these \(rides.count) ride(s) exist. Do NOT reference any other rides.\n\n"
            for (index, ride) in rides.enumerated() {
                context += "Ride \(index + 1):\n"
                let tripSummary = ride.id.flatMap { tripSummaryMap[$0] }
                context += formatRide(ride, tripSummary: tripSummary)
                context += "\n\n"
            }
        } else {
            context += "=== USER'S RIDE HISTORY ===\n"
            context += "The user has NO rides in the system.\n"
            context += "IMPORTANT: Do NOT make up or invent any rides. If asked about rides, state that the user has no ride history.\n\n"
        }
        
        if !transactions.isEmpty {
            context += "=== USER'S TRANSACTION HISTORY ===\n"
            context += "Total transactions: \(transactions.count)\n"
            context += "IMPORTANT: Only these \(transactions.count) transaction(s) exist. Do NOT reference any other transactions.\n\n"
            for (index, transaction) in transactions.enumerated() {
                context += "Transaction \(index + 1):\n"
                context += formatTransaction(transaction)
                context += "\n\n"
            }
        } else {
            context += "=== USER'S TRANSACTION HISTORY ===\n"
            context += "The user has NO transactions in the system.\n"
            context += "IMPORTANT: Do NOT make up or invent any transactions. If asked about transactions, state that the user has no transaction history.\n\n"
        }
        
        return context
    }
    
    private func formatRide(_ ride: Ride, tripSummary: TripSummary? = nil) -> String {
        var text = ""
        text += "ID: \(ride.id ?? "N/A")\n"
        text += "Status: \(ride.status.displayName) (\(ride.status.rawValue))\n"
        text += "From: \(ride.pickupLocation.address)\n"
        text += "To: \(ride.dropoffLocation.address)\n"
        if !ride.waypoints.isEmpty {
            text += "Waypoints: \(ride.waypoints.map { $0.address }.joined(separator: ", "))\n"
        }
        text += "Price: $\(String(format: "%.2f", ride.actualPrice ?? ride.estimatedPrice))\n"
        text += "Distance: \(String(format: "%.1f", ride.actualDistance ?? ride.estimatedDistance)) km\n"
        text += "Duration: \(ride.actualDuration ?? ride.estimatedDuration) minutes\n"
        text += "Type: \(ride.rideType.rawValue.capitalized)\n"
        
        // Include CO2 emissions from trip summary if available
        if let tripSummary = tripSummary {
            let co2Value = tripSummary.tripSummary.calculatedCO2Footprint ?? tripSummary.tripSummary.co2Footprint
            if let co2 = co2Value {
                text += "CO2 Emissions: \(String(format: "%.2f", co2)) kg CO₂\n"
            }
        }
        
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        text += "Created: \(formatter.string(from: ride.createdAt))\n"
        
        if let actualPickupTime = ride.actualPickupTime {
            text += "Pickup Time: \(formatter.string(from: actualPickupTime))\n"
        }
        if let actualDropoffTime = ride.actualDropoffTime {
            text += "Dropoff Time: \(formatter.string(from: actualDropoffTime))\n"
        }
        
        return text
    }
    
    private func formatTransaction(_ transaction: Transaction) -> String {
        var text = ""
        text += "ID: \(transaction.id ?? "N/A")\n"
        text += "Type: \(transaction.typeDisplayName)\n"
        text += "Status: \(transaction.status.displayName) (\(transaction.status.rawValue))\n"
        text += "Amount: \(transaction.formattedAmount)\n"
        text += "Ride ID: \(transaction.rideId)\n"
        
        if let description = transaction.description {
            text += "Description: \(description)\n"
        }
        
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        text += "Created: \(formatter.string(from: transaction.createdAt))\n"
        
        return text
    }
}


