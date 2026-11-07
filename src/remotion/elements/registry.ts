import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { RemotionElementDefinition } from './types';
import { AnimatedTitle } from './components/AnimatedTitle';
import { KineticTypography } from './components/KineticTypography';
import { ModernLowerThird } from './components/ModernLowerThird';
import { SubtitleAnimation } from './components/SubtitleAnimation';
import { GradientBackground } from './components/GradientBackground';
import { AnimatedShapes } from './components/AnimatedShapes';
import { BarChartAnimation } from './components/BarChartAnimation';
import { PieChartAnimation } from './components/PieChartAnimation';
import { ProgressIndicator } from './components/ProgressIndicator';
import { CalloutAnnotation } from './components/CalloutAnnotation';
import { NumberCounter } from './components/NumberCounter';
import { SectionTransition } from './components/SectionTransition';
import { TimelineClip, TimelineData } from '../../types';

export const INSTALLED_ELEMENTS_STORAGE_KEY = 'males_ngonten_installed_elements';

export const BUILTIN_ELEMENTS: RemotionElementDefinition[] = [
  {
    slug: 'animated-title',
    displayName: 'Animated Title',
    category: 'Animated Typography',
    tags: ['title', 'headline', 'intro', 'typography', 'spring'],
    description: 'Judul beranimasi modern dengan spring damping, dynamic divider line, dan ambient glow.',
    dimensions: { width: 1080, height: 1920 },
    durationInFrames: 90,
    fps: 30,
    dependencies: [{ name: 'remotion', version: null }],
    initialProps: {
      title: 'MALES NGONTEN',
      subtitle: 'Next-Gen Video Coding Engine',
      accentColor: '#E50914',
      fontSize: 64,
    },
    propsSchema: [
      { name: 'title', label: 'Teks Judul Utama', type: 'text', defaultValue: 'MALES NGONTEN' },
      { name: 'subtitle', label: 'Teks Subjudul', type: 'text', defaultValue: 'Next-Gen Video Coding Engine' },
      { name: 'accentColor', label: 'Warna Aksen', type: 'color', defaultValue: '#E50914' },
      { name: 'fontSize', label: 'Ukuran Font (px)', type: 'number', defaultValue: 64, min: 28, max: 120, step: 2 },
    ],
    sourceCode: `import React from 'react';
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

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center p-8 select-none pointer-events-none">
      <div className="flex flex-col items-center text-center max-w-[90%]">
        <h1
          style={{
            fontSize: \`\${fontSize}px\`,
            opacity: titleEntrance,
            transform: \`scale(\${0.7 + titleEntrance * 0.3}) translateY(\${(1 - titleEntrance) * 30}px)\`,
            textShadow: \`0 0 16px \${accentColor}80, 0 10px 25px rgba(0,0,0,0.8)\`,
          }}
          className="font-black tracking-tight text-white uppercase leading-none font-sans"
        >
          {title}
        </h1>
        <div
          style={{
            transform: \`scaleX(\${lineScale})\`,
            backgroundColor: accentColor,
            boxShadow: \`0 0 16px \${accentColor}\`,
          }}
          className="h-1.5 w-32 rounded-full my-4 origin-center"
        />
        <p
          style={{
            opacity: Math.max(0, subtitleEntrance),
            transform: \`translateY(\${(1 - Math.max(0, subtitleEntrance)) * 20}px)\`,
          }}
          className="text-lg sm:text-2xl font-semibold tracking-wide text-zinc-300 drop-shadow-md"
        >
          {subtitle}
        </p>
      </div>
    </AbsoluteFill>
  );
};`,
    component: AnimatedTitle,
  },
  {
    slug: 'kinetic-typography',
    displayName: 'Kinetic Typography',
    category: 'Animated Typography',
    tags: ['kinetic', 'words', 'impact', 'hook', 'viral'],
    description: 'Animasi teks kata per kata dengan rotasi dinamis dan penekanan warna kata kunci.',
    dimensions: { width: 1080, height: 1920 },
    durationInFrames: 75,
    fps: 30,
    dependencies: [{ name: 'remotion', version: null }],
    initialProps: {
      words: 'CREATE VIRAL SHORTS FASTER',
      highlightWord: 'VIRAL',
      fontSize: 58,
      color: '#FFFFFF',
      highlightColor: '#FF2A4D',
    },
    propsSchema: [
      { name: 'words', label: 'Rangkaian Kata', type: 'text', defaultValue: 'CREATE VIRAL SHORTS FASTER' },
      { name: 'highlightWord', label: 'Kata yang Disorot', type: 'text', defaultValue: 'VIRAL' },
      { name: 'fontSize', label: 'Ukuran Font', type: 'number', defaultValue: 58, min: 24, max: 96, step: 2 },
      { name: 'color', label: 'Warna Teks Biasa', type: 'color', defaultValue: '#FFFFFF' },
      { name: 'highlightColor', label: 'Warna Sorotan', type: 'color', defaultValue: '#FF2A4D' },
    ],
    sourceCode: `import React from 'react';
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
          const wordSpring = spring({ frame: frame - delay, fps, config: { damping: 10, mass: 0.6, stiffness: 180 } });
          const isHighlight = w.toLowerCase() === highlightWord.toLowerCase();
          const rotation = interpolate(wordSpring, [0, 1], [(idx % 2 === 0 ? -12 : 12), 0]);

          return (
            <span
              key={\`\${w}-\${idx}\`}
              style={{
                fontSize: \`\${fontSize}px\`,
                opacity: wordSpring,
                transform: \`scale(\${0.4 + wordSpring * 0.6}) rotate(\${rotation}deg)\`,
                color: isHighlight ? highlightColor : color,
              }}
              className="font-black uppercase tracking-tighter inline-block"
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};`,
    component: KineticTypography,
  },
  {
    slug: 'modern-lower-third',
    displayName: 'Modern Lower Third',
    category: 'Lower Thirds',
    tags: ['lower third', 'name badge', 'speaker', 'interview'],
    description: 'Nama dan jabatan presenter/pembicara beranimasi kaca gelap dengan accent line.',
    dimensions: { width: 1080, height: 1920 },
    durationInFrames: 100,
    fps: 30,
    dependencies: [{ name: 'remotion', version: null }],
    initialProps: {
      name: 'Alex Pratama',
      role: 'AI Creative Director',
      badgeText: 'MALES NGONTEN',
      accentColor: '#E50914',
      textColor: '#FFFFFF',
    },
    propsSchema: [
      { name: 'name', label: 'Nama Lengkap', type: 'text', defaultValue: 'Alex Pratama' },
      { name: 'role', label: 'Peran / Jabatan', type: 'text', defaultValue: 'AI Creative Director' },
      { name: 'badgeText', label: 'Badge Label', type: 'text', defaultValue: 'MALES NGONTEN' },
      { name: 'accentColor', label: 'Warna Aksen', type: 'color', defaultValue: '#E50914' },
      { name: 'textColor', label: 'Warna Teks', type: 'color', defaultValue: '#FFFFFF' },
    ],
    sourceCode: `import React from 'react';
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

  const slideIn = spring({ frame, fps, config: { damping: 14, mass: 0.8, stiffness: 120 } });
  const barExpand = spring({ frame: frame - 4, fps, config: { damping: 16, mass: 0.9 } });
  const textFade = interpolate(frame, [8, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill className="p-8 flex flex-col justify-end pointer-events-none select-none">
      <div style={{ transform: \`translateX(\${(1 - slideIn) * -120}px)\`, opacity: slideIn }} className="flex items-stretch gap-3.5 max-w-[92%]">
        <div style={{ transform: \`scaleY(\${barExpand})\`, backgroundColor: accentColor }} className="w-2 rounded-full origin-bottom" />
        <div className="flex flex-col justify-center bg-gradient-to-r from-black/90 to-zinc-950/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl">
          {badgeText && <span className="text-[11px] font-bold text-zinc-400 font-mono mb-1">{badgeText}</span>}
          <div style={{ opacity: textFade }} className="flex flex-col">
            <h2 style={{ color: textColor }} className="text-xl sm:text-2xl font-black leading-none">{name}</h2>
            <p className="text-xs sm:text-sm font-semibold text-zinc-300 mt-1">{role}</p>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};`,
    component: ModernLowerThird,
  },
  {
    slug: 'subtitle-animation',
    displayName: 'Subtitle Animation',
    category: 'Captions & Subtitles',
    tags: ['subtitles', 'karaoke', 'captions', 'tiktok', 'reels'],
    description: 'Animasi subtitle bergaya TikTok dengan pembesaran dan warna kata aktif.',
    dimensions: { width: 1080, height: 1920 },
    durationInFrames: 120,
    fps: 30,
    dependencies: [{ name: 'remotion', version: null }],
    initialProps: {
      text: 'AI yang bikin video ini otomatis dari prompt teks',
      highlightColor: '#FFD700',
      fontSize: 38,
    },
    propsSchema: [
      { name: 'text', label: 'Teks Subtitle', type: 'text', defaultValue: 'AI yang bikin video ini otomatis dari prompt teks' },
      { name: 'highlightColor', label: 'Warna Kata Aktif', type: 'color', defaultValue: '#FFD700' },
      { name: 'fontSize', label: 'Ukuran Font', type: 'number', defaultValue: 38, min: 20, max: 64, step: 2 },
    ],
    sourceCode: `import React from 'react';
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
  const framesPerWord = Math.max(8, Math.round(fps / 2.5));
  const activeWordIdx = Math.min(words.length - 1, Math.floor(frame / framesPerWord));

  return (
    <AbsoluteFill className="flex flex-col justify-end items-center pb-20 px-6 select-none pointer-events-none">
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-[90%] bg-gradient-to-r from-black/85 via-zinc-950/85 to-black/85 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl">
        {words.map((w, idx) => {
          const isActive = idx === activeWordIdx;
          const wordFrame = frame - idx * framesPerWord;
          const bounce = spring({ frame: wordFrame, fps, config: { damping: 9, mass: 0.5, stiffness: 200 } });
          return (
            <span
              key={\`\${w}-\${idx}\`}
              style={{
                fontSize: \`\${fontSize}px\`,
                color: isActive ? highlightColor : '#FFFFFF',
                transform: isActive ? \`scale(\${1 + bounce * 0.18}) translateY(-2px)\` : 'scale(1)',
              }}
              className="font-black tracking-tight"
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};`,
    component: SubtitleAnimation,
  },
  {
    slug: 'gradient-background',
    displayName: 'Gradient Background',
    category: 'Backgrounds',
    tags: ['background', 'gradient', 'mesh', 'ambient', 'dark'],
    description: 'Background gradasi dinamis berputar halus dengan partikel ambient cair.',
    dimensions: { width: 1080, height: 1920 },
    durationInFrames: 150,
    fps: 30,
    dependencies: [{ name: 'remotion', version: null }],
    initialProps: {
      color1: '#3A030A',
      color2: '#E50914',
      color3: '#0D0507',
      speed: 1.0,
    },
    propsSchema: [
      { name: 'color1', label: 'Warna Primer', type: 'color', defaultValue: '#3A030A' },
      { name: 'color2', label: 'Warna Aksen Bersinar', type: 'color', defaultValue: '#E50914' },
      { name: 'color3', label: 'Warna Sekunder Gelap', type: 'color', defaultValue: '#0D0507' },
      { name: 'speed', label: 'Kecepatan Rotasi', type: 'number', defaultValue: 1.0, min: 0.2, max: 3.0, step: 0.1 },
    ],
    sourceCode: `import React from 'react';
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
      <div style={{ background: \`linear-gradient(\${angle}deg, \${color1} 0%, \${color3} 100%)\` }} className="w-full h-full absolute inset-0" />
      <div
        style={{
          left: \`\${pulseX}%\`,
          top: \`\${pulseY}%\`,
          transform: 'translate(-50%, -50%)',
          background: \`radial-gradient(circle at center, \${color2}80 0%, transparent 65%)\`,
        }}
        className="absolute w-[120%] h-[120%] blur-3xl pointer-events-none opacity-70 mix-blend-screen"
      />
    </AbsoluteFill>
  );
};`,
    component: GradientBackground,
  },
  {
    slug: 'animated-shapes',
    displayName: 'Animated Shapes',
    category: 'Shapes & Decorative Elements',
    tags: ['shapes', 'geometric', 'motion', 'decorations', 'abstract'],
    description: 'Elemen grafis abstrak (lingkaran, cincin putar, plus) yang mengambang lembut.',
    dimensions: { width: 1080, height: 1920 },
    durationInFrames: 120,
    fps: 30,
    dependencies: [{ name: 'remotion', version: null }],
    initialProps: {
      primaryColor: '#E50914',
      secondaryColor: '#FF8A00',
      scale: 1.0,
    },
    propsSchema: [
      { name: 'primaryColor', label: 'Warna Bentuk Primer', type: 'color', defaultValue: '#E50914' },
      { name: 'secondaryColor', label: 'Warna Bentuk Sekunder', type: 'color', defaultValue: '#FF8A00' },
      { name: 'scale', label: 'Skala Ukuran', type: 'number', defaultValue: 1.0, min: 0.5, max: 2.0, step: 0.1 },
    ],
    sourceCode: `import React from 'react';
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
  const entrance = spring({ frame, fps, config: { damping: 12, mass: 0.9 } });
  const rot1 = (frame * 1.5) % 360;
  const floatY = Math.sin(frame / 15) * 20;

  return (
    <AbsoluteFill className="pointer-events-none select-none overflow-hidden">
      <div
        style={{ transform: \`scale(\${entrance * scale}) rotate(\${rot1}deg) translateY(\${floatY}px)\`, background: \`radial-gradient(circle at 40% 40%, \${primaryColor}cc 0%, \${primaryColor}22 65%, transparent 70%)\` }}
        className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full opacity-75 shadow-lg"
      />
      <div
        style={{ transform: \`scale(\${entrance * scale}) translateY(\${floatY * 1.4}px)\`, background: \`linear-gradient(135deg, \${primaryColor}, \${secondaryColor})\` }}
        className="absolute bottom-1/3 left-1/3 w-28 h-10 rounded-full shadow-lg opacity-80"
      />
    </AbsoluteFill>
  );
};`,
    component: AnimatedShapes,
  },
  {
    slug: 'bar-chart-animation',
    displayName: 'Bar Chart Animation',
    category: 'Charts & Data Visualization',
    tags: ['chart', 'data', 'infographic', 'analytics', 'bar'],
    description: 'Grafik batang statistik beranimasi tumbuh dengan angka persentase dinamis.',
    dimensions: { width: 1080, height: 1920 },
    durationInFrames: 100,
    fps: 30,
    dependencies: [{ name: 'remotion', version: null }],
    initialProps: {
      title: 'Pertumbuhan Viewers 7 Hari',
      labels: 'Sen,Sel,Rab,Kam,Jum,Sab,Min',
      values: '35,55,42,88,64,95,78',
      barColor: '#E50914',
      textColor: '#FFFFFF',
    },
    propsSchema: [
      { name: 'title', label: 'Judul Grafik', type: 'text', defaultValue: 'Pertumbuhan Viewers 7 Hari' },
      { name: 'labels', label: 'Label Sumbu X (koma)', type: 'text', defaultValue: 'Sen,Sel,Rab,Kam,Jum,Sab,Min' },
      { name: 'values', label: 'Nilai Bar (0-100 koma)', type: 'text', defaultValue: '35,55,42,88,64,95,78' },
      { name: 'barColor', label: 'Warna Batang', type: 'color', defaultValue: '#E50914' },
      { name: 'textColor', label: 'Warna Teks', type: 'color', defaultValue: '#FFFFFF' },
    ],
    sourceCode: `import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export interface BarChartAnimationProps {
  title?: string;
  labels?: string;
  values?: string;
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
  const containerEntrance = spring({ frame, fps, config: { damping: 14, mass: 0.9 } });

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center p-8 select-none pointer-events-none">
      <div style={{ transform: \`scale(\${0.8 + containerEntrance * 0.2})\`, opacity: containerEntrance }} className="w-full max-w-md bg-gradient-to-b from-[#181822]/90 to-black/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl">
        <h3 style={{ color: textColor }} className="text-lg font-bold mb-6 text-center">{title}</h3>
        <div className="flex items-end justify-between gap-3 h-48 px-2 pb-2 bg-white/5 rounded-2xl">
          {valueList.map((val, idx) => {
            const barSpring = spring({ frame: frame - (6 + idx * 4), fps, config: { damping: 12, mass: 0.7, stiffness: 140 } });
            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-[10px] font-mono font-bold text-zinc-300 mb-1">{Math.round(val * barSpring)}%</span>
                <div style={{ height: \`\${(val / maxValue) * 100 * barSpring}%\`, backgroundColor: barColor }} className="w-full rounded-t-lg" />
                <span className="text-[11px] text-zinc-400 mt-2">{labelList[idx] || \`\${idx + 1}\`}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};`,
    component: BarChartAnimation,
  },
  {
    slug: 'pie-chart-animation',
    displayName: 'Pie Chart Animation',
    category: 'Charts & Data Visualization',
    tags: ['pie chart', 'donut', 'statistics', 'percentage'],
    description: 'Gauge donut melingkar dengan animasi putaran SVG dan persentase di tengah.',
    dimensions: { width: 1080, height: 1920 },
    durationInFrames: 90,
    fps: 30,
    dependencies: [{ name: 'remotion', version: null }],
    initialProps: {
      percentage: 78,
      label: 'Retention Rate',
      sliceColor: '#E50914',
      trackColor: '#27272A',
    },
    propsSchema: [
      { name: 'percentage', label: 'Persentase (0-100)', type: 'number', defaultValue: 78, min: 0, max: 100, step: 1 },
      { name: 'label', label: 'Label Judul', type: 'text', defaultValue: 'Retention Rate' },
      { name: 'sliceColor', label: 'Warna Lingkaran Nilai', type: 'color', defaultValue: '#E50914' },
      { name: 'trackColor', label: 'Warna Latar Lintasan', type: 'color', defaultValue: '#27272A' },
    ],
    sourceCode: `import React from 'react';
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
  const progress = spring({ frame: frame - 5, fps, config: { damping: 15, mass: 1 } });
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const currentPercentage = Math.round(percentage * Math.max(0, progress));
  const strokeDashoffset = circumference - (currentPercentage / 100) * circumference;

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center p-8 select-none pointer-events-none">
      <div className="flex flex-col items-center bg-gradient-to-b from-[#181822]/90 to-black/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl">
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={radius} stroke={trackColor} strokeWidth="14" fill="transparent" />
            <circle cx="80" cy="80" r={radius} stroke={sliceColor} strokeWidth="14" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" fill="transparent" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white font-mono">{currentPercentage}%</span>
          </div>
        </div>
        <span className="text-sm font-bold text-zinc-300 mt-4 tracking-wide uppercase">{label}</span>
      </div>
    </AbsoluteFill>
  );
};`,
    component: PieChartAnimation,
  },
  {
    slug: 'progress-indicator',
    displayName: 'Progress Indicator',
    category: 'Infographics',
    tags: ['progress', 'loading', 'bar', 'timer'],
    description: 'Indikator bilah progres modern dengan efek cahaya berkilau dan label aksi.',
    dimensions: { width: 1080, height: 1920 },
    durationInFrames: 90,
    fps: 30,
    dependencies: [{ name: 'remotion', version: null }],
    initialProps: {
      progress: 85,
      label: 'Generating Final 4K Render...',
      barColor: '#E50914',
      height: 12,
    },
    propsSchema: [
      { name: 'progress', label: 'Tingkat Progres (0-100)', type: 'number', defaultValue: 85, min: 0, max: 100, step: 1 },
      { name: 'label', label: 'Teks Status', type: 'text', defaultValue: 'Generating Final 4K Render...' },
      { name: 'barColor', label: 'Warna Bar Progres', type: 'color', defaultValue: '#E50914' },
      { name: 'height', label: 'Tinggi Bar (px)', type: 'number', defaultValue: 12, min: 6, max: 24, step: 2 },
    ],
    sourceCode: `import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export interface ProgressIndicatorProps {
  progress?: number;
  label?: string;
  barColor?: string;
  height?: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress = 85,
  label = 'Generating Final 4K Render...',
  barColor = '#E50914',
  height = 12,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const anim = spring({ frame, fps, config: { damping: 16, mass: 1 } });
  const currentVal = Math.round(progress * Math.max(0, anim));

  return (
    <AbsoluteFill className="flex flex-col justify-end items-center pb-16 px-8 select-none pointer-events-none">
      <div className="w-full max-w-lg bg-gradient-to-r from-black/90 via-zinc-900/90 to-black/90 backdrop-blur-md p-5 rounded-2xl shadow-2xl space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
          <span className="text-zinc-200">{label}</span>
          <span className="font-mono text-white font-bold">{currentVal}%</span>
        </div>
        <div style={{ height: \`\${height}px\` }} className="w-full bg-zinc-800 rounded-full overflow-hidden p-0.5">
          <div style={{ width: \`\${currentVal}%\`, backgroundColor: barColor }} className="h-full rounded-full transition-all duration-75 relative overflow-hidden" />
        </div>
      </div>
    </AbsoluteFill>
  );
};`,
    component: ProgressIndicator,
  },
  {
    slug: 'callout-annotation',
    displayName: 'Callout Annotation',
    category: 'Infographics',
    tags: ['callout', 'annotation', 'pin', 'highlight', 'pointer'],
    description: 'Pin penunjuk berdenyut dengan kotak kartu informasi untuk menyorot objek video.',
    dimensions: { width: 1080, height: 1920 },
    durationInFrames: 90,
    fps: 30,
    dependencies: [{ name: 'remotion', version: null }],
    initialProps: {
      title: 'Tombol Kunci',
      detail: 'Tekan untuk render instan',
      x: 50,
      y: 45,
      pinColor: '#E50914',
    },
    propsSchema: [
      { name: 'title', label: 'Judul Callout', type: 'text', defaultValue: 'Tombol Kunci' },
      { name: 'detail', label: 'Keterangan Detail', type: 'text', defaultValue: 'Tekan untuk render instan' },
      { name: 'x', label: 'Posisi X (%)', type: 'number', defaultValue: 50, min: 10, max: 90, step: 1 },
      { name: 'y', label: 'Posisi Y (%)', type: 'number', defaultValue: 45, min: 10, max: 90, step: 1 },
      { name: 'pinColor', label: 'Warna Pin', type: 'color', defaultValue: '#E50914' },
    ],
    sourceCode: `import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export interface CalloutAnnotationProps {
  title?: string;
  detail?: string;
  x?: number;
  y?: number;
  pinColor?: string;
}

export const CalloutAnnotation: React.FC<CalloutAnnotationProps> = ({
  title = 'Tombol Kunci',
  detail = 'Tekan untuk render instan',
  x = 50,
  y = 45,
  pinColor = '#E50914',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });

  return (
    <AbsoluteFill className="pointer-events-none select-none">
      <div
        style={{
          position: 'absolute',
          left: \`\${x}%\`,
          top: \`\${y}%\`,
          transform: \`translate(-50%, -50%) scale(\${0.7 + entrance * 0.3})\`,
          opacity: entrance,
        }}
        className="flex items-center gap-3"
      >
        <div className="relative flex items-center justify-center">
          <div style={{ backgroundColor: pinColor }} className="w-4 h-4 rounded-full shadow-lg z-10" />
        </div>
        <div className="bg-gradient-to-r from-zinc-900/90 to-black/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl flex flex-col min-w-[140px]">
          <span className="text-xs font-bold text-white tracking-tight">{title}</span>
          <span className="text-[11px] font-medium text-zinc-300 mt-0.5">{detail}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};`,
    component: CalloutAnnotation,
  },
  {
    slug: 'number-counter',
    displayName: 'Number Counter',
    category: 'Infographics',
    tags: ['counter', 'numbers', 'followers', 'views', 'metrics'],
    description: 'Penghitung angka naik bertingkat (views, subscribers, metrik) dengan easing spring.',
    dimensions: { width: 1080, height: 1920 },
    durationInFrames: 80,
    fps: 30,
    dependencies: [{ name: 'remotion', version: null }],
    initialProps: {
      targetNumber: 1250000,
      prefix: '+',
      suffix: ' Views',
      label: 'Total Interaksi Bulan Ini',
      color: '#E50914',
    },
    propsSchema: [
      { name: 'targetNumber', label: 'Angka Sasaran', type: 'number', defaultValue: 1250000, min: 1, max: 100000000, step: 1000 },
      { name: 'prefix', label: 'Awalan (Prefix)', type: 'text', defaultValue: '+' },
      { name: 'suffix', label: 'Akhiran (Suffix)', type: 'text', defaultValue: ' Views' },
      { name: 'label', label: 'Deskripsi Metrik', type: 'text', defaultValue: 'Total Interaksi Bulan Ini' },
      { name: 'color', label: 'Warna Angka', type: 'color', defaultValue: '#E50914' },
    ],
    sourceCode: `import React from 'react';
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
  const countProgress = spring({ frame: frame - 4, fps, config: { damping: 18, mass: 1 } });
  const currentNum = Math.round(targetNumber * Math.max(0, countProgress));

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center p-8 select-none pointer-events-none">
      <div className="flex flex-col items-center text-center bg-gradient-to-b from-[#181822]/90 to-black/95 backdrop-blur-md px-8 py-6 rounded-3xl shadow-2xl">
        <span style={{ color }} className="text-4xl sm:text-5xl font-black font-mono tracking-tight">
          {prefix}{currentNum.toLocaleString('id-ID')}{suffix}
        </span>
        <span className="text-sm font-semibold text-zinc-300 mt-2 uppercase">{label}</span>
      </div>
    </AbsoluteFill>
  );
};`,
    component: NumberCounter,
  },
  {
    slug: 'section-transition',
    displayName: 'Section Transition',
    category: 'Transitions',
    tags: ['transition', 'wipe', 'chapter', 'curtain', 'scene'],
    description: 'Transisi tirai wipe dinamis dengan teks bab berikutnya untuk membagi segmen video.',
    dimensions: { width: 1080, height: 1920 },
    durationInFrames: 60,
    fps: 30,
    dependencies: [{ name: 'remotion', version: null }],
    initialProps: {
      title: 'NEXT CHAPTER',
      color: '#E50914',
      direction: 'up',
    },
    propsSchema: [
      { name: 'title', label: 'Teks Bab / Judul Segmen', type: 'text', defaultValue: 'NEXT CHAPTER' },
      { name: 'color', label: 'Warna Tirai Transisi', type: 'color', defaultValue: '#E50914' },
      { name: 'direction', label: 'Arah Transisi', type: 'select', defaultValue: 'up', options: ['up', 'down', 'left', 'right'] },
    ],
    sourceCode: `import React from 'react';
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
  const half = Math.floor(durationInFrames / 2);
  const wipeIn = spring({ frame, fps, config: { damping: 15, mass: 0.8 } });
  const wipeOut = spring({ frame: frame - half, fps, config: { damping: 15, mass: 0.8 } });

  const inVal = interpolate(wipeIn, [0, 1], [100, 0]);
  const outVal = interpolate(Math.max(0, wipeOut), [0, 1], [0, -100]);
  const translateY = \`\${inVal + outVal}%\`;

  return (
    <AbsoluteFill className="overflow-hidden pointer-events-none select-none">
      <div style={{ transform: \`translate3d(0, \${translateY}, 0)\`, background: \`linear-gradient(135deg, \${color} 0%, #111114 100%)\` }} className="w-full h-full flex flex-col items-center justify-center p-8 shadow-2xl">
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-widest uppercase text-center font-mono">{title}</h2>
      </div>
    </AbsoluteFill>
  );
};`,
    component: SectionTransition,
  },
];

