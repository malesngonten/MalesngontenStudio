import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export interface ModernLowerThirdProps {
  name?: string;
  role?: string;
  badgeText?: string;
  accentColor?: string;
  textColor?: string;
}

export const ModernLowerThird: React.FC<ModernLowerThirdProps> = ({
  name = 'Alex Pratama',
  role = 'AI Creative Director',
  badgeText = 'MALES NGONTEN',
  accentColor = '#E50914',
  textColor = '#FFFFFF',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 120 },
  });

  const barExpand = spring({
    frame: frame - 4,
    fps,
    config: { damping: 16, mass: 0.9 },
  });

  const textFade = interpolate(frame, [8, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill className="p-8 flex flex-col justify-end pointer-events-none select-none">
      <div
        style={{
          transform: `translateX(${(1 - slideIn) * -120}px)`,
          opacity: slideIn,
        }}
        className="flex items-stretch gap-3.5 max-w-[92%]"
      >
        {/* Accent Bar */}
        <div
          style={{
            transform: `scaleY(${barExpand})`,
            backgroundColor: accentColor,
            boxShadow: `0 0 20px ${accentColor}80`,
          }}
          className="w-2 rounded-full origin-bottom"
        />

        {/* Content Box */}
        <div className="flex flex-col justify-center bg-gradient-to-b from-[#1c1c24]/90 to-[#121218]/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl">
          {badgeText && (
            <div className="flex items-center gap-1.5 mb-1">
              <span
                style={{ backgroundColor: accentColor }}
                className="w-2 h-2 rounded-full animate-ping"
              />
              <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 font-mono">
                {badgeText}
              </span>
            </div>
          )}

          <div
            style={{ opacity: textFade }}
            className="flex flex-col"
          >
            <h2
              style={{ color: textColor }}
              className="text-xl sm:text-2xl font-black tracking-tight leading-none"
            >
              {name}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-zinc-300 mt-1">
              {role}
            </p>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
