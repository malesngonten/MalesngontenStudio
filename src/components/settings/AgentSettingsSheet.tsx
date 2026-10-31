import React from 'react';
import { Sliders, ShieldCheck, Zap, Wrench, Sparkles } from 'lucide-react';
import { AgentSettings } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { PillButton } from '../ui/PillButton';

interface AgentSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AgentSettings;
  onUpdateSettings: (newSettings: Partial<AgentSettings>) => void;
}

export const AgentSettingsSheet: React.FC<AgentSettingsSheetProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Pengaturan AI Agent"
      subtitle="Konfigurasi model Gemini dan protokol perizinan ACP"
    >
      <div className="space-y-4">
        {/* Model Selection */}
        <div>
          <label className="text-xs font-semibold text-[#8b8b94] uppercase tracking-wider block mb-2">
            Model Gemini Agent
          </label>
          <div className="space-y-1.5">
            {[
              {
                id: 'gemini-3.8-flash',
                name: 'Gemini 3.8 Flash',
                desc: 'Cepat & responsif untuk editing kode & timeline real-time',
              },
              {
                id: 'gemini-4-argon',
                name: 'Gemini 4 Argon',
                desc: 'Penalaran kompleks untuk arsitektur video & animasi custom',
              },
            ].map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => onUpdateSettings({ model: model.id })}
                className={`tap w-full p-3.5 rounded-2xl text-left flex items-start justify-between transition-all ${
                  settings.model === model.id
                    ? 'active-glow-card shadow-lg'
                    : 'bg-gradient-to-br from-[#18181c] to-[#121215] text-[#8b8b94] hover:from-[#202025]'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-[#f2f2f3] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#e5484d]" />
                    <span>{model.name}</span>
                  </div>
                  <p className="text-[11px] text-[#8b8b94] mt-0.5">{model.desc}</p>
                </div>
                {settings.model === model.id && (
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 mt-1 shrink-0 shadow-xs" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Permission Mode: Tanya dulu vs Otomatis */}
        <div>
          <label className="text-xs font-semibold text-[#8b8b94] uppercase tracking-wider block mb-2">
            Mode Persetujuan Aksi
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdateSettings({ permissionMode: 'ask' })}
              className={`tap p-3.5 rounded-2xl text-left transition-all ${
                settings.permissionMode === 'ask'
                  ? 'active-glow-card shadow-lg'
                  : 'bg-gradient-to-br from-[#18181c] to-[#121215] text-[#8b8b94] hover:from-[#202025]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#7aa7ff] mb-1" />
              <div className="text-xs font-semibold text-[#f2f2f3]">Tanya Dulu</div>
              <p className="text-[10px] text-[#8b8b94] mt-0.5">
                Minta konfirmasi untuk setiap tool call penting (Default).
              </p>
            </button>

            <button
              type="button"
              onClick={() => onUpdateSettings({ permissionMode: 'auto' })}
              className={`tap p-3.5 rounded-2xl text-left transition-all ${
                settings.permissionMode === 'auto'
                  ? 'active-glow-card shadow-lg'
                  : 'bg-gradient-to-br from-[#18181c] to-[#121215] text-[#8b8b94] hover:from-[#202025]'
              }`}
            >
              <Zap className="w-4 h-4 text-[#5fd3b0] mb-1" />
              <div className="text-xs font-semibold text-[#f2f2f3]">Otomatis</div>
              <p className="text-[10px] text-[#8b8b94] mt-0.5">
                Jalankan aksi aman (edit file) secara instan.
              </p>
            </button>
          </div>
        </div>

        {/* Auto-Fix Toggle */}
        <div className="p-3.5 bg-gradient-to-br from-[#18181c] to-[#121215] rounded-2xl flex items-center justify-between shadow-sm">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f2f2f3]">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>Perbaiki Otomatis (Auto-Fix)</span>
            </div>
            <p className="text-[10px] text-[#8b8b94] mt-0.5">
              Jika Remotion error setelah diedit, kirim pesan error ke agent maks 3 kali.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={settings.autoFixErrors}
            onClick={() => onUpdateSettings({ autoFixErrors: !settings.autoFixErrors })}
            className={`tap w-12 h-6 rounded-full transition-all relative shrink-0 ${
              settings.autoFixErrors ? 'bg-gradient-to-r from-red-600 to-rose-600 shadow-md shadow-red-950/50' : 'bg-[#303036]'
            }`}
          >
            <span
              className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 shadow-sm ${
                settings.autoFixErrors ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Quota / Status info */}
        <div className="text-[11px] text-[#76767f] text-center pt-2">
          Agent Client Protocol (ACP) • Koneksi HTTP + SSE
        </div>
      </div>
    </BottomSheet>
  );
};
