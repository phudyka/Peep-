import React from 'react';
import { cn } from './Button';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  accent?: 'green';
}

export const Card: React.FC<CardProps> = ({ children, className, header, accent }) => {
  return (
    <div className={cn(
      "rounded-xl bg-[#0d1117] border border-[#1e2a3a]",
      accent === 'green' && "border-l-2 border-l-green-500",
      className
    )}>
      {header && (
        <div className="px-5 py-4 border-b border-[#1e2a3a]">
          {header}
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
};
