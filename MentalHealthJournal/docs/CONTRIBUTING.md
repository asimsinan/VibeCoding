# Contributing to Mental Health Journal App

Thank you for your interest in contributing to the Mental Health Journal App! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

**Bug Reports:**
- Use the GitHub Issues with the "bug" label
- Include steps to reproduce the issue
- Provide environment details (OS, browser, version)
- Include screenshots or error messages if applicable

**Feature Requests:**
- Use GitHub Issues with the "enhancement" label
- Describe the feature and its benefits
- Explain how it fits with the app's goals
- Consider implementation complexity

**Security Issues:**
- Email security@moodtracker.app (do not use public issues)
- Include detailed description of the vulnerability
- Provide steps to reproduce if applicable
- Allow reasonable time for response before disclosure

### Code Contributions

**Getting Started:**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

**Pull Request Process:**
1. Update documentation for new features
2. Add tests for new functionality
3. Ensure all existing tests pass
4. Update CHANGELOG.md if applicable
5. Request review from maintainers

## 🏗️ Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git
- Modern web browser
- Code editor (VS Code recommended)

### Installation

```bash
# Clone your fork
git clone https://github.com/yourusername/moodtracker.git
cd moodtracker

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Testing
npm run test            # Run all tests
npm run test:unit       # Run unit tests
npm run test:integration # Run integration tests
npm run test:e2e        # Run end-to-end tests
npm run test:watch      # Run tests in watch mode

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run type-check      # Run TypeScript checks
npm run format          # Format code with Prettier

# Security
npm run security-audit  # Run security audit
npm run audit           # Run npm audit

# Performance
npm run analyze         # Analyze bundle size
npm run lighthouse      # Run Lighthouse audit
```

## 📋 Coding Standards

### TypeScript

**Type Safety:**
- Use strict TypeScript configuration
- Define interfaces for all data structures
- Avoid `any` type unless absolutely necessary
- Use type guards for runtime type checking

**Example:**
```typescript
interface MoodEntry {
  id: string;
  rating: number;
  notes?: string;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
}

function isValidMoodEntry(data: unknown): data is MoodEntry {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as MoodEntry).id === 'string' &&
    typeof (data as MoodEntry).rating === 'number'
  );
}
```

### React Components

**Component Structure:**
- Use functional components with hooks
- Implement proper prop types
- Use meaningful component names
- Keep components focused and single-purpose

**Example:**
```typescript
interface MoodEntryFormProps {
  onSubmit: (entry: Omit<MoodEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Partial<MoodEntry>;
}

export function MoodEntryForm({ onSubmit, initialData }: MoodEntryFormProps) {
  const [rating, setRating] = useState(initialData?.rating || 5);
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ rating, notes, entryDate: new Date().toISOString() });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form content */}
    </form>
  );
}
```

### Testing

**Test Structure:**
- Follow AAA pattern (Arrange, Act, Assert)
- Use descriptive test names
- Test both happy path and edge cases
- Mock external dependencies

**Example:**
```typescript
describe('MoodEntryForm', () => {
  it('should submit form with valid data', async () => {
    // Arrange
    const mockOnSubmit = jest.fn();
    render(<MoodEntryForm onSubmit={mockOnSubmit} />);
    
    // Act
    fireEvent.change(screen.getByLabelText(/rating/i), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText(/notes/i), { target: { value: 'Great day!' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    // Assert
    expect(mockOnSubmit).toHaveBeenCalledWith({
      rating: 8,
      notes: 'Great day!',
      entryDate: expect.any(String)
    });
  });
});
```

### Error Handling

**Error Boundaries:**
- Use React Error Boundaries for component errors
- Provide fallback UI for error states
- Log errors for debugging

**Example:**
```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>;
    }

    return this.props.children;
  }
}
```

## 🧪 Testing Guidelines

### Unit Tests

**Coverage Requirements:**
- Minimum 80% code coverage
- Test all public methods and functions
- Test error conditions and edge cases
- Mock external dependencies

**Test Files:**
- Place in `src/tests/unit/` directory
- Use `.test.ts` or `.test.tsx` extension
- Follow naming convention: `ComponentName.test.tsx`

### Integration Tests

**Test Scenarios:**
- Component interactions
- API integration
- Data flow between components
- User workflows

**Test Files:**
- Place in `src/tests/integration/` directory
- Use `.test.ts` extension
- Test complete user journeys

### End-to-End Tests

**Test Scenarios:**
- Complete user workflows
- Cross-browser compatibility
- Performance testing
- Accessibility testing

**Test Files:**
- Place in `src/tests/e2e/` directory
- Use Playwright for E2E testing
- Test critical user paths

### Performance Tests

**Metrics to Test:**
- Page load times
- API response times
- Memory usage
- Bundle size

**Tools:**
- Lighthouse for performance auditing
- Playwright for performance testing
- Custom performance monitoring

## 📚 Documentation

### Code Documentation

**JSDoc Comments:**
- Document all public functions and classes
- Include parameter types and descriptions
- Provide usage examples
- Document return values

