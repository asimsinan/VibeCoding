# Implementation Plan: Mental Health Journal App

## Metadata
- **Created**: 2025-01-28
- **Status**: Draft
- **Platform**: Web
- **Spec Path**: specs/spec.md

## Summary

The Mental Health Journal App enables users to track their daily mood patterns through an intuitive 1-10 rating system with optional notes, providing valuable insights through interactive trend charts. Built with Next.js, TypeScript, and Tailwind CSS, the application follows a library-first architecture with local IndexedDB storage and optional cloud sync capabilities. The technical approach emphasizes progressive enhancement, responsive design, and comprehensive accessibility compliance to deliver a seamless mental health tracking experience across all devices.

## Technical Context

### Language & Version
- **TypeScript**: 5.0+ with strict mode enabled
- **Node.js**: 18+ LTS for development and build processes

### Primary Dependencies
- **Next.js**: 14+ with App Router for modern React development
- **React**: 18+ with concurrent features and hooks
- **Tailwind CSS**: 3.4+ for utility-first styling
- **Chart.js/Recharts**: Latest stable for interactive data visualization
- **Zod**: 3.22+ for runtime type validation and form validation
- **IndexedDB**: Native browser API for local data persistence

### Technology Stack
- **Frontend**: Next.js 14+ with App Router, React 18+, TypeScript 5.0+
- **Styling**: Tailwind CSS 3.4+ for responsive design and component styling
- **Charts**: Chart.js or Recharts for interactive mood trend visualizations
- **State Management**: React Context API or Zustand for local state management
- **Data Storage**: IndexedDB for local storage, optional PostgreSQL for cloud sync
- **Validation**: Zod for runtime type validation and form validation
- **Deployment**: Vercel for production deployment with PWA capabilities

### Frontend Stack
- Next.js 14+ with App Router for file-based routing and server components
- React 18+ with concurrent features, Suspense, and error boundaries
- TypeScript 5.0+ for type safety and enhanced developer experience
- Tailwind CSS 3.4+ for responsive, mobile-first styling

### Backend Stack
- Next.js API Routes for serverless API endpoints
- Optional PostgreSQL for cloud data synchronization
- IndexedDB for primary local data storage

### Styling Approach
- Tailwind CSS utility-first framework for rapid UI development
- Mobile-first responsive design with breakpoints: mobile (320px+), tablet (768px+), desktop (1024px+)
- Custom CSS variables for theme consistency and dark mode support
- Component-based styling with Tailwind's @apply directive

### Chart Libraries
- Chart.js for interactive mood trend visualizations with time period filtering
- Recharts as alternative for React-native chart components
- Custom chart configurations for mood data visualization (line charts, bar charts)

### State Management
- React Context API for global application state
- Zustand as lightweight alternative for complex state management
- Local component state for UI interactions and form handling

### Enterprise-Grade Storage
- **Primary**: IndexedDB for local data persistence with encryption
- **Secondary**: PostgreSQL for optional cloud synchronization
- **Caching**: Browser localStorage for user preferences and settings
- **Backup**: Export functionality for data portability

### Testing
- **Unit Tests**: Jest with React Testing Library
- **Integration Tests**: Playwright for end-to-end testing
- **Contract Tests**: Generated from OpenAPI specifications
- **Visual Tests**: Chromatic for component visual regression testing

### Target Platform
- **Primary**: Web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **Progressive Web App**: Offline functionality and mobile app-like experience
- **Responsive**: Mobile, tablet, and desktop device support

### Performance Goals
- **Initial Load**: <3 seconds for first contentful paint
- **Interaction Response**: <100ms for user interactions
- **Core Web Vitals**: LCP <2.5s, FID <100ms, CLS <0.1
- **Bundle Size**: <500KB gzipped for initial JavaScript bundle
- **Chart Rendering**: <500ms for trend chart generation

## Edge Case Analysis

### Has Edge Cases
Yes - 5 edge cases identified from specification

### Edge Case Count
5 edge cases requiring special attention

