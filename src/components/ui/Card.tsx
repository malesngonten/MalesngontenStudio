import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'code';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-[#18181b] border-[#27272c]',
    accent: 'bg-[#18181b] border-[#e5484d]/40',
    code: 'bg-[#0a0a0b] border-[#27272c] font-code',
  };

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
