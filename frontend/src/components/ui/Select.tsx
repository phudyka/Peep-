import React from 'react';
import { Select as HeroSelect, SelectItem as HeroSelectItem } from "@heroui/react";
import { cn } from './Button';

interface SelectProps extends React.ComponentProps<typeof HeroSelect> {}

export const Select: React.FC<SelectProps> = ({ className, ...props }) => {
  return (
    <HeroSelect
      classNames={{
        trigger: cn("bg-[#0d1117] border border-[#1e2a3a] hover:border-[#2a3a50] data-[focus=true]:border-green-500 rounded-lg", className),
        value: "text-slate-200 text-sm",
        popoverContent: "bg-[#0d1117] border border-[#1e2a3a] rounded-xl shadow-2xl",
      }}
      {...props}
    />
  );
};

export const SelectItem = HeroSelectItem;
