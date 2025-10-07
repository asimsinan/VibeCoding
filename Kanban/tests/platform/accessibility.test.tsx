/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock components for testing
function AccessibleButton({ children, onClick, ...props }: any) {
  return (
    <button
      onClick={onClick}
      aria-label="Test button"
      {...props}
    >
      {children}
    </button>
  );
}

function AccessibleForm() {
  return (
    <form>
      <label htmlFor="test-input">Test Input</label>
      <input
        id="test-input"
        type="text"
        aria-describedby="test-help"
        required
      />
      <div id="test-help">This field is required</div>
      
      <fieldset>
        <legend>Choose an option</legend>
        <input type="radio" id="option1" name="options" value="1" />
        <label htmlFor="option1">Option 1</label>
        <input type="radio" id="option2" name="options" value="2" />
        <label htmlFor="option2">Option 2</label>
      </fieldset>
      
      <button type="submit">Submit</button>
    </form>
  );
}

function AccessibleNavigation() {
  return (
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="/home" aria-current="page">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
  );
}

function AccessibleTable() {
  return (
    <table>
      <caption>Sample Data Table</caption>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Age</th>
          <th scope="col">City</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">John Doe</th>
          <td>30</td>
          <td>New York</td>
        </tr>
        <tr>
          <th scope="row">Jane Smith</th>
          <td>25</td>
          <td>Los Angeles</td>
        </tr>
      </tbody>
    </table>
  );
}

function AccessibleModal() {
  return (
    <div role="dialog" aria-labelledby="modal-title" aria-modal="true">
      <h2 id="modal-title">Modal Title</h2>
      <p>Modal content goes here</p>
      <button aria-label="Close modal">×</button>
    </div>
  );
}

function InaccessibleComponent() {
  return (
    <div>
      <button>Click me</button>
      <img src="test.jpg" />
      <div onClick={() => {}}>Clickable div</div>
      <input type="text" />
      <table>
        <tr>
          <td>Header 1</td>
          <td>Header 2</td>
        </tr>
        <tr>
          <td>Data 1</td>
          <td>Data 2</td>
        </tr>
      </table>
    </div>
  );
}

describe('Accessibility Tests', () => {
  describe('Button Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<AccessibleButton>Click me</AccessibleButton>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be keyboard accessible', () => {
      const handleClick = jest.fn();
      render(<AccessibleButton onClick={handleClick}>Click me</AccessibleButton>);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
      
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      expect(handleClick).toHaveBeenCalled();
    });

    it('should have proper ARIA attributes', () => {
      render(<AccessibleButton aria-expanded="true">Toggle</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button).toHaveAttribute('aria-label', 'Test button');
    });
  });

  describe('Form Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<AccessibleForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper label associations', () => {
      render(<AccessibleForm />);
      
      const input = screen.getByLabelText('Test Input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('id', 'test-input');
    });

    it('should have proper ARIA descriptions', () => {
      render(<AccessibleForm />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'test-help');
      
      const helpText = screen.getByText('This field is required');
      expect(helpText).toHaveAttribute('id', 'test-help');
    });

    it('should have proper fieldset and legend', () => {
      render(<AccessibleForm />);
      
      const fieldset = screen.getByRole('group');
      expect(fieldset).toBeInTheDocument();
      
      const legend = screen.getByText('Choose an option');
      expect(legend).toBeInTheDocument();
    });
  });

  describe('Navigation Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<AccessibleNavigation />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper navigation structure', () => {
      render(<AccessibleNavigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
      
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(3);
    });

    it('should indicate current page', () => {
      render(<AccessibleNavigation />);
      
      const currentLink = screen.getByText('Home');
      expect(currentLink).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Table Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<AccessibleTable />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper table structure', () => {
      render(<AccessibleTable />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      const caption = screen.getByText('Sample Data Table');
      expect(caption).toBeInTheDocument();
    });

    it('should have proper header associations', () => {
      render(<AccessibleTable />);
      
      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(3);
      
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });
      
      const rowHeaders = screen.getAllByRole('rowheader');
      expect(rowHeaders).toHaveLength(2);
      
      rowHeaders.forEach(header => {
        expect(header).toHaveAttribute('scope', 'row');
      });
    });
  });

  describe('Modal Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<AccessibleModal />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper modal attributes', () => {
      render(<AccessibleModal />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    it('should have proper heading association', () => {
      render(<AccessibleModal />);
      
      const heading = screen.getByText('Modal Title');
      expect(heading).toHaveAttribute('id', 'modal-title');
    });
  });

  describe('Accessibility Violations', () => {
    it('should detect accessibility violations', async () => {
      const { container } = render(<InaccessibleComponent />);
      const results = await axe(container);
      
      // This component has violations, so we expect some
      expect(results.violations.length).toBeGreaterThan(0);
    });

    it('should detect missing alt text', async () => {
      const { container } = render(<InaccessibleComponent />);
      const results = await axe(container);
      
      const altViolations = results.violations.filter(
        violation => violation.id === 'image-alt'
      );
      expect(altViolations.length).toBeGreaterThan(0);
    });

    it('should detect missing labels', async () => {
      const { container } = render(<InaccessibleComponent />);
      const results = await axe(container);
      
      const labelViolations = results.violations.filter(
        violation => violation.id === 'label'
      );
      expect(labelViolations.length).toBeGreaterThan(0);
    });

    it('should detect clickable elements without keyboard support', async () => {
      const { container } = render(<InaccessibleComponent />);
      const results = await axe(container);
      
      const keyboardViolations = results.violations.filter(
        violation => violation.id === 'click-events-have-key-events'
      );
      expect(keyboardViolations.length).toBeGreaterThan(0);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation', () => {
      render(
        <div>
          <button tabIndex={0}>First</button>
          <button tabIndex={0}>Second</button>
          <button tabIndex={0}>Third</button>
        </div>
      );
      
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      
      expect(buttons[0]).toHaveFocus();
      
      // Simulate tab navigation
      buttons[0].blur();
      buttons[1].focus();
      expect(buttons[1]).toHaveFocus();
    });

    it('should support arrow key navigation in radio groups', () => {
      render(
        <fieldset>
          <legend>Options</legend>
          <input type="radio" id="opt1" name="options" value="1" />
          <label htmlFor="opt1">Option 1</label>
          <input type="radio" id="opt2" name="options" value="2" />
          <label htmlFor="opt2">Option 2</label>
          <input type="radio" id="opt3" name="options" value="3" />
          <label htmlFor="opt3">Option 3</label>
        </fieldset>
      );
      
      const radios = screen.getAllByRole('radio');
      radios[0].focus();
      
      // Simulate arrow key navigation
      radios[0].blur();
      radios[1].focus();
      expect(radios[1]).toHaveFocus();
      
      radios[1].blur();
      radios[2].focus();
      expect(radios[2]).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <div>
          <h1>Main Title</h1>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
        </div>
      );
      
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      const h3 = screen.getByRole('heading', { level: 3 });
      
      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
      expect(h3).toBeInTheDocument();
    });

    it('should have proper landmark roles', () => {
      render(
        <div>
          <header>Header</header>
          <nav>Navigation</nav>
          <main>Main content</main>
          <aside>Sidebar</aside>
          <footer>Footer</footer>
        </div>
      );
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('complementary')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });
});
