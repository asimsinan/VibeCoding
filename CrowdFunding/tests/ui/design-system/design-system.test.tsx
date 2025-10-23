import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js components
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font',
  }),
}));

// Test component for design system
function DesignSystemTest() {
  return (
    <div className="gradient-bg min-h-screen p-8">
      {/* Color Palette Tests */}
      <div className="mb-8">
        <h2 className="heading-2 mb-4">Color Palette</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-primary-500 text-white p-4 rounded-lg">Primary</div>
          <div className="bg-secondary-500 text-white p-4 rounded-lg">Secondary</div>
          <div className="bg-accent-500 text-white p-4 rounded-lg">Accent</div>
          <div className="bg-neutral-500 text-white p-4 rounded-lg">Neutral</div>
        </div>
      </div>

      {/* Typography Tests */}
      <div className="mb-8">
        <h2 className="heading-2 mb-4">Typography</h2>
        <h1 className="heading-1 mb-2">Heading 1</h1>
        <h2 className="heading-2 mb-2">Heading 2</h2>
        <h3 className="heading-3 mb-2">Heading 3</h3>
        <h4 className="heading-4 mb-2">Heading 4</h4>
        <p className="text-body mb-2">Body text with proper line height and spacing</p>
        <p className="text-small">Small text for captions and metadata</p>
      </div>

      {/* Button Tests */}
      <div className="mb-8">
        <h2 className="heading-2 mb-4">Buttons</h2>
        <div className="flex gap-4 flex-wrap">
          <button className="btn-primary">Primary Button</button>
          <button className="btn-secondary">Secondary Button</button>
          <button className="btn-outline">Outline Button</button>
          <button className="btn-danger">Danger Button</button>
        </div>
      </div>

      {/* Card Tests */}
      <div className="mb-8">
        <h2 className="heading-2 mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-6">
            <h3 className="heading-3 mb-2">Card Title</h3>
            <p className="text-body">Card content with proper spacing and styling</p>
          </div>
          <div className="card-hover p-6">
            <h3 className="heading-3 mb-2">Hover Card</h3>
            <p className="text-body">This card has hover effects</p>
          </div>
        </div>
      </div>

      {/* Form Tests */}
      <div className="mb-8">
        <h2 className="heading-2 mb-4">Forms</h2>
        <div className="max-w-md">
          <div className="form-group mb-4">
            <label className="label">Email Address</label>
            <input type="email" className="input" placeholder="Enter your email" />
          </div>
          <div className="form-group mb-4">
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="Enter your password" />
          </div>
          <button className="btn-primary w-full">Submit Form</button>
        </div>
      </div>

      {/* Spacing Tests */}
      <div className="mb-8">
        <h2 className="heading-2 mb-4">Spacing</h2>
        <div className="space-y-4">
          <div className="bg-primary-100 p-4">Padding 4</div>
          <div className="bg-secondary-100 p-8">Padding 8</div>
          <div className="bg-accent-100 p-12">Padding 12</div>
        </div>
      </div>

      {/* Animation Tests */}
      <div className="mb-8">
        <h2 className="heading-2 mb-4">Animations</h2>
        <div className="flex gap-4">
          <div className="bg-primary-500 text-white p-4 rounded-lg animate-fade-in">Fade In</div>
          <div className="bg-secondary-500 text-white p-4 rounded-lg animate-slide-up">Slide Up</div>
          <div className="bg-accent-500 text-white p-4 rounded-lg animate-scale-in">Scale In</div>
        </div>
      </div>
    </div>
  );
}

