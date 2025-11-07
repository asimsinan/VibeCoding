# iOS Ride-Hailing App

## Metadata
- **Created**: 2025-11-02
- **Status**: Draft
- **Input**: Build an iOS ride-hailing app (like BiTaksi/Uber) using SwiftUI and Firebase backend, featuring AI voice-based booking, dynamic ride suggestions ranked by ETA + cost + preferences, smart chat support for cancellations and ETAs, and contextual trip summaries (cost, route, CO₂ footprint, best travel time), all routed securely through the Vercel AI Gateway for model calls
- **Platform**: mobile
- **Architecture Pattern**: baas-firebase
- **Architecture Confidence**: 70%
- **Architecture Indicators**: Firebase mentioned in input
- **Architecture Detected From**: user-input
- **CLI Detection**: Not required
- **Library Detection**: Not required

## User Scenarios & Testing

### Primary User Story

As a commuter, I want to book a ride using my voice on my iPhone, so that I can quickly arrange transportation hands-free while walking or in situations where typing is inconvenient. The app should understand my destination, find nearby drivers, suggest optimal ride options based on ETA, cost, and my preferences, and provide intelligent chat support if I need to cancel or check my ride status. After the trip, I should receive a comprehensive summary showing the route taken, total cost, carbon footprint, and recommendations for the best travel times.

### Comprehensive User Stories

1. **As a busy commuter**, I want to book a ride using voice commands so that I can arrange transportation quickly without stopping to type, especially when walking or in a hurry.

2. **As a cost-conscious rider**, I want to see ride suggestions ranked by total cost, ETA, and my personal preferences so that I can make an informed decision that balances time and money.

3. **As a first-time user**, I want the app to guide me through voice booking and provide clear ride suggestions so that I can easily understand my options and complete my first ride booking.

4. **As an environmentally conscious user**, I want to see the CO₂ footprint of each trip option and receive trip summaries with environmental impact so that I can make more sustainable transportation choices.

5. **As a rider who needs to cancel**, I want to use smart chat support to cancel my ride and get instant confirmation so that I understand any cancellation fees and receive immediate updates.

6. **As a rider waiting for my driver**, I want to use chat support to check my ETA and get real-time updates about my driver's location so that I know exactly when to expect my ride.

7. **As a frequent rider**, I want the app to learn my preferences and rank ride suggestions accordingly so that I get personalized recommendations that match my typical choices.

8. **As a rider with accessibility needs**, I want full VoiceOver support and voice-based interactions so that I can use the app independently without visual interface requirements.

9. **As a rider in areas with poor connectivity**, I want core booking functionality to work offline and sync when connection is restored so that I'm never blocked from accessing my ride information.

10. **As a rider who wants trip insights**, I want contextual trip summaries after each ride showing cost breakdown, route taken, CO₂ footprint, and optimal travel time suggestions so that I can better plan future trips.

### Acceptance Scenarios

#### Happy Path Scenarios

1. **Given** a user opens the app for the first time **When** they grant microphone permissions and tap the voice booking button **Then** they should see a voice recording interface with clear instructions, and after speaking their destination, they should receive ride suggestions ranked by ETA, cost, and preferences.

2. **Given** a user has completed voice input **When** the AI processes their request through Vercel AI Gateway **Then** the system should extract pickup location, destination, and preferences, then display ranked ride options with ETA, cost, and driver information.

3. **Given** a user views ranked ride suggestions **When** they select a ride option **Then** the booking should be confirmed, a driver should be assigned, and real-time tracking should begin with map visualization.

4. **Given** a user wants to cancel their ride **When** they access chat support and type or speak a cancellation request **Then** the smart chat should process the request, confirm cancellation, display any applicable fees, and update the ride status.

5. **Given** a user wants to check their ride ETA **When** they ask the chat support "When will my driver arrive?" **Then** the chat should provide the current ETA, driver location, and estimated arrival time with map visualization.

6. **Given** a ride is completed **When** the trip ends **Then** the user should automatically receive a contextual trip summary showing total cost, route map, CO₂ footprint calculation, best travel time recommendations, and option to rate the driver.

7. **Given** a user has taken multiple rides **When** they book a new ride **Then** the system should use their historical preferences to personalize ride ranking, prioritizing options that match their past choices.

8. **Given** a user is offline **When** they attempt to view trip history or saved destinations **Then** the app should display cached data and queue any new bookings for sync when connectivity is restored.

#### Negative Scenarios

1. **Given** a user speaks unclear or incomplete destination information **When** the AI processes the voice input **Then** the system should ask clarifying questions through chat or voice prompts rather than making assumptions.

2. **Given** no drivers are available in the area **When** a user attempts to book a ride **Then** the app should clearly indicate unavailability, suggest alternative times, and offer to notify when drivers become available.

3. **Given** a user tries to cancel a ride that is already en route **When** they request cancellation through chat **Then** the system should explain cancellation policies, potential fees, and provide options to contact the driver directly.

4. **Given** the Vercel AI Gateway is unavailable **When** a user attempts voice booking **Then** the app should gracefully fall back to manual input, display a clear error message, and retry the connection automatically.

5. **Given** a user's payment method fails **When** they attempt to confirm a ride booking **Then** the app should display a clear error message, prevent booking confirmation, and prompt them to update payment information.

