import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js components
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font',
  }),
}));

// Navigation Component Tests
function NavigationTest() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen">
      {/* Header Navigation */}
      <header className="bg-white shadow-soft border-b border-neutral-200" data-testid="header-nav">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary-600" data-testid="logo">
                CrowdFund
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8" data-testid="desktop-nav">
              <a href="#" className="text-neutral-700 hover:text-primary-600 transition-colors">
                Browse
              </a>
              <a href="#" className="text-neutral-700 hover:text-primary-600 transition-colors">
                Create
              </a>
              <a href="#" className="text-neutral-700 hover:text-primary-600 transition-colors">
                About
              </a>
              <button className="btn-primary">Sign In</button>
            </nav>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-testid="mobile-menu-button"
            >
              <span className="text-xl">☰</span>
            </button>
          </div>
          
          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-neutral-200" data-testid="mobile-nav">
              <div className="py-4 space-y-2">
                <a href="#" className="block px-4 py-2 text-neutral-700 hover:bg-neutral-50">
                  Browse
                </a>
                <a href="#" className="block px-4 py-2 text-neutral-700 hover:bg-neutral-50">
                  Create
                </a>
                <a href="#" className="block px-4 py-2 text-neutral-700 hover:bg-neutral-50">
                  About
                </a>
                <div className="px-4 pt-2">
                  <button className="btn-primary w-full">Sign In</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* Breadcrumb Navigation */}
      <div className="bg-neutral-50 border-b border-neutral-200" data-testid="breadcrumb-nav">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <a href="#" className="text-primary-600 hover:text-primary-700">Home</a>
            <span className="text-neutral-400">/</span>
            <a href="#" className="text-primary-600 hover:text-primary-700">Campaigns</a>
            <span className="text-neutral-400">/</span>
            <span className="text-neutral-600">Technology</span>
          </nav>
        </div>
      </div>
      
      {/* Sidebar Navigation */}
      <div className="flex">
        <aside className="w-64 bg-white shadow-soft min-h-screen" data-testid="sidebar-nav">
          <div className="p-6">
            <h3 className="heading-3 mb-4">Dashboard</h3>
            <nav className="space-y-2">
              <a href="#" className="flex items-center px-3 py-2 text-neutral-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors">
                <span className="mr-3">📊</span>
                Overview
              </a>
              <a href="#" className="flex items-center px-3 py-2 text-neutral-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors">
                <span className="mr-3">🚀</span>
                My Campaigns
              </a>
              <a href="#" className="flex items-center px-3 py-2 text-neutral-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors">
                <span className="mr-3">💝</span>
                Donations
              </a>
              <a href="#" className="flex items-center px-3 py-2 text-neutral-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors">
                <span className="mr-3">👤</span>
                Profile
              </a>
              <a href="#" className="flex items-center px-3 py-2 text-neutral-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors">
                <span className="mr-3">⚙️</span>
                Settings
              </a>
            </nav>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-8">
          <h2 className="heading-2 mb-6">Navigation Components</h2>
          <p className="text-body mb-6">
            This page demonstrates various navigation components including header, breadcrumbs, and sidebar navigation.
          </p>
          
          {/* Tab Navigation */}
          <div className="mb-8" data-testid="tab-nav">
            <div className="border-b border-neutral-200">
              <nav className="flex space-x-8">
                <button className="py-2 px-1 border-b-2 border-primary-500 text-primary-600 font-medium">
                  Active Tab
                </button>
                <button className="py-2 px-1 border-b-2 border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300">
                  Inactive Tab
                </button>
                <button className="py-2 px-1 border-b-2 border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300">
                  Another Tab
                </button>
              </nav>
            </div>
            <div className="py-4">
              <p className="text-body">Tab content goes here...</p>
            </div>
          </div>
          
          {/* Pagination */}
          <div className="flex justify-center" data-testid="pagination-nav">
            <nav className="flex items-center space-x-1">
              <button className="px-3 py-2 text-neutral-500 hover:text-neutral-700 disabled:opacity-50" disabled>
                Previous
              </button>
              <button className="px-3 py-2 bg-primary-600 text-white rounded">1</button>
              <button className="px-3 py-2 text-neutral-700 hover:bg-neutral-100 rounded">2</button>
              <button className="px-3 py-2 text-neutral-700 hover:bg-neutral-100 rounded">3</button>
              <span className="px-3 py-2 text-neutral-500">...</span>
              <button className="px-3 py-2 text-neutral-700 hover:bg-neutral-100 rounded">10</button>
              <button className="px-3 py-2 text-neutral-700 hover:text-neutral-900">
                Next
              </button>
            </nav>
          </div>
        </main>
      </div>
    </div>
  );
}

