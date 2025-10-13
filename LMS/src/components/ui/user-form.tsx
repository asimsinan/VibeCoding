import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card';
import { Button } from './button';
import { Input } from './input';
import { Select } from './select';
import { Checkbox } from './checkbox';
import { Badge } from './badge';

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  organizationId: string;
  isActive: boolean;
  password?: string;
  confirmPassword?: string;
}

export interface UserFormProps {
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  title?: string;
  organizations?: Array<{ id: string; name: string }>;
  isEdit?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  title = 'Create User',
  organizations = [],
  isEdit = false,
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'STUDENT',
    organizationId: '',
    isActive: true,
    password: '',
    confirmPassword: '',
    ...initialData,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const errors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.organizationId) {
      errors.organizationId = 'Organization is required';
    }

    if (!isEdit) {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    } else if (formData.password && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Remove confirmPassword from submission data
    const { confirmPassword, ...submitData } = formData;
    onSubmit(submitData);
  };

  const roleOptions = [
    { value: 'STUDENT', label: 'Student' },
    { value: 'INSTRUCTOR', label: 'Instructor' },
    { value: 'ADMIN', label: 'Admin' },
  ];

  const organizationOptions = [
    { value: '', label: 'Select an organization' },
    ...organizations.map(org => ({ value: org.id, label: org.name }))
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              error={formErrors.firstName}
              placeholder="Enter first name"
              required
            />

            <Input
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              error={formErrors.lastName}
              placeholder="Enter last name"
              required
            />
          </div>

          <Input
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            error={formErrors.email}
            placeholder="Enter email address"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              options={roleOptions}
              required
            />

            <Select
              label="Organization"
              name="organizationId"
              value={formData.organizationId}
              onChange={handleInputChange}
              error={formErrors.organizationId}
              options={organizationOptions}
              required
            />
          </div>

          {!isEdit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                error={formErrors.password}
                placeholder="Enter password"
                required={!isEdit}
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={formErrors.confirmPassword}
                placeholder="Confirm password"
                required={!isEdit}
              />
            </div>
          )}

          {isEdit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="New Password (Optional)"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                error={formErrors.password}
                placeholder="Enter new password"
              />

              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={formErrors.confirmPassword}
                placeholder="Confirm new password"
              />
            </div>
          )}

          <Checkbox
            label="Active user"
            name="isActive"
            checked={formData.isActive}
            onChange={handleInputChange}
          />

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};