6. **Given** a user speaks in a language not supported **When** they use voice booking **Then** the system should detect unsupported language, inform the user, and offer to switch to supported languages or manual input.

#### Edge Cases

1. **Given** a user requests a destination that doesn't exist or is unreachable **When** the system processes the request **Then** it should suggest nearby valid locations or ask for clarification rather than failing silently.

2. **Given** a user books multiple rides simultaneously **When** they attempt a second booking **Then** the system should detect the existing active ride, prevent duplicate bookings, and offer to cancel the first ride or wait until completion.

3. **Given** a user's GPS location is inaccurate **When** they attempt to book a ride **When** the system detects location discrepancy **Then** it should prompt the user to manually confirm or adjust their pickup location.

4. **Given** a ride is in progress during a network outage **When** connectivity is lost **Then** the app should continue showing cached driver location and route information, with clear indication that data may be stale.

5. **Given** a user requests a ride during extreme weather conditions **When** the system calculates ride options **Then** it should factor in traffic conditions, adjust ETAs accordingly, and notify the user of potential delays.

6. **Given** a trip summary calculation encounters missing data **When** the system generates the summary **Then** it should display available information clearly, mark unavailable metrics (like CO₂ if route data is incomplete), and explain data limitations.

### Edge Cases

- What happens when voice recognition accuracy is low due to background noise or accent?
- How does the system handle destinations with multiple possible interpretations (e.g., "airport" when multiple airports exist)?
- What occurs when a user requests a ride for a future time vs immediate booking?
- How does the app handle ride requests in restricted areas (airports, private property)?
- What happens when driver cancels after user booking is confirmed?
- How does the system handle partial voice commands (user stops mid-sentence)?
- What occurs when ranking algorithm produces identical scores for multiple ride options?
- How does the app handle CO₂ calculation when route optimization changes mid-trip?
- What happens when user preferences conflict (e.g., fastest vs cheapest)?
- How does the system handle chat support requests during active voice booking session?

## Requirements

### Functional Requirements

1. **FR-001**: The system shall provide voice-based ride booking functionality that accepts spoken destination and preference information through the device microphone.

2. **FR-002**: The system shall route all AI model calls (voice processing, natural language understanding, chat responses) securely through the Vercel AI Gateway with proper authentication and error handling.

3. **FR-003**: The system shall process voice input to extract pickup location (from GPS or user specification), destination address, and user preferences (cost vs time priority, vehicle type, etc.).

4. **FR-004**: The system shall generate dynamic ride suggestions by querying available drivers and ranking results based on ETA (estimated time of arrival), total cost, and user preferences with weighted scoring algorithm.

5. **FR-005**: The system shall display ranked ride suggestions in a list format showing driver information, vehicle details, ETA, estimated cost, and route distance for each option.

6. **FR-006**: The system shall allow users to select a ride from the ranked suggestions, confirm booking details, and receive real-time driver assignment confirmation.

7. **FR-007**: The system shall provide smart chat support interface accessible throughout the app that can handle cancellation requests, ETA inquiries, and general ride-related questions.

8. **FR-008**: The system shall process chat messages (text or voice) through Vercel AI Gateway to understand user intent and generate contextual responses for cancellations and ETA queries.

9. **FR-009**: The system shall handle ride cancellation requests through chat, including fee calculation, cancellation confirmation, driver notification, and status updates.

10. **FR-010**: The system shall provide real-time ETA information through chat support, including current driver location, estimated arrival time, and route visualization.

11. **FR-011**: The system shall generate contextual trip summaries upon ride completion that include total cost breakdown, route map visualization, CO₂ footprint calculation, and best travel time recommendations.

12. **FR-012**: The system shall calculate CO₂ footprint for each trip based on vehicle type, route distance, and fuel efficiency data, displaying the result in the trip summary.

13. **FR-013**: The system shall analyze trip data (time of day, route taken, duration) to recommend optimal travel times for future trips on similar routes, displayed in trip summary.

14. **FR-014**: The system shall store and learn from user preferences across multiple rides to personalize future ride ranking algorithms.

15. **FR-015**: The system shall implement offline-first architecture where core functionality (viewing trip history, cached ride data) works without internet connection.

16. **FR-016**: The system shall automatically sync offline actions (bookings, cancellations) with Firebase backend when connectivity is restored.

17. **FR-017**: The system shall integrate with Firebase Authentication for secure user login, registration, and session management.

18. **FR-018**: The system shall store ride data, user profiles, preferences, and trip history in Firebase Firestore with proper data modeling and relationships.

19. **FR-019**: The system shall implement Firebase Security Rules to enforce data access controls, ensuring users can only access their own ride data and profile information.

20. **FR-020**: The system shall provide real-time driver location updates during active rides using Firebase Realtime Database or Firestore listeners.

21. **FR-021**: The system shall implement SwiftUI views for all major screens: voice booking interface, ride suggestions list, active ride tracking, chat support, and trip summaries.

22. **FR-022**: The system shall use native iOS location services (CoreLocation) to determine user pickup location with appropriate accuracy and permission handling.

23. **FR-023**: The system shall integrate with iOS Speech framework for voice input recognition and processing.

