import XCTest
import Combine
@testable import UncleTaxim

class ChatSupportViewModelTests: XCTestCase {
    var viewModel: ChatSupportViewModel!
    var cancellables: Set<AnyCancellable>!
    
    override func setUp() {
        super.setUp()
        cancellables = Set<AnyCancellable>()
        viewModel = ChatSupportViewModel()
    }
    
    override func tearDown() {
        cancellables = nil
        viewModel = nil
        super.tearDown()
    }
    
    // MARK: - State Management Tests
    
    func testInitialState() {
        // This test will fail initially (RED status)
        XCTAssertTrue(viewModel.messages.isEmpty, "Should have no messages initially")
        XCTAssertFalse(viewModel.isLoading, "Should not be loading initially")
        XCTAssertEqual(viewModel.inputMessage, "", "Should have empty input message initially")
    }
    
    func testSendMessageStateManagement() {
        // This test will fail initially (RED status)
        viewModel.inputMessage = "Hello"
        viewModel.sendMessage()
        
        XCTAssertTrue(viewModel.isLoading, "Should be loading when sending message")
    }
    
    func testClearInputStateManagement() {
        // This test will fail initially (RED status)
        viewModel.inputMessage = "Hello"
        viewModel.clearInput()
        
        XCTAssertEqual(viewModel.inputMessage, "", "Should clear input message")
    }
    
    // MARK: - Service Integration Tests
    
    func testSendMessageServiceIntegration() {
        // This test will fail initially (RED status)
        viewModel.inputMessage = "I need a ride"
        
        let expectation = XCTestExpectation(description: "Message sent")
        
        viewModel.$messages
            .dropFirst()
            .sink { messages in
                if !messages.isEmpty {
                    expectation.fulfill()
                }
            }
            .store(in: &cancellables)
        
        viewModel.sendMessage()
        
        wait(for: [expectation], timeout: 5.0)
    }
}

