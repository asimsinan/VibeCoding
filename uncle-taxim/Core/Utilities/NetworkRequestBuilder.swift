import Foundation

struct NetworkRequestBuilder {
    static func buildRequest(
        url: URL,
        method: HTTPMethod = .POST,
        apiKey: String,
        body: Encodable? = nil
    ) throws -> URLRequest {
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "X-API-Key")
        
        if let body = body {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            request.httpBody = try encoder.encode(body)
        }
        
        return request
    }
    
    static func decodeResponse<T: Decodable>(
        _ type: T.Type,
        from data: Data
    ) throws -> T {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(type, from: data)
    }
    
    static func handleHTTPResponse(
        _ response: URLResponse,
        data: Data
    ) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse("Invalid response type")
        }
        
        guard httpResponse.statusCode == 200 else {
            // Try to decode error response, but handle gracefully if it fails
            if !data.isEmpty {
                // Try to parse as JSON first to get error message
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    let errorMessage = json["error"] as? String ?? json["message"] as? String ?? "Unknown error"
                    let errorCode = json["code"] as? String ?? "\(httpResponse.statusCode)"
                    throw NetworkError.apiError(errorMessage, code: errorCode)
                }
                
                // Try to decode as ErrorResponse if JSON parsing worked
                if let errorData = try? decodeResponse(ErrorResponse.self, from: data) {
                    throw NetworkError.apiError(errorData.error, code: errorData.code)
                }
            }
            
            // Fallback: use status code and raw data if available
            let errorMessage = data.isEmpty ? "Empty response" : String(data: data, encoding: .utf8) ?? "Unknown error"
            throw NetworkError.httpError(httpResponse.statusCode)
        }
    }
}

enum HTTPMethod: String {
    case GET = "GET"
    case POST = "POST"
    case PUT = "PUT"
    case DELETE = "DELETE"
}

enum NetworkError: Error {
    case invalidResponse(String)
    case httpError(Int)
    case apiError(String, code: String)
    case encodingError(Error)
    case decodingError(Error)
}