### Complexity Assessment
- **High Complexity**: 1 edge case (offline functionality)
- **Medium Complexity**: 2 edge cases (duplicate entries, no data scenarios)
- **Low Complexity**: 2 edge cases (JavaScript disabled, old data handling)

### Estimated Additional Time
- **High Complexity**: 4-6 hours additional development
- **Medium Complexity**: 2-3 hours additional development
- **Low Complexity**: 1-2 hours additional development
- **Total Additional Time**: 7-11 hours

### Edge Cases List
1. **Multiple mood entries for same day** (Medium) - Allow editing existing entry or create new entry with confirmation
2. **No mood data scenarios** (Medium) - Display empty state with onboarding guidance
3. **Offline functionality** (High) - Implement service worker and IndexedDB sync
4. **Very old mood entries** (Low) - Implement data pagination and lazy loading
5. **JavaScript disabled access** (Low) - Provide basic form functionality with server-side rendering

### Complexity Breakdown
- **High Complexity Edge Cases**: 1 (offline functionality with sync)
- **Medium Complexity Edge Cases**: 2 (duplicate handling, empty states)
- **Low Complexity Edge Cases**: 2 (old data, no-JS fallback)

## Constitution Check

### Simplicity Gate
✅ **PASSED**: 5 projects identified (within ≤5 limit)
- Core mood logging library
- Chart visualization library
- Data persistence layer
- Next.js web application
- API layer for cloud sync

### Architecture Gate
✅ **PASSED**: Library-first approach planned
- **Every Feature as Library**: Yes - Core functionality implemented as standalone libraries
- **CLI Per Library Planned**: Yes - Each library exposes CLI with --json mode
- **Libraries List**:
  - `@moodtracker/core` - Mood logging business logic
  - `@moodtracker/charts` - Data visualization components
  - `@moodtracker/storage` - Data persistence layer
  - `@moodtracker/api` - API client and server logic

### Testing Gate (NON-NEGOTIABLE)
✅ **PASSED**: TDD order enforced
- **TDD Order Enforced**: Yes - Contract → Integration → E2E → Unit → Implementation → UI-API Integration
- **Real Dependencies Used**: Yes - IndexedDB, Chart.js, real API endpoints
- **Contract Tests Planned**: Yes - Generated from OpenAPI specifications

### Platform-Specific Gates
✅ **PASSED**: All web platform gates validated
- **Progressive Enhancement**: Works without JavaScript, enhances with JS
- **Responsive Design**: Mobile-first with breakpoints for all screen sizes
- **Performance**: <3s load, <100ms interaction response
- **Security**: HTTPS, CSP, XSS/CSRF protection
- **Accessibility**: WCAG 2.1 AA compliance
- **Browser Compatibility**: Chrome, Firefox, Safari, Edge support
- **API-First**: RESTful endpoints with OpenAPI documentation

## Project Structure

