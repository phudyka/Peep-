import React from 'react';
import { cn } from './Button';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  isOverridden?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, isOverridden, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              "h-9 w-full rounded-lg bg-[#0d1117] border border-[#1e2a3a] px-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
              isOverridden && "bg-amber-950/30 border-amber-500/60 text-amber-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30",
              className
            )}
            {...props}
          />
          {isOverridden && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#07090f]" />
          )}
        </div>
      </div>
    );
  }
);
Input.displayName = 'Input';

