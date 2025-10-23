import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js components
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font',
  }),
}));

// Responsive design test component
function ResponsiveTest() {
  return (
    <div className="min-h-screen p-4">
      {/* Container Tests */}
      <div className="container mx-auto mb-8">
        <h1 className="heading-1 mb-4">Container Test</h1>
        <p className="text-body">This content is inside a responsive container</p>
      </div>

      {/* Grid System Tests */}
      <div className="mb-8">
        <h2 className="heading-2 mb-4">Grid System</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="bg-primary-100 p-4 rounded-lg">Col 1</div>
          <div className="bg-secondary-100 p-4 rounded-lg">Col 2</div>
          <div className="bg-accent-100 p-4 rounded-lg">Col 3</div>
          <div className="bg-neutral-100 p-4 rounded-lg">Col 4</div>
        </div>
      </div>

      {/* Responsive Typography */}
      <div className="mb-8">
        <h2 className="heading-2 mb-4">Responsive Typography</h2>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
          Responsive Heading
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-neutral-600">
          This text scales with screen size
        </p>
      </div>

      {/* Responsive Spacing */}
      <div className="mb-8">
        <h2 className="heading-2 mb-4">Responsive Spacing</h2>
        <div className="p-4 sm:p-6 md:p-8 lg:p-12 bg-primary-50 rounded-lg">
          <p className="text-body">Padding increases with screen size</p>
        </div>
      </div>

      {/* Responsive Visibility */}
      <div className="mb-8">
        <h2 className="heading-2 mb-4">Responsive Visibility</h2>
        <div className="block sm:hidden bg-accent-100 p-4 rounded-lg mb-2">
          <p className="text-body">Visible on mobile only</p>
        </div>
        <div className="hidden sm:block md:hidden bg-secondary-100 p-4 rounded-lg mb-2">
          <p className="text-body">Visible on tablet only</p>
        </div>
        <div className="hidden md:block bg-primary-100 p-4 rounded-lg">
          <p className="text-body">Visible on desktop only</p>
        </div>
      </div>

      {/* Responsive Flexbox */}
      <div className="mb-8">
        <h2 className="heading-2 mb-4">Responsive Flexbox</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 bg-neutral-100 p-4 rounded-lg">
            <p className="text-body">Flex item 1</p>
          </div>
          <div className="flex-1 bg-neutral-100 p-4 rounded-lg">
            <p className="text-body">Flex item 2</p>
          </div>
          <div className="flex-1 bg-neutral-100 p-4 rounded-lg">
            <p className="text-body">Flex item 3</p>
          </div>
        </div>
      </div>

      {/* Section Layout */}
      <div className="section">
        <h2 className="heading-2 mb-4">Section Layout</h2>
        <p className="text-body">This uses the section utility class for consistent spacing</p>
      </div>
    </div>
  );
}

describe('Responsive Design System', () => {
  describe('Container System', () => {
    it('should render container with proper styling', () => {
      render(<ResponsiveTest />);
      expect(screen.getByText('Container Test')).toBeInTheDocument();
    });

    it('should apply container utility class', () => {
      render(<ResponsiveTest />);
      const container = screen.getByText('Container Test').closest('.container');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Grid System', () => {
    it('should render responsive grid columns', () => {
      render(<ResponsiveTest />);
      expect(screen.getByText('Col 1')).toBeInTheDocument();
      expect(screen.getByText('Col 2')).toBeInTheDocument();
      expect(screen.getByText('Col 3')).toBeInTheDocument();
      expect(screen.getByText('Col 4')).toBeInTheDocument();
    });

    it('should apply responsive grid classes', () => {
      render(<ResponsiveTest />);
      const gridContainer = screen.getByText('Col 1').closest('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4');
    });
  });

  describe('Responsive Typography', () => {
    it('should render responsive heading', () => {
      render(<ResponsiveTest />);
      expect(screen.getByText('Responsive Heading')).toBeInTheDocument();
    });

    it('should apply responsive text sizing', () => {
      render(<ResponsiveTest />);
      const responsiveHeading = screen.getByText('Responsive Heading');
      expect(responsiveHeading).toHaveClass('text-2xl', 'sm:text-3xl', 'md:text-4xl', 'lg:text-5xl');
    });

    it('should render responsive body text', () => {
      render(<ResponsiveTest />);
      expect(screen.getByText('This text scales with screen size')).toBeInTheDocument();
    });
  });

  describe('Responsive Spacing', () => {
    it('should render responsive padding', () => {
      render(<ResponsiveTest />);
      const spacingElement = screen.getByText('Padding increases with screen size').closest('div');
      expect(spacingElement).toHaveClass('p-4', 'sm:p-6', 'md:p-8', 'lg:p-12');
    });
  });

  describe('Responsive Visibility', () => {
    it('should render mobile-only content', () => {
      render(<ResponsiveTest />);
      expect(screen.getByText('Visible on mobile only')).toBeInTheDocument();
    });

    it('should render tablet-only content', () => {
      render(<ResponsiveTest />);
      expect(screen.getByText('Visible on tablet only')).toBeInTheDocument();
    });

    it('should render desktop-only content', () => {
      render(<ResponsiveTest />);
      expect(screen.getByText('Visible on desktop only')).toBeInTheDocument();
    });

    it('should apply correct visibility classes', () => {
      render(<ResponsiveTest />);
      const mobileOnly = screen.getByText('Visible on mobile only').closest('div');
      const tabletOnly = screen.getByText('Visible on tablet only').closest('div');
      const desktopOnly = screen.getByText('Visible on desktop only').closest('div');
      
      expect(mobileOnly).toHaveClass('block', 'sm:hidden');
      expect(tabletOnly).toHaveClass('hidden', 'sm:block', 'md:hidden');
      expect(desktopOnly).toHaveClass('hidden', 'md:block');
    });
  });

  describe('Responsive Flexbox', () => {
    it('should render responsive flex layout', () => {
      render(<ResponsiveTest />);
      expect(screen.getByText('Flex item 1')).toBeInTheDocument();
      expect(screen.getByText('Flex item 2')).toBeInTheDocument();
      expect(screen.getByText('Flex item 3')).toBeInTheDocument();
    });

    it('should apply responsive flex classes', () => {
      render(<ResponsiveTest />);
      const flexContainer = screen.getByText('Flex item 1').closest('.flex');
      expect(flexContainer).toHaveClass('flex-col', 'sm:flex-row');
    });
  });

  describe('Section Layout', () => {
    it('should render section with proper styling', () => {
      render(<ResponsiveTest />);
      expect(screen.getByText('Section Layout')).toBeInTheDocument();
    });

    it('should apply section utility class', () => {
      render(<ResponsiveTest />);
      const section = screen.getByText('Section Layout').closest('.section');
      expect(section).toBeInTheDocument();
    });
  });
});
