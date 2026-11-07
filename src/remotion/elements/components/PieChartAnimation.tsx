import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export interface PieChartAnimationProps {
  percentage?: number;
  label?: string;
  sliceColor?: string;
  trackColor?: string;
}

export const PieChartAnimation: React.FC<PieChartAnimationProps> = ({
  percentage = 78,
  label = 'Retention Rate',
  sliceColor = '#E50914',
  trackColor = '#27272A',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const progress = spring({
    frame: frame - 5,
    fps,
    config: { damping: 15, mass: 1 },
  });

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const currentPercentage = Math.round(percentage * Math.max(0, progress));
  const strokeDashoffset = circumference - (currentPercentage / 100) * circumference;

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center p-8 select-none pointer-events-none">
      <div
        style={{
          transform: `scale(${0.8 + entrance * 0.2})`,
          opacity: entrance,
        }}
        className="flex flex-col items-center bg-gradient-to-b from-[#1c1c24]/90 to-[#101016]/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl"
      >
        {/* Circular Gauge */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={trackColor}
              strokeWidth="14"
              fill="transparent"
            />
            {/* Animated Gauge Slice */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={sliceColor}
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                filter: `drop-shadow(0 0 10px ${sliceColor}80)`,
              }}
            />
          </svg>

          {/* Centered Percentage Number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white font-mono">
              {currentPercentage}%
            </span>
          </div>
        </div>

        {/* Caption Label */}
        <span className="text-sm font-bold text-zinc-300 mt-4 tracking-wide uppercase">
          {label}
        </span>
      </div>
    </AbsoluteFill>
  );
};
