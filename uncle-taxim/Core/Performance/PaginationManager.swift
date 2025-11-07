import Foundation
import FirebaseFirestore

struct PaginationResult<T> {
    let items: [T]
    let lastDocument: DocumentSnapshot?
    let hasMore: Bool
}

class PaginationManager {
    /// Fetch paginated results from Firestore
    static func fetchPaginated<T: FirestoreCodable>(
        query: Query,
        limit: Int = 20,
        lastDocument: DocumentSnapshot? = nil
    ) async throws -> PaginationResult<T> {
        var paginatedQuery = query.limit(to: limit)
        
        if let lastDocument = lastDocument {
            paginatedQuery = paginatedQuery.start(afterDocument: lastDocument)
        }
        
        let snapshot = try await paginatedQuery.getDocuments()
        let items = try snapshot.documents.compactMap { doc in
            try Firestore.Decoder().decode(T.self, from: doc.data())
        }
        
        let lastDoc = snapshot.documents.last
        let hasMore = snapshot.documents.count == limit
        
        return PaginationResult(
            items: items,
            lastDocument: lastDoc,
            hasMore: hasMore
        )
    }
}

