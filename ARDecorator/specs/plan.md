# 📋 Implementation Plan: AR Home Decorator

## 📊 Metadata
- **Created:** 2025-10-15
- **Platform:** Web
- **Status:** Draft
- **Spec Path:** specs/spec.md
- **Duration:** 1 day (Human) / 5-6 hours (AI-assisted)
- **Team Size:** 4-5 developers

## 📝 Summary

This plan outlines the implementation approach for the AR Home Decorator web application, enabling users to upload room photos and virtually place furniture using augmented reality. The implementation follows a 73-task atomic structure across 4 phases, emphasizing test-first development with real dependencies, library-first architecture, and strict verification at every step. The application combines React for UI, Three.js for 3D rendering, Node.js backend with PostgreSQL database, and WebXR API for AR capabilities.

## 🔧 Technical Context

**Language & Runtime:**
- **Frontend:** TypeScript 5.x with React 18+
- **Backend:** Node.js 20.x LTS with TypeScript
- **Build Tool:** Vite 5.x for fast development and optimized production builds

**Primary Dependencies:**
- **3D Rendering:** Three.js (r160+), React Three Fiber, Drei (helpers)
- **UI Framework:** React 18+, React Router 6+, React Query (TanStack Query)
- **Styling:** Tailwind CSS 3.x with custom design system
- **Backend:** Express.js 4.x, Prisma ORM 5.x
- **Authentication:** JWT (jsonwebtoken), Bcrypt
- **Storage:** AWS S3 SDK (or Cloudflare R2), Multer for uploads
- **Database:** PostgreSQL 15+ with Prisma

**Technology Stack:**

*Frontend:*
- React 18+ (component-based UI)
- Three.js + React Three Fiber (3D rendering)
- Drei (Three.js helpers: controls, loaders, effects)
- Tailwind CSS (utility-first styling with custom theme)
- React Router 6+ (client-side routing)
- Zustand (lightweight state management)
- React Query (server state management)
- Axios (HTTP client)
- WebXR API (AR preview mode)

*Backend:*
- Node.js 20+ with Express.js
- Prisma ORM with PostgreSQL
- JWT authentication
- Bcrypt password hashing
- Multer (file uploads)
- Sharp (image processing)
- Redis (caching layer)

*Testing:*
- Vitest (unit testing)
- React Testing Library (component testing)
- Playwright (E2E and visual regression testing)
- Supertest (API integration testing)

*DevOps:*
- Docker (containerization)
- GitHub Actions (CI/CD)
- Vercel/Netlify (frontend hosting)
- Railway/Render (backend hosting)
- Sentry (error monitoring)

**State Management:** Zustand for global client state (user session, UI preferences), React Query for server state (API data caching, synchronization)

**Styling Approach:** Tailwind CSS with custom design system configuration including brand colors, typography scale, spacing system, and component variants. Modern UI with card-based layouts, gradients, shadows, animations, and glass morphism effects.

**Performance Goals:**
- Initial page load: <3s time to interactive (TTI)
- 3D rendering: 60fps during furniture manipulation
- API response times: <100ms catalog, <200ms design operations
- Image processing: <5s total (upload + backend processing)
- Core Web Vitals: LCP <2.5s, FID <100ms, CLS <0.1

**Target Platform:** Web (Chrome, Firefox, Safari, Edge - latest 2 versions), with responsive design for mobile (≥375px), tablet (≥768px), desktop (≥1024px)

## 🚀 Implementation Phases

### Phase 1: Foundations & Data (26 tasks: TASK-001 to TASK-025 + DESIGN-001)

**Pattern:** CONTRACT (001-010) → RED (011-017) → GREEN (018-023) → SMOKE (024-025)

**Overview:**
Establish project foundation with API contracts, database schema, and core data models following test-first principles.

**Key Activities:**

1. **API Contract Definition (TASK-001 to TASK-010):**
   - Create OpenAPI 3.0 specification for all endpoints (authentication, room photos, furniture catalog, designs)
   - Define request/response schemas with validation rules
   - Document error responses and status codes
   - Validate contracts with OpenAPI validator (proof: 0 errors)
   - Generate TypeScript types from OpenAPI spec

