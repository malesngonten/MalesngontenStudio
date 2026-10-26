import React, { useState } from 'react';
import { Video, Type, Mic, Music, Plus } from 'lucide-react';
import { LayerType } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';

interface AddLayerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLayer: (type: LayerType, name: string) => void;
}

export const AddLayerSheet: React.FC<AddLayerSheetProps> = ({
  isOpen,
  onClose,
  onAddLayer,
}) => {
  const [selectedType, setSelectedType] = useState<LayerType>('text');
  const [layerName, setLayerName] = useState('');

  const layerOptions: {
    type: LayerType;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      type: 'text',
      title: 'Teks & Motion Graphics',
      description: 'Judul, headline animasi, punchline, statistik bergerak',
      icon: <Type className="w-5 h-5 text-[#b39dff]" />,
      color: 'border-[#b39dff]/40 bg-[#2a2440]/30',
    },
    {
      type: 'video',
      title: 'Klip Video / Background',
      description: 'Latar footage, transisi visual, overlay warna b-roll',
      icon: <Video className="w-5 h-5 text-[#7aa7ff]" />,
      color: 'border-[#7aa7ff]/40 bg-[#1f2a3d]/30',
    },
    {
      type: 'narration',
      title: 'Narasi & Subtitle Suara',
      description: 'Voiceover sinkron, captions dinamis per frasa',
      icon: <Mic className="w-5 h-5 text-[#5fd3b0]" />,
      color: 'border-[#5fd3b0]/40 bg-[#12302a]/30',
    },
    {
      type: 'music',
      title: 'Musik Latar & Sound FX',
      description: 'Beat pengiring, riser, swoosh, efek audio',
      icon: <Music className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-400/40 bg-amber-950/20',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName =
      layerName.trim() ||
      layerOptions.find((o) => o.type === selectedType)?.title.split(' ')[0] ||
      'Layer Baru';
    onAddLayer(selectedType, finalName);
    setLayerName('');
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Layer Timeline Baru"
      subtitle="Pilih tipe track yang ingin ditambahkan ke proyek"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Layer Type Radio Options */}
        <div className="space-y-2">
          {layerOptions.map((opt) => (
            <button
              key={opt.type}
              type="button"
              onClick={() => setSelectedType(opt.type)}
              className={`tap w-full p-3 rounded-2xl border text-left flex items-start gap-3 transition-colors ${
                selectedType === opt.type
                  ? `${opt.color} border-[#e5484d]`
                  : 'bg-[#18181b] border-[#27272c] hover:border-[#303036]'
              }`}
            >
              <div className="p-2 rounded-xl bg-[#222226] shrink-0 mt-0.5">
                {opt.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#f2f2f3]">
                  {opt.title}
                </div>
                <p className="text-[11px] text-[#8b8b94] mt-0.5">
                  {opt.description}
                </p>
              </div>
              {selectedType === opt.type && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#e5484d] shrink-0 mt-1" />
              )}
            </button>
          ))}
        </div>

        {/* Custom Layer Name Input */}
        <div>
          <label className="text-xs font-semibold text-[#8b8b94] uppercase tracking-wider block mb-1.5">
            Nama Layer (Opsional)
          </label>
          <input
            type="text"
            dir="ltr"
            value={layerName}
            onChange={(e) => setLayerName(e.target.value)}
            placeholder="Contoh: Subtitle Utama, Hook Teks, Sound FX"
            className="w-full bg-[#222226] border border-[#303036] rounded-full px-4 py-2 text-xs text-[#f2f2f3] focus:outline-hidden focus:border-[#e5484d] text-left [direction:ltr] select-text"
          />
        </div>

        {/* Action Button */}
        <Button variant="primary" size="md" fullWidth type="submit">
          <Plus className="w-4 h-4 mr-1.5" />
          Tambahkan ke Timeline
        </Button>
      </form>
    </BottomSheet>
  );
};
