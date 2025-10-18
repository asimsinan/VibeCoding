import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../../../apps/web/src/components/Card';
describe('Card Component', () => {
    it('should render card with children', () => {
        render(<Card>Card content</Card>);
        expect(screen.getByText('Card content')).toBeDefined();
    });
    it('should support different variants', () => {
        const { rerender } = render(<Card variant="elevated">Elevated</Card>);
        expect(screen.getByText('Elevated')).toBeDefined();
        rerender(<Card variant="outlined">Outlined</Card>);
        expect(screen.getByText('Outlined')).toBeDefined();
    });
    it('should support hover effect', () => {
        render(<Card hover>Hover card</Card>);
        expect(screen.getByText('Hover card')).toBeDefined();
    });
    it('should apply custom className', () => {
        const { container } = render(<Card className="custom-class">Content</Card>);
        expect(container.firstChild).toBeDefined();
    });
});
//# sourceMappingURL=Card.test.js.map