import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export interface SectionTransitionProps {
  title?: string;
  color?: string;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export const SectionTransition: React.FC<SectionTransitionProps> = ({
  title = 'NEXT CHAPTER',
  color = '#E50914',
  direction = 'up',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Wipe in during first half, wipe out during second half
  const half = Math.floor(durationInFrames / 2);

  const wipeIn = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.8 },
  });

  const wipeOut = spring({
    frame: frame - half,
    fps,
    config: { damping: 15, mass: 0.8 },
  });

  let translateY = '0%';
  let translateX = '0%';

  if (direction === 'up') {
    const inVal = interpolate(wipeIn, [0, 1], [100, 0]);
    const outVal = interpolate(Math.max(0, wipeOut), [0, 1], [0, -100]);
    translateY = `${inVal + outVal}%`;
  } else if (direction === 'down') {
    const inVal = interpolate(wipeIn, [0, 1], [-100, 0]);
    const outVal = interpolate(Math.max(0, wipeOut), [0, 1], [0, 100]);
    translateY = `${inVal + outVal}%`;
  } else if (direction === 'left') {
    const inVal = interpolate(wipeIn, [0, 1], [100, 0]);
    const outVal = interpolate(Math.max(0, wipeOut), [0, 1], [0, -100]);
    translateX = `${inVal + outVal}%`;
  } else {
    const inVal = interpolate(wipeIn, [0, 1], [-100, 0]);
    const outVal = interpolate(Math.max(0, wipeOut), [0, 1], [0, 100]);
    translateX = `${inVal + outVal}%`;
  }

  return (
    <AbsoluteFill className="overflow-hidden pointer-events-none select-none">
      {/* Wipe Curtain */}
      <div
        style={{
          transform: `translate3d(${translateX}, ${translateY}, 0)`,
          background: `linear-gradient(135deg, ${color} 0%, #111114 100%)`,
        }}
        className="w-full h-full flex flex-col items-center justify-center p-8 shadow-2xl relative"
      >
        {/* Decorative Lines */}
        <div className="w-16 h-1 rounded-full bg-white/40 mb-4" />
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-widest uppercase text-center drop-shadow-xl font-mono">
          {title}
        </h2>
        <div className="w-16 h-1 rounded-full bg-white/40 mt-4" />
      </div>
    </AbsoluteFill>
  );
};
