import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export interface BarChartAnimationProps {
  title?: string;
  labels?: string; // Comma-separated: 'Mon,Tue,Wed,Thu,Fri'
  values?: string; // Comma-separated: '45,85,60,95,70'
  barColor?: string;
  textColor?: string;
}

export const BarChartAnimation: React.FC<BarChartAnimationProps> = ({
  title = 'Pertumbuhan Viewers 7 Hari',
  labels = 'Sen,Sel,Rab,Kam,Jum,Sab,Min',
  values = '35,55,42,88,64,95,78',
  barColor = '#E50914',
  textColor = '#FFFFFF',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelList = labels.split(',');
  const valueList = values.split(',').map((v) => Number(v.trim()) || 0);
  const maxValue = Math.max(...valueList, 100);

  const containerEntrance = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9 },
  });

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center p-8 select-none pointer-events-none">
      <div
        style={{
          transform: `scale(${0.8 + containerEntrance * 0.2}) translateY(${(1 - containerEntrance) * 40}px)`,
          opacity: containerEntrance,
        }}
        className="w-full max-w-md bg-gradient-to-b from-[#1a1a24]/90 to-[#101016]/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl"
      >
        {/* Title */}
        <h3 style={{ color: textColor }} className="text-lg font-bold tracking-tight mb-6 text-center">
          {title}
        </h3>

        {/* Bars Container */}
        <div className="flex items-end justify-between gap-3 h-48 px-2 pb-2 bg-gradient-to-t from-white/[0.04] to-transparent rounded-b-2xl">
          {valueList.map((val, idx) => {
            const delay = 6 + idx * 4;
            const barSpring = spring({
              frame: frame - delay,
              fps,
              config: { damping: 12, mass: 0.7, stiffness: 140 },
            });

            const heightPercent = (val / maxValue) * 100;
            const animatedHeight = barSpring * heightPercent;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                {/* Value tooltip label */}
                <span
                  style={{ opacity: barSpring }}
                  className="text-[10px] font-mono font-bold text-zinc-300 mb-1"
                >
                  {Math.round(val * barSpring)}%
                </span>

                {/* Animated Bar */}
                <div
                  style={{
                    height: `${animatedHeight}%`,
                    backgroundColor: barColor,
                    boxShadow: `0 0 12px ${barColor}60`,
                  }}
                  className="w-full rounded-t-lg transition-all"
                />

                {/* X-axis Label */}
                <span className="text-[11px] font-medium text-zinc-400 mt-2 truncate max-w-full">
                  {labelList[idx] || `${idx + 1}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
