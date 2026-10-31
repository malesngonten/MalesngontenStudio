import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Play,
  Type,
  Palette,
  Sparkles,
  Trash2,
  Clock,
  SlidersHorizontal,
  ChevronRight,
  X,
  Film,
  Mic,
  Music,
} from 'lucide-react';
import { TimelineData, TimelineClip, TimelineLayer } from '../../types';
import { Timeline } from './Timeline';
import { PillButton } from '../ui/PillButton';

interface TimelineDetailPanelProps {
  timeline: TimelineData;
  currentFrame: number;
  onSeek: (frame: number) => void;
  selectedClip: TimelineClip | null;
  selectedLayer: TimelineLayer | null;
  onSelectClip: (clip: TimelineClip, layer: TimelineLayer) => void;
  onAddLayerClick: () => void;
  onUpdateClipProps: (layerId: string, clipId: string, updatedProps: any) => void;
  onUpdateClipTiming?: (layerId: string, clipId: string, from: number, duration?: number) => void;
  onDeleteClip: (layerId: string, clipId: string) => void;
}

const getLayerIcon = (type: string) => {
  switch (type) {
    case 'video':
      return <Film className="w-3.5 h-3.5 text-rose-400" />;
    case 'text':
      return <Type className="w-3.5 h-3.5 text-[#b39dff]" />;
    case 'narration':
      return <Mic className="w-3.5 h-3.5 text-[#5fd3b0]" />;
    case 'music':
      return <Music className="w-3.5 h-3.5 text-[#7aa7ff]" />;
    default:
      return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
  }
};