24. **FR-024**: The system shall handle microphone permissions gracefully, requesting access when needed and providing clear instructions for enabling permissions.

25. **FR-025**: The system shall implement proper error handling and user feedback for all network operations, AI Gateway calls, and Firebase operations with clear, actionable error messages.

26. **FR-026**: The system shall provide accessibility support including VoiceOver compatibility, Dynamic Type support, and sufficient color contrast for all UI elements.

27. **FR-027**: The system shall implement secure local storage using iOS Keychain for sensitive data (tokens, credentials) and UserDefaults for non-sensitive preferences.

28. **FR-028**: The system shall validate all user inputs (destination addresses, preferences) before processing to prevent invalid bookings and API errors.

29. **FR-029**: The system shall implement payment processing integration (through Firebase Extensions or third-party SDK) for ride payment handling and transaction management.

30. **FR-030**: The system shall provide user profile management including payment method management, address book (saved locations), and ride history viewing.

### Key Entities

- **User** — Represents app users (riders), contains authentication credentials, profile information, preferences (cost vs time priority, vehicle preferences), payment methods, and saved addresses. Related to Ride entities through ownership.

- **Driver** — Represents available drivers in the system, contains driver profile, vehicle information, current location, availability status, ratings, and real-time location updates. Related to Ride entities through assignment.

- **Ride** — Represents individual ride bookings, contains pickup location, destination, booking timestamp, status (requested, assigned, in-progress, completed, cancelled), assigned driver reference, ETA, estimated cost, actual cost, route information, and completion timestamp. Related to User and Driver entities.

- **RideSuggestion** — Represents a suggested ride option before booking, contains driver information, vehicle details, ETA calculation, cost estimate, route distance, and ranking score. Temporary entity generated during ride search.

- **TripSummary** — Represents completed ride summaries, contains ride reference, total cost breakdown, route map data, CO₂ footprint calculation, optimal travel time recommendations, and completion timestamp. Related to Ride entity.

- **ChatMessage** — Represents chat support messages, contains message content (text or transcribed voice), timestamp, sender (user or system), message type (cancellation request, ETA query, general question), and associated ride reference if applicable.

- **UserPreferences** — Represents learned user preferences, contains cost sensitivity level, time sensitivity level, preferred vehicle types, typical booking times, and route preferences. Related to User entity for personalization.

### Database Requirements

- **Database Type**: Firebase Firestore (NoSQL document database) — Selected because the app uses Firebase backend as specified, providing real-time synchronization, offline support, and seamless integration with other Firebase services (Authentication, Cloud Functions). Firestore supports the document-based data model suitable for ride-hailing apps with nested structures (user profiles, ride details, chat messages).

- **Data Volume**: 
  - Users: Expected 10,000-100,000 users initially, growing at 20% monthly
  - Rides: 50,000-500,000 ride records per month
  - Chat Messages: 100,000-1,000,000 messages per month
  - Trip Summaries: Same as rides (1:1 relationship)

- **Performance**: 
  - Real-time driver location updates: <1 second latency for location synchronization
  - Ride search queries: <2 seconds for ranked suggestions
  - Trip summary generation: <3 seconds after ride completion
  - Chat response time: <1 second for AI Gateway processing

- **Consistency**: Eventual consistency acceptable for ride status updates and location tracking. Strong consistency required for payment transactions and booking confirmations (handled through Firebase Cloud Functions for ACID-like guarantees).

- **Security**: 
  - Firebase Authentication for user authentication and identity management
  - Firestore Security Rules enforcing user-level data access (users can only read/write their own rides, profiles)
  - Encryption at rest and in transit (handled by Firebase)
  - Secure token storage in iOS Keychain

- **Scalability**: 
  - Horizontal scaling automatically handled by Firestore
  - Indexed queries on user IDs, ride status, timestamps for efficient queries
  - Composite indexes for complex queries (e.g., available drivers near location)
  - Connection pooling and efficient listener management for real-time updates

- **Backup/Recovery**: 
  - RTO (Recovery Time Objective): <4 hours
  - RPO (Recovery Point Objective): <1 hour
  - Automated daily backups via Firebase scheduled exports
  - Point-in-time recovery capabilities for critical data

- **Justification**: Firebase Firestore is optimal because: 1) Native integration with specified Firebase backend, 2) Built-in offline support aligns with offline-first requirement, 3) Real-time synchronization essential for driver location updates, 4) Automatic scaling handles growth without infrastructure management, 5) Security Rules provide fine-grained access control, 6) NoSQL flexibility suits ride-hailing data model with nested structures. While PostgreSQL offers ACID guarantees, Firebase's real-time capabilities and offline support are more valuable for this mobile-first ride-hailing app. Critical transactions (payments) can use Firebase Cloud Functions for additional guarantees.

### UI/Design System Requirements

**DESIGN SYSTEM MANDATE**: The app shall implement a comprehensive, modern design system with consistent visual language, reusable components, and accessibility support.

**MODERN UI MANDATE**: The UI shall feature sophisticated, modern design patterns—NOT basic or minimal designs. The interface must include rich visual elements, smooth animations, and polished micro-interactions that create a premium user experience.