export const USER_ELEMENTS_STORAGE_KEY = 'males_ngonten_user_elements';

/**
 * Universal dynamic Remotion renderer for user-created custom elements
 */
export function createUserComponent(
  initialProps: Record<string, any>,
  animationType: string = 'zoom'
): React.FC<any> {
  const UserComponent: React.FC<any> = (props) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const anim = spring({ frame, fps, config: { damping: 14, mass: 0.8, stiffness: 130 } });

    const text = props.text ?? initialProps.text ?? props.title ?? initialProps.title ?? 'Custom Element';
    const subtitle = props.subtitle ?? initialProps.subtitle ?? '';
    const color = props.color ?? initialProps.color ?? '#FFFFFF';
    const backgroundColor = props.backgroundColor ?? initialProps.backgroundColor ?? '#E50914';
    const fontSize = props.fontSize ?? initialProps.fontSize ?? 48;
    const animMode = props.animation ?? initialProps.animation ?? animationType;

    let transform = `scale(${0.7 + anim * 0.3})`;
    if (animMode === 'fade') {
      transform = 'none';
    } else if (animMode === 'slide-up') {
      transform = `translateY(${(1 - anim) * 45}px)`;
    } else if (animMode === 'bounce') {
      transform = `scale(${anim * 1.05})`;
    }

    return React.createElement(
      AbsoluteFill,
      { className: 'flex flex-col items-center justify-center p-8 select-none pointer-events-none' },
      React.createElement(
        'div',
        {
          style: {
            transform,
            opacity: anim,
            background: backgroundColor
              ? `linear-gradient(135deg, ${backgroundColor}ee 0%, #111116 100%)`
              : 'transparent',
            color,
            fontSize: `${fontSize}px`,
            textShadow: '0 4px 16px rgba(0,0,0,0.8)',
          },
          className: 'px-6 py-4 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-[88%]',
        },
        React.createElement(
          'span',
          { className: 'font-black tracking-tight leading-tight uppercase font-sans' },
          text
        ),
        subtitle
          ? React.createElement(
              'span',
              { className: 'text-sm font-semibold opacity-90 mt-2 font-sans tracking-wide' },
              subtitle
            )
          : null
      )
    );
  };
  return UserComponent;
}

