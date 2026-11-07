import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export interface NumberCounterProps {
  targetNumber?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  color?: string;
}

export const NumberCounter: React.FC<NumberCounterProps> = ({
  targetNumber = 1250000,
  prefix = '+',
  suffix = ' Views',
  label = 'Total Interaksi Bulan Ini',
  color = '#E50914',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9 },
  });

  const countProgress = spring({
    frame: frame - 4,
    fps,
    config: { damping: 18, mass: 1 },
  });

  const currentNum = Math.round(targetNumber * Math.max(0, countProgress));
  const formatted = currentNum.toLocaleString('id-ID');

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center p-8 select-none pointer-events-none">
      <div
        style={{
          transform: `scale(${0.75 + entrance * 0.25}) translateY(${(1 - entrance) * 20}px)`,
          opacity: entrance,
        }}
        className="flex flex-col items-center text-center bg-gradient-to-b from-[#1c1c24]/90 to-[#101016]/90 backdrop-blur-md px-8 py-6 rounded-3xl shadow-2xl"
      >
        <span
          style={{
            color,
            textShadow: `0 0 20px ${color}70`,
          }}
          className="text-4xl sm:text-5xl font-black font-mono tracking-tight"
        >
          {prefix}{formatted}{suffix}
        </span>

        <span className="text-sm font-semibold text-zinc-300 mt-2 tracking-wide uppercase">
          {label}
        </span>
      </div>
    </AbsoluteFill>
  );
};
