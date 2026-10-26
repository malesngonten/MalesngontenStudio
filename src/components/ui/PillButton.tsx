import React from 'react';

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'outline' | 'filled' | 'red';
  size?: 'xs' | 'sm' | 'md';
  active?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const PillButton: React.FC<PillButtonProps> = ({
  variant = 'outline',
  size = 'sm',
  active = false,
  fullWidth = false,
  className = '',
  disabled = false,
  children,
  ...props
}) => {
  // Visual height can be compact (28px for sm), but .tap guarantees 44x44px touch target
  const sizeClasses = {
    xs: 'text-[11px] px-2.5 py-1 min-h-[26px]',
    sm: 'text-xs px-3 py-1.5 min-h-[28px]',
    md: 'text-sm px-3.5 py-1.5 min-h-[34px]',
  };

  const variantClasses = {
    outline: active
      ? 'border border-[#e5484d] bg-[#3b2427]/40 text-[#f2f2f3]'
      : 'border border-[#303036] bg-[#18181b] hover:border-[#45454d] text-[#8b8b94] hover:text-[#f2f2f3]',
    filled: active
      ? 'bg-[#e5484d] text-white font-medium'
      : 'bg-[#222226] text-[#8b8b94] hover:text-[#f2f2f3] hover:bg-[#2c2c31]',
    red: 'border border-[#e5484d]/60 bg-[#3b2427]/30 text-[#e5484d] hover:bg-[#3b2427]/50 active:scale-95',
  };

  return (
    <button
      type="button"
      className={`tap inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors select-none disabled:opacity-40 disabled:pointer-events-none ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
