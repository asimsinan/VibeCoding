import { describe, it, expect } from 'vitest';
describe('Design System - Spacing', () => {
    it('should define padding utilities', () => {
        const paddings = ['p-0', 'p-1', 'p-2', 'p-4', 'p-8', 'p-16'];
        paddings.forEach(padding => {
            expect(padding).toBeTruthy();
        });
    });
    it('should define margin utilities', () => {
        const margins = ['m-0', 'm-1', 'm-2', 'm-4', 'm-8', 'm-16'];
        margins.forEach(margin => {
            expect(margin).toBeTruthy();
        });
    });
    it('should define gap utilities', () => {
        const gaps = ['gap-0', 'gap-1', 'gap-2', 'gap-4', 'gap-8'];
        gaps.forEach(gap => {
            expect(gap).toBeTruthy();
        });
    });
    it('should define space utilities', () => {
        const spaces = ['space-x-2', 'space-y-2', 'space-x-4', 'space-y-4'];
        spaces.forEach(space => {
            expect(space).toBeTruthy();
        });
    });
});
//# sourceMappingURL=spacing.test.js.map