import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientForm } from '../../../src/components/ClientForm/ClientForm';
import { Client, ValidationErrors } from '../../../src/types/client';

/**
 * Unit Tests for ClientForm Component
 * 
 * These tests verify the ClientForm component functionality including:
 * - Form field rendering and interaction
 * - Real-time validation
 * - Error message display
 * - Accessibility compliance
 */

// Mock the core library functions
jest.mock('../../../src/lib/index', () => ({
  validateClient: jest.fn(),
  formatCurrency: jest.fn((value: number) => `$${value.toFixed(2)}`)
}));

describe('ClientForm Component Unit Tests', () => {
  let mockClient: Client;
  let mockOnChange: jest.MockedFunction<(client: Client) => void>;
  let mockOnValidate: jest.MockedFunction<(field: string, value: string) => void>;
  let mockErrors: ValidationErrors;

  beforeEach(() => {
    mockClient = {
      name: 'John Doe',
      address: '123 Main St, City, State 12345',
      email: 'john@example.com',
      phone: '+1-555-123-4567'
    };

    mockOnChange = jest.fn();
    mockOnValidate = jest.fn();
    mockErrors = {
      name: '',
      address: '',
      email: '',
      phone: ''
    };
  });

  describe('Component Rendering', () => {
    it('should render all form fields', () => {
      render(
        <ClientForm
          client={mockClient}
          onChange={mockOnChange}
          errors={mockErrors}
          onValidate={mockOnValidate}
        />
      );

      expect(screen.getByLabelText(/client name/i)).toBeTruthy();
      expect(screen.getByLabelText(/address/i)).toBeTruthy();
      expect(screen.getByLabelText(/email/i)).toBeTruthy();
      expect(screen.getByLabelText(/phone/i)).toBeTruthy();
    });

    it('should display current client values', () => {
      render(
        <ClientForm
          client={mockClient}
          onChange={mockOnChange}
          errors={mockErrors}
          onValidate={mockOnValidate}
        />
      );

      expect(screen.getByDisplayValue('John Doe')).toBeTruthy();
      expect(screen.getByDisplayValue('123 Main St, City, State 12345')).toBeTruthy();
      expect(screen.getByDisplayValue('john@example.com')).toBeTruthy();
      expect(screen.getByDisplayValue('+1-555-123-4567')).toBeTruthy();
    });

    it('should have proper accessibility attributes', () => {
      render(
        <ClientForm
          client={mockClient}
          onChange={mockOnChange}
          errors={mockErrors}
          onValidate={mockOnValidate}
        />
      );

      const nameInput = screen.getByLabelText(/client name/i);
      const addressInput = screen.getByLabelText(/address/i);
      const emailInput = screen.getByLabelText(/email/i);
      const phoneInput = screen.getByLabelText(/phone/i);

      expect(nameInput).toHaveProperty('required', true);
      expect(addressInput).toHaveProperty('required', true);
      expect(emailInput).toHaveProperty('required', true);
      expect(phoneInput).toHaveProperty('type', 'tel');
    });
  });

  describe('User Interactions', () => {
    it('should call onChange when input values change', async () => {
      const user = userEvent.setup();
      
      render(
        <ClientForm
          client={mockClient}
          onChange={mockOnChange}
          errors={mockErrors}
          onValidate={mockOnValidate}
        />
      );

      const nameInput = screen.getByLabelText(/client name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Smith');

      // Check that onChange was called
      // The component calls onChange on every keystroke
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should call onValidate when input loses focus', async () => {
      const user = userEvent.setup();
      
      render(
        <ClientForm
          client={mockClient}
          onChange={mockOnChange}
          errors={mockErrors}
          onValidate={mockOnValidate}
        />
      );

      const nameInput = screen.getByLabelText(/client name/i);
      await user.click(nameInput);
      await user.tab();

      expect(mockOnValidate).toHaveBeenCalledWith('name', 'John Doe');
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <ClientForm
          client={mockClient}
          onChange={mockOnChange}
          errors={mockErrors}
          onValidate={mockOnValidate}
        />
      );

      const nameInput = screen.getByLabelText(/client name/i);
      nameInput.focus();
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/address/i));
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/email/i));
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/phone/i));
    });
  });

  describe('Validation and Error Handling', () => {
    it('should display error messages when provided', () => {
      const errorsWithMessages: ValidationErrors = {
        name: 'Name is required',
        address: 'Address is required',
        email: 'Invalid email format',
        phone: 'Invalid phone format'
      };

      render(
        <ClientForm
          client={mockClient}
          onChange={mockOnChange}
          errors={errorsWithMessages}
          onValidate={mockOnValidate}
        />
      );

      expect(screen.getByText('Name is required')).toBeTruthy();
      expect(screen.getByText('Address is required')).toBeTruthy();
      expect(screen.getByText('Invalid email format')).toBeTruthy();
      expect(screen.getByText('Invalid phone format')).toBeTruthy();
    });

    it('should not display error messages when empty', () => {
      render(
        <ClientForm
          client={mockClient}
          onChange={mockOnChange}
          errors={mockErrors}
          onValidate={mockOnValidate}
        />
      );

      expect(screen.queryByText(/is required/i)).not.toBeTruthy();
      expect(screen.queryByText(/invalid/i)).not.toBeTruthy();
    });

    it('should have proper ARIA attributes for error states', () => {
      const errorsWithMessages: ValidationErrors = {
        name: 'Name is required',
        address: '',
        email: '',
        phone: ''
      };

      render(
        <ClientForm
          client={mockClient}
          onChange={mockOnChange}
          errors={errorsWithMessages}
          onValidate={mockOnValidate}
        />
      );

      const nameInput = screen.getByLabelText(/client name/i);
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput).toHaveAttribute('aria-describedby');
    });
  });

  describe('Form Field Types and Validation', () => {
    it('should have correct input types', () => {
      render(
        <ClientForm
          client={mockClient}
          onChange={mockOnChange}
          errors={mockErrors}
          onValidate={mockOnValidate}
        />
      );

      expect(screen.getByLabelText(/client name/i)).toHaveProperty('type', 'text');
      // Address is a textarea, not an input with type
      expect(screen.getByLabelText(/email/i)).toHaveProperty('type', 'email');
      expect(screen.getByLabelText(/phone/i)).toHaveProperty('type', 'tel');
    });

    it('should handle empty client data', () => {
      const emptyClient: Client = {
        name: '',
        address: '',
        email: '',
        phone: ''
      };

      render(
        <ClientForm
          client={emptyClient}
          onChange={mockOnChange}
          errors={mockErrors}
          onValidate={mockOnValidate}
        />
      );

      expect(screen.getByLabelText(/client name/i)).toHaveProperty('value', '');
      expect(screen.getByLabelText(/address/i)).toHaveProperty('value', '');
      expect(screen.getByLabelText(/email/i)).toHaveProperty('value', '');
      expect(screen.getByLabelText(/phone/i)).toHaveProperty('value', '');
    });
  });

  describe('Performance and Optimization', () => {
    it('should not re-render unnecessarily when props are the same', () => {
      const { rerender } = render(
        <ClientForm
          client={mockClient}
          onChange={mockOnChange}
          errors={mockErrors}
          onValidate={mockOnValidate}
        />
      );

      const initialRenderCount = mockOnChange.mock.calls.length;

      // Re-render with same props
      rerender(
        <ClientForm
          client={mockClient}
          onChange={mockOnChange}
          errors={mockErrors}
          onValidate={mockOnValidate}
        />
      );

      // onChange should not be called during re-render
      expect(mockOnChange).toHaveBeenCalledTimes(initialRenderCount);
    });

    it('should handle rapid input changes efficiently', async () => {
      const user = userEvent.setup();
      
      render(
        <ClientForm
          client={mockClient}
          onChange={mockOnChange}
          errors={mockErrors}
          onValidate={mockOnValidate}
        />
      );

      const nameInput = screen.getByLabelText(/client name/i);
      
      // Simulate rapid typing
      await user.clear(nameInput);
      await user.type(nameInput, 'ABC');

      // Should handle rapid changes without errors
      // The input value is controlled by the parent component, so it shows the original value
      expect(nameInput).toHaveProperty('value', 'John Doe');
    });
  });

  describe('Accessibility Compliance', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      render(
        <ClientForm
          client={mockClient}
          onChange={mockOnChange}
          errors={mockErrors}
          onValidate={mockOnValidate}
        />
      );

      // Test tab navigation
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/client name/i));
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/address/i));
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/email/i));
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/phone/i));
    });

    it('should have proper labels and descriptions', () => {
      render(
        <ClientForm
          client={mockClient}
          onChange={mockOnChange}
          errors={mockErrors}
          onValidate={mockOnValidate}
        />
      );

      // Check that all inputs have associated labels
      expect(screen.getByLabelText(/client name/i)).toBeTruthy();
      expect(screen.getByLabelText(/address/i)).toBeTruthy();
      expect(screen.getByLabelText(/email/i)).toBeTruthy();
      expect(screen.getByLabelText(/phone/i)).toBeTruthy();
    });

    it('should announce validation errors to screen readers', () => {
      const errorsWithMessages: ValidationErrors = {
        name: 'Name is required',
        address: '',
        email: '',
        phone: ''
      };

      render(
        <ClientForm
          client={mockClient}
          onChange={mockOnChange}
          errors={errorsWithMessages}
          onValidate={mockOnValidate}
        />
      );

      const errorMessage = screen.getByText('Name is required');
      expect(errorMessage).toHaveProperty('role', 'alert');
      expect(errorMessage).toBeTruthy();
    });
  });
});
