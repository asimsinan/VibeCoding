import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../../apps/web/src/components/Button';
describe('Button Component', () => {
    it('should render button with text', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeDefined();
    });
    it('should handle click events', () => {
        let clicked = false;
        render(<Button onClick={() => { clicked = true; }}>Click</Button>);
        fireEvent.click(screen.getByText('Click'));
        expect(clicked).toBe(true);
    });
    it('should support different variants', () => {
        const { rerender } = render(<Button variant="primary">Primary</Button>);
        expect(screen.getByText('Primary')).toBeDefined();
        rerender(<Button variant="secondary">Secondary</Button>);
        expect(screen.getByText('Secondary')).toBeDefined();
    });
    it('should support different sizes', () => {
        const { rerender } = render(<Button size="sm">Small</Button>);
        expect(screen.getByText('Small')).toBeDefined();
        rerender(<Button size="lg">Large</Button>);
        expect(screen.getByText('Large')).toBeDefined();
    });
    it('should show loading state', () => {
        render(<Button loading>Loading</Button>);
        expect(screen.getByText('Loading')).toBeDefined();
    });
    it('should be disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);
        const button = screen.getByText('Disabled');
        expect(button.disabled).toBe(true);
    });
});
//# sourceMappingURL=Button.test.js.map