```
src/
├── lib/                           # Core libraries (SDD Library-First)
│   ├── mood-core/                 # Mood logging business logic
│   │   ├── models/                # Data models and types
│   │   │   ├── MoodEntry.ts       # Core mood entry model
│   │   │   ├── User.ts            # User preferences model
│   │   │   └── MoodTrend.ts       # Trend analysis model
│   │   ├── services/              # Business logic services
│   │   │   ├── MoodService.ts     # Mood CRUD operations
│   │   │   ├── TrendService.ts    # Trend calculation logic
│   │   │   └── ValidationService.ts # Data validation
│   │   ├── cli.ts                 # CLI interface (--json mode)
│   │   └── index.ts               # Library exports
│   ├── mood-charts/               # Chart visualization library
│   │   ├── components/            # Chart components
│   │   │   ├── MoodTrendChart.tsx # Main trend chart
│   │   │   ├── MoodHistoryChart.tsx # History visualization
│   │   │   └── MoodStatsChart.tsx # Statistics display
│   │   ├── utils/                 # Chart utilities
│   │   │   ├── chartConfig.ts     # Chart.js configurations
│   │   │   └── dataTransform.ts   # Data transformation
│   │   ├── cli.ts                 # CLI interface (--json mode)
│   │   └── index.ts               # Library exports
│   ├── mood-storage/              # Data persistence library
│   │   ├── adapters/              # Storage adapters
│   │   │   ├── IndexedDBAdapter.ts # Local storage
│   │   │   └── PostgresAdapter.ts # Cloud storage
│   │   ├── services/              # Storage services
│   │   │   ├── LocalStorageService.ts # IndexedDB operations
│   │   │   └── CloudSyncService.ts # Sync operations
│   │   ├── cli.ts                 # CLI interface (--json mode)
│   │   └── index.ts               # Library exports
│   └── mood-api/                  # API client and server
│       ├── client/                # API client
│       │   ├── MoodApiClient.ts   # HTTP client
│       │   └── types.ts           # API types
│       ├── server/                # API server (Next.js routes)
│       │   ├── routes/            # API route handlers
│       │   └── middleware/        # Authentication, validation
│       ├── cli.ts                 # CLI interface (--json mode)
│       └── index.ts               # Library exports
├── contracts/                     # API specifications
│   ├── openapi.yaml              # OpenAPI 3.0 specification
│   ├── mood-entry.schema.json    # Mood entry JSON schema
│   └── api-types.ts              # Generated TypeScript types
├── tests/                         # Test suites (TDD order)
│   ├── contract/                  # Contract tests (Phase 1)
│   │   ├── mood-entry.contract.test.ts
│   │   └── api.contract.test.ts
│   ├── integration/               # Integration tests (Phase 1)
│   │   ├── storage.integration.test.ts
│   │   └── api.integration.test.ts
│   ├── e2e/                       # End-to-end tests (Phase 1)
│   │   ├── mood-logging.e2e.test.ts
│   │   └── trend-viewing.e2e.test.ts
│   ├── unit/                      # Unit tests (Phase 2)
│   │   ├── mood-service.unit.test.ts
│   │   ├── trend-service.unit.test.ts
│   │   └── validation.unit.test.ts
│   └── fixtures/                  # Test data and mocks
│       ├── mood-entries.json
│       └── test-users.json
├── app/                           # Next.js App Router (thin UI veneer)
│   ├── (auth)/                    # Route groups
│   ├── api/                       # API routes
│   │   └── v1/                    # API versioning
│   │       ├── mood-entries/      # Mood entry endpoints
│   │       ├── mood-trends/       # Trend data endpoints
│   │       └── user/              # User settings endpoints
│   ├── components/                # React components
│   │   ├── ui/                    # Reusable UI components
│   │   ├── forms/                 # Form components
│   │   └── charts/                # Chart wrapper components
│   ├── lib/                       # App-specific utilities
│   ├── styles/                    # Global styles and Tailwind config
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page
│   ├── mood/                      # Mood logging pages
│   │   ├── page.tsx              # Daily mood logging
│   │   └── history/page.tsx      # Mood history view
│   ├── trends/                    # Trend visualization pages
│   │   ├── page.tsx              # Trend charts
│   │   └── [period]/page.tsx     # Period-specific trends
│   └── globals.css                # Global CSS and Tailwind imports
├── public/                        # Static assets
│   ├── icons/                     # PWA icons
│   ├── manifest.json              # PWA manifest
│   └── sw.js                      # Service worker
├── docs/                          # Documentation
│   ├── api/                       # API documentation
│   ├── architecture/              # System architecture docs
│   └── deployment/                # Deployment guides
├── .github/                       # GitHub workflows
│   └── workflows/
│       ├── ci.yml                 # Continuous integration
│       └── deploy.yml             # Deployment pipeline
├── package.json                   # Dependencies and scripts
├── next.config.js                 # Next.js configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
├── jest.config.js                 # Jest testing configuration
├── playwright.config.ts           # Playwright E2E configuration
└── README.md                      # Project documentation
```

**ENFORCEMENT**: This project structure is MANDATORY and must be followed exactly during implementation. Any deviation will result in implementation failure. The structure enforces SDD principles with library-first architecture, clear separation of concerns, and comprehensive testing organization.