2. **Database Setup (TASK-011 to TASK-013):**
   - Configure PostgreSQL with Docker Compose
   - Define Prisma schema with entities: User, RoomPhoto, FurnitureItem, Design, PlacedFurniture, SharedDesign, DesignReport
   - Create initial migration (proof: SQL shown with all tables)
   - Configure connection pooling and retry logic

3. **RED Phase - Contract Tests (TASK-014 to TASK-017):**
   - Write contract tests for API endpoints (must FAIL initially)
   - Create integration tests for database models (must FAIL)
   - Proof: Test execution showing RED failures

4. **GREEN Phase - Core Implementation (TASK-018 to TASK-023):**
   - Implement data models with Prisma
   - Create database repositories with transactions
   - Build API route handlers with validation
   - Achieve ≥80% test coverage (proof: coverage report)
   - All tests must pass GREEN

5. **SMOKE Tests (TASK-024 to TASK-025):**
   - Start backend server (proof: 200 OK health check)
   - Verify database connection and migrations applied
   - Test API endpoints return expected structure

6. **Design Foundation (DESIGN-001):**
   - Initialize Tailwind CSS configuration with custom theme
   - Define design tokens (colors, typography, spacing)
   - Create base component structure

**Verification Requirements:**
- OpenAPI spec validates with 0 errors
- Database migrations apply successfully (SQL output shown)
- All tests RED → GREEN demonstrated
- Server starts and responds to health check (200 OK)
- Test coverage ≥80% (coverage report provided)

### Phase 2: Core Implementation (21 tasks: TASK-026 to TASK-045 + DESIGN-002)

**Pattern:** Core Library (RED→GREEN) → Services (RED→GREEN) → Controllers (RED→GREEN) → Auth (RED→GREEN) → Integration → SMOKE

**Overview:**
Build core business logic, authentication, and API endpoints following RED-GREEN-REFACTOR pattern for each component.

**Key Activities:**

1. **Core 3D Engine Library (TASK-026 to TASK-030):**
   - Create standalone `@ar-decorator/3d-engine` library
   - Implement furniture placement logic (position, rotation, scale validation)
   - Build collision detection and snap-to-grid helpers
   - Add lighting and shadow calculations
   - Pattern: Write tests (RED) → Implement (GREEN) → Refactor
   - Proof: TypeScript compilation success, tests pass, 0 errors

2. **Business Services (TASK-031 to TASK-036):**
   - FurnitureService: catalog management, filtering, search
   - DesignService: save/load designs, cost calculations
   - RoomPhotoService: upload handling, metadata extraction
   - ImageProcessingService: integration with backend API
   - Each service follows RED→GREEN pattern
   - Proof: Service tests pass, integration tests verify real database calls

3. **API Controllers (TASK-037 to TASK-041):**
   - Authentication controller (register, login, JWT validation)
   - Furniture catalog controller (CRUD operations)
   - Design management controller (save, load, share)
   - Room photo upload controller (multipart handling)
   - Admin management controller (role-based access)
   - Proof: API tests pass, real HTTP requests verified

4. **Authentication & Authorization (TASK-042 to TASK-044):**
   - JWT token generation and validation middleware
   - Role-based access control (user vs admin)
   - Password hashing and verification
   - Proof: Auth tests pass, unauthorized requests blocked (403)

5. **Integration Verification (TASK-045):**
   - End-to-end integration test: register → login → upload → save design
   - Verify all components work together with real dependencies
   - Proof: Complete user journey succeeds

6. **SMOKE Test (TASK-046):**
   - Full backend operational check
   - All endpoints respond correctly
   - Database transactions work end-to-end

7. **Design System Implementation (DESIGN-002):**
   - Build reusable React components (Button, Card, Input, Modal)
   - Implement modern UI patterns (shadows, gradients, animations)
   - Create component documentation

