'use client';

// ProductForm component
// Product creation/editing form component

import React, { useState } from 'react';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';

interface ProductFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    price: number;
    category: string;
    images: string[];
  }) => void;
  loading?: boolean;
  error?: string;
  initialData?: {
    title: string;
    description: string;
    price: number;
    category: string;
    images: string[];
  };
  className?: string;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  onSubmit,
  loading = false,
  error,
  initialData,
  className = '',
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    category: initialData?.category || '',
    images: initialData?.images || [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    'Electronics',
    'Clothing',
    'Home & Garden',
    'Books',
    'Sports',
    'Other',
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Input
        label="Product Title"
        type="text"
        placeholder="Enter product title"
        value={formData.title}
        onChange={(value) => handleChange('title', value)}
        {...(errors.title && { error: errors.title })}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
          <span className="text-red-500 ml-1">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Enter product description"
          required
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <Input
        label="Price"
        type="number"
        placeholder="Enter price"
        value={formData.price.toString()}
        onChange={(value) => handleChange('price', parseFloat(value) || 0)}
        {...(errors.price && { error: errors.price })}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
          <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.category ? 'border-red-300' : 'border-gray-300'
          }`}
          required
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        className="w-full"
      >
        {loading ? 'Saving...' : 'Save Product'}
      </Button>
    </form>
  );
};
