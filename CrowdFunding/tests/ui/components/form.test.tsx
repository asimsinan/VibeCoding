import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js components
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font',
  }),
}));

// Form Component Tests
function FormTest() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="heading-2 mb-6">Form Components</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="test-form">
        {/* Text Input */}
        <div className="form-group">
          <label className="label" htmlFor="name">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            className="input"
            placeholder="Enter your full name"
            data-testid="name-input"
          />
        </div>
        
        {/* Email Input */}
        <div className="form-group">
          <label className="label" htmlFor="email">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            className="input"
            placeholder="Enter your email"
            data-testid="email-input"
          />
        </div>
        
        {/* Password Input */}
        <div className="form-group">
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="input"
            placeholder="Enter your password"
            data-testid="password-input"
          />
        </div>
        
        {/* Textarea */}
        <div className="form-group">
          <label className="label" htmlFor="bio">
            Bio
          </label>
          <textarea
            id="bio"
            className="input resize-none"
            rows={4}
            placeholder="Tell us about yourself"
            data-testid="bio-textarea"
          />
        </div>
        
        {/* Select */}
        <div className="form-group">
          <label className="label" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            className="input"
            data-testid="category-select"
          >
            <option value="">Select a category</option>
            <option value="technology">Technology</option>
            <option value="art">Art</option>
            <option value="music">Music</option>
            <option value="film">Film</option>
          </select>
        </div>
        
        {/* Checkbox */}
        <div className="form-group">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              data-testid="terms-checkbox"
            />
            <span className="text-sm text-neutral-700">
              I agree to the terms and conditions
            </span>
          </label>
        </div>
        
        {/* Radio Buttons */}
        <div className="form-group">
          <fieldset>
            <legend className="label">Gender</legend>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  className="text-primary-600 focus:ring-primary-500"
                  data-testid="gender-male"
                />
                <span className="text-sm text-neutral-700">Male</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  className="text-primary-600 focus:ring-primary-500"
                  data-testid="gender-female"
                />
                <span className="text-sm text-neutral-700">Female</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="other"
                  className="text-primary-600 focus:ring-primary-500"
                  data-testid="gender-other"
                />
                <span className="text-sm text-neutral-700">Other</span>
              </label>
            </div>
          </fieldset>
        </div>
        
        {/* File Input */}
        <div className="form-group">
          <label className="label" htmlFor="avatar">
            Profile Picture
          </label>
          <input
            type="file"
            id="avatar"
            accept="image/*"
            className="input"
            data-testid="file-input"
          />
        </div>
        
        {/* Submit Button */}
        <button type="submit" className="btn-primary w-full" data-testid="submit-button">
          Submit Form
        </button>
        
        {/* Reset Button */}
        <button type="reset" className="btn-outline w-full" data-testid="reset-button">
          Reset Form
        </button>
      </form>
    </div>
  );
}

describe('Form Components', () => {
  it('should render form with all input types', () => {
    render(<FormTest />);
    
    expect(screen.getByTestId('test-form')).toBeInTheDocument();
    expect(screen.getByTestId('name-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('bio-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('category-select')).toBeInTheDocument();
    expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('file-input')).toBeInTheDocument();
  });

  it('should render all labels correctly', () => {
    render(<FormTest />);
    
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Bio')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Profile Picture')).toBeInTheDocument();
  });

  it('should render radio buttons correctly', () => {
    render(<FormTest />);
    
    expect(screen.getByTestId('gender-male')).toBeInTheDocument();
    expect(screen.getByTestId('gender-female')).toBeInTheDocument();
    expect(screen.getByTestId('gender-other')).toBeInTheDocument();
    expect(screen.getByText('Male')).toBeInTheDocument();
    expect(screen.getByText('Female')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('should render submit and reset buttons', () => {
    render(<FormTest />);
    
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    expect(screen.getByTestId('reset-button')).toBeInTheDocument();
    expect(screen.getByText('Submit Form')).toBeInTheDocument();
    expect(screen.getByText('Reset Form')).toBeInTheDocument();
  });

  it('should handle text input changes', () => {
    render(<FormTest />);
    
    const nameInput = screen.getByTestId('name-input') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    
    expect(nameInput.value).toBe('John Doe');
  });

  it('should handle email input changes', () => {
    render(<FormTest />);
    
    const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    
    expect(emailInput.value).toBe('john@example.com');
  });

  it('should handle password input changes', () => {
    render(<FormTest />);
    
    const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });
    
    expect(passwordInput.value).toBe('secret123');
  });

  it('should handle textarea changes', () => {
    render(<FormTest />);
    
    const bioTextarea = screen.getByTestId('bio-textarea') as HTMLTextAreaElement;
    fireEvent.change(bioTextarea, { target: { value: 'This is my bio' } });
    
    expect(bioTextarea.value).toBe('This is my bio');
  });

  it('should handle select changes', () => {
    render(<FormTest />);
    
    const categorySelect = screen.getByTestId('category-select') as HTMLSelectElement;
    fireEvent.change(categorySelect, { target: { value: 'technology' } });
    
    expect(categorySelect.value).toBe('technology');
  });

  it('should handle checkbox changes', () => {
    render(<FormTest />);
    
    const termsCheckbox = screen.getByTestId('terms-checkbox') as HTMLInputElement;
    fireEvent.click(termsCheckbox);
    
    expect(termsCheckbox.checked).toBe(true);
  });

  it('should handle radio button selection', () => {
    render(<FormTest />);
    
    const maleRadio = screen.getByTestId('gender-male') as HTMLInputElement;
    const femaleRadio = screen.getByTestId('gender-female') as HTMLInputElement;
    
    fireEvent.click(maleRadio);
    expect(maleRadio.checked).toBe(true);
    expect(femaleRadio.checked).toBe(false);
    
    fireEvent.click(femaleRadio);
    expect(maleRadio.checked).toBe(false);
    expect(femaleRadio.checked).toBe(true);
  });

  it('should handle form submission', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    render(<FormTest />);
    
    const form = screen.getByTestId('test-form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Form submitted');
    });
    
    consoleSpy.mockRestore();
  });

  it('should apply correct CSS classes to inputs', () => {
    render(<FormTest />);
    
    const nameInput = screen.getByTestId('name-input');
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    
    expect(nameInput).toHaveClass('input');
    expect(emailInput).toHaveClass('input');
    expect(passwordInput).toHaveClass('input');
  });

  it('should apply correct CSS classes to labels', () => {
    render(<FormTest />);
    
    const nameLabel = screen.getByText('Full Name');
    const emailLabel = screen.getByText('Email Address');
    
    expect(nameLabel).toHaveClass('label');
    expect(emailLabel).toHaveClass('label');
  });

  it('should apply correct CSS classes to form groups', () => {
    render(<FormTest />);
    
    const nameLabel = screen.getByText('Full Name');
    const formGroup = nameLabel.closest('.form-group');
    
    expect(formGroup).toBeInTheDocument();
  });
});
