import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critical' | 'high' | 'warning' | 'resolved' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantStyles = {
    critical: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
    high: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-500/10',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200 ring-yellow-500/10',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
    info: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/10',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',
  };

  const dotStyles = {
    critical: 'bg-rose-500',
    high: 'bg-amber-500',
    warning: 'bg-yellow-500',
    resolved: 'bg-emerald-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ring-1 ring-inset ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
};

export const getSeverityBadgeVariant = (severity: string): 'critical' | 'high' | 'warning' | 'info' | 'neutral' => {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return 'critical';
    case 'HIGH':
      return 'high';
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
      return 'info';
    default:
      return 'neutral';
  }
};

export const getStatusBadgeVariant = (status: string): 'critical' | 'high' | 'warning' | 'resolved' | 'info' | 'neutral' => {
  switch (status?.toUpperCase()) {
    case 'NEW':
      return 'critical';
    case 'INVESTIGATING':
      return 'high';
    case 'ACTION_REQUIRED':
      return 'warning';
    case 'RESOLVED':
    case 'DONE':
    case 'CLOSED':
      return 'resolved';
    case 'READY':
    case 'WAITING':
      return 'info';
    default:
      return 'neutral';
  }
};
