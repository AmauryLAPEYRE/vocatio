// src/components/ui/Progress.tsx
import React from 'react';
import { twMerge } from 'tailwind-merge';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
  showValue?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className,
  indicatorClassName,
  showValue = false,
  valuePrefix = '',
  valueSuffix = '',
}) => {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
  
  return (
    <div className="relative">
      <div className={twMerge("h-2 w-full bg-gray-200 rounded-full overflow-hidden", className)}>
        <div 
          className={twMerge("h-full bg-blue-600 transition-all duration-300 ease-in-out", indicatorClassName)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <div className="text-xs text-gray-600 mt-1">
          {valuePrefix}{value}{valueSuffix}
        </div>
      )}
    </div>
  );
};