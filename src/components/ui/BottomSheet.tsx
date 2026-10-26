import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Sheet content */}
      <div className="relative w-full max-w-[480px] max-h-[85vh] bg-[#121214] border-t border-[#27272c] rounded-t-3xl shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom duration-200">
        {/* Drag handle */}
        <div className="w-full flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 bg-[#303036] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#27272c]">
          <div>
            <h3 className="text-sm font-semibold text-[#f2f2f3]">{title}</h3>
            {subtitle && <p className="text-[11px] text-[#8b8b94]">{subtitle}</p>}
          </div>
          <IconButton
            icon={<X className="w-4 h-4" />}
            aria-label="Tutup"
            size="sm"
            onClick={onClose}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 safe-pb">
          {children}
        </div>
      </div>
    </div>
  );
};
