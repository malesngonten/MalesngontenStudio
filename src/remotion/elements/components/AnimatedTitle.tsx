import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export interface AnimatedTitleProps {
  title?: string;
  subtitle?: string;
  accentColor?: string;
  fontSize?: number;
}

export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({
  title = 'MALES NGONTEN',
  subtitle = 'Next-Gen Video Coding Engine',
  accentColor = '#E50914',
  fontSize = 64,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring entrance animations
  const titleEntrance = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.8, stiffness: 120 },
  });

  const subtitleEntrance = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, mass: 1 },
  });

  const lineScale = interpolate(frame, [5, 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const glowPulse = Math.sin(frame / 12) * 8 + 16;

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center p-8 select-none pointer-events-none">
      {/* Container */}
      <div className="flex flex-col items-center text-center max-w-[90%]">
        {/* Main Title */}
        <h1
          style={{
            fontSize: `${fontSize}px`,
            opacity: titleEntrance,
            transform: `scale(${0.7 + titleEntrance * 0.3}) translateY(${(1 - titleEntrance) * 30}px)`,
            textShadow: `0 0 ${glowPulse}px ${accentColor}80, 0 10px 25px rgba(0,0,0,0.8)`,
          }}
          className="font-black tracking-tight text-white uppercase leading-none font-sans"
        >
          {title}
        </h1>

        {/* Dynamic Divider Accent Line */}
        <div
          style={{
            transform: `scaleX(${lineScale})`,
            backgroundColor: accentColor,
            boxShadow: `0 0 16px ${accentColor}`,
          }}
          className="h-1.5 w-32 rounded-full my-4 origin-center transition-transform"
        />

        {/* Subtitle */}
        <p
          style={{
            opacity: Math.max(0, subtitleEntrance),
            transform: `translateY(${(1 - Math.max(0, subtitleEntrance)) * 20}px)`,
          }}
          className="text-lg sm:text-2xl font-semibold tracking-wide text-zinc-300 drop-shadow-md"
        >
          {subtitle}
        </p>
      </div>
    </AbsoluteFill>
  );
};
