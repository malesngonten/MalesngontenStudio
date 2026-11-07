import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export interface ProgressIndicatorProps {
  progress?: number;
  label?: string;
  barColor?: string;
  height?: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress = 85,
  label = 'Generating Final 4K Render...',
  barColor = '#E50914',
  height = 12,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const anim = spring({
    frame,
    fps,
    config: { damping: 16, mass: 1 },
  });

  const currentVal = Math.round(progress * Math.max(0, anim));

  return (
    <AbsoluteFill className="flex flex-col justify-end items-center pb-16 px-8 select-none pointer-events-none">
      <div className="w-full max-w-lg bg-gradient-to-b from-[#1c1c24]/90 to-[#101016]/90 backdrop-blur-md p-5 rounded-2xl shadow-2xl space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
          <span className="text-zinc-200">{label}</span>
          <span className="font-mono text-white font-bold">{currentVal}%</span>
        </div>

        {/* Outer Bar Track */}
        <div
          style={{ height: `${height}px` }}
          className="w-full bg-zinc-800 rounded-full overflow-hidden p-0.5"
        >
          {/* Animated Fill Bar */}
          <div
            style={{
              width: `${currentVal}%`,
              backgroundColor: barColor,
              boxShadow: `0 0 16px ${barColor}90`,
            }}
            className="h-full rounded-full transition-all duration-75 relative overflow-hidden"
          >
            {/* Shimmer light across bar */}
            <div
              style={{
                transform: `translateX(${(frame * 4) % 200 - 100}%)`,
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full h-full"
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
