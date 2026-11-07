import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export interface SubtitleAnimationProps {
  text?: string;
  highlightColor?: string;
  fontSize?: number;
}

export const SubtitleAnimation: React.FC<SubtitleAnimationProps> = ({
  text = 'AI yang bikin video ini otomatis dari prompt teks',
  highlightColor = '#FFD700',
  fontSize = 38,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = text.split(' ');
  const wordsPerSecond = 2.5;
  const framesPerWord = Math.max(8, Math.round(fps / wordsPerSecond));
  const activeWordIdx = Math.min(words.length - 1, Math.floor(frame / framesPerWord));

  return (
    <AbsoluteFill className="flex flex-col justify-end items-center pb-20 px-6 select-none pointer-events-none">
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-[90%] bg-gradient-to-b from-[#181820]/90 to-[#0e0e14]/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl">
        {words.map((w, idx) => {
          const isActive = idx === activeWordIdx;
          const wordFrame = frame - idx * framesPerWord;
          const bounce = spring({
            frame: wordFrame,
            fps,
            config: { damping: 9, mass: 0.5, stiffness: 200 },
          });

          return (
            <span
              key={`${w}-${idx}`}
              style={{
                fontSize: `${fontSize}px`,
                color: isActive ? highlightColor : '#FFFFFF',
                transform: isActive ? `scale(${1 + bounce * 0.18}) translateY(-2px)` : 'scale(1)',
                textShadow: isActive
                  ? `0 0 16px ${highlightColor}90, 0 4px 12px rgba(0,0,0,0.9)`
                  : '0 2px 8px rgba(0,0,0,0.8)',
              }}
              className={`font-black tracking-tight transition-all duration-100 ${
                isActive ? 'underline decoration-2 underline-offset-4' : 'opacity-85'
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
