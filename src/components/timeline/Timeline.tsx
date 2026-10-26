import React, { useRef, useState, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Layers,
  Film,
  Type,
  Mic,
  Music,
  Clock,
  Sparkles,
  MoveHorizontal,
  GripVertical,
} from 'lucide-react';
import { TimelineData, TimelineClip, TimelineLayer } from '../../types';

interface TimelineProps {
  timeline: TimelineData;
  currentFrame: number;
  onSeek: (frame: number) => void;
  selectedClipId: string | null;
  onSelectClip: (clip: TimelineClip, layer: TimelineLayer) => void;
  onUpdateClipTiming?: (layerId: string, clipId: string, from: number, duration?: number) => void;
}

// Layer visual styling metadata
const getLayerMeta = (type: string, index: number) => {
  switch (type) {
    case 'video':
      return {
        icon: Film,
        shortBadge: `V${index + 1}`,
        label: 'Video',
        color: 'text-rose-400',
        headerBg: 'bg-rose-500/10 border-rose-500/30',
        clipBg: 'bg-gradient-to-r from-[#2f181c]/90 to-[#241316]/90 border border-rose-500/40 text-rose-100',
        clipSelectedBg: 'bg-gradient-to-r from-[#442027] to-[#36181e] border-2 border-white ring-2 ring-rose-500/60 shadow-lg shadow-black/80 text-white',
        accentBar: 'bg-rose-500',
      };
    case 'text':
      return {
        icon: Type,
        shortBadge: `T${index + 1}`,
        label: 'Teks',
        color: 'text-[#b39dff]',
        headerBg: 'bg-[#2a2440]/60 border-[#b39dff]/30',
        clipBg: 'bg-gradient-to-r from-[#251e3b]/90 to-[#1d172e]/90 border border-[#b39dff]/40 text-[#e6e0ff]',
        clipSelectedBg: 'bg-gradient-to-r from-[#392c5c] to-[#2d224b] border-2 border-white ring-2 ring-[#b39dff]/60 shadow-lg shadow-black/80 text-white',
        accentBar: 'bg-[#b39dff]',
      };
    case 'narration':
      return {
        icon: Mic,
        shortBadge: `VO`,
        label: 'Narasi',
        color: 'text-[#5fd3b0]',
        headerBg: 'bg-[#12302a]/60 border-[#5fd3b0]/30',
        clipBg: 'bg-gradient-to-r from-[#122822]/90 to-[#0c1c18]/90 border border-[#5fd3b0]/40 text-[#d4f8ee]',
        clipSelectedBg: 'bg-gradient-to-r from-[#1b4339] to-[#14322a] border-2 border-white ring-2 ring-[#5fd3b0]/60 shadow-lg shadow-black/80 text-white',
        accentBar: 'bg-[#5fd3b0]',
      };
    case 'music':
      return {
        icon: Music,
        shortBadge: `A${index + 1}`,
        label: 'Musik',
        color: 'text-[#7aa7ff]',
        headerBg: 'bg-[#1c2a44]/60 border-[#7aa7ff]/30',
        clipBg: 'bg-gradient-to-r from-[#18233a]/90 to-[#111929]/90 border border-[#7aa7ff]/40 text-[#dbe7ff]',
        clipSelectedBg: 'bg-gradient-to-r from-[#25395e] to-[#1c2b48] border-2 border-white ring-2 ring-[#7aa7ff]/60 shadow-lg shadow-black/80 text-white',
        accentBar: 'bg-[#7aa7ff]',
      };
    default:
      return {
        icon: Sparkles,
        shortBadge: `FX`,
        label: 'Layer',
        color: 'text-amber-400',
        headerBg: 'bg-amber-500/10 border-amber-500/30',
        clipBg: 'bg-gradient-to-r from-[#2a2416]/90 to-[#1e1910]/90 border border-amber-500/40 text-amber-100',
        clipSelectedBg: 'bg-gradient-to-r from-[#42371e] to-[#302714] border-2 border-white ring-2 ring-amber-400/60 shadow-lg shadow-black/80 text-white',
        accentBar: 'bg-amber-400',
      };
  }
};

