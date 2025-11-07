import Foundation
import Combine
import FirebaseFirestore

class LazyLoadingManager<T> {
    private var items: [T] = []
    private var isLoading = false
    private var hasMore = true
    private var lastDocument: DocumentSnapshot?
    
    var itemsPublisher: AnyPublisher<[T], Never> {
        itemsSubject.eraseToAnyPublisher()
    }
    
    private let itemsSubject = CurrentValueSubject<[T], Never>([])
    
    /// Load more items lazily
    func loadMore(
        query: Query,
        limit: Int = 20,
        decoder: @escaping (DocumentSnapshot) throws -> T
    ) async throws {
        guard !isLoading && hasMore else { return }
        
        isLoading = true
        defer { isLoading = false }
        
        do {
            var paginatedQuery = query.limit(to: limit)
            
            if let lastDocument = lastDocument {
                paginatedQuery = paginatedQuery.start(afterDocument: lastDocument)
            }
            
            let snapshot = try await paginatedQuery.getDocuments()
            let newItems = try snapshot.documents.compactMap { doc in
                try decoder(doc)
            }
            
            items.append(contentsOf: newItems)
            itemsSubject.send(items)
            
            lastDocument = snapshot.documents.last
            hasMore = snapshot.documents.count == limit
        } catch {
            throw error
        }
    }
    
    /// Reset lazy loading state
    func reset() {
        items.removeAll()
        lastDocument = nil
        hasMore = true
        isLoading = false
        itemsSubject.send([])
    }
}