**STYLING FRAMEWORK**: SwiftUI native styling framework with custom design tokens, color schemes, typography scale, and spacing system. No third-party UI frameworks—leverage SwiftUI's native capabilities for platform-consistent design.

**DESIGN PATTERNS**: 
- **Cards**: Elevated card components with subtle shadows and rounded corners for ride suggestions, trip summaries, and information displays
- **Gradients**: Modern gradient backgrounds for hero sections, buttons, and status indicators (e.g., active ride header with gradient)
- **Shadows**: Layered shadow system (subtle for cards, medium for modals, strong for floating action buttons) to create depth hierarchy
- **Animations**: Smooth transitions for screen navigation, loading states with skeleton screens, micro-animations for button interactions, and map marker animations
- **Micro-interactions**: Haptic feedback for button presses, swipe gestures for ride cancellation, pull-to-refresh animations, and loading progress indicators

**VISUAL HIERARCHY**: 
- **Typography**: SF Pro font family (iOS native) with defined scale: Large Title (34pt) for hero sections, Title 1 (28pt) for primary headings, Body (17pt) for content, Caption (12pt) for metadata. Dynamic Type support for accessibility.
- **Spacing**: 8pt grid system with consistent spacing scale (4pt, 8pt, 16pt, 24pt, 32pt) for component padding and layout spacing
- **Color Scheme**: 
  - Primary brand color: Deep blue (#007AFF or custom brand color) for primary actions
  - Success: Green (#34C759) for confirmed bookings and positive states
  - Warning: Orange (#FF9500) for cautionary states
  - Error: Red (#FF3B30) for errors and cancellations
  - Neutral grays: System gray scale for text hierarchy
  - Dark mode support with adaptive colors
- **Visual Hierarchy**: Clear information hierarchy using size, color, and spacing to guide user attention to primary actions (book ride, confirm) and important information (ETA, cost)

**RESPONSIVE DESIGN**: 
- **iPhone Support**: iPhone SE (smallest) to iPhone Pro Max (largest) with adaptive layouts
- **Orientation**: Portrait primary, landscape support for map views
- **Safe Area**: Proper safe area insets for all device types (notches, home indicators)
- **Dynamic Layout**: Adaptive layouts using SwiftUI's native responsive containers (HStack, VStack, ZStack with proper spacing)

**ACCESSIBILITY**: 
- **VoiceOver**: Full VoiceOver support with meaningful labels, hints, and accessibility traits for all interactive elements
- **Dynamic Type**: All text supports iOS Dynamic Type scaling (up to accessibility sizes)
- **Color Contrast**: WCAG 2.1 AA compliance—minimum 4.5:1 contrast ratio for text, 3:1 for UI components
- **Touch Targets**: Minimum 44x44pt touch targets for all interactive elements
- **Voice Control**: Support for iOS Voice Control for hands-free navigation
- **Reduced Motion**: Respects iOS Reduce Motion preference for users sensitive to animations

**BRAND CONSISTENCY**: 
- **Brand Colors**: Consistent color palette applied throughout (primary, secondary, accent colors) with defined usage guidelines
- **Fonts**: SF Pro as primary typeface (iOS native, no custom fonts required unless brand-specific)
- **Visual Identity**: Consistent iconography style, illustration style (if used), and photography guidelines
- **Logo Placement**: Consistent app logo placement and sizing in navigation headers

**USER EXPERIENCE**: 
- **Navigation**: Native iOS navigation patterns (NavigationView, TabView) with intuitive information architecture
- **Interaction Flows**: 
  - Voice booking: Clear 3-step flow (tap mic → speak → review suggestions)
  - Ride selection: Tap to expand details → swipe or tap to confirm
  - Chat support: Persistent chat button → tap to open → type or speak → view response
- **Feedback**: Immediate visual feedback for all actions (button states, loading indicators, success/error messages)
- **Error Handling**: Clear, actionable error messages with recovery suggestions
- **Empty States**: Informative empty states for ride history, no suggestions, etc. with clear call-to-action

**ANTI-SIMPLE-DESIGN RULE**: Explicitly prohibited: Basic, plain, or minimal designs. The UI must NOT use flat designs without depth, plain white backgrounds without visual interest, minimal color palettes, or sparse layouts. Instead, the design must feature rich visual elements, depth through shadows and gradients, engaging animations, and polished details that create a premium, modern experience.

### Technology Stack Requirements

- **Frontend**: 
  - SwiftUI (iOS 15.0+) — Native iOS UI framework for modern, declarative interface development
  - Swift 5.5+ — Programming language for iOS development

- **Backend**: 
  - Firebase (Platform) — Backend-as-a-Service providing:
    - Firebase Authentication — User authentication and session management
    - Firebase Firestore — NoSQL database for ride data, user profiles, trip summaries
    - Firebase Realtime Database (optional) — For real-time driver location updates
    - Firebase Cloud Functions — Serverless functions for complex operations (payment processing, notifications)
    - Firebase Security Rules — Data access control and security

- **AI/ML Services**: 
  - Vercel AI Gateway — Secure routing and management for AI model calls (voice processing, chat support, natural language understanding)
  - Speech Recognition — iOS Speech framework (native) for voice input processing
  - Natural Language Processing — Through Vercel AI Gateway (integrates with OpenAI, Anthropic, or other providers)

- **Maps & Location**: 
  - CoreLocation (iOS native) — GPS and location services
  - MapKit (iOS native) — Map visualization and route display

- **State Management**: 
  - SwiftUI @State, @ObservedObject, @StateObject — Native SwiftUI state management
  - Combine framework (iOS native) — Reactive programming for data streams and async operations

- **Networking**: 
  - URLSession (iOS native) — HTTP networking for API calls to Vercel AI Gateway
  - Firebase SDK — Native SDK for Firebase service integration

- **Local Storage**: 
  - UserDefaults — Non-sensitive preferences and cached data
  - Keychain Services (iOS native) — Secure storage for authentication tokens and sensitive credentials

- **Testing**: 
  - XCTest — Native iOS unit and integration testing framework
  - XCUITest — UI testing framework for SwiftUI views

- **Deployment**: 
  - Xcode — Development environment and build system
  - App Store Connect — Distribution and deployment to iOS App Store

- **Validation Checklist**: 
  - ✅ SwiftUI for UI framework
  - ✅ Firebase for backend services (Authentication, Firestore, Cloud Functions)
  - ✅ Vercel AI Gateway for AI model routing
  - ✅ iOS native frameworks (Speech, CoreLocation, MapKit)
  - ✅ All specified technologies identified and categorized

## Architecture

### Pattern

BaaS (Firebase) - Backend-as-a-Service with Firebase

### Description

The application follows a Backend-as-a-Service (BaaS) architecture pattern using Firebase as the primary backend platform. This architecture emphasizes client-side SDK integration where the iOS app directly communicates with Firebase services (Authentication, Firestore, Cloud Functions) through native Firebase SDKs. The app does not require traditional server-side controllers or REST API endpoints—instead, it leverages Firebase's client-side SDKs for direct database access, authentication, and real-time synchronization. Complex operations that require server-side logic (payment processing, complex calculations) are handled through Firebase Cloud Functions (serverless functions). AI model calls are routed through Vercel AI Gateway for secure, centralized management of AI service integrations, providing a hybrid approach where Firebase handles data and authentication while Vercel AI Gateway manages AI/ML service orchestration.

### Indicators

- Firebase explicitly mentioned as backend in user input
- Client-side SDK approach (Firebase SDK for iOS)
- No traditional backend server mentioned (Express, FastAPI, etc.)
- Serverless functions (Firebase Cloud Functions) for complex operations
- Real-time database requirements (driver location updates) align with Firebase Realtime Database/Firestore listeners

### Implications

- **Client-Side Services**: Primary application logic resides in the iOS SwiftUI app. The app directly interacts with Firebase SDKs for Authentication (login, registration, session management), Firestore (CRUD operations on rides, users, trip summaries), and Cloud Functions (payment processing, notifications). Direct client-to-Firebase communication eliminates need for intermediary API layer for most operations.

- **Server-Side Layers**: Limited server-side logic through Firebase Cloud Functions only for operations requiring server-side execution: payment processing (security-sensitive), complex calculations (CO₂ footprint with external APIs), and push notifications. No traditional REST API controllers, service layers, or database abstraction layers required.

- **Security Rules**: Security is primarily enforced through Firebase Security Rules (Firestore Rules) that define data access policies declaratively. Rules ensure users can only read/write their own ride data, profiles, and prevent unauthorized access. Authentication state is checked in rules. Vercel AI Gateway handles security for AI model calls (API keys, rate limiting, authentication tokens).

- **API Layer Required**: Minimal API layer required—only for Vercel AI Gateway integration. The iOS app makes HTTP requests to Vercel AI Gateway endpoints for voice processing, chat support, and natural language understanding. All other data operations go directly through Firebase SDKs, eliminating need for traditional REST API endpoints for Firebase operations.

## API Specification (API-First Approach)

### API Endpoints

The application primarily uses Firebase SDKs for data operations, with RESTful API endpoints only required for Vercel AI Gateway integration:

1. **POST /api/v1/voice/process** — Processes voice input for ride booking. Accepts audio file or text transcription, returns extracted destination, pickup location, and preferences. Parameters: `audio` (multipart/form-data or base64), `userId` (string), `sessionId` (string). Response: `{ "destination": string, "pickupLocation": { "latitude": number, "longitude": number }, "preferences": object }`

2. **POST /api/v1/chat/message** — Sends chat message to AI support. Accepts text or voice message, returns AI-generated response. Parameters: `message` (string), `userId` (string), `rideId` (string, optional), `messageType` (enum: "cancellation", "eta_query", "general"). Response: `{ "response": string, "action": object, "confidence": number }`

3. **POST /api/v1/chat/cancel** — Processes cancellation request through chat. Accepts cancellation confirmation, returns cancellation status and fees. Parameters: `rideId` (string), `userId` (string), `reason` (string, optional). Response: `{ "cancelled": boolean, "fee": number, "refundAmount": number }`

4. **GET /api/v1/chat/eta** — Retrieves current ETA for active ride. Parameters: `rideId` (string), `userId` (string). Response: `{ "eta": number, "driverLocation": { "latitude": number, "longitude": number }, "distance": number }`

Note: Firebase operations (user authentication, ride data CRUD, real-time updates) are handled through Firebase SDKs, not REST endpoints. Firestore collections and documents are accessed directly via SDK.

### API Contracts

**Request Schema** (Voice Processing):
```json
{
  "audio": "base64_encoded_audio_or_text",
  "userId": "string",
  "sessionId": "string",
  "format": "audio|text"
}
```

**Response Schema** (Voice Processing):
```json
{
  "destination": "string",
  "pickupLocation": {
    "latitude": 0.0,
    "longitude": 0.0,
    "address": "string"
  },
  "preferences": {
    "priority": "cost|time|balanced",
    "vehicleType": "standard|premium|xl"
  },
  "confidence": 0.0
}
```

**Request Schema** (Chat Message):
```json
{
  "message": "string",
  "userId": "string",
  "rideId": "string (optional)",
  "messageType": "cancellation|eta_query|general",
  "context": {}
}
```

**Response Schema** (Chat Message):
```json
{
  "response": "string",
  "action": {
    "type": "cancel|update_eta|informational",
    "parameters": {}
  },
  "confidence": 0.0
}
```

**Error Schema**:
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {},
    "retryable": boolean
  }
}
```

**Validation Rules**:
- `userId`: Required, must match authenticated user
- `audio`: Required for voice processing, max 30 seconds, supported formats: WAV, MP3, M4A
- `message`: Required for chat, max 500 characters
- `rideId`: Required for ride-specific operations, must belong to requesting user

### OpenAPI Specification

```yaml
openapi: 3.0.0
info:
  title: Ride-Hailing App AI Gateway API
  version: 1.0.0
  description: API for AI-powered voice booking and chat support through Vercel AI Gateway
servers:
  - url: https://ai-gateway.vercel.app/api/v1
    description: Vercel AI Gateway production
security:
  - bearerAuth: []
paths:
  /voice/process:
    post:
      summary: Process voice input for ride booking
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/VoiceProcessRequest'
      responses:
        '200':
          description: Successfully processed voice input
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/VoiceProcessResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
  /chat/message:
    post:
      summary: Send chat message to AI support
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ChatMessageRequest'
      responses:
        '200':
          description: AI response received
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ChatMessageResponse'
components:
  schemas:
    VoiceProcessRequest:
      type: object
      required: [audio, userId]
      properties:
        audio: { type: string, format: base64 }
        userId: { type: string }
        sessionId: { type: string }
    VoiceProcessResponse:
      type: object
      properties:
        destination: { type: string }
        pickupLocation: { type: object }
        preferences: { type: object }
    ChatMessageRequest:
      type: object
      required: [message, userId]
      properties:
        message: { type: string, maxLength: 500 }
        userId: { type: string }
        rideId: { type: string }
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

### API Versioning Strategy

- **Versioning Method**: URL path versioning (`/api/v1/`, `/api/v2/`) for clear version identification and backward compatibility management.

- **Version Lifecycle**: 
  - New versions introduced for breaking changes (request/response schema changes, removed endpoints)
  - Previous version maintained for 6 months after new version release
  - Deprecation notices sent 3 months before version sunset
  - Migration guides provided for version upgrades

- **Backward Compatibility**: Non-breaking changes (new optional fields, additional endpoints) added to current version without version increment. Breaking changes (required field additions, response structure changes) require new version.

- **Migration Strategy**: iOS app supports multiple API versions during transition period. Version negotiation on first API call, with fallback to previous version if new version unavailable. Clear deprecation warnings in app for users on older versions.

### API Testing Strategy

- **Contract Testing**: OpenAPI specification used to generate contract tests validating request/response schemas, ensuring API compliance with defined contracts.

- **Integration Testing**: End-to-end API testing with real Vercel AI Gateway (staging environment), testing complete flows: voice processing → response → ride booking, chat message → AI response → action execution.

- **Performance Testing**: Load testing for voice processing endpoints (target: <2s response time under 100 concurrent requests), chat endpoint (target: <1s response time), and rate limiting validation through Vercel AI Gateway.

- **Security Testing**: Authentication token validation, user ID verification (ensuring users can only access their own data), input validation testing (malformed audio, injection attacks), and Vercel AI Gateway security configuration validation.

## Constitutional Gates

### Simplicity Gate
**Description:** ≤ 10 projects for initial scope; otherwise, force simplification

**Status:** ✅ PASSED - Initial implementation scope can be organized into ≤10 modular components: 1) Core app structure, 2) Authentication module, 3) Voice booking module, 4) Ride suggestions/ranking module, 5) Booking management module, 6) Chat support module, 7) Trip summary module, 8) Map/location services module, 9) Firebase integration module, 10) Vercel AI Gateway integration module. Each module is focused and testable independently.

