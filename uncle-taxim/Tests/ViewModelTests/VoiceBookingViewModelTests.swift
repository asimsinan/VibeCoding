import XCTest
import Combine
@testable import UncleTaxim

class VoiceBookingViewModelTests: XCTestCase {
    var viewModel: VoiceBookingViewModel!
    var cancellables: Set<AnyCancellable>!
    
    override func setUp() {
        super.setUp()
        cancellables = Set<AnyCancellable>()
        viewModel = VoiceBookingViewModel()
    }
    
    override func tearDown() {
        cancellables = nil
        viewModel = nil
        super.tearDown()
    }
    
    // MARK: - State Management Tests
    
    func testInitialState() {
        // This test will fail initially (RED status)
        XCTAssertFalse(viewModel.isRecording, "Should not be recording initially")
        XCTAssertNil(viewModel.voiceResult, "Should have no voice result initially")
        XCTAssertFalse(viewModel.isProcessing, "Should not be processing initially")
    }
    
    func testStartRecordingStateManagement() {
        // This test will fail initially (RED status)
        viewModel.startRecording()
        
        XCTAssertTrue(viewModel.isRecording, "Should be recording after start")
    }
    
    func testStopRecordingStateManagement() {
        // This test will fail initially (RED status)
        viewModel.startRecording()
        viewModel.stopRecording()
        
        XCTAssertFalse(viewModel.isRecording, "Should not be recording after stop")
    }
    
    // MARK: - Service Integration Tests
    
    func testProcessVoiceServiceIntegration() {
        // This test will fail initially (RED status)
        let audioData = "base64_encoded_audio"
        
        let expectation = XCTestExpectation(description: "Voice processing completes")
        
        viewModel.$voiceResult
            .dropFirst()
            .sink { result in
                if result != nil {
                    expectation.fulfill()
                }
            }
            .store(in: &cancellables)
        
        viewModel.processVoice(audioData: audioData)
        
        wait(for: [expectation], timeout: 5.0)
    }
}

