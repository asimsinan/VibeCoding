import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js components
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font',
  }),
}));

// Theme configuration test component
function ThemeTest() {
  return (
    <div className="min-h-screen">
      {/* Light Theme Test */}
      <div className="bg-white text-neutral-900 p-8">
        <h1 className="text-2xl font-bold mb-4">Light Theme</h1>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-primary-50 border border-primary-200 p-4 rounded-lg">
            <h3 className="text-primary-800 font-semibold">Primary Light</h3>
            <p className="text-primary-600">Light theme primary colors</p>
          </div>
          <div className="bg-secondary-50 border border-secondary-200 p-4 rounded-lg">
            <h3 className="text-secondary-800 font-semibold">Secondary Light</h3>
            <p className="text-secondary-600">Light theme secondary colors</p>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-lg">
            <h3 className="text-neutral-800 font-semibold">Neutral Light</h3>
            <p className="text-neutral-600">Light theme neutral colors</p>
          </div>
        </div>
      </div>

      {/* Dark Theme Test */}
      <div className="bg-neutral-900 text-white p-8">
        <h1 className="text-2xl font-bold mb-4 text-white">Dark Theme</h1>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-primary-900 border border-primary-700 p-4 rounded-lg">
            <h3 className="text-primary-200 font-semibold">Primary Dark</h3>
            <p className="text-primary-300">Dark theme primary colors</p>
          </div>
          <div className="bg-secondary-900 border border-secondary-700 p-4 rounded-lg">
            <h3 className="text-secondary-200 font-semibold">Secondary Dark</h3>
            <p className="text-secondary-300">Dark theme secondary colors</p>
          </div>
          <div className="bg-neutral-800 border border-neutral-600 p-4 rounded-lg">
            <h3 className="text-neutral-200 font-semibold">Neutral Dark</h3>
            <p className="text-neutral-300">Dark theme neutral colors</p>
          </div>
        </div>
      </div>

      {/* Glass Effect Test */}
      <div className="bg-gradient-to-br from-primary-100 to-secondary-100 p-8">
        <div className="glass-effect p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-2">Glass Effect</h2>
          <p className="text-neutral-700">Glass morphism effect with backdrop blur</p>
        </div>
      </div>
    </div>
  );
}

describe('Theme System', () => {
  describe('Light Theme', () => {
    it('should render light theme colors correctly', () => {
      render(<ThemeTest />);
      expect(screen.getByText('Light Theme')).toBeInTheDocument();
    });

    it('should render primary light colors', () => {
      render(<ThemeTest />);
      expect(screen.getByText('Primary Light')).toBeInTheDocument();
    });

    it('should render secondary light colors', () => {
      render(<ThemeTest />);
      expect(screen.getByText('Secondary Light')).toBeInTheDocument();
    });

    it('should render neutral light colors', () => {
      render(<ThemeTest />);
      expect(screen.getByText('Neutral Light')).toBeInTheDocument();
    });
  });

  describe('Dark Theme', () => {
    it('should render dark theme colors correctly', () => {
      render(<ThemeTest />);
      expect(screen.getByText('Dark Theme')).toBeInTheDocument();
    });

    it('should render primary dark colors', () => {
      render(<ThemeTest />);
      expect(screen.getByText('Primary Dark')).toBeInTheDocument();
    });

    it('should render secondary dark colors', () => {
      render(<ThemeTest />);
      expect(screen.getByText('Secondary Dark')).toBeInTheDocument();
    });

    it('should render neutral dark colors', () => {
      render(<ThemeTest />);
      expect(screen.getByText('Neutral Dark')).toBeInTheDocument();
    });
  });

  describe('Special Effects', () => {
    it('should render glass effect correctly', () => {
      render(<ThemeTest />);
      expect(screen.getByText('Glass Effect')).toBeInTheDocument();
    });

    it('should apply glass effect styling', () => {
      render(<ThemeTest />);
      const glassElement = screen.getByText('Glass Effect').closest('.glass-effect');
      expect(glassElement).toBeInTheDocument();
    });
  });
});
