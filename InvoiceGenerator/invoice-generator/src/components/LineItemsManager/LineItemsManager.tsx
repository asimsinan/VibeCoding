import React, { useState, useCallback, useRef } from 'react';
import { LineItemsManagerProps } from '../../types/lineItem';
import './LineItemsManager.css';

/**
 * LineItemsManager Component
 * 
 * A component for managing line items with add/remove/edit functionality.
 * Features:
 * - Add/remove line items
 * - Edit item details with real-time calculations
 * - Drag-and-drop reordering
 * - Accessibility compliance
 */
export const LineItemsManager: React.FC<LineItemsManagerProps> = ({
  items,
  onChange,
  onCalculate
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragRef = useRef<HTMLTableRowElement>(null);

  const handleAddItem = useCallback(() => {
    const newItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0
    };
    onChange([...items, newItem]);
  }, [items, onChange]);

  const handleRemoveItem = useCallback((index: number) => {
    if (items.length <= 1) return; // Don't remove the last item
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
    onCalculate(newItems);
  }, [items, onChange, onCalculate]);

  const handleItemChange = useCallback((index: number, field: keyof typeof items[0], value: string | number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };

    // Recalculate line total if quantity or unit price changed
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? value as number : newItems[index].quantity;
      const unitPrice = field === 'unitPrice' ? value as number : newItems[index].unitPrice;
      newItems[index].lineTotal = quantity * unitPrice;
    }

    onChange(newItems);
    onCalculate(newItems);
  }, [items, onChange, onCalculate]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);
    
    onChange(newItems);
    onCalculate(newItems);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, items, onChange, onCalculate]);

  const canRemove = items.length > 1;

  return (
    <div className="line-items-manager" data-testid="line-items-manager">
      <div className="line-items-manager__header">
        <h2 className="line-items-manager__title">Line Items</h2>
        <button
          type="button"
          onClick={handleAddItem}
          className="line-items-manager__add-button"
          aria-label="Add new line item"
        >
          + Add Item
        </button>
      </div>

      <div className="line-items-manager__table-container">
        <table className="line-items-manager__table" role="table">
          <thead>
            <tr>
              <th className="line-items-manager__header-cell">Description</th>
              <th className="line-items-manager__header-cell">Quantity</th>
              <th className="line-items-manager__header-cell">Unit Price</th>
              <th className="line-items-manager__header-cell">Total</th>
              <th className="line-items-manager__header-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={item.id}
                ref={index === 0 ? dragRef : null}
                className={`line-items-manager__row ${
                  draggedIndex === index ? 'line-items-manager__row--dragging' : ''
                } ${
                  dragOverIndex === index ? 'line-items-manager__row--drag-over' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                aria-label={`Line item ${index + 1}`}
              >
                <td className="line-items-manager__cell">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="line-items-manager__input line-items-manager__input--description"
                    placeholder="Enter item description"
                    aria-label={`Description for item ${index + 1}`}
                  />
                </td>
                <td className="line-items-manager__cell">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="line-items-manager__input line-items-manager__input--quantity"
                    aria-label={`Quantity for item ${index + 1}`}
                  />
                </td>
                <td className="line-items-manager__cell">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="line-items-manager__input line-items-manager__input--unit-price"
                    aria-label={`Unit price for item ${index + 1}`}
                  />
                </td>
                <td className="line-items-manager__cell">
                  <span className="line-items-manager__total">
                    ${item.lineTotal.toFixed(2)}
                  </span>
                </td>
                <td className="line-items-manager__cell">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={!canRemove}
                    className="line-items-manager__remove-button"
                    aria-label={`Remove item ${index + 1}`}
                    title={canRemove ? `Remove item ${index + 1}` : 'Cannot remove the last item'}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div className="line-items-manager__empty-state">
          <p>No items added yet. Click "Add Item" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default LineItemsManager;
