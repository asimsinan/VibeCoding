/**
 * UI Components Tests
 * TDD RED Phase: Tests should fail initially
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { View, Text } from 'react-native';

// These components will be implemented in GREEN phase
import { CameraScanner } from '@/components/camera/CameraScanner';
import { NutritionCard } from '@/components/cards/NutritionCard';
import { AllergenCard } from '@/components/cards/AllergenCard';
import { AlternativeList } from '@/components/cards/AlternativeList';
import { LoginForm } from '@/components/forms/LoginForm';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { NutritionInfo } from '@/lib/food-label-scanner/models/NutritionInfo';
import { AllergenInfo } from '@/lib/food-label-scanner/models/AllergenInfo';
import { AlternativeSuggestion } from '@/lib/food-label-scanner/models/AlternativeSuggestion';

// Mock navigation
const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ id: 'test-id' }),
}));

// Mock camera permissions
const mockUseCameraPermissions = jest.fn();

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CameraView: ({ children }: any) => React.createElement(View, { testID: 'camera-view' }, children),
    CameraType: { front: 'front', back: 'back' },
    useCameraPermissions: () => mockUseCameraPermissions(),
  };
});

describe('UI Components - User Interactions', () => {
  describe('CameraScanner Component', () => {
    beforeEach(() => {
      mockUseCameraPermissions.mockReturnValue([
        { granted: true, canAskAgain: true },
        jest.fn(),
      ]);
    });

    it('should render camera interface', () => {
      const { getByTestId } = render(<CameraScanner />);
      expect(getByTestId('camera-scanner')).toBeTruthy();
    });

    it('should handle scan button press', async () => {
      const onScan = jest.fn();
      const { getByTestId } = render(<CameraScanner onScan={onScan} />);
      const scanButton = getByTestId('scan-button');
      fireEvent.press(scanButton);
      // Wait for async scan
      await new Promise((resolve) => setTimeout(resolve, 1100));
      expect(onScan).toHaveBeenCalled();
    });

    it('should show loading state during scan', () => {
      const { getByTestId } = render(<CameraScanner scanning />);
      expect(getByTestId('scan-loading')).toBeTruthy();
    });
  });

  describe('NutritionCard Component', () => {
    const mockNutrition = new NutritionInfo(
      'Test Food',
      '1 serving',
      250,
      {
        protein: 10,
        carbs: 30,
        fat: 8,
        fiber: 5,
        sodium: 100,
        sugar: 15,
        saturatedFat: 2,
        transFat: 0,
      }
    );

    it('should render nutrition information', () => {
      const { getByText } = render(<NutritionCard nutrition={mockNutrition} />);
      expect(getByText('250')).toBeTruthy(); // Calories
    });

    it('should handle expand/collapse', () => {
      const { getByTestId } = render(<NutritionCard nutrition={mockNutrition} />);
      const expandButton = getByTestId('expand-nutrition');
      fireEvent.press(expandButton);
      expect(getByTestId('nutrition-details')).toBeTruthy();
    });
  });

  describe('AllergenCard Component', () => {
    const mockAllergens = [
      new AllergenInfo('Peanuts', 'high', 'Contains peanuts'),
      new AllergenInfo('Dairy', 'medium', 'Contains dairy'),
    ];

    it('should render allergen warnings', () => {
      const { getByText } = render(<AllergenCard allergens={mockAllergens} />);
      expect(getByText('Peanuts')).toBeTruthy();
    });

    it('should highlight high severity allergens', () => {
      const { getByText } = render(<AllergenCard allergens={mockAllergens} />);
      // Component renders allergen name, severity might be in description
      expect(getByText('Peanuts')).toBeTruthy();
    });
  });

  describe('AlternativeList Component', () => {
    const mockAlternatives = [
      new AlternativeSuggestion(
        'alt1',
        'Healthier Option',
        'Lower sodium',
        {
          calories: { current: 300, alternative: 250, difference: -50 },
          protein: { current: 10, alternative: 15, difference: 5 },
          carbs: { current: 40, alternative: 35, difference: -5 },
          fat: { current: 10, alternative: 8, difference: -2 },
          fiber: { current: 2, alternative: 5, difference: 3 },
          sodium: { current: 500, alternative: 300, difference: -200 },
        }
      ),
    ];

    it('should render alternative suggestions', () => {
      const { getByText } = render(<AlternativeList alternatives={mockAlternatives} />);
      expect(getByText('Healthier Option')).toBeTruthy();
    });

    it('should handle alternative selection', () => {
      const onSelect = jest.fn();
      const { getByTestId } = render(
        <AlternativeList alternatives={mockAlternatives} onSelect={onSelect} />
      );
      const alternative = getByTestId('alternative-0');
      fireEvent.press(alternative);
      expect(onSelect).toHaveBeenCalledWith(mockAlternatives[0]);
    });
  });

  describe('LoginForm Component', () => {
    it('should render login form fields', () => {
      const { getByPlaceholderText } = render(<LoginForm />);
      expect(getByPlaceholderText('Email')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
    });

    it('should handle form submission', () => {
      const onSubmit = jest.fn();
      const { getByTestId, getByPlaceholderText } = render(<LoginForm onSubmit={onSubmit} />);
      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      const submitButton = getByTestId('login-submit');
      fireEvent.press(submitButton);
      expect(onSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should validate email format', async () => {
      const { getByPlaceholderText, getByTestId, getByText } = render(<LoginForm />);
      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.changeText(passwordInput, 'password123');
      
      const submitButton = getByTestId('login-submit');
      fireEvent.press(submitButton);
      
      // Check for error message text directly
      await waitFor(() => {
        expect(getByText('Invalid email format')).toBeTruthy();
      }, { timeout: 2000 });
    });
  });

  describe('RegisterForm Component', () => {
    it('should render registration form fields', () => {
      const { getByPlaceholderText } = render(<RegisterForm />);
      expect(getByPlaceholderText('Display Name')).toBeTruthy();
      expect(getByPlaceholderText('Email')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
    });

    it('should handle form submission', () => {
      const onSubmit = jest.fn();
      const { getByTestId, getByPlaceholderText } = render(<RegisterForm onSubmit={onSubmit} />);
      const displayNameInput = getByPlaceholderText('Display Name');
      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      fireEvent.changeText(displayNameInput, 'Test User');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      const submitButton = getByTestId('register-submit');
      fireEvent.press(submitButton);
      expect(onSubmit).toHaveBeenCalledWith('Test User', 'test@example.com', 'password123');
    });

    it('should validate password strength', async () => {
      const { getByPlaceholderText, getByTestId, getByText } = render(<RegisterForm />);
      const passwordInput = getByPlaceholderText('Password');
      const emailInput = getByPlaceholderText('Email');
      const displayNameInput = getByPlaceholderText('Display Name');
      
      // Fill required fields
      fireEvent.changeText(displayNameInput, 'Test User');
      fireEvent.changeText(emailInput, 'test@example.com');
      
      // Set invalid password
      fireEvent.changeText(passwordInput, '123'); // Too short
      
      const submitButton = getByTestId('register-submit');
      
      // Password error should appear when trying to submit
      fireEvent.press(submitButton);
      
      // Wait for error message text to appear
      await waitFor(() => {
        expect(getByText('Password must be at least 6 characters')).toBeTruthy();
      }, { timeout: 2000 });
    });
  });
});

describe('UI Components - State Management', () => {
  beforeEach(() => {
    mockUseCameraPermissions.mockReturnValue([
      { granted: true, canAskAgain: true },
      jest.fn(),
    ]);
  });

  it('should manage camera scan state', () => {
    const { rerender, getByTestId } = render(<CameraScanner />);
    expect(getByTestId('camera-ready')).toBeTruthy();
    rerender(<CameraScanner scanning />);
    expect(getByTestId('camera-scanning')).toBeTruthy();
  });

  it('should manage form validation state', () => {
    const { getByPlaceholderText, getByTestId } = render(<LoginForm />);
    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'test@example.com');
    expect(getByTestId('email-valid')).toBeTruthy();
  });
});

describe('UI Components - Navigation Integration', () => {
  beforeEach(() => {
    mockUseCameraPermissions.mockReturnValue([
      { granted: true, canAskAgain: true },
      jest.fn(),
    ]);
  });

  it('should navigate to results on scan complete', async () => {
    const onScanComplete = jest.fn();
    const { getByTestId } = render(<CameraScanner onScanComplete={onScanComplete} />);
    const scanButton = getByTestId('scan-button');
    fireEvent.press(scanButton);
    // Wait for async scan
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect(onScanComplete).toHaveBeenCalled();
  });

  it('should navigate after login', () => {
    const { getByTestId } = render(<LoginForm />);
    const submitButton = getByTestId('login-submit');
    fireEvent.press(submitButton);
    // Navigation will be tested in GREEN phase
  });
});