export const TimelineDetailPanel: React.FC<TimelineDetailPanelProps> = ({
  timeline,
  currentFrame,
  onSeek,
  selectedClip,
  selectedLayer,
  onSelectClip,
  onAddLayerClick,
  onUpdateClipProps,
  onUpdateClipTiming,
  onDeleteClip,
}) => {
  const [editingText, setEditingText] = useState(selectedClip?.props?.text || '');
  const [editingFontSize, setEditingFontSize] = useState(selectedClip?.props?.fontSize || 36);

  // Sync state when selectedClip changes
  React.useEffect(() => {
    if (selectedClip) {
      setEditingText(selectedClip.props?.text || selectedClip.name);
      setEditingFontSize(selectedClip.props?.fontSize || 36);
    }
  }, [selectedClip]);

  const handleTextChange = (newText: string) => {
    setEditingText(newText);
    if (selectedLayer && selectedClip) {
      onUpdateClipProps(selectedLayer.id, selectedClip.id, { text: newText });
    }
  };

  const handleFontSizeChange = (size: number) => {
    setEditingFontSize(size);
    if (selectedLayer && selectedClip) {
      onUpdateClipProps(selectedLayer.id, selectedClip.id, { fontSize: size });
    }
  };

  const handleAnimationChange = (anim: 'slide-up' | 'zoom' | 'bounce' | 'fade') => {
    if (selectedLayer && selectedClip) {
      onUpdateClipProps(selectedLayer.id, selectedClip.id, { animation: anim });
    }
  };

  const handleColorChange = (color: string) => {
    if (selectedLayer && selectedClip) {
      onUpdateClipProps(selectedLayer.id, selectedClip.id, { color });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0e0e10] overflow-y-auto select-none safe-pb">
      {/* 1. Main Timeline Tracks */}
      <Timeline
        timeline={timeline}
        currentFrame={currentFrame}
        onSeek={onSeek}
        selectedClipId={selectedClip?.id || null}
        onSelectClip={onSelectClip}
        onUpdateClipTiming={onUpdateClipTiming}
      />

      {/* 2. Timeline Quick Bar: Add Layer & Track Summary (Tanpa border, gradasi lembut) */}
      <div className="px-3 py-2 bg-gradient-to-r from-[#141419] via-[#101014] to-[#0e0e12] flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-[#8b8b94]">
          <Layers className="w-3.5 h-3.5 text-[#e5484d]" />
          <span>{timeline.layers.length} Track Aktif</span>
          <span>•</span>
          <span className="font-mono text-[#f2f2f3]">
            {timeline.layers.reduce((sum, l) => sum + l.clips.length, 0)} Klip
          </span>
        </div>

        <PillButton
          variant="red"
          size="xs"
          onClick={onAddLayerClick}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Track</span>
        </PillButton>
      </div>

      {/* 3. Clip Inspector Panel (When a clip is selected) */}
      <div className="p-3 space-y-3">
        {selectedClip && selectedLayer ? (
          <div className="active-glow-card rounded-3xl p-4 space-y-3.5 shadow-2xl animate-in fade-in">
            {/* Inspector Header */}
            <div className="flex items-center justify-between pb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-white/[0.08] flex items-center justify-center">
                    {getLayerIcon(selectedLayer.type)}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/[0.08] text-[#f2f2f3]">
                    {selectedLayer.name}
                  </span>
                  <span className="text-xs font-semibold text-[#f2f2f3] truncate">
                    {selectedClip.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#8b8b94] font-mono mt-0.5 pl-0.5">
                  <span>Frame {selectedClip.from} - {selectedClip.from + selectedClip.duration}</span>
                  <span>•</span>
                  <span>{((selectedClip.duration) / timeline.fps).toFixed(1)}s</span>
                </div>
              </div>

              <button
                type="button"
                aria-label="Hapus klip ini"
                onClick={() => onDeleteClip(selectedLayer.id, selectedClip.id)}
                className="tap w-8 h-8 rounded-full flex items-center justify-center text-[#76767f] hover:text-red-400 hover:bg-white/[0.08] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Properties Editor based on clip type */}
            {selectedLayer.type === 'text' && (
              <div className="space-y-2.5">
                {/* Text Content */}
                <div>
                  <label className="text-[10px] font-semibold text-[#8b8b94] uppercase tracking-wider block mb-1">
                    Isi Teks Video
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={editingText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="w-full bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-full px-3.5 py-2 text-xs text-[#f2f2f3] focus:outline-hidden focus:ring-1 focus:ring-[#e5484d] text-left [direction:ltr] select-text shadow-inner"
                    placeholder="Ketik teks yang ingin dimunculkan..."
                  />
                </div>

                {/* Font Size & Animation */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-[#8b8b94] uppercase tracking-wider block mb-1">
                      Ukuran ({editingFontSize}px)
                    </label>
                    <input
                      type="range"
                      min={18}
                      max={72}
                      value={editingFontSize}
                      onChange={(e) => handleFontSizeChange(parseInt(e.target.value, 10))}
                      className="w-full accent-[#e5484d] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-[#8b8b94] uppercase tracking-wider block mb-1">
                      Animasi
                    </label>
                    <select
                      value={selectedClip.props?.animation || 'slide-up'}
                      onChange={(e) => handleAnimationChange(e.target.value as any)}
                      className="w-full bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-full px-3 py-1.5 text-xs text-[#f2f2f3] focus:outline-hidden"
                    >
                      <option value="slide-up">Slide Up</option>
                      <option value="zoom">Zoom</option>
                      <option value="bounce">Bounce</option>
                      <option value="fade">Fade</option>
                    </select>
                  </div>
                </div>

                {/* Color presets */}
                <div>
                  <label className="text-[10px] font-semibold text-[#8b8b94] uppercase tracking-wider block mb-1">
                    Warna Teks
                  </label>
                  <div className="flex items-center gap-2">
                    {[
                      { color: '#ffffff', label: 'Putih' },
                      { color: '#e5484d', label: 'Merah' },
                      { color: '#5fd3b0', label: 'Hijau' },
                      { color: '#7aa7ff', label: 'Biru' },
                      { color: '#f59e0b', label: 'Kuning' },
                    ].map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => handleColorChange(c.color)}
                        style={{ backgroundColor: c.color }}
                        className={`w-6 h-6 rounded-full border-2 transition-transform active:scale-90 ${
                          (selectedClip.props?.color || '#ffffff') === c.color
                            ? 'border-white scale-110 shadow-md'
                            : 'border-transparent'
                        }`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedLayer.type === 'video' && (
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-[#8b8b94] uppercase tracking-wider block">
                  Latar Belakang / Gradien
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      id: 'g1',
                      name: 'Cyber Dark',
                      val: 'radial-gradient(circle at 50% 40%, #1f1b2e 0%, #0d0c14 100%)',
                    },
                    {
                      id: 'g2',
                      name: 'Neon Crimson',
                      val: 'radial-gradient(circle at 50% 50%, #3b1419 0%, #0a0a0b 100%)',
                    },
                    {
                      id: 'g3',
                      name: 'Emerald Night',
                      val: 'radial-gradient(circle at 50% 40%, #112d25 0%, #081210 100%)',
                    },
                    {
                      id: 'g4',
                      name: 'Deep Navy',
                      val: 'radial-gradient(circle at 50% 40%, #12213d 0%, #090e1a 100%)',
                    },
                  ].map((grad) => (
                    <button
                      key={grad.id}
                      type="button"
                      onClick={() =>
                        onUpdateClipProps(selectedLayer.id, selectedClip.id, {
                          backgroundColor: grad.val,
                        })
                      }
                      style={{ background: grad.val }}
                      className="tap p-2.5 rounded-full text-center text-xs font-semibold text-white shadow-sm hover:scale-[1.02] transition-transform"
                    >
                      {grad.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedLayer.type === 'music' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#8b8b94]">
                  <span>Volume Audio</span>
                  <span className="font-mono text-[#f2f2f3]">
                    {Math.round((selectedClip.props?.volume ?? 0.8) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round((selectedClip.props?.volume ?? 0.8) * 100)}
                  onChange={(e) =>
                    onUpdateClipProps(selectedLayer.id, selectedClip.id, {
                      volume: parseInt(e.target.value, 10) / 100,
                    })
                  }
                  className="w-full accent-[#7aa7ff] cursor-pointer"
                />
              </div>
            )}

            {selectedLayer.type === 'narration' && (
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-[#8b8b94] uppercase tracking-wider block">
                  Teks Subtitle Narasi
                </label>
                <textarea
                  rows={2}
                  value={selectedClip.props?.text || ''}
                  onChange={(e) =>
                    onUpdateClipProps(selectedLayer.id, selectedClip.id, {
                      text: e.target.value,
                    })
                  }
                  className="w-full bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl px-3.5 py-2 text-xs text-[#f2f2f3] focus:outline-hidden focus:ring-1 focus:ring-[#5fd3b0] resize-none shadow-inner"
                  placeholder="Ketik teks narasi..."
                />
              </div>
            )}

            {/* Universal Timing & Duration Controls for Selected Clip */}
            <div className="pt-2 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#8b8b94] uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#e5484d]" />
                  <span>Pengaturan Timing & Posisi</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateClipTiming && selectedLayer && selectedClip) {
                      onUpdateClipTiming(selectedLayer.id, selectedClip.id, currentFrame, selectedClip.duration);
                    }
                  }}
                  className="tap text-[10px] text-[#e5484d] hover:text-[#f87171] font-medium bg-gradient-to-r from-[#e5484d]/20 to-[#e5484d]/10 px-3 py-1 rounded-full shadow-xs"
                  title="Pindahkan titik mulai klip ini ke posisi playhead saat ini"
                >
                  Tempel ke Playhead ({((currentFrame) / timeline.fps).toFixed(1)}s)
                </button>
              </div>

              {/* Start Time Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#8b8b94]">Mulai Muncul</span>
                  <span className="font-mono text-[#f2f2f3]">
                    {((selectedClip.from) / timeline.fps).toFixed(2)}s ({selectedClip.from} frame)
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, timeline.durationInFrames - 5)}
                  value={selectedClip.from}
                  onChange={(e) => {
                    if (onUpdateClipTiming && selectedLayer) {
                      onUpdateClipTiming(selectedLayer.id, selectedClip.id, parseInt(e.target.value, 10), selectedClip.duration);
                    }
                  }}
                  className="w-full accent-[#e5484d] cursor-pointer"
                />
              </div>

              {/* Duration Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#8b8b94]">Durasi Tayang</span>
                  <span className="font-mono text-[#f2f2f3]">
                    {((selectedClip.duration) / timeline.fps).toFixed(2)}s ({selectedClip.duration} frame)
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={timeline.durationInFrames}
                  value={selectedClip.duration}
                  onChange={(e) => {
                    if (onUpdateClipTiming && selectedLayer) {
                      onUpdateClipTiming(selectedLayer.id, selectedClip.id, selectedClip.from, parseInt(e.target.value, 10));
                    }
                  }}
                  className="w-full accent-[#5fd3b0] cursor-pointer"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-b from-[#18181c]/70 to-[#121215]/70 rounded-3xl p-5 text-center select-none shadow-md">
            <SlidersHorizontal className="w-5 h-5 text-[#8b8b94] mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-[#f2f2f3]">Pilih Klip di Timeline</p>
            <p className="text-[11px] text-[#8b8b94] mt-0.5">
              Ketuk salah satu blok klip di atas untuk mengedit teks, animasi, warna, atau volume.
            </p>
          </div>
        )}

        {/* Quick Tips (Subtle gradient, zero borders) */}
        <div className="p-3.5 bg-gradient-to-b from-[#18181c] to-[#121215] rounded-3xl text-[11px] text-[#8b8b94] space-y-1 leading-relaxed shadow-sm">
          <p className="font-semibold text-[#f2f2f3]">💡 Tips Timeline:</p>
          <p>• Geser jari di track timeline untuk memutar video ke titik tertentu (scrubbing).</p>
          <p>• Perubahan klip tersimpan otomatis dan langsung diperbarui di player atas.</p>
        </div>
      </div>
    </div>
  );
};
