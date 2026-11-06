import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import {
  Play,
  Pause,
  Maximize2,
  RotateCcw,
  Layers,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from 'lucide-react';
import { TimelineData, TimelineClip } from '../../types';
import { ShortVideoComposition } from '../../remotion/ShortVideoComposition';

interface RemotionPreviewProps {
  timeline: TimelineData;
  currentFrame: number;
  onFrameUpdate: (frame: number) => void;
  isPlaying: boolean;
  onPlayPauseToggle: () => void;
  selectedClipId: string | null;
  onSelectClip: (layerId: string, clipId: string) => void;
  onUpdateClipPosition?: (layerId: string, clipId: string, x: number, y: number) => void;
  onPromptElementAction?: (elementName: string, defaultAction: string) => void;
  isTimelineOpen?: boolean;
  onToggleTimeline?: () => void;
}

export const RemotionPreview: React.FC<RemotionPreviewProps> = ({
  timeline,
  currentFrame,
  onFrameUpdate,
  isPlaying,
  onPlayPauseToggle,
  selectedClipId,
  onSelectClip,
  onUpdateClipPosition,
  isTimelineOpen,
  onToggleTimeline,
}) => {
  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const videoFrameRef = useRef<HTMLDivElement>(null);
  const isInternalUpdateRef = useRef(false);
  const lastFrameRef = useRef(-1);

  // --- Remotion Player Zoom & Pan State ---
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isGesturing, setIsGesturing] = useState<boolean>(false);

  // Touch gesture tracking references
  const gestureRef = useRef<{
    initialDistance: number;
    initialScale: number;
    initialMidX: number;
    initialMidY: number;
    initialPanX: number;
    initialPanY: number;
    is2Finger: boolean;
    is1FingerPan: boolean;
    startX: number;
    startY: number;
    lastTapTime: number;
  }>({
    initialDistance: 0,
    initialScale: 1.0,
    initialMidX: 0,
    initialMidY: 0,
    initialPanX: 0,
    initialPanY: 0,
    is2Finger: false,
    is1FingerPan: false,
    startX: 0,
    startY: 0,
    lastTapTime: 0,
  });

  // Dragging state on canvas for elements
  const [draggingClip, setDraggingClip] = useState<{
    layerId: string;
    clipId: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Reset zoom & pan helper
  const handleResetZoom = useCallback(() => {
    setZoomScale(1.0);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Sync external seek (timeline scrub) to playerRef
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    if (!playerRef.current) return;
    try {
      const current = Math.round(playerRef.current.getCurrentFrame());
      if (current !== currentFrame) {
        lastFrameRef.current = currentFrame;
        playerRef.current.seekTo(currentFrame);
      }
    } catch {
      // player mounting
    }
  }, [currentFrame]);

  // Sync play/pause state
  useEffect(() => {
    if (!playerRef.current) return;
    try {
      if (isPlaying && !playerRef.current.isPlaying()) {
        playerRef.current.play();
      } else if (!isPlaying && playerRef.current.isPlaying()) {
        playerRef.current.pause();
      }
    } catch {
      // player playback
    }
  }, [isPlaying]);

  // Listen to frameupdate from player
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrame = (e: { detail: { frame: number } }) => {
      const rounded = Math.round(e.detail.frame);
      if (rounded !== lastFrameRef.current) {
        lastFrameRef.current = rounded;
        isInternalUpdateRef.current = true;
        onFrameUpdate(rounded);
      }
    };

    player.addEventListener('frameupdate', onFrame);
    return () => {
      player.removeEventListener('frameupdate', onFrame);
    };
  }, [onFrameUpdate]);

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen?.();
    }
  }, []);

  // --- Pinch-to-zoom & Pan Touch Handlers for Remotion Player ---
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touches = e.touches;
    const now = Date.now();

    // 2-Finger Pinch-to-Zoom & 2-Finger Pan
    if (touches.length === 2) {
      e.preventDefault();
      setIsGesturing(true);

      const t1 = touches[0];
      const t2 = touches[1];
      const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      gestureRef.current.is2Finger = true;
      gestureRef.current.is1FingerPan = false;
      gestureRef.current.initialDistance = distance;
      gestureRef.current.initialScale = zoomScale;
      gestureRef.current.initialMidX = midX;
      gestureRef.current.initialMidY = midY;
      gestureRef.current.initialPanX = panOffset.x;
      gestureRef.current.initialPanY = panOffset.y;
      return;
    }

    // 1-Finger Touch: Double-tap detection or Zoomed Panning
    if (touches.length === 1) {
      const t = touches[0];

      // Double-tap to reset or quick zoom
      if (now - gestureRef.current.lastTapTime < 280) {
        e.preventDefault();
        if (zoomScale > 1.05 || panOffset.x !== 0 || panOffset.y !== 0) {
          handleResetZoom();
        } else {
          setZoomScale(2.0);
        }
        gestureRef.current.lastTapTime = 0;
        return;
      }
      gestureRef.current.lastTapTime = now;

      // When zoomed in, allow 1-finger panning of the preview
      if (zoomScale > 1.05 && !draggingClip) {
        gestureRef.current.is1FingerPan = true;
        gestureRef.current.is2Finger = false;
        gestureRef.current.startX = t.clientX;
        gestureRef.current.startY = t.clientY;
        gestureRef.current.initialPanX = panOffset.x;
        gestureRef.current.initialPanY = panOffset.y;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touches = e.touches;

    // 2-Finger Pinch Zoom & Pan
    if (touches.length === 2 && gestureRef.current.is2Finger) {
      e.preventDefault();
      const t1 = touches[0];
      const t2 = touches[1];
      const currentDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const currentMidX = (t1.clientX + t2.clientX) / 2;
      const currentMidY = (t1.clientY + t2.clientY) / 2;

      if (gestureRef.current.initialDistance > 0) {
        const ratio = currentDistance / gestureRef.current.initialDistance;
        const newScale = Math.min(4.0, Math.max(0.6, gestureRef.current.initialScale * ratio));

        const deltaMidX = currentMidX - gestureRef.current.initialMidX;
        const deltaMidY = currentMidY - gestureRef.current.initialMidY;

        setZoomScale(newScale);
        setPanOffset({
          x: gestureRef.current.initialPanX + deltaMidX,
          y: gestureRef.current.initialPanY + deltaMidY,
        });
      }
      return;
    }

    // 1-Finger Pan when zoomed in
    if (touches.length === 1 && gestureRef.current.is1FingerPan) {
      e.preventDefault();
      const t = touches[0];
      const deltaX = t.clientX - gestureRef.current.startX;
      const deltaY = t.clientY - gestureRef.current.startY;

      setPanOffset({
        x: gestureRef.current.initialPanX + deltaX,
        y: gestureRef.current.initialPanY + deltaY,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsGesturing(false);
    gestureRef.current.is2Finger = false;
    gestureRef.current.is1FingerPan = false;

    // Snap back if zoomed out below 0.95
    if (zoomScale < 0.95) {
      setZoomScale(1.0);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  // Mouse wheel zoom for desktop testability
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      const zoomFactor = -e.deltaY * 0.005;
      const nextScale = Math.min(4.0, Math.max(0.7, zoomScale + zoomFactor));
      setZoomScale(nextScale);
      if (nextScale <= 1.0) {
        setPanOffset({ x: 0, y: 0 });
      }
    }
  };

  // Format time display
  const currentSec = (currentFrame / timeline.fps).toFixed(2);
  const totalSec = (timeline.durationInFrames / timeline.fps).toFixed(2);

  // Active text clips at current frame that can be dragged
  const activeTextClips: { layerId: string; clip: TimelineClip }[] = [];
  timeline.layers
    .filter((l) => l.type === 'text')
    .forEach((layer) => {
      layer.clips.forEach((clip) => {
        if (currentFrame >= clip.from && currentFrame < clip.from + clip.duration) {
          activeTextClips.push({ layerId: layer.id, clip });
        }
      });
    });

  // On-Canvas Drag Handlers for individual text clips
  const handlePointerDown = (
    e: React.PointerEvent,
    layerId: string,
    clip: TimelineClip
  ) => {
    if (!videoFrameRef.current || !onUpdateClipPosition) return;
    e.stopPropagation();

    onSelectClip(layerId, clip.id);

    const initialX = clip.props?.x ?? 50;
    const initialY = clip.props?.y ?? 50;

    setDraggingClip({
      layerId,
      clipId: clip.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX,
      initialY,
      currentX: initialX,
      currentY: initialY,
    });

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture fallback
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingClip || !videoFrameRef.current || !onUpdateClipPosition) return;
    e.stopPropagation();

    const rect = videoFrameRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Compensate for current zoomScale
    const effectiveScale = zoomScale || 1.0;
    const deltaPixelX = (e.clientX - draggingClip.startX) / effectiveScale;
    const deltaPixelY = (e.clientY - draggingClip.startY) / effectiveScale;

    const baseWidth = rect.width / effectiveScale;
    const baseHeight = rect.height / effectiveScale;

    const deltaPercentX = (deltaPixelX / baseWidth) * 100;
    const deltaPercentY = (deltaPixelY / baseHeight) * 100;

    let nextX = Math.round(draggingClip.initialX + deltaPercentX);
    let nextY = Math.round(draggingClip.initialY + deltaPercentY);

    // Snap to horizontal / vertical center
    if (Math.abs(nextX - 50) < 3) nextX = 50;
    if (Math.abs(nextY - 50) < 3) nextY = 50;

    // Constrain within frame bounds
    nextX = Math.max(5, Math.min(95, nextX));
    nextY = Math.max(5, Math.min(95, nextY));

    setDraggingClip((prev) => (prev ? { ...prev, currentX: nextX, currentY: nextY } : null));
    onUpdateClipPosition(draggingClip.layerId, draggingClip.clipId, nextX, nextY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingClip) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Fallback
      }
      setDraggingClip(null);
    }
  };

  // Scrubber bar seek
  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const frame = parseInt(e.target.value, 10);
    onFrameUpdate(frame);
  };

  const isZoomed = Math.abs(zoomScale - 1.0) > 0.05 || Math.abs(panOffset.x) > 2 || Math.abs(panOffset.y) > 2;

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col bg-[#050507] select-none relative overflow-hidden"
    >
      {/* 1. Video Viewport Area with data-allow-pinch-zoom="true" for global zoom lock exclusion */}
      <div
        ref={viewportRef}
        data-allow-pinch-zoom="true"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onWheel={handleWheel}
        className="flex-1 relative flex items-center justify-center p-2 sm:p-4 min-h-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/30 via-[#08080a] to-[#040406] overflow-hidden touch-none"
      >
        {/* Floating Zoom & Pan Status Pill (Minimalist, only shown when zoomed or panned) */}
        {isZoomed && (
          <div className="absolute top-2.5 right-2.5 z-40 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-white text-xs font-mono shadow-xl animate-in fade-in duration-150">
            <span className="font-semibold text-zinc-200">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom & Posisi (Kembali ke 100%)"
              className="tap flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-[11px] transition-all ml-0.5"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        )}

        {/* Zoomable & Pannable Transform Wrapper */}
        <div
          style={{
            transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0px) scale(${zoomScale})`,
            transformOrigin: 'center center',
            transition: isGesturing ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="relative pointer-events-auto"
        >
          {/* Aspect Ratio 9:16 Canvas Frame (Always strictly preserves aspect ratio, Zero Borders) */}
          <div
            ref={videoFrameRef}
            className="h-full aspect-[9/16] bg-black shadow-[0_10px_40px_rgba(0,0,0,0.85)] relative flex items-center justify-center overflow-hidden"
            style={{ maxHeight: '100%' }}
          >
            {/* Remotion Player Engine */}
            <Player
              ref={playerRef}
              component={ShortVideoComposition}
              inputProps={{ timeline }}
              durationInFrames={timeline.durationInFrames}
              fps={timeline.fps}
              compositionWidth={timeline.width}
              compositionHeight={timeline.height}
              style={{
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
              controls={false}
              autoPlay={false}
              loop
            />

            {/* Interactive Drag & Drop Hit Target on Active Elements */}
            {!isPlaying &&
              activeTextClips.map(({ layerId, clip }) => {
                const isSelected = selectedClipId === clip.id;
                const posX = clip.props?.x ?? 50;
                const posY = clip.props?.y ?? 50;

                return (
                  <div
                    key={clip.id}
                    onPointerDown={(e) => handlePointerDown(e, layerId, clip)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    style={{
                      position: 'absolute',
                      top: `${posY}%`,
                      left: `${posX}%`,
                      transform: 'translate(-50%, -50%)',
                      touchAction: 'none',
                    }}
                    className={`cursor-move select-none z-30 ${
                      isSelected
                        ? 'ring-2 ring-red-500/70 rounded-full'
                        : 'hover:ring-1 hover:ring-white/30 rounded-full'
                    }`}
                  >
                    <div className="p-1 relative">
                      <div className="opacity-0 pointer-events-none text-center px-3 py-1 font-bold text-sm whitespace-nowrap">
                        {clip.props?.text || clip.name}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* 2. Floating Minimalist Control Dock - Clean, Soft Gradients, No Harsh Borders */}
      <div className="h-11 px-3 sm:px-4 bg-gradient-to-t from-[#09090c] via-[#09090c]/90 to-transparent flex items-center justify-between gap-2 shrink-0 z-20 relative">
        {/* Progress bar layer — placed above controls as separate layer, not inline */}
        <div className="absolute -top-3 left-0 right-0 h-0.5 w-full overflow-hidden pointer-events-auto">
          <div className="h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-full shadow-lg shadow-red-500/30" style={{ width: `${Math.min(100, (currentFrame / Math.max(1, timeline.durationInFrames - 1)) * 100)}%` }} />
          <input
            type="range"
            min={0}
            max={Math.max(1, timeline.durationInFrames - 1)}
            value={currentFrame}
            onChange={handleScrubberChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer accent-red-500"
            title="Geser timeline frame"
          />
        </div>

        {/* Left: Play/Pause & Timecode */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onPlayPauseToggle}
            className="tap w-7 h-7 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 flex items-center justify-center text-white active:scale-95 transition-all shadow-md shadow-red-950/40 shrink-0"
            aria-label={isPlaying ? 'Jeda video' : 'Putar video'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-white" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
            )}
          </button>

          {/* Time indicator */}
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-900/90 text-[11px] font-mono tabular-nums text-zinc-300 shadow-xs">
            <span className="font-semibold text-white">{currentSec}s</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">{totalSec}s</span>
          </div>
        </div>

        {/* Right: Quick actions (Track toggle, Zoom Reset, Rewind, Fullscreen) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Zoom quick reset / status button */}
          <button
            type="button"
            onClick={handleResetZoom}
            title={isZoomed ? `Zoom: ${Math.round(zoomScale * 100)}% (Klik untuk Reset ke 100%)` : 'Pinch 2 jari pada video untuk Zoom'}
            className={`tap px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-mono transition-all ${
              isZoomed
                ? 'bg-gradient-to-r from-red-950/90 to-zinc-900 text-rose-300 shadow-sm'
                : 'bg-zinc-850/80 text-zinc-400 hover:text-white'
            }`}
          >
            {zoomScale > 1.05 ? (
              <ZoomIn className="w-3.5 h-3.5 text-rose-400" />
            ) : zoomScale < 0.95 ? (
              <ZoomOut className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <ZoomIn className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <span className="font-semibold">{Math.round(zoomScale * 100)}%</span>
          </button>

          {onToggleTimeline && (
            <button
              type="button"
              onClick={onToggleTimeline}
              title={isTimelineOpen ? 'Sembunyikan Timeline Track' : 'Tampilkan Timeline Track'}
              className={`tap px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium transition-all ${
                isTimelineOpen
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-950/40'
                  : 'bg-zinc-850/80 text-zinc-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Timeline</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onFrameUpdate(0)}
            title="Reset ke awal (Frame 0)"
            className="tap w-7 h-7 rounded-full bg-zinc-850/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={handleFullscreen}
            title="Mode Layar Penuh"
            className="tap w-7 h-7 rounded-full bg-zinc-850/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
