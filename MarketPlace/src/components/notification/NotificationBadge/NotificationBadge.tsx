// NotificationBadge component
// Notification badge component for displaying notification count

import React from 'react';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  className = '',
}) => {
  if (count === 0) {return null;}

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full ${className}`}>
      {displayCount}
    </span>
  );
};
