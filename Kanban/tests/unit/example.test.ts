// Example unit test to verify test framework setup
import { describe, it, expect } from '@jest/globals';

describe('Example Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should fail as expected in RED phase', () => {
    // This test intentionally fails to demonstrate RED phase
    expect(true).toBe(false);
  });
});