export const Timeline: React.FC<TimelineProps> = ({
  timeline,
  currentFrame,
  onSeek,
  selectedClipId,
  onSelectClip,
  onUpdateClipTiming,
}) => {
  const tracksRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isScrubbingPlayhead, setIsScrubbingPlayhead] = useState(false);

  // Dragging state for clips
  const [activeClipDrag, setActiveClipDrag] = useState<{
    layerId: string;
    clipId: string;
    from: number;
    duration: number;
    mode: 'move' | 'trim-start' | 'trim-end';
  } | null>(null);

  const totalFrames = Math.max(1, timeline.durationInFrames);
  const totalSeconds = totalFrames / timeline.fps;

  // Playhead percentage position
  const playheadPercent = Math.min(100, Math.max(0, (currentFrame / totalFrames) * 100));

  // --- PLAYHEAD SCRUBBING LOGIC ---
  const handleSeekFromClientX = useCallback(
    (clientX: number) => {
      if (!tracksRef.current) return;
      const rect = tracksRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const ratio = Math.min(1, Math.max(0, clickX / rect.width));
      const targetFrame = Math.round(ratio * totalFrames);
      onSeek(Math.min(totalFrames, Math.max(0, targetFrame)));
    },
    [totalFrames, onSeek]
  );

  const handlePlayheadPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    setIsScrubbingPlayhead(true);
    handleSeekFromClientX(e.clientX);

    const onPointerMove = (ev: PointerEvent) => {
      handleSeekFromClientX(ev.clientX);
    };

    const onPointerUp = () => {
      setIsScrubbingPlayhead(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleRulerPointerDown = (e: React.PointerEvent) => {
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    setIsScrubbingPlayhead(true);
    handleSeekFromClientX(e.clientX);

    const onPointerMove = (ev: PointerEvent) => {
      handleSeekFromClientX(ev.clientX);
    };

    const onPointerUp = () => {
      setIsScrubbingPlayhead(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleTrackLanePointerDown = (e: React.PointerEvent) => {
    // Only seek if clicking empty space in the lane (not on a clip)
    if ((e.target as HTMLElement).closest('.timeline-clip-card')) return;
    handleSeekFromClientX(e.clientX);
  };

  // --- CLIP DRAGGING LOGIC (MOVE & TRIM) ---
  const handleClipPointerDown = (
    e: React.PointerEvent,
    layer: TimelineLayer,
    clip: TimelineClip,
    mode: 'move' | 'trim-start' | 'trim-end'
  ) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const initialFrom = clip.from;
    const initialDuration = clip.duration;
    let didMove = false;

    // Initial drag state
    let currentFrom = initialFrom;
    let currentDuration = initialDuration;

    const onPointerMove = (moveEv: PointerEvent) => {
      if (!tracksRef.current) return;
      const deltaX = moveEv.clientX - startX;
      if (Math.abs(deltaX) > 3) {
        didMove = true;
      }
      if (!didMove) return;

      const rect = tracksRef.current.getBoundingClientRect();
      const deltaFrames = Math.round((deltaX / rect.width) * totalFrames);

      if (mode === 'move') {
        // Shift timing freely (allows overlapping with other clips)
        const maxStart = Math.max(0, totalFrames - 5);
        currentFrom = Math.max(0, Math.min(maxStart, initialFrom + deltaFrames));
        currentDuration = initialDuration;
      } else if (mode === 'trim-start') {
        // Trim left handle
        const rawNewFrom = initialFrom + deltaFrames;
        const clampedFrom = Math.max(0, Math.min(initialFrom + initialDuration - 5, rawNewFrom));
        const diff = clampedFrom - initialFrom;
        currentFrom = clampedFrom;
        currentDuration = Math.max(5, initialDuration - diff);
      } else if (mode === 'trim-end') {
        // Trim right handle
        const rawDuration = initialDuration + deltaFrames;
        const maxDuration = totalFrames - initialFrom;
        currentDuration = Math.max(5, Math.min(maxDuration, rawDuration));
        currentFrom = initialFrom;
      }

      setActiveClipDrag({
        layerId: layer.id,
        clipId: clip.id,
        from: currentFrom,
        duration: currentDuration,
        mode,
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      if (didMove && onUpdateClipTiming) {
        onUpdateClipTiming(layer.id, clip.id, currentFrom, currentDuration);
      }
      // Always select the clip when touched
      onSelectClip(
        {
          ...clip,
          from: currentFrom,
          duration: currentDuration,
        },
        layer
      );

      setActiveClipDrag(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Generate 5-6 interval second markers for the time ruler
  const rulerTicks = [];
  const stepSec = totalSeconds <= 6 ? 1 : totalSeconds <= 15 ? 2 : 5;
  for (let sec = 0; sec <= totalSeconds; sec += stepSec) {
    const pct = (sec / totalSeconds) * 100;
    rulerTicks.push({ sec, pct });
  }

  return (
    <div className="w-full bg-[#121214] px-3 py-2.5 border-b border-[#27272c] select-none shrink-0">
      {/* 1. Header Bar with Track Counter & View Mode Toggle */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1f1f23] text-xs text-[#8b8b94]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#e5484d]/10 border border-[#e5484d]/30 flex items-center justify-center">
            <Layers className="w-3 h-3 text-[#e5484d]" />
          </div>
          <span className="font-bold text-[#f2f2f3] tracking-wider text-[11px]">TIMELINE TRACKS</span>
          <span className="text-[10px] bg-[#1c1c20] border border-[#27272c] px-2 py-0.5 rounded-full font-mono text-[#a1a1aa]">
            {timeline.layers.length} Track • {(totalFrames / timeline.fps).toFixed(1)}s
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#71717a] hidden sm:inline">
            💡 Geser klip untuk atur timing
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="tap flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1c1c20] hover:bg-[#27272c] border border-[#27272c] text-[11px] font-medium text-[#d4d4d8] transition-colors"
            title={isExpanded ? 'Ganti ke tampilan ringkas' : 'Tampilkan semua layer'}
          >
            <span>{isExpanded ? 'Semua Track' : 'Ringkas'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#8b8b94]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#8b8b94]" />}
          </button>
        </div>
      </div>

      {/* 2. Timeline Grid: Left Track Icons + Right Track Lanes & Ruler */}
      <div className="flex gap-2">
        {/* Left Column: Mobile Track Headers with Icons */}
        <div className="w-[46px] shrink-0 flex flex-col gap-2">
          {/* Top spacer matching time ruler */}
          <div className="h-[24px] flex items-center justify-center text-[10px] text-[#71717a] font-mono">
            <Clock className="w-3.5 h-3.5 text-[#8b8b94]" />
          </div>

          {isExpanded ? (
            timeline.layers.map((layer, index) => {
              const meta = getLayerMeta(layer.type, index);
              const IconComponent = meta.icon;
              const hasSelectedClip = layer.clips.some((c) => c.id === selectedClipId);

              return (
                <div
                  key={layer.id}
                  className={`h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all border shadow-xs ${
                    hasSelectedClip
                      ? `${meta.headerBg} ring-1 ${meta.accentBar.replace('bg-', 'ring-')}`
                      : 'bg-[#18181b] border-[#27272c]'
                  }`}
                  title={`${layer.name} (${meta.label}) - Ketuk klip di kanan untuk geser timing`}
                >
                  <IconComponent className={`w-4 h-4 ${meta.color}`} />
                  <span className="text-[9px] font-bold font-mono tracking-tight text-[#a1a1aa] leading-none">
                    {meta.shortBadge}
                  </span>
                </div>
              );
            })
          ) : (
            <div
              className="h-[36px] rounded-xl bg-[#18181b] border border-[#27272c] flex flex-col items-center justify-center gap-0.5"
              title="Semua Track Terpadu"
            >
              <Layers className="w-3.5 h-3.5 text-[#e5484d]" />
              <span className="text-[8px] font-bold font-mono text-[#e5484d] leading-none">ALL</span>
            </div>
          )}
        </div>

        {/* Right Column: Time Ruler, Track Lanes, Playhead */}
        <div
          ref={tracksRef}
          className="relative flex-1 flex flex-col gap-2 select-none touch-none"
        >
          {/* A. Time Ruler Bar (Interactive Scrubbing) */}
          <div
            onPointerDown={handleRulerPointerDown}
            className="relative h-[24px] bg-[#161619] rounded-lg border border-[#27272c] overflow-hidden cursor-ew-resize hover:border-[#3f3f46] transition-colors"
            title="Klik atau geser di sini untuk memutar video ke titik waktu tertentu"
          >
            {rulerTicks.map(({ sec, pct }) => (
              <div
                key={sec}
                className="absolute top-0 bottom-0 flex flex-col items-center -translate-x-1/2 pointer-events-none"
                style={{ left: `${pct}%` }}
              >
                <span className="text-[8px] font-mono font-medium text-[#71717a] leading-none pt-1">
                  {sec}s
                </span>
                <div className="w-[1px] h-2 bg-[#2d2d34] mt-auto" />
              </div>
            ))}
          </div>

          {/* B. Track Lanes */}
          {isExpanded ? (
            timeline.layers.map((layer, index) => {
              const meta = getLayerMeta(layer.type, index);
              const IconComponent = meta.icon;

              return (
                <div
                  key={layer.id}
                  onPointerDown={handleTrackLanePointerDown}
                  className="relative h-[48px] bg-[#17171a] rounded-xl border border-[#242429] overflow-hidden cursor-crosshair"
                >
                  {/* Subtle track lane grid pattern */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                  {/* Clips inside this layer (Supports free placement & overlapping!) */}
                  {layer.clips.map((clip) => {
                    const isDraggingThis =
                      activeClipDrag?.layerId === layer.id && activeClipDrag?.clipId === clip.id;
                    const clipFrom = isDraggingThis ? activeClipDrag.from : clip.from;
                    const clipDuration = isDraggingThis ? activeClipDrag.duration : clip.duration;

                    const leftPercent = Math.min(100, Math.max(0, (clipFrom / totalFrames) * 100));
                    const widthPercent = Math.min(
                      100 - leftPercent,
                      Math.max(2.5, (clipDuration / totalFrames) * 100)
                    );
                    const isSelected = clip.id === selectedClipId;
                    const clipSec = (clipDuration / timeline.fps).toFixed(1);
                    const startSec = (clipFrom / timeline.fps).toFixed(2);

                    return (
                      <div
                        key={clip.id}
                        onPointerDown={(e) => handleClipPointerDown(e, layer, clip, 'move')}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                        className={`timeline-clip-card absolute top-[4px] bottom-[4px] rounded-lg flex items-center justify-between gap-1 transition-all touch-none cursor-grab active:cursor-grabbing select-none backdrop-blur-xs ${
                          isDraggingThis
                            ? 'z-30 ring-2 ring-white scale-[1.02] shadow-2xl opacity-95'
                            : isSelected
                            ? 'z-20'
                            : 'z-10 hover:z-20 hover:brightness-110'
                        } ${isSelected ? meta.clipSelectedBg : meta.clipBg}`}
                        title={`${clip.name} (Mulai: ${startSec}s, Durasi: ${clipSec}s) - Tahan & geser untuk atur timing`}
                      >
                        {/* Trim handle LEFT (for trimming start timing) */}
                        <div
                          onPointerDown={(e) => handleClipPointerDown(e, layer, clip, 'trim-start')}
                          className="w-3.5 h-full flex items-center justify-center cursor-ew-resize hover:bg-white/30 rounded-l-md transition-colors shrink-0 z-20 group"
                          title="Geser tepi kiri untuk memotong awal klip"
                        >
                          <div className={`w-[2px] h-3.5 rounded-full transition-colors ${isSelected ? 'bg-white' : 'bg-white/40 group-hover:bg-white'}`} />
                        </div>

                        {/* Audio waveform visualization for narration & music */}
                        {(layer.type === 'narration' || layer.type === 'music') && (
                          <div className="absolute inset-0 opacity-20 flex items-center justify-around pointer-events-none px-3 overflow-hidden gap-[2px]">
                            {[30, 65, 25, 80, 50, 95, 40, 70, 50, 85, 30, 60, 75, 45, 60, 80, 35, 70, 55, 90, 25, 65, 85, 45, 70, 35, 90, 60].map((h, i) => (
                              <div
                                key={i}
                                className={`w-[2px] rounded-full shrink-0 ${layer.type === 'narration' ? 'bg-[#5fd3b0]' : 'bg-[#7aa7ff]'}`}
                                style={{ height: `${h}%` }}
                              />
                            ))}
                          </div>
                        )}

                        {/* Video filmstrip decoration */}
                        {layer.type === 'video' && (
                          <div className="absolute top-0 left-0 right-0 h-1 flex justify-between px-2 opacity-25 pointer-events-none">
                            {Array.from({ length: 8 }).map((_, i) => (
                              <div key={i} className="w-1.5 h-1 bg-white rounded-xs" />
                            ))}
                          </div>
                        )}

                        {/* Clip content: Icon + Title */}
                        <div className="flex items-center gap-1.5 min-w-0 pointer-events-none flex-1 truncate py-0.5">
                          <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : meta.color}`} />
                          <span className="text-[11px] font-bold truncate leading-tight">
                            {clip.name}
                          </span>
                        </div>

                        {/* Duration pill */}
                        <div className="shrink-0 pointer-events-none pr-0.5">
                          <span
                            className={`text-[9px] font-mono px-1 py-0.5 rounded-md font-semibold ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-black/40 text-[#d4d4d8]'
                            }`}
                          >
                            {clipSec}s
                          </span>
                        </div>

                        {/* Trim handle RIGHT (for trimming duration) */}
                        <div
                          onPointerDown={(e) => handleClipPointerDown(e, layer, clip, 'trim-end')}
                          className="w-3.5 h-full flex items-center justify-center cursor-ew-resize hover:bg-white/30 rounded-r-md transition-colors shrink-0 z-20 group"
                          title="Geser tepi kanan untuk mengubah durasi klip"
                        >
                          <div className={`w-[2px] h-3.5 rounded-full transition-colors ${isSelected ? 'bg-white' : 'bg-white/40 group-hover:bg-white'}`} />
                        </div>

                        {/* Live Floating Tooltip when this clip is actively being dragged */}
                        {isDraggingThis && (
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#18181b] text-white border border-white/40 shadow-xl px-2 py-0.5 rounded-md text-[10px] font-mono font-bold whitespace-nowrap pointer-events-none z-50">
                            {startSec}s ({clipFrom}f) • Dur: {clipSec}s
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          ) : (
            // Compact single master lane view (36px high)
            <div
              onPointerDown={handleTrackLanePointerDown}
              className="relative h-[36px] bg-[#17171a] rounded-xl border border-[#27272c] overflow-hidden cursor-crosshair"
            >
              {timeline.layers.flatMap((l, lIdx) =>
                l.clips.map((clip) => {
                  const leftPercent = Math.min(100, Math.max(0, (clip.from / totalFrames) * 100));
                  const widthPercent = Math.min(100 - leftPercent, Math.max(1.5, (clip.duration / totalFrames) * 100));
                  const meta = getLayerMeta(l.type, lIdx);
                  const isSelected = clip.id === selectedClipId;

                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClip(clip, l);
                      }}
                      style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                      className={`absolute top-[4px] bottom-[4px] rounded-md px-1.5 flex items-center text-[9px] font-bold truncate transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 border-white ring-2 ring-white/50 z-20 text-white ' + meta.accentBar
                          : 'opacity-80 text-white ' + meta.accentBar
                      }`}
                      title={`${clip.name} (${l.name})`}
                    >
                      <span className="truncate">{clip.name}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* C. Playhead Needle & Vertical Scrub Line */}
          <div
            className={`absolute top-0 bottom-0 z-40 -translate-x-1/2 pointer-events-none ${
              isScrubbingPlayhead ? 'transition-none' : 'transition-transform duration-75'
            }`}
            style={{ left: `${playheadPercent}%` }}
          >
            {/* Interactive needle handle top */}
            <div
              onPointerDown={handlePlayheadPointerDown}
              className="pointer-events-auto cursor-ew-resize touch-none flex flex-col items-center group -mt-1 active:scale-110 transition-transform"
              title="Tahan & geser penanda tracking ini untuk memutar video"
            >
              {/* Tooltip during active scrub */}
              {isScrubbingPlayhead && (
                <div className="absolute -top-7 bg-[#e5484d] text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap pointer-events-none">
                  {((currentFrame) / timeline.fps).toFixed(2)}s (F{currentFrame})
                </div>
              )}

              {/* Needle Head Button */}
              <div className="w-6 h-5.5 bg-white rounded-t-xs rounded-b-md shadow-lg shadow-black/80 flex items-center justify-center border border-white/40">
                <div className="w-1.5 h-1.5 bg-[#e5484d] rounded-full" />
              </div>

              {/* Vertical scrub line spanning through all tracks */}
              <div className="w-[2px] h-[320px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