/**
 * Get installed element slugs from localStorage
 */
export function getInstalledElementSlugs(): string[] {
  try {
    const raw = localStorage.getItem(INSTALLED_ELEMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return ['animated-title', 'gradient-background'];
}

/**
 * Save installed element slugs to localStorage
 */
export function saveInstalledElementSlugs(slugs: string[]): void {
  try {
    localStorage.setItem(INSTALLED_ELEMENTS_STORAGE_KEY, JSON.stringify(slugs));
  } catch {}
}

/**
 * Get user-created custom elements from localStorage
 */
export function getUserElements(): RemotionElementDefinition[] {
  try {
    const raw = localStorage.getItem(USER_ELEMENTS_STORAGE_KEY);
    if (raw) {
      const parsed: any[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          ...item,
          category: item.category || 'Komponen Pengguna',
          isUserCreated: true,
          isInstalled: true,
          component: createUserComponent(item.initialProps, item.initialProps?.animation || 'zoom'),
        }));
      }
    }
  } catch (e) {
    console.error('Failed to parse user elements:', e);
  }
  return [];
}

/**
 * Save a new user-created element to localStorage
 */
export function saveUserElement(element: RemotionElementDefinition): void {
  try {
    const current = getUserElements();
    // Exclude component function before saving JSON
    const serializable = {
      ...element,
      component: undefined,
      isUserCreated: true,
      isInstalled: true,
    };
    const updated = [serializable, ...current.filter((e) => e.slug !== element.slug)];
    localStorage.setItem(USER_ELEMENTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save user element:', e);
  }
}

/**
 * Delete a user-created element from localStorage
 */
export function deleteUserElement(slug: string): void {
  try {
    const current = getUserElements();
    const updated = current.filter((e) => e.slug !== slug);
    localStorage.setItem(USER_ELEMENTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete user element:', e);
  }
}

/**
 * Factory helper: Create a brand new RemotionElementDefinition from an active timeline clip!
 */
export function createUserElementFromClip(
  clip: TimelineClip,
  displayName: string,
  category: any = 'Komponen Pengguna',
  description?: string
): RemotionElementDefinition {
  const slug = `user-el-${Date.now()}`;
  const initialProps: Record<string, any> = {
    text: clip.props?.text || clip.name || 'Custom Element',
    subtitle: clip.props?.subtitle || '',
    color: clip.props?.color || '#FFFFFF',
    backgroundColor: clip.props?.backgroundColor || '#E50914',
    fontSize: clip.props?.fontSize || 48,
    animation: clip.props?.animation || 'zoom',
    ...(clip.elementProps || {}),
  };

  const desc =
    description?.trim() ||
    `Komponen buatan pengguna yang disimpan langsung dari klip "${clip.name}" di video aktif.`;

  const sourceCode = `import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export interface ${displayName.replace(/[^a-zA-Z0-9]/g, '')}Props {
  text?: string;
  subtitle?: string;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
}

export const ${displayName.replace(/[^a-zA-Z0-9]/g, '')}: React.FC<${displayName.replace(/[^a-zA-Z0-9]/g, '')}Props> = ({
  text = ${JSON.stringify(initialProps.text)},
  subtitle = ${JSON.stringify(initialProps.subtitle)},
  color = ${JSON.stringify(initialProps.color)},
  backgroundColor = ${JSON.stringify(initialProps.backgroundColor)},
  fontSize = ${initialProps.fontSize},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const anim = spring({ frame, fps, config: { damping: 14, mass: 0.8, stiffness: 130 } });

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center p-8 select-none pointer-events-none">
      <div
        style={{
          transform: \`scale(\${0.7 + anim * 0.3})\`,
          opacity: anim,
          background: backgroundColor
            ? \`linear-gradient(135deg, \${backgroundColor}ee 0%, #111116 100%)\`
            : 'transparent',
          color,
          fontSize: \`\${fontSize}px\`,
          textShadow: '0 4px 16px rgba(0,0,0,0.8)',
        }}
        className="px-6 py-4 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-[88%]"
      >
        <span className="font-black tracking-tight leading-tight uppercase font-sans">
          {text}
        </span>
        {subtitle && (
          <span className="text-sm font-semibold opacity-90 mt-2 font-sans tracking-wide">
            {subtitle}
          </span>
        )}
      </div>
    </AbsoluteFill>
  );
};`;

  const element: RemotionElementDefinition = {
    slug,
    displayName,
    category,
    tags: ['user', 'custom', 'video-clip'],
    description: desc,
    dimensions: { width: 1080, height: 1920 },
    durationInFrames: clip.duration || 90,
    fps: 30,
    dependencies: [{ name: 'remotion', version: null }],
    initialProps,
    propsSchema: [
      { name: 'text', label: 'Teks Utama', type: 'text', defaultValue: initialProps.text },
      { name: 'subtitle', label: 'Teks Subtitle', type: 'text', defaultValue: initialProps.subtitle },
      { name: 'color', label: 'Warna Teks', type: 'color', defaultValue: initialProps.color },
      { name: 'backgroundColor', label: 'Warna Latar', type: 'color', defaultValue: initialProps.backgroundColor },
      { name: 'fontSize', label: 'Ukuran Font (px)', type: 'number', defaultValue: initialProps.fontSize, min: 20, max: 120, step: 2 },
    ],
    sourceCode,
    component: createUserComponent(initialProps, initialProps.animation),
    isUserCreated: true,
    isInstalled: true,
  };

  return element;
}

/**
 * Get all available elements (built-in + user-created) with installation flag
 */
export function getAllElements(): RemotionElementDefinition[] {
  const installed = new Set(getInstalledElementSlugs());
  const builtins = BUILTIN_ELEMENTS.map((el) => ({
    ...el,
    isInstalled: installed.has(el.slug),
    isUserCreated: false,
  }));
  const userEls = getUserElements();

  return [...userEls, ...builtins];
}

/**
 * Get a single element definition by slug
 */
export function getElementBySlug(slug: string): RemotionElementDefinition | undefined {
  const elements = getAllElements();
  return elements.find((el) => el.slug === slug);
}

/**
 * Helper to create a TimelineClip for an element
 */
export function createElementTimelineClip(
  element: RemotionElementDefinition,
  fromFrame: number = 0,
  customProps?: Record<string, any>
): TimelineClip {
  return {
    id: `clip-el-${element.slug}-${Date.now()}`,
    name: element.displayName,
    from: fromFrame,
    duration: element.durationInFrames,
    elementSlug: element.slug,
    elementProps: {
      ...element.initialProps,
      ...customProps,
    },
    props: {
      text: element.displayName,
      ...element.initialProps,
      ...customProps,
    },
  };
}
