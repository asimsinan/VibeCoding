import Foundation

extension Array {
    /// Concurrent map for parallel processing
    func concurrentMap<T>(_ transform: @escaping (Element) -> T) -> [T] {
        let queue = DispatchQueue(label: "com.uncletaxim.concurrentMap", attributes: .concurrent)
        let group = DispatchGroup()
        var results: [T?] = []
        results.reserveCapacity(count)
        for _ in 0..<count {
            results.append(nil)
        }
        
        for (index, element) in enumerated() {
            group.enter()
            queue.async {
                results[index] = transform(element)
                group.leave()
            }
        }
        
        group.wait()
        return results.compactMap { $0 }
    }
}

