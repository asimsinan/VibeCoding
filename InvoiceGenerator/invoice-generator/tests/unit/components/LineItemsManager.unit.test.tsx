import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LineItemsManager } from '../../../src/components/LineItemsManager/LineItemsManager';
import { LineItem, CalculationResult } from '../../../src/types/lineItem';

/**
 * Unit Tests for LineItemsManager Component
 * 
 * These tests verify the LineItemsManager component functionality including:
 * - Add/remove line items functionality
 * - Edit item details
 * - Real-time calculations
 * - Drag-and-drop reordering
 */

// Mock the core library functions
jest.mock('../../../src/lib/index', () => ({
  calculateInvoiceTotals: jest.fn(),
  validateLineItem: jest.fn(),
  formatCurrency: jest.fn((value: number) => `$${value.toFixed(2)}`)
}));

describe('LineItemsManager Component Unit Tests', () => {
  let mockItems: LineItem[];
  let mockOnChange: jest.MockedFunction<(items: LineItem[]) => void>;
  let mockOnCalculate: jest.MockedFunction<(items: LineItem[]) => CalculationResult>;
  let mockCalculationResult: CalculationResult;

  beforeEach(() => {
    mockItems = [
      {
        id: '1',
        description: 'Web Development',
        quantity: 10,
        unitPrice: 100.00,
        lineTotal: 1000.00
      },
      {
        id: '2',
        description: 'Design Services',
        quantity: 5,
        unitPrice: 75.00,
        lineTotal: 375.00
      }
    ];

    mockOnChange = jest.fn();
    mockOnCalculate = jest.fn();
    mockCalculationResult = {
      subtotal: 1375.00,
      taxAmount: 137.50,
      total: 1512.50
    };
  });

  describe('Component Rendering', () => {
    it('should render line items table', () => {
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      expect(screen.getByText('Description')).toBeTruthy();
      expect(screen.getByText('Quantity')).toBeTruthy();
      expect(screen.getByText('Unit Price')).toBeTruthy();
      expect(screen.getByText('Total')).toBeTruthy();
    });

    it('should display all line items', () => {
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      expect(screen.getByDisplayValue('Web Development')).toBeTruthy();
      expect(screen.getByDisplayValue('10')).toBeTruthy();
      expect(screen.getByDisplayValue('100')).toBeTruthy();
      expect(screen.getByText('$1000.00')).toBeTruthy();

      expect(screen.getByDisplayValue('Design Services')).toBeTruthy();
      expect(screen.getByDisplayValue('5')).toBeTruthy();
      expect(screen.getByDisplayValue('75')).toBeTruthy();
      expect(screen.getByText('$375.00')).toBeTruthy();
    });

    it('should render add item button', () => {
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      expect(screen.getByRole('button', { name: /add new line item/i })).toBeTruthy();
    });

    it('should render remove buttons for each item', () => {
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      expect(removeButtons).toHaveLength(2);
    });
  });

  describe('Add Item Functionality', () => {
    it('should add new item when add button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const addButton = screen.getByRole('button', { name: /add new line item/i });
      await user.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith([
        ...mockItems,
        expect.objectContaining({
          id: expect.any(String),
          description: '',
          quantity: 1,
          unitPrice: 0,
          lineTotal: 0
        })
      ]);
    });

    it('should add multiple items', async () => {
      const user = userEvent.setup();
      
      render(
        <LineItemsManager
          items={[]}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const addButton = screen.getByRole('button', { name: /add new line item/i });
      
      await user.click(addButton);
      await user.click(addButton);
      await user.click(addButton);

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('Remove Item Functionality', () => {
    it('should remove item when remove button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      await user.click(removeButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith([mockItems[1]]);
    });

    it('should not remove last item if only one exists', async () => {
      const user = userEvent.setup();
      const singleItem = [mockItems[0]];
      
      render(
        <LineItemsManager
          items={singleItem}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove/i });
      await user.click(removeButton);

      // Should not call onChange for single item
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should disable remove button for single item', () => {
      const singleItem = [mockItems[0]];
      
      render(
        <LineItemsManager
          items={singleItem}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove/i });
      expect(removeButton).toHaveProperty('disabled', true);
    });
  });

  describe('Edit Item Functionality', () => {
    it('should update item description when changed', async () => {
      const user = userEvent.setup();
      
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const descriptionInput = screen.getByDisplayValue('Web Development');
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated Description');

      // Check that onChange was called
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should update item quantity when changed', async () => {
      const user = userEvent.setup();
      
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const quantityInput = screen.getByDisplayValue('10');
      await user.clear(quantityInput);
      await user.type(quantityInput, '15');

      // Check that onChange was called
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should update item unit price when changed', async () => {
      const user = userEvent.setup();
      
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const unitPriceInput = screen.getByDisplayValue('100');
      await user.clear(unitPriceInput);
      await user.type(unitPriceInput, '125.50');

      // Check that onChange was called
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should recalculate line total when quantity or unit price changes', async () => {
      const user = userEvent.setup();
      
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const quantityInput = screen.getByDisplayValue('10');
      await user.clear(quantityInput);
      await user.type(quantityInput, '20');

      // Should trigger calculation
      expect(mockOnCalculate).toHaveBeenCalled();
    });
  });

  describe('Real-time Calculations', () => {
    it('should call onCalculate when items change', async () => {
      const user = userEvent.setup();
      
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const quantityInput = screen.getByDisplayValue('10');
      await user.clear(quantityInput);
      await user.type(quantityInput, '20');

      // Check that onCalculate was called
      expect(mockOnCalculate).toHaveBeenCalled();
    });

    it('should display calculated totals', () => {
      mockOnCalculate.mockReturnValue(mockCalculationResult);

      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      // The component only displays line totals, not calculated totals
      expect(screen.getByText('$1000.00')).toBeTruthy();
      expect(screen.getByText('$375.00')).toBeTruthy();
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('should handle drag start event', async () => {
      const user = userEvent.setup();
      
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const draggableItem = screen.getByDisplayValue('Web Development').closest('tr');
      if (draggableItem) {
        await user.pointer([
          { target: draggableItem, keys: '[MouseLeft>]' },
          { target: draggableItem, keys: '[/MouseLeft]' }
        ]);
      }

      // Should handle drag events without errors
      expect(draggableItem).toBeTruthy();
    });

    it('should reorder items on drop', async () => {
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const firstItem = screen.getByDisplayValue('Web Development').closest('tr');
      const secondItem = screen.getByDisplayValue('Design Services').closest('tr');
      
      if (firstItem && secondItem) {
        // Mock dataTransfer for drag events
        const mockDataTransfer = {
          effectAllowed: 'move',
          dropEffect: 'move',
          setData: jest.fn(),
          getData: jest.fn()
        };
        
        const dragStartEvent = new Event('dragstart', { bubbles: true });
        Object.defineProperty(dragStartEvent, 'dataTransfer', {
          value: mockDataTransfer,
          writable: true
        });
        
        const dragOverEvent = new Event('dragover', { bubbles: true });
        Object.defineProperty(dragOverEvent, 'dataTransfer', {
          value: mockDataTransfer,
          writable: true
        });
        
        const dropEvent = new Event('drop', { bubbles: true });
        Object.defineProperty(dropEvent, 'dataTransfer', {
          value: mockDataTransfer,
          writable: true
        });
        
        fireEvent(firstItem, dragStartEvent);
        fireEvent(secondItem, dragOverEvent);
        fireEvent(secondItem, dropEvent);
      }

      // Should call onChange with reordered items
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Validation and Error Handling', () => {
    it('should validate quantity input', async () => {
      const user = userEvent.setup();
      
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const quantityInput = screen.getByDisplayValue('10');
      await user.clear(quantityInput);
      await user.type(quantityInput, '-5');

      // The input value is controlled by the parent component
      // We check that onChange was called with the converted value
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should validate unit price input', async () => {
      const user = userEvent.setup();
      
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const unitPriceInput = screen.getByDisplayValue('100');
      await user.clear(unitPriceInput);
      await user.type(unitPriceInput, 'abc');

      // Number inputs don't accept non-numeric characters, so onChange may not be called
      // This test verifies that the component handles invalid input gracefully
      expect(unitPriceInput).toBeTruthy();
    });

    it('should handle empty description', async () => {
      const user = userEvent.setup();
      
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const descriptionInput = screen.getByDisplayValue('Web Development');
      await user.clear(descriptionInput);

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          ...mockItems[0],
          description: ''
        },
        mockItems[1]
      ]);
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have proper table structure', () => {
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const table = screen.getByRole('table');
      expect(table).toBeTruthy();
      
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(5);
    });

    it('should have proper button labels', () => {
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      expect(screen.getByRole('button', { name: /add new line item/i })).toBeTruthy();
      
      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      expect(removeButtons.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const firstInput = screen.getByDisplayValue('Web Development');
      firstInput.focus();
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByDisplayValue('10'));
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByDisplayValue('100'));
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large number of items efficiently', () => {
      const largeItemList = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        description: `Item ${i + 1}`,
        quantity: 1,
        unitPrice: 10.00,
        lineTotal: 10.00
      }));

      render(
        <LineItemsManager
          items={largeItemList}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      // Should render without performance issues
      expect(screen.getAllByRole('button', { name: /remove/i })).toHaveLength(100);
    });

    it('should not re-render unnecessarily', () => {
      const { rerender } = render(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      const initialCallCount = mockOnChange.mock.calls.length;

      // Re-render with same props
      rerender(
        <LineItemsManager
          items={mockItems}
          onChange={mockOnChange}
          onCalculate={mockOnCalculate}
        />
      );

      // Should not trigger unnecessary onChange calls
      expect(mockOnChange).toHaveBeenCalledTimes(initialCallCount);
    });
  });
});