**Verification Requirements:**
- All tests follow RED→GREEN cycle (demonstrated)
- Test coverage ≥80% for all services
- No mock implementations (real database, real computations)
- TypeScript compilation with 0 errors
- Backend fully operational (proof: curl or Postman test results)

### Phase 3: UI Development with Real APIs (16 tasks: TASK-046 to TASK-060 + DESIGN-003)

**Pattern:** Platform Setup → Design System (RED→GREEN) → Components (RED→GREEN) → Real API Integration (RED→GREEN) → Visual Testing → SMOKE

**Overview:**
Build React frontend with Three.js 3D rendering, connecting to REAL backend APIs (no mocks). Implement responsive design and AR preview capabilities.

**Key Activities:**

1. **Platform Setup (TASK-047 to TASK-049):**
   - Initialize Vite + React + TypeScript project
   - Configure Tailwind CSS with custom theme
   - Set up React Router with route structure
   - Configure environment variables for API endpoints
   - Proof: Build succeeds, dev server starts

2. **Design System Components (TASK-050 to TASK-053):**
   - Implement component library: Button, Card, Input, Modal, Navigation, FurnitureCard
   - Modern UI styling: shadows, gradients, hover effects, animations
   - Responsive breakpoints: mobile (375px+), tablet (768px+), desktop (1024px+)
   - Accessibility: keyboard navigation, ARIA labels, focus indicators
   - Pattern: Component tests (RED) → Implementation (GREEN)
   - Proof: Component tests pass, Storybook documentation generated

3. **3D Rendering Components (TASK-054 to TASK-056):**
   - Set up React Three Fiber canvas
   - Implement 3D scene with room photo background
   - Create furniture model loader (GLB/GLTF)
   - Add orbit controls and manipulation gestures
   - Lighting system matching room photo
   - Proof: 3D scene renders at 60fps, furniture loads successfully

4. **Real API Integration (TASK-057 to TASK-059):**
   - Create API client with Axios and React Query
   - Connect to REAL backend endpoints (NO MOCKS)
   - Authentication flow: register → login → protected routes
   - Furniture catalog with real data fetching
   - Design save/load with real API calls
   - Room photo upload with progress tracking
   - Proof: Network tab shows real HTTP requests, responses logged
   - Count API calls: `grep -r "axios." src/ | wc -l` (must be >0)

5. **Feature Pages (TASK-060 to TASK-063):**
   - Home page with room photo upload
   - Furniture catalog with search and filters
   - 3D editor canvas with furniture placement
   - My Designs dashboard
   - Shared design viewer (public access)
   - Admin panel for furniture management

6. **AR Preview Mode (TASK-064 to TASK-065):**
   - WebXR API integration for camera access
   - AR overlay of 3D furniture on live video
   - Fallback to static 3D viewer for unsupported browsers
   - Proof: WebXR detection works, fallback demonstrated

7. **Visual Regression Testing (TASK-066 to TASK-067):**
   - Set up Playwright with visual testing
   - Capture baseline screenshots for all pages
   - Test responsive layouts at different breakpoints
   - Cross-browser testing (Chrome, Firefox, Safari)
   - Proof: Screenshots generated and compared

8. **SMOKE Test (TASK-068):**
   - Complete user journey: login → upload photo → place furniture → save → share
   - Verify real API integration works end-to-end
   - Check performance (page load <3s, 60fps rendering)
   - Proof: Lighthouse score, user journey video/screenshots

9. **Advanced Design Implementation (DESIGN-003):**
   - Glass morphism effects on UI panels
   - Micro-interactions and loading animations
   - Toast notifications with smooth transitions
   - Skeleton loaders for progressive content

**Verification Requirements:**
- Real API integration demonstrated (network logs shown)
- No mock services allowed in production code
- Component tests pass with React Testing Library
- Visual regression tests capture screenshots
- Build succeeds with 0 TypeScript errors
- Application loads and renders correctly
- 60fps rendering maintained during interactions
- Lighthouse score: Performance ≥90, Accessibility ≥90

### Phase 4: Comprehensive Testing & Deployment (10 tasks: TASK-069 to TASK-073)

