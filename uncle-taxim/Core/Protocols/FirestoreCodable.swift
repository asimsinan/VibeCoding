import Foundation
import FirebaseFirestore

protocol FirestoreCodable: Codable {
    var id: String? { get set }
    func validate() throws
}

extension FirestoreCodable {
    func toFirestoreData() throws -> [String: Any] {
        let encoder = Firestore.Encoder()
        return try encoder.encode(self)
    }
    
    static func fromFirestoreData(_ data: [String: Any]) throws -> Self {
        let decoder = Firestore.Decoder()
        return try decoder.decode(Self.self, from: data)
    }
}

