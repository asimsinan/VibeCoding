import XCTest
@testable import UncleTaxim

class VoiceProcessingServiceTests: XCTestCase {
    var voiceService: VoiceProcessingService!
    var mockAIGateway: AIGatewayService!
    
    override func setUp() {
        super.setUp()
        mockAIGateway = AIGatewayService()
        voiceService = VoiceProcessingService(aiGateway: mockAIGateway)
    }
    
    override func tearDown() {
        voiceService = nil
        mockAIGateway = nil
        super.tearDown()
    }
    
    // MARK: - Voice Input Handling Tests
    
    func testProcessVoiceInput_Success() {
        // This test will fail initially (RED status)
        let audioData = "base64_encoded_audio_data"
        let userId = "user123"
        
        Task {
            do {
                let result = try await voiceService.processVoiceInput(audioData: audioData, userId: userId)
                XCTAssertNotNil(result, "Voice processing should return result")
                XCTAssertTrue(result.success, "Voice processing should succeed")
            } catch {
                XCTFail("Voice processing should not throw error: \(error)")
            }
        }
    }
    
    func testProcessVoiceInput_WithEmptyAudio() {
        // This test will fail initially (RED status)
        let audioData = ""
        let userId = "user123"
        
        Task {
            do {
                _ = try await voiceService.processVoiceInput(audioData: audioData, userId: userId)
                XCTFail("Should throw error for empty audio")
            } catch {
                XCTAssertTrue(true, "Should throw error for empty audio")
            }
        }
    }
    
    // MARK: - Audio Processing Tests
    
    func testProcessAudio_ThroughAIGateway() {
        // This test will fail initially (RED status)
        let audioData = "base64_encoded_audio_data"
        let userId = "user123"
        
        Task {
            do {
                let result = try await voiceService.processVoiceInput(audioData: audioData, userId: userId)
                XCTAssertNotNil(result.transcript, "Should return transcript from AI Gateway")
                XCTAssertNotNil(result.intent, "Should return intent from AI Gateway")
            } catch {
                XCTFail("Audio processing should succeed: \(error)")
            }
        }
    }
    
    func testProcessAudio_ExtractEntities() {
        // This test will fail initially (RED status)
        let audioData = "base64_encoded_audio_data"
        let userId = "user123"
        
        Task {
            do {
                let result = try await voiceService.processVoiceInput(audioData: audioData, userId: userId)
                XCTAssertNotNil(result.entities, "Should extract entities from audio")
            } catch {
                XCTFail("Entity extraction should work: \(error)")
            }
        }
    }
    
    // MARK: - Integration Tests
    
    func testVoiceProcessingToRideSuggestion() {
        // This test will fail initially (RED status)
        let audioData = "base64_encoded_audio_data"
        let userId = "user123"
        
        Task {
            do {
                let result = try await voiceService.processVoiceInput(audioData: audioData, userId: userId)
                XCTAssertNotNil(result.rideSuggestion, "Should generate ride suggestion from voice")
            } catch {
                XCTFail("Voice to ride suggestion should work: \(error)")
            }
        }
    }
}

