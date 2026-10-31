import React, { useState } from 'react';
import {
  Download,
  Film,
  Sparkles,
  Play,
  Trash2,
  XCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { RenderJob } from '../../types';
import { PillButton } from '../ui/PillButton';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/Skeleton';

interface RenderTabProps {
  currentJob: RenderJob | null;
  completedJobs: RenderJob[];
  onStartRender: (resolution: '720p' | '1080p' | '4K', fps: number) => void;
  onCancelRender: (jobId: string) => void;
  onDeleteRender: (jobId: string) => void;
}

export const RenderTab: React.FC<RenderTabProps> = ({
  currentJob,
  completedJobs,
  onStartRender,
  onCancelRender,
  onDeleteRender,
}) => {
  // Default 720p / 30fps as required for lightweight resource usage
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4K'>('720p');
  const [fps, setFps] = useState<number>(30);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '4.2 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0e0e10] p-4 overflow-y-auto space-y-4 select-none safe-pb">
      {/* Title & note */}
      <div>
        <h3 className="text-sm font-semibold text-[#f2f2f3]">Render Studio</h3>
        <p className="text-[11px] text-[#8b8b94] mt-0.5">
          Eksport video Remotion menjadi file MP4 siap bagikan ke TikTok, Reels, atau Shorts.
        </p>
      </div>

      {/* Render Settings Card (Tanpa border, gradasi lembut) */}
      <div className="bg-gradient-to-b from-[#18181c] to-[#111114] rounded-3xl p-4 space-y-3.5 shadow-lg">
        {/* Resolusi (Standalone Pill Buttons tanpa container background) */}
        <div>
          <label className="text-xs font-semibold text-[#8b8b94] uppercase tracking-wider block mb-1.5">
            Resolusi Video
          </label>
          <div className="flex items-center gap-2">
            {(['720p', '1080p', '4K'] as const).map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => setResolution(res)}
                className={`tap flex-1 py-2 text-xs font-semibold rounded-full transition-all min-h-[38px] ${
                  resolution === res
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white shadow-md shadow-red-950/40'
                    : 'bg-gradient-to-b from-[#24242a] to-[#1a1a20] text-[#8b8b94] hover:text-[#f2f2f3] hover:from-[#2a2a32] hover:to-[#202026]'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#76767f] mt-1.5">
            *Default 720p direkomendasikan untuk render cepat di perangkat mobile.
          </p>
        </div>

        {/* FPS (Standalone Pill Buttons tanpa container background) */}
        <div>
          <label className="text-xs font-semibold text-[#8b8b94] uppercase tracking-wider block mb-1.5">
            Frame Rate (FPS)
          </label>
          <div className="flex items-center gap-2">
            {[24, 30, 60].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setFps(rate)}
                className={`tap flex-1 py-2 text-xs font-semibold rounded-full transition-all min-h-[38px] ${
                  fps === rate
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white shadow-md shadow-red-950/40'
                    : 'bg-gradient-to-b from-[#24242a] to-[#1a1a20] text-[#8b8b94] hover:text-[#f2f2f3] hover:from-[#2a2a32] hover:to-[#202026]'
                }`}
              >
                {rate} FPS
              </button>
            ))}
          </div>
        </div>

        {/* Start Render Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!!currentJob && (currentJob.status === 'rendering' || currentJob.status === 'queued')}
          onClick={() => onStartRender(resolution, fps)}
        >
          <Film className="w-4 h-4 mr-2" />
          Mulai Render ({resolution} @ {fps}fps)
        </Button>
      </div>

      {/* Live SSE Progress Card (Active Card dengan efek 3-color glow gradient) */}
      {currentJob && (currentJob.status === 'rendering' || currentJob.status === 'queued') && (
        <div className="active-glow-card rounded-3xl p-4 space-y-3 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e5484d] animate-ping" />
              <span className="text-xs font-semibold text-[#f2f2f3]">
                {currentJob.status === 'queued' ? 'Menyiapkan Render...' : 'Sedang Merender Video'}
              </span>
            </div>
            <PillButton
              variant="outline"
              size="xs"
              onClick={() => onCancelRender(currentJob.id)}
              className="text-red-400 hover:text-red-300"
            >
              <XCircle className="w-3.5 h-3.5" />
              Batal
            </PillButton>
          </div>

          {/* Persen Besar */}
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-[#f2f2f3]">
              {Math.round(currentJob.progress)}%
            </span>
            <span className="text-xs font-mono text-[#8b8b94]">
              Frame {currentJob.currentFrame} / {currentJob.totalFrames}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-[#222226] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#e5484d] rounded-full transition-all duration-200"
              style={{ width: `${currentJob.progress}%` }}
            />
          </div>

          {/* Sisa waktu */}
          <div className="flex items-center justify-between text-[11px] text-[#8b8b94] font-mono">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Sisa perkiraan: {currentJob.estimatedSecondsRemaining} detik</span>
            </div>
            <span>{currentJob.resolution} @ {currentJob.fps}fps</span>
          </div>
        </div>
      )}

      {/* Completed Renders List */}
      <div>
        <h4 className="text-xs font-semibold text-[#8b8b94] uppercase tracking-wider mb-2.5">
          Hasil Render ({completedJobs.length})
        </h4>

        {completedJobs.length === 0 ? (
          <EmptyState
            icon={<Film className="w-6 h-6" />}
            title="Belum Ada Hasil Render"
            description="Video yang selesai dirender akan muncul di sini dan dapat diunduh atau dipratinjau langsung."
          />
        ) : (
          <div className="space-y-2.5">
            {completedJobs.map((job) => (
              <div
                key={job.id}
                className="bg-gradient-to-b from-[#18181c] to-[#111114] rounded-3xl p-3.5 space-y-2 shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#f2f2f3] truncate">
                        {job.fileName || `Males_Ngonten_${job.id.slice(0, 6)}.mp4`}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-950/80 to-teal-950/80 text-[#5fd3b0] font-semibold">
                        {job.resolution}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#8b8b94] mt-1 font-mono">
                      <span>{job.fps} FPS</span>
                      <span>•</span>
                      <span>{formatSize(job.fileSize)}</span>
                      <span>•</span>
                      <span>{job.createdAt}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Hapus hasil render"
                    onClick={() => onDeleteRender(job.id)}
                    className="tap w-8 h-8 rounded-full flex items-center justify-center text-[#76767f] hover:text-red-400 hover:bg-white/[0.08] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={job.downloadUrl || `/api/renders/${job.id}/download`}
                    download={job.fileName || `video-${job.id}.mp4`}
                    className="tap flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-full bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 text-xs font-semibold text-[#f2f2f3] transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-[#5fd3b0]" />
                    <span>Unduh MP4</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