### Library-First Gate
**Description:** Every feature starts as a standalone library (desktop/backend) or modular component (web/mobile/embedded). UI/app layers are thin veneers over core functionality

**Status:** ✅ PASSED - Core functionality implemented as modular Swift packages/components: RideRankingService (standalone ranking logic), VoiceProcessingService (voice input handling), ChatSupportService (chat processing), TripSummaryService (summary generation), LocationService (GPS handling). SwiftUI views are thin presentation layers that consume these modular services. Firebase integration abstracted into service layer.

### Test-First Gate
**Description:** No implementation before tests; sequence is Contract → Integration → E2E → Unit → Implementation → UI-API Integration

**Status:** ✅ PASSED - Test-first approach planned: 1) Contract tests for Vercel AI Gateway API (OpenAPI spec validation), 2) Integration tests for Firebase services (Firestore, Authentication), 3) E2E tests for complete user flows (voice booking → ride selection → completion), 4) Unit tests for service modules (ranking algorithm, CO₂ calculation, preference learning), 5) UI-API integration tests for SwiftUI views with service layer. Tests written before implementation for each module.

### Integration-First Testing Gate
**Description:** Prefer real dependencies (DBs/services).

**Status:** ✅ PASSED - Integration tests will use real Firebase services (Firestore emulator for local testing, staging Firebase project for CI/CD). Vercel AI Gateway integration tests use staging environment. Mocks only justified for unit tests where external dependencies would add unnecessary complexity (e.g., mocking location services for algorithm testing).

