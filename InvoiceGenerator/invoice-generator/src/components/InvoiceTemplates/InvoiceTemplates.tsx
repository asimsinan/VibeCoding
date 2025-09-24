import React, { useState } from 'react';
import { Client } from '../../types/client';
import { LineItem } from '../../types/lineItem';
import './InvoiceTemplates.css';

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  client: Partial<Client>;
  items: Partial<LineItem>[];
  taxRate: number;
  notes?: string;
}

interface InvoiceTemplatesProps {
  onSelectTemplate: (template: InvoiceTemplate) => void;
  onClose: () => void;
}

const defaultTemplates: InvoiceTemplate[] = [
  {
    id: 'web-development',
    name: 'Web Development',
    description: 'Template for web development projects',
    category: 'Technology',
    client: {
      name: '',
      email: '',
      address: '',
      phone: '',
    },
    items: [
      {
        description: 'Frontend Development',
        quantity: 1,
        unitPrice: 0,
      },
      {
        description: 'Backend Development',
        quantity: 1,
        unitPrice: 0,
      },
      {
        description: 'Testing & QA',
        quantity: 1,
        unitPrice: 0,
      },
    ],
    taxRate: 10,
    notes: 'Thank you for choosing our web development services.',
  },
  {
    id: 'consulting',
    name: 'Business Consulting',
    description: 'Template for business consulting services',
    category: 'Consulting',
    client: {
      name: '',
      email: '',
      address: '',
      phone: '',
    },
    items: [
      {
        description: 'Strategy Consultation',
        quantity: 1,
        unitPrice: 0,
      },
      {
        description: 'Market Analysis',
        quantity: 1,
        unitPrice: 0,
      },
      {
        description: 'Implementation Support',
        quantity: 1,
        unitPrice: 0,
      },
    ],
    taxRate: 8,
    notes: 'We look forward to helping your business grow.',
  },
  {
    id: 'design',
    name: 'Graphic Design',
    description: 'Template for graphic design projects',
    category: 'Design',
    client: {
      name: '',
      email: '',
      address: '',
      phone: '',
    },
    items: [
      {
        description: 'Logo Design',
        quantity: 1,
        unitPrice: 0,
      },
      {
        description: 'Brand Identity',
        quantity: 1,
        unitPrice: 0,
      },
      {
        description: 'Marketing Materials',
        quantity: 1,
        unitPrice: 0,
      },
    ],
    taxRate: 12,
    notes: 'Creative solutions for your brand.',
  },
  {
    id: 'maintenance',
    name: 'Maintenance & Support',
    description: 'Template for ongoing maintenance services',
    category: 'Support',
    client: {
      name: '',
      email: '',
      address: '',
      phone: '',
    },
    items: [
      {
        description: 'Monthly Maintenance',
        quantity: 1,
        unitPrice: 0,
      },
      {
        description: 'Technical Support',
        quantity: 1,
        unitPrice: 0,
      },
      {
        description: 'Updates & Patches',
        quantity: 1,
        unitPrice: 0,
      },
    ],
    taxRate: 5,
    notes: 'Reliable support for your systems.',
  },
];

export const InvoiceTemplates: React.FC<InvoiceTemplatesProps> = ({
  onSelectTemplate,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categories = ['all', ...Array.from(new Set(defaultTemplates.map(t => t.category)))];

  const filteredTemplates = defaultTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectTemplate = (template: InvoiceTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <div className="invoice-templates">
      <div className="invoice-templates__header">
        <h2>Choose a Template</h2>
        <button onClick={onClose} className="invoice-templates__close">
          ×
        </button>
      </div>

      <div className="invoice-templates__filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="category-filter">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="invoice-templates__grid">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className="template-card"
            onClick={() => handleSelectTemplate(template)}
          >
            <div className="template-card__header">
              <h3 className="template-card__name">{template.name}</h3>
              <span className="template-card__category">{template.category}</span>
            </div>
            <p className="template-card__description">{template.description}</p>
            <div className="template-card__items">
              <div className="template-card__items-label">Includes:</div>
              <ul className="template-card__items-list">
                {template.items.map((item, index) => (
                  <li key={index}>{item.description}</li>
                ))}
              </ul>
            </div>
            <div className="template-card__footer">
              <div className="template-card__tax">Tax: {template.taxRate}%</div>
              <button className="template-card__select-btn">
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="invoice-templates__empty">
          <div className="empty-state">
            <div className="empty-state__icon">🔍</div>
            <h3>No templates found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        </div>
      )}
    </div>
  );
};
