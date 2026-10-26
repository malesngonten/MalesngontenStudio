import React from 'react';
import { ShieldAlert, Check, X, CheckCheck } from 'lucide-react';
import { PermissionRequest } from '../../types';
import { PillButton } from '../ui/PillButton';

interface PermissionCardProps {
  permission: PermissionRequest;
  onDecision: (decision: 'approved' | 'approved_session' | 'rejected') => void;
}

export const PermissionCard: React.FC<PermissionCardProps> = ({
  permission,
  onDecision,
}) => {
  const isDangerous = permission.riskLevel === 'dangerous';
  const isResolved = permission.status !== 'pending';

  return (
    <div className="my-2.5 bg-[#18181b] border border-[#e5484d]/40 rounded-2xl p-3.5 shadow-lg select-none">
      <div className="flex items-start gap-2.5 mb-2.5">
        <div className="p-2 rounded-xl bg-[#e5484d]/15 text-[#e5484d] shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#f2f2f3]">
              Persetujuan Diperlukan
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isDangerous
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {permission.riskLevel}
            </span>
          </div>
          <p className="text-xs text-[#8b8b94] mt-0.5 leading-relaxed">
            {permission.reason}
          </p>
          <div className="mt-1.5 bg-[#0a0a0b] px-2.5 py-1 rounded-lg border border-[#27272c] font-code text-[11px] text-[#7aa7ff] truncate">
            {permission.action}: {permission.target}
          </div>
        </div>
      </div>

      {/* Decision buttons */}
      {!isResolved ? (
        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-[#27272c]">
          <PillButton
            variant="outline"
            size="xs"
            onClick={() => onDecision('rejected')}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-3 h-3" />
            Tolak
          </PillButton>
          <PillButton
            variant="outline"
            size="xs"
            onClick={() => onDecision('approved_session')}
          >
            <CheckCheck className="w-3 h-3 text-[#7aa7ff]" />
            Untuk Sesi Ini
          </PillButton>
          <PillButton
            variant="red"
            size="xs"
            onClick={() => onDecision('approved')}
          >
            <Check className="w-3 h-3" />
            Izinkan
          </PillButton>
        </div>
      ) : (
        <div className="text-[11px] text-right font-medium text-[#8b8b94] pt-1">
          Status: {permission.status === 'approved' ? 'Diizinkan' : permission.status === 'approved_session' ? 'Diizinkan untuk sesi ini' : 'Ditolak'}
        </div>
      )}
    </div>
  );
};
