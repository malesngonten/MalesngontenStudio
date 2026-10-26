import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { Play, Pause, Maximize, Plus, AlertCircle, Copy, Check, Wrench, Minimize2, Maximize2 } from 'lucide-react';
import { TimelineData } from '../../types';
import { ShortVideoComposition } from '../../remotion/ShortVideoComposition';
import { PillButton } from '../ui/PillButton';
import { IconButton } from '../ui/IconButton';

interface RemotionPreviewProps {
  timeline: TimelineData;
  currentFrame: number;
  onFrameUpdate: (frame: number) => void;
  isPlaying: boolean;
  onPlayPauseToggle: () => void;
  onAddLayerClick: () => void;
  compilationError: string | null;
  onAskAiFix: (err: string) => void;
}

export const RemotionPreview: React.FC<RemotionPreviewProps> = ({
  timeline,
  currentFrame,
  onFrameUpdate,
  isPlaying,
  onPlayPauseToggle,
  onAddLayerClick,
  compilationError,
  onAskAiFix,
}) => {
  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [playerSize, setPlayerSize] = useState<'compact' | 'expanded'>('compact');
  const isInternalUpdateRef = useRef(false);
  const lastFrameRef = useRef(-1);

  // Sync external seek (e.g. from timeline scrub/tap) to playerRef
  useEffect(() => {
    // If the frame update originated from player's own internal playback, skip seekTo
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    if (!playerRef.current) return;
    const player = playerRef.current;
    try {
      const current = Math.round(player.getCurrentFrame());
      if (current !== currentFrame) {
        lastFrameRef.current = currentFrame;
        player.seekTo(currentFrame);
      }
    } catch (e) {
      // player might still be mounting
    }
  }, [currentFrame]);

  // Sync play/pause state
  useEffect(() => {
    if (!playerRef.current) return;
    const player = playerRef.current;
    try {
      if (isPlaying && !player.isPlaying()) {
        player.play();
      } else if (!isPlaying && player.isPlaying()) {
        player.pause();
      }
    } catch (e) {
      // player playback error
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

  const handleCopyError = useCallback(() => {
    if (!compilationError) return;
    navigator.clipboard.writeText(compilationError);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [compilationError]);

  // Format frames to mm:ss
  const formatTime = (frame: number, fps: number) => {
    const totalSeconds = Math.floor(frame / fps);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentTimeStr = formatTime(currentFrame, timeline.fps);
  const totalTimeStr = formatTime(timeline.durationInFrames, timeline.fps);

  const playerHeightClass = playerSize === 'compact' ? 'h-[185px]' : 'h-[262px]';

  return (
    <div ref={containerRef} className="flex flex-col bg-black border-b border-[#27272c] w-full shrink-0">
      {/* a) Player: area hitam full-bleed portrait 9:16 di tengah */}
      <div className={`relative w-full ${playerHeightClass} transition-all duration-200 bg-black flex items-center justify-center overflow-hidden`}>
        {compilationError ? (
          // g) Error state: kartu error (nama file + baris, pesan monospace) dengan "Minta AI perbaiki" & "Salin error"
          <div className="w-[90%] max-w-[340px] bg-[#18181b] border border-[#e5484d]/50 rounded-2xl p-4 shadow-xl flex flex-col justify-between my-auto">
            <div className="flex items-center gap-2 text-[#e5484d] font-semibold text-xs mb-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Gagal Mengompilasi Remotion</span>
            </div>
            <pre className="text-[11px] font-code text-[#f2f2f3] bg-[#0a0a0b] p-2.5 rounded-xl border border-[#27272c] max-h-24 overflow-y-auto whitespace-pre-wrap select-text mb-3">
              {compilationError}
            </pre>
            <div className="flex items-center gap-2">
              <PillButton
                variant="red"
                onClick={() => onAskAiFix(compilationError)}
                className="flex-1"
              >
                <Wrench className="w-3.5 h-3.5" />
                Minta AI perbaiki
              </PillButton>
              <PillButton
                variant="outline"
                onClick={handleCopyError}
                className="shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#5fd3b0]" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Tersalin' : 'Salin'}
              </PillButton>
            </div>
          </div>
        ) : (
          // Video 9:16 frame container
          <div
            className="h-full aspect-[9/16] bg-black shadow-2xl relative flex items-center justify-center transition-all duration-200"
            style={{ aspectRatio: `${timeline.width} / ${timeline.height}` }}
          >
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
              }}
              controls={false}
              autoPlay={false}
              loop
            />
          </div>
        )}
      </div>

      {/* b) Baris kontrol 40px: Play/Pause, waktu, spacer, + Layer, Fullscreen */}
      <div className="h-[40px] px-3 bg-[#121214] border-t border-[#27272c] flex items-center justify-between gap-2 select-none shrink-0">
        <div className="flex items-center gap-2">
          {/* Play/Pause: ikon putih terisi, min 44x44 tap area */}
          <button
            type="button"
            aria-label={isPlaying ? 'Jeda video' : 'Putar video'}
            onClick={onPlayPauseToggle}
            className="tap w-9 h-9 rounded-full bg-[#222226] hover:bg-[#2c2c31] border border-[#303036] flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white translate-x-0.5" />
            )}
          </button>

          {/* Time display: nowrap, tabular-nums */}
          <span className="text-xs font-mono font-medium text-[#8b8b94] whitespace-nowrap tabular-nums">
            <span className="text-[#f2f2f3] font-semibold">{currentTimeStr}</span> / {totalTimeStr}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Pill "+ Layer" bergaris */}
          <PillButton
            variant="red"
            size="sm"
            onClick={onAddLayerClick}
            aria-label="Tambah Layer Baru"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Layer</span>
          </PillButton>

          {/* Toggle Ukuran Preview (Compact vs Expanded) */}
          <IconButton
            icon={playerSize === 'compact' ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            aria-label={playerSize === 'compact' ? 'Perbesar preview video' : 'Perkecil preview video'}
            size="sm"
            onClick={() => setPlayerSize(playerSize === 'compact' ? 'expanded' : 'compact')}
          />

          {/* Tombol Fullscreen */}
          <IconButton
            icon={<Maximize className="w-4 h-4" />}
            aria-label="Layar penuh"
            size="sm"
            onClick={handleFullscreen}
          />
        </div>
      </div>
    </div>
  );
};
