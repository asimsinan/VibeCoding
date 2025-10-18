import { describe, it, expect } from 'vitest';
describe('Design System - Colors', () => {
    it('should define primary color palette', () => {
        const colors = ['primary', 'primary-light', 'primary-dark'];
        colors.forEach(color => {
            expect(color).toBeTruthy();
        });
    });
    it('should define accent color palette', () => {
        const colors = ['accent', 'accent-light', 'accent-dark'];
        colors.forEach(color => {
            expect(color).toBeTruthy();
        });
    });
    it('should define semantic colors', () => {
        const colors = ['success', 'warning', 'error', 'info'];
        colors.forEach(color => {
            expect(color).toBeTruthy();
        });
    });
    it('should define neutral colors', () => {
        const colors = ['surface', 'background', 'text'];
        colors.forEach(color => {
            expect(color).toBeTruthy();
        });
    });
});
//# sourceMappingURL=colors.test.js.map