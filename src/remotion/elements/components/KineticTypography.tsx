import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export interface KineticTypographyProps {
  words?: string;
  highlightWord?: string;
  fontSize?: number;
  color?: string;
  highlightColor?: string;
}

export const KineticTypography: React.FC<KineticTypographyProps> = ({
  words = 'CREATE VIRAL SHORTS FASTER',
  highlightWord = 'VIRAL',
  fontSize = 58,
  color = '#FFFFFF',
  highlightColor = '#FF2A4D',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wordArray = words.split(' ');

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center p-6 select-none pointer-events-none">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 max-w-[85%] text-center">
        {wordArray.map((w, idx) => {
          const delay = idx * 6;
          const wordSpring = spring({
            frame: frame - delay,
            fps,
            config: { damping: 10, mass: 0.6, stiffness: 180 },
          });

          const isHighlight = w.toLowerCase() === highlightWord.toLowerCase();
          const rotation = interpolate(wordSpring, [0, 1], [(idx % 2 === 0 ? -12 : 12), 0]);

          return (
            <span
              key={`${w}-${idx}`}
              style={{
                fontSize: `${fontSize}px`,
                opacity: wordSpring,
                transform: `scale(${0.4 + wordSpring * 0.6}) rotate(${rotation}deg) translateY(${(1 - wordSpring) * 20}px)`,
                color: isHighlight ? highlightColor : color,
                textShadow: isHighlight
                  ? `0 0 24px ${highlightColor}90, 0 6px 20px rgba(0,0,0,0.9)`
                  : '0 4px 18px rgba(0,0,0,0.8)',
              }}
              className={`font-black uppercase tracking-tighter inline-block ${
                isHighlight ? 'px-3 py-0.5 rounded-xl bg-white/10 backdrop-blur-xs' : ''
              }`}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
