import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export interface AnimatedShapesProps {
  primaryColor?: string;
  secondaryColor?: string;
  scale?: number;
}

export const AnimatedShapes: React.FC<AnimatedShapesProps> = ({
  primaryColor = '#E50914',
  secondaryColor = '#FF8A00',
  scale = 1.0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.9 },
  });

  const rot1 = (frame * 1.5) % 360;
  const rot2 = (-frame * 2) % 360;
  const floatY = Math.sin(frame / 15) * 20;

  return (
    <AbsoluteFill className="pointer-events-none select-none overflow-hidden">
      {/* Floating Geometric Shapes */}
      {/* Ring 1 */}
      <div
        style={{
          transform: `scale(${entrance * scale}) rotate(${rot1}deg) translateY(${floatY}px)`,
          background: `radial-gradient(circle, transparent 55%, ${primaryColor} 60%, transparent 68%)`,
          opacity: 0.65,
        }}
        className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full"
      />

      {/* Cross / Plus */}
      <div
        style={{
          transform: `scale(${entrance * scale}) rotate(${rot2}deg) translateY(${-floatY}px)`,
          opacity: 0.7,
        }}
        className="absolute top-1/3 right-1/4 w-16 h-16 flex items-center justify-center"
      >
        <div style={{ backgroundColor: secondaryColor }} className="absolute w-full h-3 rounded-full" />
        <div style={{ backgroundColor: secondaryColor }} className="absolute h-full w-3 rounded-full" />
      </div>

      {/* Floating Pill */}
      <div
        style={{
          transform: `scale(${entrance * scale}) rotate(${rot1 * 0.7}deg) translateY(${floatY * 1.4}px)`,
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          opacity: 0.8,
        }}
        className="absolute bottom-1/3 left-1/3 w-28 h-10 rounded-full shadow-lg"
      />

      {/* Square Ring */}
      <div
        style={{
          transform: `scale(${entrance * scale}) rotate(${rot2 * 0.8}deg) translateY(${-floatY * 0.8}px)`,
          background: `linear-gradient(135deg, ${secondaryColor}60, transparent)`,
          opacity: 0.5,
        }}
        className="absolute bottom-1/4 right-1/3 w-24 h-24 rounded-2xl"
      />
    </AbsoluteFill>
  );
};
