'use client';

import { Badge } from '@/components/ui/badge';
import { Clock, Check, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface PostStatusBadgeProps {
  status: 'draft' | 'scheduled' | 'published';
  scheduledAt?: Date | null;
  className?: string;
}

export function PostStatusBadge({ status, scheduledAt, className }: PostStatusBadgeProps) {
  const getStatusConfig = (status: 'draft' | 'scheduled' | 'published') => {
    switch (status) {
      case 'published':
        return {
          label: 'Published',
          icon: Check,
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100'
        };
      case 'scheduled':
        return {
          label: scheduledAt ? format(scheduledAt, 'MMM d, h:mm a') : 'Scheduled',
          icon: Clock,
          className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100'
        };
      case 'draft':
      default:
        return {
          label: 'Draft',
          icon: FileText,
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${className} gap-1 text-xs font-medium`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
} 