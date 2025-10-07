/**
 * Unit tests for authentication components
 * Tests LoginForm, SignupForm, and AuthGuard components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../../../src/lib/auth/components/LoginForm';
import { SignupForm } from '../../../src/lib/auth/components/SignupForm';
import { AuthGuard } from '../../../src/lib/auth/components/AuthGuard';
import { useAuth } from '../../../src/lib/auth/hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../../src/lib/auth/hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('LoginForm Component', () => {
  const mockSignIn = jest.fn();
  const mockSetError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: null,
      signIn: mockSignIn,
      signUp: jest.fn(),
      signOut: jest.fn(),
      setError: mockSetError,
    });
  });

  it('should render login form elements', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should handle form submission with valid data', async () => {
    mockSignIn.mockResolvedValue(undefined);

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should show validation errors for empty fields', async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('should show validation error for invalid email format', async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('should display authentication error', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: 'Invalid credentials',
      signIn: mockSignIn,
      signUp: jest.fn(),
      signOut: jest.fn(),
      setError: mockSetError,
    });

    render(<LoginForm />);

    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('should show loading state during authentication', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      error: null,
      signIn: mockSignIn,
      signUp: jest.fn(),
      signOut: jest.fn(),
      setError: mockSetError,
    });

    render(<LoginForm />);

    expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('should clear error when user starts typing', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: 'Previous error',
      signIn: mockSignIn,
      signUp: jest.fn(),
      signOut: jest.fn(),
      setError: mockSetError,
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });

    expect(mockSetError).toHaveBeenCalledWith(null);
  });
});

describe('SignupForm Component', () => {
  const mockSignUp = jest.fn();
  const mockSetError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: mockSignUp,
      signOut: jest.fn(),
      setError: mockSetError,
    });
  });

  it('should render signup form elements', () => {
    render(<SignupForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('should handle form submission with valid data', async () => {
    mockSignUp.mockResolvedValue(undefined);

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'Test User'
      );
    });
  });

  it('should show validation errors for empty fields', async () => {
    render(<SignupForm />);

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/confirm password is required/i)).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('should show validation error for password mismatch', async () => {
    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'differentpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('should show validation error for weak password', async () => {
    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: '123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('should display registration error', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: 'Email already registered',
      signIn: jest.fn(),
      signUp: mockSignUp,
      signOut: jest.fn(),
      setError: mockSetError,
    });

    render(<SignupForm />);

    expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
  });

  it('should show loading state during registration', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      error: null,
      signIn: jest.fn(),
      signUp: mockSignUp,
      signOut: jest.fn(),
      setError: mockSetError,
    });

    render(<SignupForm />);

    expect(screen.getByRole('button', { name: /signing up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signing up/i })).toBeDisabled();
  });
});

describe('AuthGuard Component', () => {
  const mockChildren = <div>Protected Content</div>;

  it('should render children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      session: { access_token: 'token-123' },
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      setError: jest.fn(),
    });

    render(<AuthGuard>{mockChildren}</AuthGuard>);

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should show loading spinner when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      setError: jest.fn(),
    });

    render(<AuthGuard>{mockChildren}</AuthGuard>);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      setError: jest.fn(),
    });

    // Mock window.location
    delete (window as any).location;
    window.location = { href: '' } as any;

    render(<AuthGuard>{mockChildren}</AuthGuard>);

    expect(window.location.href).toBe('/auth/login');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should show custom loading component when provided', () => {
    const customLoading = <div>Custom Loading...</div>;

    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      setError: jest.fn(),
    });

    render(<AuthGuard loadingComponent={customLoading}>{mockChildren}</AuthGuard>);

    expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should show custom fallback component when not authenticated', () => {
    const customFallback = <div>Please log in to continue</div>;

    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      setError: jest.fn(),
    });

    render(<AuthGuard fallbackComponent={customFallback}>{mockChildren}</AuthGuard>);

    expect(screen.getByText('Please log in to continue')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