**Pattern:** Test All Suites → Verify Application → Performance → Security → Accessibility → Cleanup → Coverage → Documentation → Final Sign-off

**Overview:**
Execute comprehensive testing across all layers, verify production readiness, and perform final quality assurance.

**Key Activities:**

1. **Test Suite Execution (TASK-069):**
   - Run ALL test suites: contract, unit, integration, E2E, visual
   - Proof: 0 test failures, all suites pass
   - Coverage report: ≥90% for backend, ≥85% for frontend
   - Terminal output showing test results

2. **Application Verification (TASK-070):**
   - Start complete application (backend + frontend)
   - Verify health endpoints return 200 OK
   - Test database connectivity and migrations
   - Proof: Server logs showing successful startup

3. **Manual Smoke Tests (TASK-071):**
   - Execute 3-5 critical user journeys manually
   - Document results with screenshots/videos
   - Verify all features functional:
     - User registration and login
     - Room photo upload and processing
     - Furniture browsing and search
     - 3D furniture placement and manipulation
     - Design save/load/share
     - Admin furniture management
     - AR preview mode
   - Proof: Documented test results with evidence

4. **Performance Testing (TASK-072):**
   - Lighthouse audit: Performance, Accessibility, Best Practices, SEO
   - Load testing with k6 or Artillery (100 concurrent users)
   - API response time verification (<100ms catalog, <200ms operations)
   - 3D rendering FPS measurement (must maintain 60fps)
   - Memory profiling (heap <100MB)
   - Proof: Lighthouse report, load test results, FPS logs

5. **Security Audit (TASK-073):**
   - Dependency vulnerability scan: `npm audit` (0 high/critical vulnerabilities)
   - OWASP ZAP security scan
   - Verify HTTPS enforcement and security headers
   - Test authentication (JWT validation, unauthorized access blocked)
   - Input validation testing (SQL injection, XSS prevention)
   - Proof: Security scan reports, 0 critical vulnerabilities

6. **Accessibility Testing (TASK-074):**
   - Automated: axe-core accessibility tests (0 violations)
   - Manual: keyboard navigation testing (all features accessible)
   - Screen reader testing: NVDA/JAWS compatibility
   - Color contrast verification (WCAG 2.1 AA: ≥4.5:1)
   - Proof: axe-core report, keyboard test documentation

7. **Code Quality & Cleanup (TASK-075):**
   - ESLint: 0 errors, 0 warnings
   - TypeScript: strict mode enabled, 0 compilation errors
   - Remove dead code and unused dependencies
   - Format code with Prettier
   - Verify project structure matches specification
   - Proof: Linter output clean, dependency audit clean

8. **Documentation (TASK-076):**
   - Update README with setup instructions
   - API documentation (OpenAPI spec published)
   - Architecture diagrams
   - Deployment guide
   - User guide for key features
   - Proof: Documentation files complete

9. **Deployment Preparation (TASK-077):**
   - Docker images built and tested
   - Environment variables documented
   - CI/CD pipeline configured (GitHub Actions)
   - Staging environment deployed and verified
   - Database migrations tested on staging
   - Proof: Deployment successful, staging URL accessible

10. **Final Sign-off (TASK-078):**
    - All 73 tasks completed with proof
    - All constitutional gates passed
    - All quality gates met
    - Complete proof trail documented
    - Project ready for production deployment

**Verification Requirements:**
- ALL test suites pass (0 failures)
- Application starts successfully (200 OK demonstrated)
- Manual smoke tests documented with evidence
- Performance targets met (Lighthouse ≥90)
- Security vulnerabilities: 0 high/critical
- Accessibility: WCAG 2.1 AA compliance (0 violations)
- Test coverage: ≥90% backend, ≥85% frontend
- Code quality: 0 linter errors
- Documentation complete
- Production deployment successful

## 🏗️ Project Structure