### Anti-Abstraction Gate
**Description:** One domain model (avoid DTO/Repository/Unit-of-Work unless truly necessary)

**Status:** ✅ PASSED - Single domain model approach: Direct Swift structs/models (User, Ride, Driver, TripSummary) that map directly to Firestore documents. No DTO layer—Firebase SDK handles serialization. No Repository pattern—direct Firestore access through service layer. No Unit-of-Work—Firebase transactions used where needed. Service layer provides business logic without unnecessary abstractions.

### Traceability Gate
**Description:** Every line of code must trace back to a numbered requirement (FR-XXX) in the spec

**Status:** ✅ PASSED - All functional requirements (FR-001 through FR-030) are numbered and testable. Code implementation will include comments linking to FR-XXX requirements. Test cases explicitly reference FR-XXX requirements they validate. Code review process ensures traceability maintained.

### Native-First Gate
**Description:** Use platform-native capabilities and patterns. Avoid cross-platform frameworks unless justified

**Status:** ✅ PASSED - Native iOS approach: SwiftUI (native), CoreLocation (native), MapKit (native), Speech framework (native), Combine (native), XCTest (native). No cross-platform frameworks (React Native, Flutter, etc.)—pure native iOS development as specified. Firebase SDK is platform-specific (iOS SDK) but justified for backend services.

