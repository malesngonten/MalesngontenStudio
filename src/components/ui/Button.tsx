import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled = false,
  children,
  ...props
}) => {
  const baseClasses = 'tap inline-flex items-center justify-center font-medium rounded-full transition-colors active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px]',
    md: 'text-sm px-4 py-2 min-h-[44px]',
    lg: 'text-base px-6 py-2.5 min-h-[48px]',
  };

  const variantClasses = {
    primary: 'bg-[#e5484d] hover:bg-[#d93d42] text-white font-semibold shadow-sm',
    secondary: 'bg-[#222226] hover:bg-[#2c2c31] text-[#f2f2f3] border border-[#303036]',
    outline: 'bg-transparent border border-[#303036] hover:border-[#45454d] text-[#f2f2f3]',
    ghost: 'bg-transparent hover:bg-[#222226] text-[#8b8b94] hover:text-[#f2f2f3]',
    danger: 'bg-[#e5484d]/15 text-[#e5484d] border border-[#e5484d]/30 hover:bg-[#e5484d]/25',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