```
ARDecorator/
├── apps/
│   ├── web/                          # Frontend React application
│   │   ├── src/
│   │   │   ├── components/           # React components
│   │   │   │   ├── design-system/    # Reusable UI components
│   │   │   │   ├── furniture/        # Furniture-specific components
│   │   │   │   ├── room/             # Room photo and 3D canvas
│   │   │   │   └── shared/           # Shared components
│   │   │   ├── pages/                # Route pages
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── FurnitureCatalog.tsx
│   │   │   │   ├── DesignEditor.tsx
│   │   │   │   ├── MyDesigns.tsx
│   │   │   │   ├── SharedDesign.tsx
│   │   │   │   └── Admin.tsx
│   │   │   ├── lib/                  # Frontend utilities
│   │   │   │   ├── api-client/       # API client with React Query
│   │   │   │   ├── 3d-engine/        # Three.js scene management
│   │   │   │   └── utils/            # Helper functions
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── store/                # Zustand state management
│   │   │   ├── styles/               # Global styles and Tailwind
│   │   │   ├── types/                # TypeScript types
│   │   │   ├── App.tsx               # Root component
│   │   │   └── main.tsx              # Entry point
│   │   ├── public/                   # Static assets
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   └── api/                          # Backend Node.js API
│       ├── src/
│       │   ├── lib/                  # Core library (business logic)
│       │   │   ├── models/           # Prisma models and types
│       │   │   ├── services/         # Business logic services
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── furniture.service.ts
│       │   │   │   ├── design.service.ts
│       │   │   │   ├── room-photo.service.ts
│       │   │   │   └── image-processing.service.ts
│       │   │   └── utils/            # Helper functions
│       │   ├── api/                  # API layer (thin veneer)
│       │   │   ├── routes/           # Express routes
│       │   │   │   ├── auth.routes.ts
│       │   │   │   ├── furniture.routes.ts
│       │   │   │   ├── designs.routes.ts
│       │   │   │   ├── room-photos.routes.ts
│       │   │   │   └── admin.routes.ts
│       │   │   ├── middleware/       # Express middleware
│       │   │   │   ├── auth.middleware.ts
│       │   │   │   ├── validation.middleware.ts
│       │   │   │   ├── error.middleware.ts
│       │   │   │   └── rate-limit.middleware.ts
│       │   │   └── controllers/      # Route controllers
│       │   ├── config/               # Configuration
│       │   │   ├── database.ts
│       │   │   ├── storage.ts
│       │   │   └── redis.ts
│       │   ├── types/                # TypeScript types
│       │   ├── app.ts                # Express app setup
│       │   └── server.ts             # Server entry point
│       ├── prisma/
│       │   ├── schema.prisma         # Database schema
│       │   ├── migrations/           # Migration files
│       │   └── seed.ts               # Database seeding
│       ├── contracts/                # OpenAPI specifications
│       │   └── openapi.yaml
│       └── package.json
│
├── packages/
│   ├── types/                        # Shared TypeScript types
│   │   └── src/
│   │       ├── api.types.ts
│   │       ├── domain.types.ts
│   │       └── index.ts
│   │
│   └── 3d-engine/                    # Standalone 3D engine library
│       ├── src/
│       │   ├── scene/                # Scene management
│       │   ├── furniture/            # Furniture placement logic
│       │   ├── lighting/             # Lighting calculations
│       │   ├── collision/            # Collision detection
│       │   └── index.ts
│       ├── tests/                    # Unit tests
│       └── package.json
│
├── tests/
│   ├── contract/                     # API contract tests
│   ├── integration/                  # Integration tests
│   ├── e2e/                          # End-to-end tests (Playwright)
│   │   ├── user-flows/
│   │   ├── visual/                   # Visual regression tests
│   │   └── playwright.config.ts
│   └── fixtures/                     # Test data and fixtures
│
├── specs/                            # Specifications
│   ├── spec.md
│   ├── plan.md
│   └── tasks.md
│
├── docs/                             # Documentation
│   ├── architecture.md
│   ├── api-guide.md
│   └── deployment.md
│
├── docker-compose.yml                # Local development environment
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI pipeline
│       └── deploy.yml                # Deployment pipeline
├── .env.example
├── .gitignore
├── package.json                      # Root workspace config
├── tsconfig.json                     # TypeScript config
├── turbo.json                        # Turbo build config (optional)
└── README.md
```