describe('Design System Foundation', () => {
  describe('Color Palette', () => {
    it('should render primary colors correctly', () => {
      render(<DesignSystemTest />);
      expect(screen.getByText('Primary')).toBeInTheDocument();
    });

    it('should render secondary colors correctly', () => {
      render(<DesignSystemTest />);
      expect(screen.getByText('Secondary')).toBeInTheDocument();
    });

    it('should render accent colors correctly', () => {
      render(<DesignSystemTest />);
      expect(screen.getByText('Accent')).toBeInTheDocument();
    });

    it('should render neutral colors correctly', () => {
      render(<DesignSystemTest />);
      expect(screen.getByText('Neutral')).toBeInTheDocument();
    });
  });

  describe('Typography', () => {
    it('should render heading 1 with correct styling', () => {
      render(<DesignSystemTest />);
      const heading1 = screen.getByText('Heading 1');
      expect(heading1).toBeInTheDocument();
      expect(heading1).toHaveClass('heading-1');
    });

    it('should render heading 2 with correct styling', () => {
      render(<DesignSystemTest />);
      const heading2 = screen.getByText('Heading 2');
      expect(heading2).toBeInTheDocument();
      expect(heading2).toHaveClass('heading-2');
    });

    it('should render heading 3 with correct styling', () => {
      render(<DesignSystemTest />);
      const heading3 = screen.getByText('Heading 3');
      expect(heading3).toBeInTheDocument();
      expect(heading3).toHaveClass('heading-3');
    });

    it('should render heading 4 with correct styling', () => {
      render(<DesignSystemTest />);
      const heading4 = screen.getByText('Heading 4');
      expect(heading4).toBeInTheDocument();
      expect(heading4).toHaveClass('heading-4');
    });

    it('should render body text with correct styling', () => {
      render(<DesignSystemTest />);
      const bodyText = screen.getByText('Body text with proper line height and spacing');
      expect(bodyText).toBeInTheDocument();
      expect(bodyText).toHaveClass('text-body');
    });

    it('should render small text with correct styling', () => {
      render(<DesignSystemTest />);
      const smallText = screen.getByText('Small text for captions and metadata');
      expect(smallText).toBeInTheDocument();
      expect(smallText).toHaveClass('text-small');
    });
  });

  describe('Buttons', () => {
    it('should render primary button with correct styling', () => {
      render(<DesignSystemTest />);
      const primaryButton = screen.getByText('Primary Button');
      expect(primaryButton).toBeInTheDocument();
      expect(primaryButton).toHaveClass('btn-primary');
    });

    it('should render secondary button with correct styling', () => {
      render(<DesignSystemTest />);
      const secondaryButton = screen.getByText('Secondary Button');
      expect(secondaryButton).toBeInTheDocument();
      expect(secondaryButton).toHaveClass('btn-secondary');
    });

    it('should render outline button with correct styling', () => {
      render(<DesignSystemTest />);
      const outlineButton = screen.getByText('Outline Button');
      expect(outlineButton).toBeInTheDocument();
      expect(outlineButton).toHaveClass('btn-outline');
    });

    it('should render danger button with correct styling', () => {
      render(<DesignSystemTest />);
      const dangerButton = screen.getByText('Danger Button');
      expect(dangerButton).toBeInTheDocument();
      expect(dangerButton).toHaveClass('btn-danger');
    });
  });

  describe('Cards', () => {
    it('should render card with correct styling', () => {
      render(<DesignSystemTest />);
      const card = screen.getByText('Card Title');
      expect(card).toBeInTheDocument();
      expect(card.closest('.card')).toBeInTheDocument();
    });

    it('should render hover card with correct styling', () => {
      render(<DesignSystemTest />);
      const hoverCard = screen.getByText('Hover Card');
      expect(hoverCard).toBeInTheDocument();
      expect(hoverCard.closest('.card-hover')).toBeInTheDocument();
    });
  });

  describe('Forms', () => {
    it('should render form inputs with correct styling', () => {
      render(<DesignSystemTest />);
      const emailInput = screen.getByPlaceholderText('Enter your email');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveClass('input');
    });

    it('should render form labels with correct styling', () => {
      render(<DesignSystemTest />);
      const emailLabel = screen.getByText('Email Address');
      expect(emailLabel).toBeInTheDocument();
      expect(emailLabel).toHaveClass('label');
    });

    it('should render form groups with correct styling', () => {
      render(<DesignSystemTest />);
      const emailLabel = screen.getByText('Email Address');
      expect(emailLabel.closest('.form-group')).toBeInTheDocument();
    });
  });

  describe('Spacing', () => {
    it('should render elements with different padding sizes', () => {
      render(<DesignSystemTest />);
      const padding4 = screen.getByText('Padding 4');
      const padding8 = screen.getByText('Padding 8');
      const padding12 = screen.getByText('Padding 12');
      
      expect(padding4).toBeInTheDocument();
      expect(padding8).toBeInTheDocument();
      expect(padding12).toBeInTheDocument();
    });
  });

  describe('Animations', () => {
    it('should render fade-in animation', () => {
      render(<DesignSystemTest />);
      const fadeInElement = screen.getByText('Fade In');
      expect(fadeInElement).toBeInTheDocument();
      expect(fadeInElement).toHaveClass('animate-fade-in');
    });

    it('should render slide-up animation', () => {
      render(<DesignSystemTest />);
      const slideUpElement = screen.getByText('Slide Up');
      expect(slideUpElement).toBeInTheDocument();
      expect(slideUpElement).toHaveClass('animate-slide-up');
    });

    it('should render scale-in animation', () => {
      render(<DesignSystemTest />);
      const scaleInElement = screen.getByText('Scale In');
      expect(scaleInElement).toBeInTheDocument();
      expect(scaleInElement).toHaveClass('animate-scale-in');
    });
  });

  describe('Layout and Container', () => {
    it('should render gradient background', () => {
      render(<DesignSystemTest />);
      const container = screen.getByText('Color Palette').closest('.gradient-bg');
      expect(container).toBeInTheDocument();
    });

    it('should render responsive grid layouts', () => {
      render(<DesignSystemTest />);
      const gridContainer = screen.getByText('Card Title').closest('.grid');
      expect(gridContainer).toBeInTheDocument();
    });
  });
});
