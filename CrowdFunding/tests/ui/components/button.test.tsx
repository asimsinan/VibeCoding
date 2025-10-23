import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js components
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font',
  }),
}));

// Button Component Tests
function ButtonTest() {
  return (
    <div className="p-8 space-y-4">
      <h2 className="heading-2 mb-4">Button Components</h2>
      
      {/* Primary Button */}
      <button 
        className="btn-primary" 
        onClick={() => console.log('Primary clicked')}
        data-testid="primary-button"
      >
        Primary Button
      </button>
      
      {/* Secondary Button */}
      <button 
        className="btn-secondary" 
        onClick={() => console.log('Secondary clicked')}
        data-testid="secondary-button"
      >
        Secondary Button
      </button>
      
      {/* Outline Button */}
      <button 
        className="btn-outline" 
        onClick={() => console.log('Outline clicked')}
        data-testid="outline-button"
      >
        Outline Button
      </button>
      
      {/* Danger Button */}
      <button 
        className="btn-danger" 
        onClick={() => console.log('Danger clicked')}
        data-testid="danger-button"
      >
        Danger Button
      </button>
      
      {/* Disabled Button */}
      <button 
        className="btn-primary" 
        disabled
        data-testid="disabled-button"
      >
        Disabled Button
      </button>
      
      {/* Button with Icon */}
      <button 
        className="btn-primary flex items-center gap-2" 
        data-testid="icon-button"
      >
        <span>🚀</span>
        Button with Icon
      </button>
      
      {/* Loading Button */}
      <button 
        className="btn-primary flex items-center gap-2" 
        disabled
        data-testid="loading-button"
      >
        <span className="animate-spin">⟳</span>
        Loading...
      </button>
    </div>
  );
}

describe('Button Components', () => {
  it('should render primary button correctly', () => {
    render(<ButtonTest />);
    const primaryButton = screen.getByTestId('primary-button');
    expect(primaryButton).toBeInTheDocument();
    expect(primaryButton).toHaveClass('btn-primary');
    expect(primaryButton).toHaveTextContent('Primary Button');
  });

  it('should render secondary button correctly', () => {
    render(<ButtonTest />);
    const secondaryButton = screen.getByTestId('secondary-button');
    expect(secondaryButton).toBeInTheDocument();
    expect(secondaryButton).toHaveClass('btn-secondary');
    expect(secondaryButton).toHaveTextContent('Secondary Button');
  });

  it('should render outline button correctly', () => {
    render(<ButtonTest />);
    const outlineButton = screen.getByTestId('outline-button');
    expect(outlineButton).toBeInTheDocument();
    expect(outlineButton).toHaveClass('btn-outline');
    expect(outlineButton).toHaveTextContent('Outline Button');
  });

  it('should render danger button correctly', () => {
    render(<ButtonTest />);
    const dangerButton = screen.getByTestId('danger-button');
    expect(dangerButton).toBeInTheDocument();
    expect(dangerButton).toHaveClass('btn-danger');
    expect(dangerButton).toHaveTextContent('Danger Button');
  });

  it('should render disabled button correctly', () => {
    render(<ButtonTest />);
    const disabledButton = screen.getByTestId('disabled-button');
    expect(disabledButton).toBeInTheDocument();
    expect(disabledButton).toBeDisabled();
    expect(disabledButton).toHaveTextContent('Disabled Button');
  });

  it('should render button with icon correctly', () => {
    render(<ButtonTest />);
    const iconButton = screen.getByTestId('icon-button');
    expect(iconButton).toBeInTheDocument();
    expect(iconButton).toHaveTextContent('Button with Icon');
    expect(iconButton).toHaveTextContent('🚀');
  });

  it('should render loading button correctly', () => {
    render(<ButtonTest />);
    const loadingButton = screen.getByTestId('loading-button');
    expect(loadingButton).toBeInTheDocument();
    expect(loadingButton).toBeDisabled();
    expect(loadingButton).toHaveTextContent('Loading...');
  });

  it('should handle click events', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    render(<ButtonTest />);
    
    const primaryButton = screen.getByTestId('primary-button');
    fireEvent.click(primaryButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Primary clicked');
    consoleSpy.mockRestore();
  });

  it('should not trigger click events when disabled', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    render(<ButtonTest />);
    
    const disabledButton = screen.getByTestId('disabled-button');
    fireEvent.click(disabledButton);
    
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