## Implementation Phases

### Phase 1: Contracts & Tests (Week 1)
**Duration**: 2-3 days
**Focus**: Establish contracts and failing tests before any implementation

#### Contract Definition
- Generate OpenAPI 3.0 specification from requirements (FR-001 to FR-007)
- Create JSON schemas for MoodEntry, User, and MoodTrend entities
- Define API endpoints with request/response contracts
- Generate TypeScript types from OpenAPI specification

#### Test Creation (Must Fail Initially)
- **Contract Tests**: API endpoint validation using generated OpenAPI spec
- **Integration Tests**: Database operations with real IndexedDB and PostgreSQL
- **E2E Tests**: Complete user workflows (mood logging, trend viewing)
- **Data Model Tests**: Entity validation and business rule enforcement

#### Success Criteria
- All contract tests fail (no implementation yet)
- Integration test scenarios defined and failing
- E2E test cases cover all user scenarios
- Data models defined with validation rules

### Phase 2: Library Implementation (Week 2-3)
**Duration**: 5-7 days
**Focus**: Implement core libraries following TDD with real dependencies

#### Core Library Development
- **@moodtracker/core**: Mood logging business logic with CLI interface
- **@moodtracker/storage**: IndexedDB and PostgreSQL adapters
- **@moodtracker/charts**: Chart.js integration with React components
- **@moodtracker/api**: HTTP client and Next.js API routes

#### TDD Implementation Process
1. Write failing unit test for specific functionality
2. Implement minimal code to pass the test
3. Refactor while keeping tests green
4. Repeat for each feature (FR-001 through FR-007)

#### CLI Interface Development
- Each library exposes CLI with --json mode
- Input via stdin, output via stdout, errors via stderr
- Support for programmatic access and testing

#### Success Criteria
- All unit tests pass with real dependencies
- CLI interfaces functional for all libraries
- Integration tests pass with actual database connections
- Error handling and validation implemented

### Phase 3: Integration & Validation (Week 4)
**Duration**: 3-4 days
**Focus**: Integrate libraries into Next.js app and validate complete system

#### Next.js Application Integration
- Create thin UI veneer over core libraries
- Implement responsive design with Tailwind CSS
- Add progressive enhancement for JavaScript-disabled users
- Integrate PWA capabilities for offline functionality

#### Performance & Security Validation
- Optimize bundle size and loading performance
- Implement security headers and XSS protection
- Validate accessibility compliance (WCAG 2.1 AA)
- Test cross-browser compatibility

#### Edge Case Handling
- Implement offline functionality with service worker
- Handle duplicate mood entries for same day
- Create empty state experiences for new users
- Add data pagination for large datasets

#### Success Criteria
- All E2E tests pass with complete user workflows
- Performance targets met (<3s load, <100ms interaction)
- Security audit passed with no vulnerabilities
- Accessibility audit passed (WCAG 2.1 AA)
- Cross-browser testing passed on target browsers

## Database Strategy

### Database Technology Choice
**Primary**: IndexedDB for local storage with client-side encryption
**Secondary**: PostgreSQL for optional cloud synchronization
**Rationale**: IndexedDB provides offline-first capability with browser-native storage, while PostgreSQL offers enterprise-grade cloud sync for users who want data backup and cross-device access.

### Schema Design Planning
```sql
-- PostgreSQL Schema (Cloud Sync)
CREATE TABLE mood_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
    notes TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, date);
CREATE INDEX idx_mood_entries_created_at ON mood_entries(created_at);

-- IndexedDB Schema (Local Storage)
interface MoodEntry {
    id: string;
    rating: number; // 1-10
    notes?: string;
    date: string; // ISO date
    createdAt: string; // ISO datetime
    updatedAt: string; // ISO datetime
    synced: boolean; // Cloud sync status
}
```

### Migration Strategy
- **Version Control**: Database migrations tracked in version control
- **Rollback Strategy**: Each migration includes rollback instructions
- **Data Migration**: Automated data transformation for schema changes
- **Environment Management**: Separate schemas for dev/staging/production

