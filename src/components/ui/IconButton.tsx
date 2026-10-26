import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  'aria-label': string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'primary' | 'secondary' | 'danger';
  active?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  'aria-label': ariaLabel,
  size = 'md',
  variant = 'ghost',
  active = false,
  className = '',
  disabled = false,
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-11 h-11', // 44x44
    md: 'w-11 h-11', // 44x44
    lg: 'w-12 h-12', // 48x48
  };

  const variantClasses = {
    ghost: active 
      ? 'bg-[#222226] text-[#e5484d]' 
      : 'bg-transparent text-[#8b8b94] hover:text-[#f2f2f3] active:bg-[#222226]/50',
    primary: 'bg-[#e5484d] hover:bg-[#d93d42] text-white shadow-sm',
    secondary: 'bg-[#222226] text-[#f2f2f3] border border-[#303036] hover:bg-[#2c2c31]',
    danger: 'bg-[#e5484d]/15 text-[#e5484d] border border-[#e5484d]/30 hover:bg-[#e5484d]/25',
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`tap inline-flex items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon}
    </button>
  );
};