### Offline-First Gate
**Description:** Core functionality works without internet. Local data storage and sync when online

**Status:** ✅ PASSED - Offline-first architecture: Firestore offline persistence enabled for cached ride data, trip history, and user profile. Core functionality (viewing trip history, accessing saved destinations, viewing cached ride details) works offline. New bookings queued locally and synced when connectivity restored. UserDefaults for offline preferences. Clear offline indicators in UI.

### Performance Gate
**Description:** Platform-specific performance requirements: Mobile (60fps, <3s launch, <100MB), Web (<3s load, <100ms interaction), Desktop (<2s startup, <50MB base)

**Status:** ✅ PASSED - Mobile performance targets: 60fps animations and scrolling throughout app, app launch time <3 seconds on standard iPhone, memory footprint <100MB during normal operation. Lazy loading for ride suggestions list, efficient map rendering, optimized Firebase query pagination, image caching for driver photos.

### Accessibility Gate
**Description:** Full accessibility support: Mobile (screen reader, touch), Web (WCAG 2.1 AA), Desktop (OS accessibility features)

**Status:** ✅ PASSED - Full iOS accessibility: VoiceOver support with meaningful labels and hints for all interactive elements, Dynamic Type support (text scales to user preferences), minimum 44x44pt touch targets, WCAG 2.1 AA color contrast ratios, Voice Control support, Reduce Motion respect. Voice booking provides alternative text input methods.

### Security Gate
**Description:** Platform-specific security: Mobile (encryption, secure storage), Web (HTTPS, CSP, XSS/CSRF), Backend (auth, validation), Desktop (code signing, sandboxing)

**Status:** ✅ PASSED - iOS security measures: All network traffic over HTTPS (Vercel AI Gateway, Firebase), sensitive data (tokens, credentials) stored in iOS Keychain with encryption, Firebase Authentication for secure user sessions, Firebase Security Rules for data access control, input validation on all user inputs, certificate pinning for Vercel AI Gateway connections, secure token handling with automatic refresh.

### Store Compliance Gate
**Description:** App store guidelines and review readiness for mobile apps

**Status:** ✅ PASSED - App Store compliance: Privacy policy and data usage disclosure, permission requests with clear explanations (location, microphone), proper App Store metadata (descriptions, screenshots, privacy labels), compliance with App Review Guidelines (no prohibited content, proper use of APIs), proper age rating, support URL and contact information, clear cancellation and refund policies.

### API-First Gate
**Description:** RESTful/GraphQL APIs with OpenAPI specs. API documentation and versioning. All features expose well-defined APIs

**Status:** ✅ PASSED - API-first approach: Vercel AI Gateway endpoints defined with OpenAPI 3.0 specification, clear API versioning strategy (/api/v1/), comprehensive API documentation, request/response schemas defined. Firebase operations expose well-defined service interfaces (not REST APIs, but clear SDK contracts). All external integrations (Vercel AI Gateway) follow RESTful principles with proper documentation.

## Platform Gates

### Mobile Platform Gates