**Structural Rules:**
- **Monorepo Structure**: Use workspace package manager (pnpm/npm workspaces)
- **Library-First**: Core business logic in `packages/` as standalone libraries
- **Thin API Layer**: `apps/api/src/api/` is thin veneer over `lib/` services
- **Shared Types**: Common types in `packages/types` shared between frontend and backend
- **Test Organization**: Tests mirror source structure, integration tests separate
- **No Mocks in Production**: Real dependencies only, mocks limited to external APIs in tests

## 🗄️ Database Strategy

**Database Technology:** PostgreSQL 15+ (enterprise-grade relational database with ACID compliance)

**Schema Design:**

*Core Tables:*
- **users**: id (UUID), email (unique), password_hash, name, role (enum: user/admin), created_at, updated_at
- **room_photos**: id (UUID), user_id (FK), filename, storage_url, dimensions (JSONB: width, height, depth), surfaces (JSONB array), status (enum: processing/completed/failed), created_at
- **furniture_items**: id (UUID), name, description, category (enum: seating/tables/storage/lighting/decor), style (enum: modern/traditional/minimalist/industrial/scandinavian), price (decimal), dimensions (JSONB: width, height, depth), model_url, thumbnail_url, created_at, updated_at
- **designs**: id (UUID), user_id (FK), room_photo_id (FK), name, total_cost (decimal), created_at, updated_at
- **placed_furniture**: id (UUID), design_id (FK), furniture_item_id (FK), position (JSONB: x, y, z), rotation (JSONB: x, y, z), scale (decimal), created_at
- **shared_designs**: id (UUID), design_id (FK), share_token (unique), expires_at, view_count (integer), created_at
- **design_reports**: id (UUID), design_id (FK), report_url, status (enum: generating/completed/failed), created_at

