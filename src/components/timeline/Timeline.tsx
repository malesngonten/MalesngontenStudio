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

// Layer visual styling metadata - Clear gradients, capsule cards, zero borders
const getLayerMeta = (type: string, index: number) => {
  switch (type) {
    case 'video':
      return {
        icon: Film,
        shortBadge: `V${index + 1}`,
        label: 'Video',
        color: 'text-rose-200',
        headerBg: 'bg-gradient-to-r from-rose-900/70 via-red-900/60 to-rose-950/70 text-rose-100 shadow-sm',
        clipBg: 'bg-gradient-to-r from-rose-600/85 via-rose-500/75 to-pink-600/85 text-white shadow-md shadow-rose-950/50',
        clipSelectedBg: 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white shadow-xl shadow-rose-950/80 ring-2 ring-white/90',
        accentBar: 'bg-gradient-to-r from-rose-500 to-pink-500',
      };
    case 'text':
      return {
        icon: Type,
        shortBadge: `T${index + 1}`,
        label: 'Teks',
        color: 'text-purple-200',
        headerBg: 'bg-gradient-to-r from-purple-900/70 via-violet-900/60 to-indigo-950/70 text-purple-100 shadow-sm',
        clipBg: 'bg-gradient-to-r from-purple-600/85 via-violet-500/75 to-indigo-600/85 text-white shadow-md shadow-purple-950/50',
        clipSelectedBg: 'bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-600 text-white shadow-xl shadow-purple-950/80 ring-2 ring-white/90',
        accentBar: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      };
    case 'narration':
      return {
        icon: Mic,
        shortBadge: `VO`,
        label: 'Narasi',
        color: 'text-emerald-200',
        headerBg: 'bg-gradient-to-r from-emerald-900/70 via-teal-900/60 to-green-950/70 text-emerald-100 shadow-sm',
        clipBg: 'bg-gradient-to-r from-emerald-600/85 via-teal-500/75 to-green-600/85 text-white shadow-md shadow-emerald-950/50',
        clipSelectedBg: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 text-white shadow-xl shadow-emerald-950/80 ring-2 ring-white/90',
        accentBar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      };
    case 'music':
      return {
        icon: Music,
        shortBadge: `A${index + 1}`,
        label: 'Musik',
        color: 'text-sky-200',
        headerBg: 'bg-gradient-to-r from-sky-900/70 via-blue-900/60 to-cyan-950/70 text-sky-100 shadow-sm',
        clipBg: 'bg-gradient-to-r from-sky-600/85 via-blue-500/75 to-cyan-600/85 text-white shadow-md shadow-sky-950/50',
        clipSelectedBg: 'bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-600 text-white shadow-xl shadow-sky-950/80 ring-2 ring-white/90',
        accentBar: 'bg-gradient-to-r from-sky-500 to-cyan-500',
      };
    default:
      return {
        icon: Sparkles,
        shortBadge: `FX`,
        label: 'Layer',
        color: 'text-amber-200',
        headerBg: 'bg-gradient-to-r from-amber-900/70 via-orange-900/60 to-yellow-950/70 text-amber-100 shadow-sm',
        clipBg: 'bg-gradient-to-r from-amber-600/85 via-orange-500/75 to-yellow-600/85 text-white shadow-md shadow-amber-950/50',
        clipSelectedBg: 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-600 text-white shadow-xl shadow-amber-950/80 ring-2 ring-white/90',
        accentBar: 'bg-gradient-to-r from-amber-500 to-orange-500',
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
    <div className="w-full bg-gradient-to-b from-[#131318] via-[#0e0e12] to-[#0a0a0c] px-3 py-2.5 select-none shrink-0 shadow-lg">
      {/* 1. Header Bar with Track Counter & View Mode Toggle (Kapsul & Gradasi) */}
      <div className="flex items-center justify-between pb-2 mb-2 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-red-600/30 to-rose-600/20 flex items-center justify-center shadow-xs">
            <Layers className="w-3 h-3 text-red-400" />
          </div>
          <span className="font-bold text-zinc-200 tracking-wider text-[11px]">TIMELINE</span>
          <span className="text-[10px] bg-gradient-to-r from-zinc-800/90 to-zinc-900/90 px-2.5 py-0.5 rounded-full font-mono text-zinc-300 shadow-xs">
            {timeline.layers.length} Track • {(totalFrames / timeline.fps).toFixed(1)}s
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-500 hidden sm:inline">
            Geser klip untuk atur timing
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="tap flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-zinc-800/90 to-zinc-900/90 hover:from-zinc-700/90 hover:to-zinc-800/90 text-[11px] font-medium text-zinc-200 shadow-sm transition-all"
            title={isExpanded ? 'Ganti ke tampilan ringkas' : 'Tampilkan semua layer'}
          >
            <span>{isExpanded ? 'Semua Track' : 'Ringkas'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
          </button>
        </div>
      </div>

      {/* 2. Timeline Grid: Left Track Icons + Right Track Lanes & Ruler */}
      <div className="flex gap-2">
        {/* Left Column: Track Headers with Icons (Kapsul Bulat) */}
        <div className="w-[38px] shrink-0 flex flex-col gap-1.5">
          {/* Top spacer matching time ruler */}
          <div className="h-[22px] flex items-center justify-center text-[10px] text-zinc-500 font-mono">
            <Clock className="w-3 h-3 text-zinc-500" />
          </div>

          {isExpanded ? (
            timeline.layers.map((layer, index) => {
              const meta = getLayerMeta(layer.type, index);
              const IconComponent = meta.icon;
              const hasSelectedClip = layer.clips.some((c) => c.id === selectedClipId);

              return (
                <div
                  key={layer.id}
                  className={`h-[38px] w-[38px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-all shadow-sm ${
                    hasSelectedClip
                      ? `${meta.headerBg} ring-2 ring-white/60`
                      : 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 hover:from-zinc-700/80'
                  }`}
                  title={`${layer.name} (${meta.label})`}
                >
                  <IconComponent className={`w-3.5 h-3.5 ${meta.color}`} />
                  <span className="text-[8px] font-bold font-mono tracking-tight text-zinc-300 leading-none">
                    {meta.shortBadge}
                  </span>
                </div>
              );
            })
          ) : (
            <div
              className="h-[32px] w-[38px] rounded-full bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 flex flex-col items-center justify-center gap-0.5 shadow-sm"
              title="Semua Track Terpadu"
            >
              <Layers className="w-3 h-3 text-red-400" />
              <span className="text-[7px] font-bold font-mono text-red-400 leading-none">ALL</span>
            </div>
          )}
        </div>

        {/* Right Column: Time Ruler, Track Lanes, Playhead */}
        <div
          ref={tracksRef}
          className="relative flex-1 flex flex-col gap-1.5 select-none touch-none"
        >
          {/* A. Time Ruler Bar (Interactive Scrubbing, Kapsul) */}
          <div
            onPointerDown={handleRulerPointerDown}
            className="relative h-[22px] bg-gradient-to-r from-zinc-900/90 via-zinc-800/80 to-zinc-900/90 hover:from-zinc-800/90 rounded-full overflow-hidden cursor-ew-resize transition-all shadow-inner px-2"
            title="Klik atau geser di sini untuk scrub timeline"
          >
            {rulerTicks.map(({ sec, pct }) => (
              <div
                key={sec}
                className="absolute top-0 bottom-0 flex flex-col items-center -translate-x-1/2 pointer-events-none"
                style={{ left: `${pct}%` }}
              >
                <span className="text-[8px] font-mono font-medium text-zinc-400 leading-none pt-0.5">
                  {sec}s
                </span>
                <div className="w-[1px] h-1.5 bg-white/15 mt-auto" />
              </div>
            ))}
          </div>

          {/* B. Track Lanes (Kapsul dengan Gradasi Jelas) */}
          {isExpanded ? (
            timeline.layers.map((layer, index) => {
              const meta = getLayerMeta(layer.type, index);
              const IconComponent = meta.icon;

              return (
                <div
                  key={layer.id}
                  onPointerDown={handleTrackLanePointerDown}
                  className="relative h-[38px] bg-gradient-to-r from-zinc-900/70 via-zinc-900/40 to-zinc-900/70 hover:from-zinc-800/50 rounded-full overflow-hidden cursor-crosshair transition-all px-1"
                >
                  {/* Subtle ambient track background */}
                  <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

                  {/* Clips inside this layer (Kapsul Bulat, Gradasi Jelas, Tanpa Border) */}
                  {layer.clips.map((clip) => {
                    const isDraggingThis =
                      activeClipDrag?.layerId === layer.id && activeClipDrag?.clipId === clip.id;
                    const clipFrom = isDraggingThis ? activeClipDrag.from : clip.from;
                    const clipDuration = isDraggingThis ? activeClipDrag.duration : clip.duration;

                    const leftPercent = Math.min(100, Math.max(0, (clipFrom / totalFrames) * 100));
                    const widthPercent = Math.min(
                      100 - leftPercent,
                      Math.max(3, (clipDuration / totalFrames) * 100)
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
                        className={`timeline-clip-card absolute top-[2px] bottom-[2px] rounded-full flex items-center justify-between gap-1 transition-all touch-none cursor-grab active:cursor-grabbing select-none px-1.5 ${
                          isDraggingThis
                            ? 'z-30 ring-2 ring-white scale-[1.02] shadow-2xl opacity-95'
                            : isSelected
                            ? 'z-20'
                            : 'z-10 hover:z-20 hover:brightness-110'
                        } ${isSelected ? meta.clipSelectedBg : meta.clipBg}`}
                        title={`${clip.name} (${startSec}s - ${clipSec}s)`}
                      >
                        {/* Trim handle LEFT (Kapsul Halus) */}
                        <div
                          onPointerDown={(e) => handleClipPointerDown(e, layer, clip, 'trim-start')}
                          className="w-2.5 h-full flex items-center justify-center cursor-ew-resize hover:bg-white/20 rounded-full transition-colors shrink-0 z-20 group"
                        >
                          <div className={`w-[2px] h-3 rounded-full ${isSelected ? 'bg-white' : 'bg-white/40 group-hover:bg-white'}`} />
                        </div>

                        {/* Audio waveform visualization for narration & music */}
                        {(layer.type === 'narration' || layer.type === 'music') && (
                          <div className="absolute inset-0 opacity-20 flex items-center justify-around pointer-events-none px-3 overflow-hidden gap-[2px]">
                            {[30, 65, 25, 80, 50, 95, 40, 70, 50, 85, 30, 60, 75, 45, 60, 80, 35, 70, 55, 90, 25, 65, 85, 45, 70, 35, 90, 60].map((h, i) => (
                              <div
                                key={i}
                                className={`w-[2px] rounded-full shrink-0 ${layer.type === 'narration' ? 'bg-emerald-200' : 'bg-sky-200'}`}
                                style={{ height: `${h}%` }}
                              />
                            ))}
                          </div>
                        )}

                        {/* Clip content: Icon + Title */}
                        <div className="flex items-center gap-1.5 min-w-0 pointer-events-none flex-1 truncate py-0.5">
                          <IconComponent className="w-3.5 h-3.5 shrink-0 text-white" />
                          <span className="text-[11px] font-bold text-white truncate leading-tight drop-shadow-xs">
                            {clip.name}
                          </span>
                        </div>

                        {/* Duration pill (Kapsul Bulat) */}
                        <div className="shrink-0 pointer-events-none pr-0.5">
                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold shadow-xs ${
                              isSelected
                                ? 'bg-black/50 text-white'
                                : 'bg-black/35 text-white/90'
                            }`}
                          >
                            {clipSec}s
                          </span>
                        </div>

                        {/* Trim handle RIGHT (Kapsul Halus) */}
                        <div
                          onPointerDown={(e) => handleClipPointerDown(e, layer, clip, 'trim-end')}
                          className="w-2.5 h-full flex items-center justify-center cursor-ew-resize hover:bg-white/20 rounded-full transition-colors shrink-0 z-20 group"
                        >
                          <div className={`w-[2px] h-3 rounded-full ${isSelected ? 'bg-white' : 'bg-white/40 group-hover:bg-white'}`} />
                        </div>

                        {/* Live Floating Tooltip when this clip is actively being dragged */}
                        {isDraggingThis && (
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gradient-to-r from-zinc-800 to-zinc-900 text-white shadow-2xl px-2.5 py-0.5 rounded-full text-[10px] font-mono whitespace-nowrap pointer-events-none z-50">
                            {startSec}s • {clipSec}s
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          ) : (
            // Compact single master lane view (32px high, Kapsul)
            <div
              onPointerDown={handleTrackLanePointerDown}
              className="relative h-[32px] bg-gradient-to-r from-zinc-900/70 via-zinc-900/40 to-zinc-900/70 rounded-full overflow-hidden cursor-crosshair px-1"
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
                      className={`absolute top-[3px] bottom-[3px] rounded-full px-2 flex items-center text-[9px] font-bold truncate transition-all cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-white z-20 text-white ' + meta.clipSelectedBg
                          : 'opacity-90 text-white shadow-xs ' + meta.clipBg
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
              className="pointer-events-auto cursor-ew-resize touch-none flex flex-col items-center group -mt-1 active:scale-110 transition-transform h-full"
              title="Tahan & geser penanda tracking ini untuk memutar video"
            >
              {/* Tooltip during active scrub */}
              {isScrubbingPlayhead && (
                <div className="absolute -top-7 bg-[#e5484d] text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap pointer-events-none">
                  {((currentFrame) / timeline.fps).toFixed(2)}s (F{currentFrame})
                </div>
              )}

              {/* Needle Head Button */}
              <div className="w-4 h-4 bg-white rounded-full shadow-md shadow-black/50 flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              </div>

              {/* Vertical scrub line spanning through all tracks */}
              <div className="w-[2px] flex-1 min-h-[120px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