### Connection Management
- **Connection Pooling**: Configured for optimal performance
- **Timeout Handling**: 30-second timeout for database operations
- **Retry Logic**: Exponential backoff for failed connections
- **Failover**: Graceful degradation to local-only mode
- **Monitoring**: Database performance metrics and alerting

## API-First Planning

### API Design Planning
- **RESTful Endpoints**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **Resource Modeling**: Mood entries, trends, and user settings as resources
- **HTTP Status Codes**: Proper status codes for all response scenarios
- **API Consistency**: Uniform response format across all endpoints

### API Contract Planning
- **Request/Response Schemas**: JSON schemas for all API interactions
- **Validation Rules**: Input validation with detailed error messages
- **Error Handling**: Consistent error response format with error codes
- **Data Types**: Strong typing with TypeScript interfaces

### API Testing Planning
- **Contract Testing**: Automated tests generated from OpenAPI specification
- **Integration Testing**: End-to-end API testing with real database
- **Performance Testing**: Load testing for 100 concurrent users
- **Security Testing**: Authentication, authorization, and input validation testing

### API Documentation Planning
- **OpenAPI Specification**: Complete API documentation with examples
- **Versioning Strategy**: URL path versioning (/api/v1/) with deprecation timeline
- **Migration Approach**: Automated migration tools and client SDK updates
- **Developer Experience**: Interactive API documentation with try-it-out functionality

## Platform-Specific Planning

### Web Platform Planning
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Responsive Design**: Mobile-first approach with breakpoints for all devices
- **Browser Compatibility**: Support for Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Performance Optimization**: Code splitting, lazy loading, and Core Web Vitals optimization
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation and screen reader support
- **PWA Features**: Service worker, offline functionality, and app-like experience
- **Security**: HTTPS enforcement, CSP headers, and XSS/CSRF protection

## Complexity Tracking

No constitutional gates were violated in this implementation plan. All gates passed validation with the planned approach:

- **Simplicity Gate**: 5 projects (within ≤5 limit)
- **Library-First Gate**: All features implemented as standalone libraries
- **Test-First Gate**: TDD sequence enforced throughout development
- **Integration-First Testing**: Real dependencies used for all testing
- **Anti-Abstraction Gate**: Single domain model approach maintained
- **Traceability Gate**: All code traces to numbered requirements (FR-001 to FR-007)

## Time Estimation

### Human Development Timeline
- **Total Duration**: 2-3 weeks
- **Development Time**: 10-12 days
- **Testing & Refinement**: 3-4 days
- **Complexity Level**: High
- **Team Size**: 2-3 developers

### AI-Assisted Development Timeline
- **Total Duration**: 4-6 hours
- **Development Time**: 3-4 hours
- **Testing Time**: 1-2 hours
- **Time Savings**: 85-90% faster than human development
- **AI Multipliers**:
  - Development: 0.08x (12x faster)
  - Testing: 0.06x (16x faster)
  - Guidance: 0.15x (6x faster)

### Team Composition Recommendation
- **Team Size**: 2-3 developers
- **Required Roles**:
  - Full-Stack Developer (1) - Next.js, TypeScript, React
  - Frontend Developer (1) - UI/UX, Tailwind CSS, Charts
  - Backend Developer (0.5) - API development, database design
- **Skills Required**:
  - React: Intermediate level
  - TypeScript: Intermediate level
  - Next.js: Intermediate level
  - Chart.js: Basic level

### Confidence Ranges
- **AI Development**: 4 hours (optimistic) → 6 hours (realistic) → 8 hours (pessimistic)
- **Human Development**: 2 weeks (optimistic) → 3 weeks (realistic) → 4 weeks (pessimistic)
- **Calibration Applied**: Based on 85% accuracy from historical data

---

**SDD Version**: SDD-Cursor-1.2  
**Generated**: 2025-01-28  
**Description**: Implementation plan for Mental Health Journal App following SDD methodology