**Example:**
```typescript
/**
 * Creates a new mood entry with the provided data
 * @param entryData - The mood entry data to create
 * @param entryData.rating - Mood rating from 1-10
 * @param entryData.notes - Optional notes about the mood
 * @param entryData.entryDate - Date of the mood entry (ISO string)
 * @returns Promise that resolves to the created mood entry
 * @throws {ValidationError} When entry data is invalid
 * @throws {StorageError} When entry cannot be saved
 */
async function createMoodEntry(entryData: CreateMoodEntryData): Promise<MoodEntry> {
  // Implementation
}
```

### README Updates

**When to Update:**
- New features or major changes
- Updated installation instructions
- New configuration options
- Breaking changes

**What to Include:**
- Clear description of changes
- Updated usage examples
- Migration instructions if applicable
- Links to relevant documentation

### API Documentation

**OpenAPI Specification:**
- Keep API documentation up to date
- Include request/response examples
- Document error responses
- Provide SDK examples

## 🔒 Security Guidelines

### Secure Coding Practices

**Input Validation:**
- Validate all user inputs
- Sanitize data before processing
- Use parameterized queries
- Implement rate limiting

**Authentication:**
- Use secure authentication methods
- Implement proper session management
- Use HTTPS for all communications
- Implement proper authorization checks

**Data Protection:**
- Encrypt sensitive data
- Implement proper data retention
- Follow privacy regulations
- Secure data transmission

### Security Testing

**Vulnerability Scanning:**
- Run security audits regularly
- Test for common vulnerabilities
- Use automated security tools
- Perform manual security reviews

**Penetration Testing:**
- Test authentication mechanisms
- Test authorization controls
- Test input validation
- Test error handling

## 🚀 Performance Guidelines

### Code Performance

**Optimization Techniques:**
- Use React.memo for expensive components
- Implement proper memoization
- Optimize bundle size
- Use lazy loading for routes

**Example:**
```typescript
const ExpensiveComponent = React.memo(({ data }: { data: ComplexData }) => {
  const processedData = useMemo(() => {
    return processComplexData(data);
  }, [data]);

  return <div>{/* Render processed data */}</div>;
});
```

### Bundle Optimization

**Code Splitting:**
- Split code by routes
- Lazy load components
- Use dynamic imports
- Optimize vendor bundles

**Example:**
```typescript
const LazyComponent = lazy(() => import('./LazyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

## 🎨 Design Guidelines

### UI/UX Principles

**Design System:**
- Follow established design patterns
- Use consistent spacing and typography
- Maintain accessibility standards
- Ensure responsive design

**Component Design:**
- Create reusable components
- Use semantic HTML elements
- Implement proper ARIA attributes
- Ensure keyboard navigation

### Accessibility

**WCAG Compliance:**
- Meet WCAG 2.1 AA standards
- Provide alternative text for images
- Ensure proper color contrast
- Implement keyboard navigation

**Testing:**
- Use screen readers for testing
- Test with keyboard only
- Validate color contrast
- Test with different zoom levels

## 📝 Commit Guidelines

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(mood-tracking): add mood entry validation

- Add client-side validation for mood ratings
- Implement server-side validation
- Add error messages for invalid inputs

Closes #123
```

```
fix(charts): resolve chart rendering issue

- Fix chart not rendering on mobile devices
- Update Chart.js configuration
- Add responsive chart options

Fixes #456
```

### Branch Naming

**Convention:**
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions

**Examples:**
- `feature/mood-export`
- `fix/chart-mobile-rendering`
- `docs/api-documentation`
- `refactor/storage-layer`

## 🔄 Release Process

### Version Numbering

**Semantic Versioning:**
- `MAJOR.MINOR.PATCH`
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes (backward compatible)

**Examples:**
- `1.0.0` - Initial stable release
- `1.1.0` - New features added
- `1.1.1` - Bug fixes
- `2.0.0` - Breaking changes

### Release Checklist

**Pre-Release:**
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version numbers updated
- [ ] Security audit passed

**Release:**
- [ ] Create release branch
- [ ] Tag release version
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Monitor deployment

**Post-Release:**
- [ ] Update documentation
- [ ] Announce release
- [ ] Monitor for issues
- [ ] Gather feedback

## 🤔 Getting Help

### Resources

**Documentation:**
- [Project README](README.md)
- [API Documentation](docs/API.md)
- [User Guide](docs/USER_GUIDE.md)
- [Monitoring Guide](docs/MONITORING.md)

**Community:**
- GitHub Discussions
- Discord Server
- Stack Overflow (tag: moodtracker)
- Reddit Community

**Support:**
- GitHub Issues
- Email: support@moodtracker.app
- Live Chat (in-app)

### Code Review Process

**Review Criteria:**
- Code quality and style
- Test coverage and quality
- Documentation completeness
- Performance implications
- Security considerations

**Review Timeline:**
- Initial review within 48 hours
- Follow-up reviews within 24 hours
- Merge within 7 days (if approved)

## 📄 License

By contributing to the Mental Health Journal App, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation
- Community acknowledgments

---

**Thank you for contributing to the Mental Health Journal App! Your contributions help make mental health tracking more accessible and effective for everyone.**
