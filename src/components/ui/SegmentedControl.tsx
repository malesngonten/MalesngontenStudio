import React from 'react';

interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  fullWidth?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  fullWidth = true,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center bg-[#222226] p-1 rounded-full border border-[#303036] select-none ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.value)}
            className={`tap relative flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-full transition-all min-h-[36px] ${
              isSelected
                ? 'bg-[#e5484d] text-white shadow-sm'
                : 'text-[#8b8b94] hover:text-[#f2f2f3]'
            }`}
          >
            {option.icon && <span className="w-3.5 h-3.5 shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
