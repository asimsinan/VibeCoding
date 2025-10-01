/**
 * Simple Integration Test
 * TASK-023: UI-API Integration Tests
 * 
 * A simple test to verify the test setup is working correctly.
 */

import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '../utils/testUtils';

describe('Simple Integration Test', () => {
  it('should render a simple component', () => {
    render(<div>Test Component</div>);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should render with providers', () => {
    render(<div>Test with Providers</div>);
    expect(screen.getByText('Test with Providers')).toBeInTheDocument();
  });
});
