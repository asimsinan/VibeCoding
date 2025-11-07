import Foundation
import Security

protocol KeychainServiceProtocol {
    func storeToken(_ token: String, forKey key: String) throws
    func getToken(forKey key: String) throws -> String?
    func deleteToken(forKey key: String) throws
}

class KeychainService: KeychainServiceProtocol {
    private let service: String
    
    init(service: String = "com.uncletaxim.app") {
        self.service = service
    }
    
    /// Store token securely in iOS Keychain
    func storeToken(_ token: String, forKey key: String) throws {
        guard let data = token.data(using: .utf8) else {
            throw KeychainError.dataConversionFailed
        }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]
        
        // Delete existing item if present
        SecItemDelete(query as CFDictionary)
        
        // Add new item
        let status = SecItemAdd(query as CFDictionary, nil)
        
        guard status == errSecSuccess else {
            throw KeychainError.storeFailed(status)
        }
    }
    
    /// Retrieve token from iOS Keychain
    func getToken(forKey key: String) throws -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess else {
            if status == errSecItemNotFound {
                return nil
            }
            throw KeychainError.retrieveFailed(status)
        }
        
        guard let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            throw KeychainError.dataConversionFailed
        }
        
        return token
    }
    
    /// Delete token from iOS Keychain
    func deleteToken(forKey key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.deleteFailed(status)
        }
    }
}

enum KeychainError: Error, LocalizedError {
    case storeFailed(OSStatus)
    case retrieveFailed(OSStatus)
    case deleteFailed(OSStatus)
    case dataConversionFailed
    
    var errorDescription: String? {
        switch self {
        case .storeFailed(let status):
            return "Failed to store token in Keychain: \(status)"
        case .retrieveFailed(let status):
            return "Failed to retrieve token from Keychain: \(status)"
        case .deleteFailed(let status):
            return "Failed to delete token from Keychain: \(status)"
        case .dataConversionFailed:
            return "Failed to convert token data"
        }
    }
}

