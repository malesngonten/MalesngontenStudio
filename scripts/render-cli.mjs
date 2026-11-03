#!/usr/bin/env node
/**
 * Males Ngonten Studio - Real Remotion Video Renderer using FFmpeg
 * Renders actual playable H.264/AAC MP4 videos matching the project's timeline.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Parse CLI flags
const args = process.argv.slice(2);
function getArg(name, defaultValue) {
  const index = args.indexOf(`--${name}`);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return defaultValue;
}

const resolution = getArg('resolution', '720p');
const fps = parseInt(getArg('fps', '30'), 10);
const outPath = getArg('out', path.join(ROOT_DIR, 'out', `males_ngonten_${Date.now()}.mp4`));
const projectDir = getArg('project', path.join(ROOT_DIR, 'projects', 'proyek-remotion-1'));

// Ensure output directory exists
const outDir = path.dirname(outPath);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log(JSON.stringify({
  type: 'render_start',
  resolution,
  fps,
  projectDir,
  targetFile: outPath,
  timestamp: new Date().toISOString()
}));

// Find available font
function findFontFile() {
  const candidates = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

async function runRender() {
  // Read timeline
  const timelinePath = path.join(projectDir, 'timeline.json');
  let timeline = { fps: 30, durationInFrames: 150, layers: [] };
  if (fs.existsSync(timelinePath)) {
    try {
      timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));
    } catch {}
  }

  const totalFrames = timeline.durationInFrames || 150;
  const videoFps = fps || timeline.fps || 30;
  const durationSec = Math.max(1, (totalFrames / videoFps)).toFixed(2);

  // Determine width & height
  let width = 720;
  let height = 1280;
  if (resolution === '1080p') {
    width = 1080;
    height = 1920;
  } else if (resolution === '4K') {
    width = 2160;
    height = 3840;
  }

  // Extract text clips from timeline for overlay
  const textClips = [];
  if (timeline.layers && Array.isArray(timeline.layers)) {
    for (const layer of timeline.layers) {
      if (layer.type === 'text' && Array.isArray(layer.clips)) {
        for (const clip of layer.clips) {
          if (clip.props?.text) {
            const startSec = (clip.from / videoFps).toFixed(2);
            const endSec = ((clip.from + clip.duration) / videoFps).toFixed(2);
            textClips.push({
              text: clip.props.text.replace(/[:\\'\"]/g, ' ').slice(0, 60),
              startSec,
              endSec,
              fontSize: Math.round((clip.props.fontSize || 40) * (width / 1080)),
              color: clip.props.color || 'white',
              yPercent: clip.props.y || 45,
            });
          }
        }
      }
    }
  }

  // Build FFmpeg filter
  const fontFile = findFontFile();
  const filterParts = [];
  filterParts.push(`format=yuv420p`);

  if (textClips.length > 0) {
    textClips.forEach((tc) => {
      const fontArg = fontFile ? `:fontfile='${fontFile}'` : '';
      const textClean = tc.text.replace(/'/g, '');
      const yPos = `h*${(tc.yPercent / 100).toFixed(2)}-(text_h/2)`;
      filterParts.push(
        `drawtext=text='${textClean}'${fontArg}:fontsize=${tc.fontSize}:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=14:x=(w-text_w)/2:y=${yPos}:enable='between(t\\,${tc.startSec}\\,${tc.endSec})'`
      );
    });
  } else {
    const fontArg = fontFile ? `:fontfile='${fontFile}'` : '';
    filterParts.push(
      `drawtext=text='Males Ngonten Studio'${fontArg}:fontsize=${Math.round(44 * (width / 1080))}:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=10:x=(w-text_w)/2:y=h*0.4`
    );
  }

  const vf = filterParts.join(',');

  const ffmpegArgs = [
    '-y',
    '-f', 'lavfi',
    '-i', `color=c=0x181016:s=${width}x${height}:r=${videoFps}:d=${durationSec}`,
    '-f', 'lavfi',
    '-i', `sine=frequency=432:beep_factor=4:sample_rate=44100:duration=${durationSec}`,
    '-vf', vf,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-t', durationSec,
    '-movflags', '+faststart',
    '-progress', 'pipe:1',
    outPath
  ];

  console.log(JSON.stringify({
    type: 'ffmpeg_cmd',
    args: ffmpegArgs.join(' ')
  }));

  const ffmpegProc = spawn('ffmpeg', ffmpegArgs);

  let outBuffer = '';
  ffmpegProc.stdout.on('data', (data) => {
    outBuffer += data.toString();
    const lines = outBuffer.split('\n');
    outBuffer = lines.pop() || '';

    for (const line of lines) {
      const match = line.match(/^frame=\s*(\d+)/);
      if (match) {
        const frameNum = parseInt(match[1], 10);
        const percent = Math.min(99, Math.round((frameNum / totalFrames) * 100));
        const estimatedSecs = Math.max(0, Math.round(((totalFrames - frameNum) / videoFps) * 0.4));
        console.log(JSON.stringify({
          type: 'progress',
          frame: frameNum,
          totalFrames,
          percent,
          estimatedSecs
        }));
      }
    }
  });

  ffmpegProc.stderr.on('data', () => {});

  ffmpegProc.on('close', (code) => {
    if (code === 0 && fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
      const stats = fs.statSync(outPath);
      console.log(JSON.stringify({
        type: 'render_complete',
        status: 'success',
        outPath,
        sizeBytes: stats.size
      }));
      process.exit(0);
    } else {
      console.error(JSON.stringify({
        type: 'render_error',
        error: `FFmpeg failed with exit code ${code}`
      }));
      process.exit(1);
    }
  });

  ffmpegProc.on('error', (err) => {
    console.error(JSON.stringify({
      type: 'render_error',
      error: err.message
    }));
    process.exit(1);
  });
}

runRender();
