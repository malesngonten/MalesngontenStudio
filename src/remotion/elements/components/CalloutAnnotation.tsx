import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export interface CalloutAnnotationProps {
  title?: string;
  detail?: string;
  x?: number; // percentage
  y?: number; // percentage
  pinColor?: string;
}

export const CalloutAnnotation: React.FC<CalloutAnnotationProps> = ({
  title = 'Tombol Kunci',
  detail = 'Tekan untuk render instan',
  x = 50,
  y = 45,
  pinColor = '#E50914',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.8 },
  });

  const pulse = Math.sin(frame / 6) * 4 + 8;

  return (
    <AbsoluteFill className="pointer-events-none select-none">
      <div
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          transform: `translate(-50%, -50%) scale(${0.7 + entrance * 0.3})`,
          opacity: entrance,
        }}
        className="flex items-center gap-3"
      >
        {/* Pulsing Pin Indicator */}
        <div className="relative flex items-center justify-center">
          <div
            style={{
              background: `radial-gradient(circle, ${pinColor}80 0%, transparent 70%)`,
              width: `${28 + pulse * 2}px`,
              height: `${28 + pulse * 2}px`,
            }}
            className="absolute rounded-full opacity-70 animate-ping"
          />
          <div
            style={{ backgroundColor: pinColor }}
            className="w-4 h-4 rounded-full shadow-lg z-10"
          />
        </div>

        {/* Callout Card */}
        <div className="bg-gradient-to-b from-[#1c1c24]/95 to-[#101016]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl flex flex-col min-w-[140px]">
          <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
            <span style={{ color: pinColor }}>●</span> {title}
          </span>
          <span className="text-[11px] font-medium text-zinc-300 mt-0.5">
            {detail}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
