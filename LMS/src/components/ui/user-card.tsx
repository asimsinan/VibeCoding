import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card';
import { Button } from './button';
import { Badge } from './badge';

export interface UserCardProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
    organizationName?: string;
    isActive: boolean;
    createdAt: string;
    lastLoginAt?: string;
    coursesCount?: number;
    studentsCount?: number;
  };
  onEdit?: (user: UserCardProps['user']) => void;
  onDelete?: (user: UserCardProps['user']) => void;
  onView?: (user: UserCardProps['user']) => void;
  onToggleStatus?: (user: UserCardProps['user']) => void;
  showActions?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
  showActions = true,
}) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'INSTRUCTOR':
        return 'bg-blue-100 text-blue-800';
      case 'STUDENT':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return formatDate(dateString);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {user.firstName} {user.lastName}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{user.email}</p>
          </div>
          <div className="flex flex-col space-y-1">
            <Badge className={getRoleColor(user.role)}>
              {user.role}
            </Badge>
            <Badge className={getStatusColor(user.isActive)}>
              {user.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
        {user.organizationName && (
          <p className="text-sm text-gray-500">Organization: {user.organizationName}</p>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Joined:</span>
            <span className="text-gray-900">{formatDate(user.createdAt)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Last Login:</span>
            <span className="text-gray-900">{formatLastLogin(user.lastLoginAt)}</span>
          </div>

          {user.role === 'INSTRUCTOR' && user.coursesCount !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Courses:</span>
              <span className="text-gray-900">{user.coursesCount}</span>
            </div>
          )}

          {user.role === 'INSTRUCTOR' && user.studentsCount !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Students:</span>
              <span className="text-gray-900">{user.studentsCount}</span>
            </div>
          )}

          {user.role === 'STUDENT' && user.coursesCount !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Enrolled Courses:</span>
              <span className="text-gray-900">{user.coursesCount}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        {showActions && (
          <div className="flex space-x-2 w-full">
            {onView && (
              <Button
                onClick={() => onView(user)}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                View
              </Button>
            )}

            {onEdit && (
              <Button
                onClick={() => onEdit(user)}
                variant="outline"
                size="sm"
              >
                Edit
              </Button>
            )}

            {onToggleStatus && (
              <Button
                onClick={() => onToggleStatus(user)}
                variant="outline"
                size="sm"
                className={user.isActive ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
              >
                {user.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            )}

            {onDelete && (
              <Button
                onClick={() => onDelete(user)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};