describe('Navigation Components', () => {
  it('should render header navigation correctly', () => {
    render(<NavigationTest />);
    
    expect(screen.getByTestId('header-nav')).toBeInTheDocument();
    expect(screen.getByTestId('logo')).toBeInTheDocument();
    expect(screen.getByText('CrowdFund')).toBeInTheDocument();
  });

  it('should render desktop navigation menu', () => {
    render(<NavigationTest />);
    
    expect(screen.getByTestId('desktop-nav')).toBeInTheDocument();
    expect(screen.getByText('Browse')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('should render mobile menu button', () => {
    render(<NavigationTest />);
    
    expect(screen.getByTestId('mobile-menu-button')).toBeInTheDocument();
  });

  it('should toggle mobile menu when button is clicked', () => {
    render(<NavigationTest />);
    
    const mobileButton = screen.getByTestId('mobile-menu-button');
    expect(screen.queryByTestId('mobile-nav')).not.toBeInTheDocument();
    
    fireEvent.click(mobileButton);
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
    
    fireEvent.click(mobileButton);
    expect(screen.queryByTestId('mobile-nav')).not.toBeInTheDocument();
  });

  it('should render mobile navigation when opened', () => {
    render(<NavigationTest />);
    
    const mobileButton = screen.getByTestId('mobile-menu-button');
    fireEvent.click(mobileButton);
    
    const mobileNav = screen.getByTestId('mobile-nav');
    expect(mobileNav).toBeInTheDocument();
    expect(mobileNav).toHaveTextContent('Browse');
    expect(mobileNav).toHaveTextContent('Create');
    expect(mobileNav).toHaveTextContent('About');
  });

  it('should render breadcrumb navigation', () => {
    render(<NavigationTest />);
    
    expect(screen.getByTestId('breadcrumb-nav')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
  });

  it('should render sidebar navigation', () => {
    render(<NavigationTest />);
    
    expect(screen.getByTestId('sidebar-nav')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('My Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Donations')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should render tab navigation', () => {
    render(<NavigationTest />);
    
    expect(screen.getByTestId('tab-nav')).toBeInTheDocument();
    expect(screen.getByText('Active Tab')).toBeInTheDocument();
    expect(screen.getByText('Inactive Tab')).toBeInTheDocument();
    expect(screen.getByText('Another Tab')).toBeInTheDocument();
  });

  it('should render pagination navigation', () => {
    render(<NavigationTest />);
    
    expect(screen.getByTestId('pagination-nav')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should apply correct CSS classes to navigation elements', () => {
    render(<NavigationTest />);
    
    const headerNav = screen.getByTestId('header-nav');
    const desktopNav = screen.getByTestId('desktop-nav');
    const sidebarNav = screen.getByTestId('sidebar-nav');
    
    expect(headerNav).toHaveClass('bg-white', 'shadow-soft');
    expect(desktopNav).toHaveClass('hidden', 'md:flex');
    expect(sidebarNav).toHaveClass('w-64', 'bg-white', 'shadow-soft');
  });

  it('should render navigation icons', () => {
    render(<NavigationTest />);
    
    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('🚀')).toBeInTheDocument();
    expect(screen.getByText('💝')).toBeInTheDocument();
    expect(screen.getByText('👤')).toBeInTheDocument();
    expect(screen.getByText('⚙️')).toBeInTheDocument();
  });

  it('should handle navigation interactions', () => {
    render(<NavigationTest />);
    
    const mobileButton = screen.getByTestId('mobile-menu-button');
    
    // Test multiple clicks
    fireEvent.click(mobileButton);
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
    
    fireEvent.click(mobileButton);
    expect(screen.queryByTestId('mobile-nav')).not.toBeInTheDocument();
    
    fireEvent.click(mobileButton);
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
  });

  it('should render disabled pagination button', () => {
    render(<NavigationTest />);
    
    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('should render active tab with correct styling', () => {
    render(<NavigationTest />);
    
    const activeTab = screen.getByText('Active Tab');
    expect(activeTab).toHaveClass('border-primary-500', 'text-primary-600');
  });
});
