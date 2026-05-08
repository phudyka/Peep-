import React from 'react';
import { cn } from './Button';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ children, className, variant = 'default' }) => {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      variant === 'default' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "border border-default-400/20 text-slate-400",
      className
    )}>
      {children}
    </span>
  );
};
