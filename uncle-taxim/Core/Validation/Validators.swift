import Foundation

protocol Validator {
    func validate(_ value: Any) throws
}

struct EmailValidator: Validator {
    func validate(_ value: Any) throws {
        guard let email = value as? String else {
            throw ValidationError.invalidType("Email must be a string")
        }
        
        guard !email.isEmpty else {
            throw ValidationError.emptyValue("Email cannot be empty")
        }
        
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        
        guard emailPredicate.evaluate(with: email) else {
            throw ValidationError.invalidFormat("Email format is invalid")
        }
    }
}

struct PasswordValidator: Validator {
    let minLength: Int
    
    init(minLength: Int = 6) {
        self.minLength = minLength
    }
    
    func validate(_ value: Any) throws {
        guard let password = value as? String else {
            throw ValidationError.invalidType("Password must be a string")
        }
        
        guard !password.isEmpty else {
            throw ValidationError.emptyValue("Password cannot be empty")
        }
        
        guard password.count >= minLength else {
            throw ValidationError.invalidLength("Password must be at least \(minLength) characters")
        }
    }
}

struct AddressValidator: Validator {
    func validate(_ value: Any) throws {
        guard let address = value as? String else {
            throw ValidationError.invalidType("Address must be a string")
        }
        
        guard !address.isEmpty else {
            throw ValidationError.emptyValue("Address cannot be empty")
        }
        
        guard address.count >= 5 else {
            throw ValidationError.invalidLength("Address must be at least 5 characters")
        }
    }
}

struct LocationValidator: Validator {
    func validate(_ value: Any) throws {
        guard let location = value as? LocationWithAddress else {
            throw ValidationError.invalidType("Location must be LocationWithAddress")
        }
        
        guard location.latitude >= -90 && location.latitude <= 90 else {
            throw ValidationError.invalidValue("Latitude must be between -90 and 90")
        }
        
        guard location.longitude >= -180 && location.longitude <= 180 else {
            throw ValidationError.invalidValue("Longitude must be between -180 and 180")
        }
        
        guard !location.address.isEmpty else {
            throw ValidationError.emptyValue("Address cannot be empty")
        }
    }
}

struct PriceValidator: Validator {
    func validate(_ value: Any) throws {
        guard let price = value as? Double else {
            throw ValidationError.invalidType("Price must be a number")
        }
        
        guard price >= 0 else {
            throw ValidationError.invalidValue("Price cannot be negative")
        }
        
        guard price <= 10000 else {
            throw ValidationError.invalidValue("Price cannot exceed 10000")
        }
    }
}

struct InputSanitizer {
    /// Sanitize string input by removing dangerous characters
    static func sanitize(_ input: String) -> String {
        return input
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "<", with: "")
            .replacingOccurrences(of: ">", with: "")
    }
    
    /// Sanitize email input
    static func sanitizeEmail(_ email: String) -> String {
        return sanitize(email).lowercased()
    }
}

enum ValidationError: Error, LocalizedError {
    case invalidType(String)
    case emptyValue(String)
    case invalidFormat(String)
    case invalidLength(String)
    case invalidValue(String)
    case invalidUserId(String)
    case invalidPrice(String)
    case invalidDuration(String)
    case invalidExpiration(String)
    case invalidRideId(String)
    case invalidDriverId(String)
    case invalidRating(String)
    case invalidEmail(String)
    case invalidPhoneNumber(String)
    case invalidName(String)
    case invalidLanguage(String)
    case invalidCurrency(String)
    case invalidSessionId(String)
    case invalidMessage(String)
    case invalidLicenseNumber(String)
    case invalidAudio(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidType(let message):
            return "Invalid type: \(message)"
        case .emptyValue(let message):
            return "Empty value: \(message)"
        case .invalidFormat(let message):
            return "Invalid format: \(message)"
        case .invalidLength(let message):
            return "Invalid length: \(message)"
        case .invalidValue(let message):
            return "Invalid value: \(message)"
        case .invalidUserId(let message):
            return "Invalid user ID: \(message)"
        case .invalidPrice(let message):
            return "Invalid price: \(message)"
        case .invalidDuration(let message):
            return "Invalid duration: \(message)"
        case .invalidExpiration(let message):
            return "Invalid expiration: \(message)"
        case .invalidRideId(let message):
            return "Invalid ride ID: \(message)"
        case .invalidDriverId(let message):
            return "Invalid driver ID: \(message)"
        case .invalidRating(let message):
            return "Invalid rating: \(message)"
        case .invalidEmail(let message):
            return "Invalid email: \(message)"
        case .invalidPhoneNumber(let message):
            return "Invalid phone number: \(message)"
        case .invalidName(let message):
            return "Invalid name: \(message)"
        case .invalidLanguage(let message):
            return "Invalid language: \(message)"
        case .invalidCurrency(let message):
            return "Invalid currency: \(message)"
        case .invalidSessionId(let message):
            return "Invalid session ID: \(message)"
        case .invalidMessage(let message):
            return "Invalid message: \(message)"
        case .invalidLicenseNumber(let message):
            return "Invalid license number: \(message)"
        case .invalidAudio(let message):
            return "Invalid audio: \(message)"
        }
    }
}

