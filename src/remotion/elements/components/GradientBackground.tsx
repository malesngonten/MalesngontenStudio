import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export interface GradientBackgroundProps {
  color1?: string;
  color2?: string;
  color3?: string;
  speed?: number;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  color1 = '#3A030A',
  color2 = '#E50914',
  color3 = '#0D0507',
  speed = 1.0,
}) => {
  const frame = useCurrentFrame();

  const angle = (frame * speed * 1.5) % 360;
  const pulseX = 50 + Math.sin((frame * speed) / 20) * 25;
  const pulseY = 50 + Math.cos((frame * speed) / 25) * 20;

  return (
    <AbsoluteFill className="overflow-hidden select-none">
      {/* Base Canvas Gradient */}
      <div
        style={{
          background: `linear-gradient(${angle}deg, ${color1} 0%, ${color3} 100%)`,
        }}
        className="w-full h-full absolute inset-0 transition-all"
      />

      {/* Floating Ambient Fluid Spheres */}
      <div
        style={{
          left: `${pulseX}%`,
          top: `${pulseY}%`,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle at center, ${color2}80 0%, transparent 65%)`,
        }}
        className="absolute w-[120%] h-[120%] blur-3xl pointer-events-none opacity-70 mix-blend-screen"
      />

      <div
        style={{
          right: `${100 - pulseX}%`,
          bottom: `${100 - pulseY}%`,
          transform: 'translate(50%, 50%)',
          background: `radial-gradient(ellipse at center, ${color1}90 0%, transparent 70%)`,
        }}
        className="absolute w-[100%] h-[100%] blur-2xl pointer-events-none opacity-60"
      />
    </AbsoluteFill>
  );
};
