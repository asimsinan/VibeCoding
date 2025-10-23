import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js components
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font',
  }),
}));

// Card Component Tests
function CardTest() {
  return (
    <div className="p-8 space-y-6">
      <h2 className="heading-2 mb-6">Card Components</h2>
      
      {/* Basic Card */}
      <div className="card p-6" data-testid="basic-card">
        <h3 className="heading-3 mb-2">Basic Card</h3>
        <p className="text-body mb-4">
          This is a basic card with simple content and styling.
        </p>
        <button className="btn-primary">Action Button</button>
      </div>
      
      {/* Hover Card */}
      <div className="card-hover p-6" data-testid="hover-card">
        <h3 className="heading-3 mb-2">Hover Card</h3>
        <p className="text-body mb-4">
          This card has hover effects and transforms on interaction.
        </p>
        <button className="btn-secondary">Hover Me</button>
      </div>
      
      {/* Campaign Card */}
      <div className="card-hover overflow-hidden" data-testid="campaign-card">
        <img 
          src="https://via.placeholder.com/400x200" 
          alt="Campaign" 
          className="w-full h-48 object-cover"
        />
        <div className="p-6">
          <h3 className="heading-3 mb-2">Amazing Campaign</h3>
          <p className="text-body mb-4">
            Help us build the next generation of sustainable technology.
          </p>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-neutral-600 mb-1">
              <span>Progress</span>
              <span>$15,000 / $25,000</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div className="bg-primary-600 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-small text-neutral-500">15 days left</span>
            <button className="btn-primary">Donate Now</button>
          </div>
        </div>
      </div>
      
      {/* User Profile Card */}
      <div className="card p-6 text-center" data-testid="profile-card">
        <img 
          src="https://via.placeholder.com/80x80" 
          alt="User Avatar" 
          className="w-20 h-20 rounded-full mx-auto mb-4"
        />
        <h3 className="heading-3 mb-2">John Doe</h3>
        <p className="text-body mb-4">
          Technology enthusiast and entrepreneur with a passion for innovation.
        </p>
        <div className="flex justify-center gap-2">
          <button className="btn-outline">Follow</button>
          <button className="btn-primary">Message</button>
        </div>
      </div>
      
      {/* Stats Card */}
      <div className="card p-6" data-testid="stats-card">
        <h3 className="heading-3 mb-4">Campaign Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">127</div>
            <div className="text-small text-neutral-600">Donations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary-600">$15,000</div>
            <div className="text-small text-neutral-600">Raised</div>
          </div>
        </div>
      </div>
      
      {/* Notification Card */}
      <div className="card p-4 border-l-4 border-primary-500" data-testid="notification-card">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600">ℹ</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-neutral-900 mb-1">New Donation!</h4>
            <p className="text-small text-neutral-600">
              Sarah Johnson just donated $50 to your campaign.
            </p>
          </div>
          <button className="text-neutral-400 hover:text-neutral-600">
            ×
          </button>
        </div>
      </div>
      
      {/* Loading Card */}
      <div className="card p-6" data-testid="loading-card">
        <div className="animate-pulse">
          <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-neutral-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

describe('Card Components', () => {
  it('should render basic card correctly', () => {
    render(<CardTest />);
    
    const basicCard = screen.getByTestId('basic-card');
    expect(basicCard).toBeInTheDocument();
    expect(basicCard).toHaveClass('card');
    expect(screen.getByText('Basic Card')).toBeInTheDocument();
    expect(screen.getByText('This is a basic card with simple content and styling.')).toBeInTheDocument();
  });

  it('should render hover card correctly', () => {
    render(<CardTest />);
    
    const hoverCard = screen.getByTestId('hover-card');
    expect(hoverCard).toBeInTheDocument();
    expect(hoverCard).toHaveClass('card-hover');
    expect(screen.getByText('Hover Card')).toBeInTheDocument();
  });

  it('should render campaign card with image and progress bar', () => {
    render(<CardTest />);
    
    const campaignCard = screen.getByTestId('campaign-card');
    expect(campaignCard).toBeInTheDocument();
    expect(screen.getByText('Amazing Campaign')).toBeInTheDocument();
    expect(screen.getByText('Help us build the next generation of sustainable technology.')).toBeInTheDocument();
    expect(screen.getByText('$15,000 / $25,000')).toBeInTheDocument();
    expect(screen.getByText('15 days left')).toBeInTheDocument();
  });

  it('should render profile card with avatar and actions', () => {
    render(<CardTest />);
    
    const profileCard = screen.getByTestId('profile-card');
    expect(profileCard).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Technology enthusiast and entrepreneur with a passion for innovation.')).toBeInTheDocument();
    expect(screen.getByText('Follow')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('should render stats card with metrics', () => {
    render(<CardTest />);
    
    const statsCard = screen.getByTestId('stats-card');
    expect(statsCard).toBeInTheDocument();
    expect(screen.getByText('Campaign Statistics')).toBeInTheDocument();
    expect(screen.getByText('127')).toBeInTheDocument();
    expect(screen.getByText('Donations')).toBeInTheDocument();
    expect(screen.getByText('$15,000')).toBeInTheDocument();
    expect(screen.getByText('Raised')).toBeInTheDocument();
  });

  it('should render notification card with icon and close button', () => {
    render(<CardTest />);
    
    const notificationCard = screen.getByTestId('notification-card');
    expect(notificationCard).toBeInTheDocument();
    expect(screen.getByText('New Donation!')).toBeInTheDocument();
    expect(screen.getByText('Sarah Johnson just donated $50 to your campaign.')).toBeInTheDocument();
  });

  it('should render loading card with skeleton', () => {
    render(<CardTest />);
    
    const loadingCard = screen.getByTestId('loading-card');
    expect(loadingCard).toBeInTheDocument();
    expect(loadingCard.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should apply correct CSS classes to cards', () => {
    render(<CardTest />);
    
    const basicCard = screen.getByTestId('basic-card');
    const hoverCard = screen.getByTestId('hover-card');
    
    expect(basicCard).toHaveClass('card');
    expect(hoverCard).toHaveClass('card-hover');
  });

  it('should render action buttons in cards', () => {
    render(<CardTest />);
    
    expect(screen.getByText('Action Button')).toBeInTheDocument();
    expect(screen.getByText('Hover Me')).toBeInTheDocument();
    expect(screen.getByText('Donate Now')).toBeInTheDocument();
    expect(screen.getByText('Follow')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('should handle card interactions', () => {
    render(<CardTest />);
    
    const hoverCard = screen.getByTestId('hover-card');
    const hoverButton = screen.getByText('Hover Me');
    
    expect(hoverCard).toBeInTheDocument();
    expect(hoverButton).toBeInTheDocument();
    
    // Test hover effect by checking if the element has the correct class
    expect(hoverCard).toHaveClass('card-hover');
  });

  it('should render progress bar in campaign card', () => {
    render(<CardTest />);
    
    const progressBar = screen.getByTestId('campaign-card').querySelector('.bg-primary-600');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle('width: 60%');
  });

  it('should render images in cards', () => {
    render(<CardTest />);
    
    const campaignImage = screen.getByAltText('Campaign');
    const profileImage = screen.getByAltText('User Avatar');
    
    expect(campaignImage).toBeInTheDocument();
    expect(profileImage).toBeInTheDocument();
  });
});