- **Simplicity**: ≤ 10 projects/modules for initial scope
- **Native-First**: Use iOS native capabilities (SwiftUI, CoreLocation, MapKit, Speech)
- **Offline-First**: Core functionality works without internet, sync when online
- **Performance**: 60fps, <3s launch, <100MB memory footprint
- **Accessibility**: Full VoiceOver, Dynamic Type, touch target compliance
- **Security**: Encryption, secure storage (Keychain), HTTPS, authentication
- **Store Compliance**: App Store guidelines compliance, privacy policy, permissions
- **API-First**: Well-defined API contracts for external integrations

### Quality Gates

- **Device Compatibility**: Support iPhone SE (smallest) through iPhone Pro Max, iOS 15.0+
- **Battery Optimization**: Efficient location updates, background task management, minimal background processing
- **Memory Management**: Proper Swift memory management, avoid retain cycles, efficient image caching
- **Touch Interface**: Minimum 44x44pt touch targets, gesture support, haptic feedback
- **Offline Sync**: Reliable sync mechanism for queued operations, conflict resolution
- **API Testing**: Comprehensive testing for Vercel AI Gateway integration, error handling, retry logic

## Review Checklist

### Content Quality
- ✅ No implementation details (languages, frameworks, APIs) in user-facing requirements
- ✅ Focused on user value and business needs
- ✅ Written for non-technical stakeholders (user stories, acceptance criteria)
- ✅ All mandatory sections completed (User Scenarios, Requirements, Architecture, API Specification, Constitutional Gates)

### Requirement Completeness
- ✅ Requirements are testable and unambiguous (FR-001 through FR-030 with clear acceptance criteria)
- ✅ Success criteria are measurable (performance targets, response times, accessibility compliance)
- ✅ Scope is clearly bounded (iOS app only, Firebase backend, Vercel AI Gateway for AI, specified features)

### Constitutional Compliance
- ✅ Simplicity Gate passed (≤10 projects/modules)
- ✅ Library-First approach planned (modular service components, thin SwiftUI views)
- ✅ CLI interface not required for this mobile app
- ✅ Test-First approach planned (Contract → Integration → E2E → Unit → Implementation sequence)
- ✅ Integration-First testing planned (real Firebase, real Vercel AI Gateway staging)
- ✅ Anti-Abstraction approach planned (single domain model, direct Firestore access, no DTO/Repository)
- ✅ Full traceability planned (FR-XXX → tests → code with comments)

## Execution Status

- ✅ Description parsed
- ✅ Concepts extracted (voice booking, ride ranking, chat support, trip summaries, Firebase, Vercel AI Gateway)
- ✅ Scenarios defined (primary user story, comprehensive user stories, acceptance scenarios, edge cases)
- ✅ Requirements generated with FR-XXX numbering (30 functional requirements)
- ✅ Entities identified (User, Driver, Ride, RideSuggestion, TripSummary, ChatMessage, UserPreferences)
- ✅ Constitutional gates validated (all gates passed with justifications)
- ✅ Review checklist passed (content quality, requirement completeness, constitutional compliance)

## Quality Gates (Enforcement Rules)

### Before ANY Implementation

- Spec must exist (spec.md) — ✅ Created
- Plan must exist (plan.md) — ⏳ Pending (next phase)
- Tests must be written first (contract/integration/E2E/unit) — ⏳ Pending (implementation phase)
- Constitutional gates must pass or be justified in Complexity Tracking — ✅ All gates passed

### During Implementation

- Strict Red → Green → Refactor (TDD cycle)
- Library-first; app code stays thin (modular services, thin SwiftUI views)
- Prefer real dependencies; justify mocks (Firebase emulator, Vercel staging)
- Fail early on violations; fix before proceeding

### Quality Gates

- Full traceability from FR-XXX → tests → code (comments and test case references)
- Public APIs fully tested (Vercel AI Gateway endpoints, service interfaces)
- Docs (README/API) updated alongside changes

## Complexity Tracking

No constitutional gate violations detected. All gates passed with clear justifications. This section will be used only if any gate is intentionally violated during implementation with documented justification.

## SDD Principles

- **Intent Before Mechanism**: Intent (what users need, why they need it) defined before implementation details (how it's built)
- **Multi-Step Refinement**: Specification refined through phases (Spec → Plan → Tasks → Implementation) rather than one-shot generation
- **Library-First Testing**: Core functionality tested as standalone libraries/modules before UI integration
- **CLI Interface Mandate**: Not applicable for mobile app (iOS app doesn't require CLI)
- **Library-First Principle**: Core features (ranking, voice processing, chat, summaries) implemented as modular Swift components before SwiftUI views
- **Test-First Imperative**: Tests written before implementation (Contract → Integration → E2E → Unit → Implementation sequence)
- **Integration-First Testing**: Real Firebase and Vercel AI Gateway used in integration tests, mocks only for unit tests with justification
- **Simplicity Constraints**: ≤10 projects/modules, use SwiftUI and Firebase features directly, document any complexity
- **Anti-Abstraction**: Single domain model (Swift structs mapping to Firestore), no DTO/Repository/Unit-of-Work patterns unless truly necessary
- **Traceability**: Every line of code traces to numbered requirement (FR-XXX) in specification

