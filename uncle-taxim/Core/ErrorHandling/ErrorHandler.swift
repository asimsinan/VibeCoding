import Foundation

/// Standard error response format
struct ErrorResponse: Codable {
    let error: String
    let message: String
    let code: String
    let timestamp: Date
    
    init(error: String, message: String, code: String) {
        self.error = error
        self.message = message
        self.code = code
        self.timestamp = Date()
    }
}

/// Error codes for consistent error handling
enum ErrorCode: String {
    case validationError = "VALIDATION_ERROR"
    case authenticationError = "AUTHENTICATION_ERROR"
    case authorizationError = "AUTHORIZATION_ERROR"
    case notFound = "NOT_FOUND"
    case networkError = "NETWORK_ERROR"
    case serverError = "SERVER_ERROR"
    case unknownError = "UNKNOWN_ERROR"
}

/// Centralized error handling service
class ErrorHandler {
    private let logger: ErrorLoggerProtocol
    
    init(logger: ErrorLoggerProtocol = ErrorLogger()) {
        self.logger = logger
    }
    
    /// Handle error and return standardized error response
    func handleError(_ error: Error) -> ErrorResponse {
        logger.logError(error)
        
        if let validationError = error as? ValidationError {
            return ErrorResponse(
                error: "Validation Error",
                message: validationError.localizedDescription,
                code: ErrorCode.validationError.rawValue
            )
        }
        
        if let authError = error as? AuthError {
            return ErrorResponse(
                error: "Authentication Error",
                message: authError.localizedDescription,
                code: ErrorCode.authenticationError.rawValue
            )
        }
        
        if let dataError = error as? DataServiceError {
            if case .authenticationRequired = dataError {
                return ErrorResponse(
                    error: "Authentication Required",
                    message: dataError.localizedDescription ?? "User must be authenticated",
                    code: ErrorCode.authenticationError.rawValue
                )
            }
            if case .authorizationFailed = dataError {
                return ErrorResponse(
                    error: "Authorization Failed",
                    message: dataError.localizedDescription ?? "User not authorized",
                    code: ErrorCode.authorizationError.rawValue
                )
            }
            if case .notFound = dataError {
                return ErrorResponse(
                    error: "Not Found",
                    message: dataError.localizedDescription ?? "Resource not found",
                    code: ErrorCode.notFound.rawValue
                )
            }
        }
        
        if let networkError = error as? NetworkError {
            return ErrorResponse(
                error: "Network Error",
                message: networkError.localizedDescription ?? "Network request failed",
                code: ErrorCode.networkError.rawValue
            )
        }
        
        // Default error response
        return ErrorResponse(
            error: "Unknown Error",
            message: error.localizedDescription,
            code: ErrorCode.unknownError.rawValue
        )
    }
    
    /// Attempt error recovery where possible
    func attemptRecovery(from error: Error) -> Bool {
        // Network errors can be retried
        if error is NetworkError {
            return true
        }
        
        // Authentication errors might be recoverable with retry
        if error is AuthError {
            return true
        }
        
        return false
    }
}

/// Error logging protocol
protocol ErrorLoggerProtocol {
    func logError(_ error: Error)
    func logError(_ error: Error, context: [String: Any])
}

/// Error logger implementation
class ErrorLogger: ErrorLoggerProtocol {
    func logError(_ error: Error) {
        logError(error, context: [:])
    }
    
    func logError(_ error: Error, context: [String: Any]) {
        let errorInfo: [String: Any] = [
            "error": error.localizedDescription,
            "type": String(describing: type(of: error)),
            "timestamp": Date().timeIntervalSince1970,
            "context": context
        ]
        
        // In production, this would send to logging service
    }
}

/// Error monitoring service
class ErrorMonitor {
    private let logger: ErrorLoggerProtocol
    private var errorCounts: [String: Int] = [:]
    
    init(logger: ErrorLoggerProtocol = ErrorLogger()) {
        self.logger = logger
    }
    
    func recordError(_ error: Error) {
        let errorType = String(describing: type(of: error))
        errorCounts[errorType, default: 0] += 1
        
        logger.logError(error, context: [
            "errorCount": errorCounts[errorType] ?? 0
        ])
    }
    
    func getErrorCount(for errorType: String) -> Int {
        return errorCounts[errorType] ?? 0
    }
    
    func getAllErrorCounts() -> [String: Int] {
        return errorCounts
    }
}

