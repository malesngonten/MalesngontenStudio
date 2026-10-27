import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import {
  Play,
  Pause,
  Maximize,
  RotateCcw,
  Move,
  Check,
  Sparkles,
  Layers,
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
}) => {
  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoFrameRef = useRef<HTMLDivElement>(null);
  const isInternalUpdateRef = useRef(false);
  const lastFrameRef = useRef(-1);

  // Dragging state on canvas
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
    } catch (e) {
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
    } catch (e) {
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

  // On-Canvas Drag Handlers
  const handlePointerDown = (
    e: React.PointerEvent,
    layerId: string,
    clip: TimelineClip
  ) => {
    if (!videoFrameRef.current || !onUpdateClipPosition) return;
    e.stopPropagation();
    e.preventDefault();

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    onSelectClip(layerId, clip.id);
    if (isPlaying) {
      onPlayPauseToggle(); // Pause to adjust
    }

    const currentX = clip.props?.x ?? 50;
    const currentY = clip.props?.y ?? 50;

    setDraggingClip({
      layerId,
      clipId: clip.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY,
      currentX,
      currentY,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingClip || !videoFrameRef.current || !onUpdateClipPosition) return;
    const rect = videoFrameRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const deltaXPercent = ((e.clientX - draggingClip.startX) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - draggingClip.startY) / rect.height) * 100;

    let newX = Math.round(draggingClip.initialX + deltaXPercent);
    let newY = Math.round(draggingClip.initialY + deltaYPercent);

    // Magnetic snap to center (50%)
    if (Math.abs(newX - 50) < 3) newX = 50;
    if (Math.abs(newY - 50) < 3) newY = 50;

    newX = Math.max(8, Math.min(92, newX));
    newY = Math.max(8, Math.min(92, newY));

    setDraggingClip((prev) => (prev ? { ...prev, currentX: newX, currentY: newY } : null));
    onUpdateClipPosition(draggingClip.layerId, draggingClip.clipId, newX, newY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingClip) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }
    setDraggingClip(null);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col bg-[#0d0d10] select-none relative overflow-hidden"
    >
      {/* Video Viewport Area */}
      <div className="flex-1 relative flex items-center justify-center p-2 min-h-0 bg-radial from-[#15151a] to-[#0a0a0c]">
        {/* Aspect Ratio 9:16 Frame */}
        <div
          ref={videoFrameRef}
          className="h-full aspect-[9/16] bg-black shadow-2xl relative flex items-center justify-center overflow-hidden rounded-xl border border-[#232329]"
          style={{ maxHeight: '100%' }}
        >
          {/* Remotion Player */}
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

          {/* Center Crosshair Guidelines when dragging near center */}
          {draggingClip && draggingClip.currentX === 50 && (
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-red-500/70 pointer-events-none z-40" />
          )}
          {draggingClip && draggingClip.currentY === 50 && (
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-red-500/70 pointer-events-none z-40" />
          )}

          {/* Interactive Drag & Drop Overlay on Active Text Elements */}
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
                  className={`cursor-move select-none z-30 transition-shadow ${
                    isSelected
                      ? 'ring-2 ring-[#e5484d] ring-offset-2 ring-offset-black/60 rounded-xl'
                      : 'hover:ring-1 hover:ring-white/50 rounded-xl'
                  }`}
                >
                  <div className="p-2 relative group">
                    {/* Drag Handle Tag */}
                    {isSelected && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#e5484d] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md whitespace-nowrap pointer-events-none">
                        <Move className="w-2.5 h-2.5" />
                        <span>Geser ({posX}%, {posY}%)</span>
                      </div>
                    )}
                    {/* Ghost hit target matching text */}
                    <div className="opacity-0 pointer-events-none text-center px-4 py-2 font-extrabold text-sm whitespace-nowrap">
                      {clip.props?.text || clip.name}
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Pause / Drag Hint Overlay */}
          {!isPlaying && (
            <div className="absolute top-2 left-2 z-20 pointer-events-none bg-black/60 backdrop-blur-xs text-[#8f8f9c] text-[10px] px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
              <Move className="w-2.5 h-2.5 text-[#e5484d]" />
              <span>Drag teks untuk ubah posisi</span>
            </div>
          )}

          {/* Resolution Badge */}
          <div className="absolute top-2 right-2 z-20 pointer-events-none bg-black/60 backdrop-blur-xs text-[#8f8f9c] text-[10px] font-mono px-2 py-0.5 rounded-md border border-white/10">
            9:16 • 1080p
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="h-[42px] px-3 bg-[#111114] border-t border-[#232329] flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={onPlayPauseToggle}
            className="tap w-8 h-8 rounded-full bg-[#c92a2a] hover:bg-[#b02525] flex items-center justify-center text-white active:scale-95 transition-all shadow-md"
            aria-label={isPlaying ? 'Jeda video' : 'Putar video'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white translate-x-0.5" />
            )}
          </button>

          {/* Time & Frame Counter */}
          <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums">
            <span className="text-white font-semibold">{currentSec}s</span>
            <span className="text-[#656570]">/ {totalSec}s</span>
            <span className="text-[10px] text-[#656570] bg-[#1a1a20] px-1.5 py-0.5 rounded border border-[#272733]">
              F{currentFrame}
            </span>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {/* Reset to Start */}
          <button
            type="button"
            onClick={() => onFrameUpdate(0)}
            title="Ulangi dari frame 0"
            className="tap w-7 h-7 rounded-md flex items-center justify-center text-[#8e8e99] hover:text-white hover:bg-[#1f1f25] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={handleFullscreen}
            title="Layar Penuh"
            className="tap w-7 h-7 rounded-md flex items-center justify-center text-[#8e8e99] hover:text-white hover:bg-[#1f1f25] transition-colors"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