*Indexes:*
- `users.email` (unique index for fast login lookups)
- `furniture_items.category` (B-tree index for catalog filtering)
- `designs.user_id` (B-tree index for user's designs lookup)
- `placed_furniture.design_id` (B-tree index for loading design furniture)
- `shared_designs.share_token` (unique index for fast public access)
- `furniture_items.price` (B-tree index for price range queries)

*Relationships:*
- User 1:N Room Photos (cascade delete)
- User 1:N Designs (cascade delete)
- RoomPhoto 1:N Designs (restrict delete if designs exist)
- Design 1:N PlacedFurniture (cascade delete)
- FurnitureItem 1:N PlacedFurniture (restrict delete if used in designs)
- Design 1:1 SharedDesign (cascade delete)
- Design 1:N DesignReports (cascade delete)

**Migration Strategy:**
- Version-controlled migrations with Prisma Migrate
- Development: `prisma migrate dev` for iterative schema changes
- Production: `prisma migrate deploy` for automated deployment
- Rollback strategy: Keep migration history, test rollback in staging
- Data migrations: Separate data migration scripts when schema changes affect existing data

**Connection Management:**
- Prisma connection pooling: 10 connections for development, 50 for production
- Connection timeout: 10 seconds
- Query timeout: 30 seconds
- Retry logic: 3 attempts with exponential backoff
- Health checks: Periodic ping to detect connection issues
- Graceful shutdown: Close connections on process termination

**Performance Optimization:**
- Query optimization: Use `include` selectively, avoid N+1 queries
- Pagination: Cursor-based pagination for large datasets
- Caching: Redis cache for frequently accessed furniture catalog
- Read replicas: Consider for analytics and reporting queries at scale
- JSONB indexing: GIN indexes on dimensions and surfaces for efficient queries

## 🎨 Design System Planning

**Design System Architecture:**

*Component Library Structure:*
- **Atoms**: Button, Input, Label, Icon, Badge, Avatar, Spinner
- **Molecules**: InputGroup, SearchBar, FurnitureCard, PriceTag, RatingDisplay
- **Organisms**: Navigation, FurnitureCatalogGrid, DesignCard, DesignControls, Modal
- **Templates**: PageLayout, EditorLayout, DashboardLayout
- **Pages**: Composed from templates and organisms

*Design Tokens (Tailwind Configuration):*
```javascript
// tailwind.config.js
{
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      // ... blue scale
      600: '#2563eb', // Primary brand
      900: '#1e3a8a'
    },
    secondary: {
      // Purple accent scale
      600: '#9333ea'
    },
    neutral: {
      // Gray scale for text and backgrounds
    }
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    }
  },
  spacing: {
    // 8px base unit: 1=4px, 2=8px, 4=16px, 6=24px, 8=32px, 12=48px, 16=64px
  },
  borderRadius: {
    'none': '0',
    'sm': '0.25rem',
    'DEFAULT': '0.5rem',
    'lg': '1rem',
    'xl': '1.5rem',
    'full': '9999px'
  },
  boxShadow: {
    'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    'DEFAULT': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  }
}
```

**Modern UI Patterns:**

*Card-Based Layouts:*
- Furniture catalog: Grid of cards with shadow, hover lift effect, image, title, price, dimensions
- Design dashboard: Card grid with thumbnail, name, metadata, action buttons
- Elevation: Base shadow, hover shadow-lg, active shadow-xl

*Sophisticated Color Schemes:*
- Primary actions: Blue gradient (from-blue-600 to-blue-700)
- Secondary actions: Purple accent
- Success states: Green gradient
- Error states: Red with proper contrast
- Neutral backgrounds: Subtle gray tones, not pure white

*Professional Typography:*
- Headings: Font weight 600-700, clear size hierarchy
- Body text: Font weight 400, comfortable line height (1.5)
- Labels: Uppercase, font weight 500, letter spacing
- Proper contrast ratios: ≥4.5:1 for WCAG AA

*Interactive Elements:*
- Buttons: Solid backgrounds, hover brightness increase, active scale down (95%)
- Input fields: Border focus ring, smooth transition
- Cards: Hover lift (translateY -4px), shadow increase
- Links: Underline on hover, color transition

**Visual Enhancement Planning:**

*Micro-Interactions:*
- Button press: Scale down to 95% with quick transition
- Card hover: Lift effect + shadow increase (150ms ease-out)
- Furniture placement: Smooth drag with trailing shadow
- Success feedback: Green checkmark animation with bounce

*Animations:*
- Page transitions: Fade in with slide (200ms)
- Modal open: Scale from 95% to 100% with fade (250ms)
- Loading spinners: Smooth rotation, branded colors
- Skeleton loaders: Shimmer effect during content load

*Visual Depth:*
- Z-index scale: Base 0, Dropdown 10, Modal 50, Toast 100
- Shadows: Layered shadows for depth perception
- Overlays: Semi-transparent backgrounds for modals
- Glass morphism: Backdrop blur on floating panels

*Smooth Transitions:*
- Default: 150ms ease-out for most interactions
- Slow: 300ms ease-in-out for page transitions
- Fast: 100ms ease-out for micro-interactions

*Loading States:*
- Skeleton screens: Animated pulse effect matching content structure
- Progress bars: Linear progress for uploads with percentage
- Spinners: Rotating branded spinner for async operations

*Error State Styling:*
- Error messages: Red background (50 tint), red text (700), icon
- Invalid inputs: Red border, shake animation on submit
- Toast notifications: Red gradient, auto-dismiss after 5s

**Accessibility Standards:**
- WCAG 2.1 AA compliance enforced
- Color contrast ≥4.5:1 for text, ≥3:1 for large text
- Keyboard navigation: Tab order, focus visible, Enter/Space for actions
- Screen reader support: Semantic HTML, ARIA labels, live regions
- Reduced motion: Respect prefers-reduced-motion media query

**Anti-Simple-Design Enforcement:**
- ❌ Forbidden: Plain white backgrounds without visual interest
- ❌ Forbidden: Basic unstyled buttons
- ❌ Forbidden: Minimal layouts without hierarchy
- ✅ Required: Modern card-based layouts with shadows
- ✅ Required: Gradient accents on primary actions
- ✅ Required: Professional typography with clear hierarchy
- ✅ Required: Interactive hover states and animations

## 🌐 API-First Planning

**API Design:**
- RESTful architecture with resource-oriented endpoints
- Versioning: URL path (`/api/v1/`)
- HTTP methods: GET (read), POST (create), PUT (update), DELETE (remove)
- Status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Error
- Consistent response format: `{ data: {...}, error: {...} }`

**API Contracts:**
- OpenAPI 3.0 specification as single source of truth
- Request validation: JSON schemas for all request bodies
- Response validation: Consistent structure across all endpoints
- Error schema: `{ error: { code: string, message: string, details: [] } }`
- TypeScript types generated from OpenAPI spec

**API Testing:**
- Contract tests: Validate implementation matches OpenAPI spec (Dredd/Schemathesis)
- Integration tests: Real HTTP requests against test database (Supertest)
- Performance tests: Load testing with k6 (100 concurrent users)
- Security tests: Authentication, authorization, input validation

**Visual Regression Testing:**
- Playwright setup with visual comparison
- Baseline screenshots captured for all pages at 3 breakpoints (mobile, tablet, desktop)
- Cross-browser testing: Chrome, Firefox, Safari
- CI integration: Fail build on visual regressions
- Screenshot artifacts stored for review

**API Documentation:**
- OpenAPI spec served via Swagger UI
- Code examples in JavaScript, cURL
- Authentication guide with JWT examples
- Error handling reference
- Versioning and deprecation policy documented

## 📱 Web Platform Planning

**Progressive Enhancement:**
- Base experience: Informational landing page without JavaScript
- Enhanced: Full 3D and AR features with JavaScript enabled
- Graceful degradation: Fallback to static 3D viewer when WebXR unavailable

**Responsive Design:**
- Mobile-first approach starting at 375px
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- Touch-optimized: Pinch to scale, two-finger rotate, drag to move
- Adaptive layouts: Bottom sheet on mobile, sidebar on desktop

**Browser Compatibility:**
- Chrome 100+ (full support)
- Firefox 100+ (full support)
- Safari 15+ (full support, WebXR via polyfill)
- Edge 100+ (full support)
- Feature detection: WebGL, WebXR, with fallbacks

**Performance Optimization:**
- Code splitting: Route-based lazy loading
- Image optimization: WebP format, responsive images, lazy loading
- 3D model optimization: Progressive loading (low-poly → high-poly), LOD
- Bundle size: <500KB initial, <2MB total
- CDN: Static assets and 3D models served from CDN
- Caching: Service worker for offline catalog (future enhancement)

**Accessibility:**
- WCAG 2.1 AA compliance
- Keyboard navigation for all features
- Screen reader support with ARIA
- Focus management in modals and overlays
- Color contrast validation
- Alternative text for images and 3D descriptions

---

## 🚨 Critical Implementation Rules

1. **Test-First Mandatory**: NO implementation before tests (RED → GREEN → REFACTOR)
2. **Real Dependencies Only**: Use real database, real 3D rendering, real API calls (no mocks in production)
3. **Proof Required**: Every task requires proof (terminal output, file counts, test results)
4. **No Shortcuts**: Cannot skip verification, cannot claim completion without evidence
5. **Library-First**: Core logic in standalone libraries, UI as thin veneer
6. **Traceability**: Code comments reference requirements (FR-XXX)
7. **Modern UI Mandatory**: No basic/plain designs allowed, sophisticated styling required
8. **API Integration**: Frontend MUST connect to real backend APIs (count API calls as proof)
9. **Performance Targets**: <3s load, <100ms API, 60fps 3D rendering
10. **Quality Gates**: ≥80% test coverage, 0 linter errors, 0 high vulnerabilities

---

**Next Steps:**
1. Review and approve implementation plan
2. Generate task breakdown: `/sdd_tasks`
3. Begin Phase 1 implementation: `/sdd_implement 1`

