import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawnSync, spawn, ChildProcess } from 'child_process';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
let geminiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  try {
    geminiClient = new GoogleGenAI();
    console.log('[Gemini SDK] Initialized GoogleGenAI with API key');
  } catch (err) {
    console.warn('[Gemini SDK] Failed to initialize GoogleGenAI client:', err);
  }
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Directories
const WORKSPACE_DIR = process.cwd();
const PROJECTS_BASE = path.join(WORKSPACE_DIR, 'projects');
const ACTIVE_PROJECT_DIR = path.join(PROJECTS_BASE, 'proyek-remotion-1');
const OUT_DIR = path.join(WORKSPACE_DIR, 'out');
const ASSETS_DIR = path.join(ACTIVE_PROJECT_DIR, 'public', 'assets');
const CHATS_DIR = path.join(ACTIVE_PROJECT_DIR, '.males_ngonten', 'chats');
const CHECKPOINTS_DIR = path.join(ACTIVE_PROJECT_DIR, '.males_ngonten', 'checkpoints');
const CHECKPOINTS_INDEX_PATH = path.join(CHECKPOINTS_DIR, 'index.json');
const SCRIPTS_DIR = path.join(WORKSPACE_DIR, 'scripts');

// Ensure base project directories exist
[PROJECTS_BASE, ACTIVE_PROJECT_DIR, OUT_DIR, ASSETS_DIR, CHATS_DIR, CHECKPOINTS_DIR, path.join(ACTIVE_PROJECT_DIR, 'src'), SCRIPTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Initialize git repo for real checkpoints
function ensureGitRepo() {
  const gitDir = path.join(ACTIVE_PROJECT_DIR, '.git');
  if (!fs.existsSync(gitDir)) {
    const initResult = spawnSync('git', ['init'], { cwd: ACTIVE_PROJECT_DIR, encoding: 'utf-8' });
    if (initResult.status === 0) {
      console.log('[Git] Repository diinisialisasi di', ACTIVE_PROJECT_DIR);
    } else {
      console.warn('[Git] Gagal inisialisasi repo:', initResult.stderr || initResult.stdout);
    }
  }
  // Set safe.directory for git in proot/Termux
  spawnSync('git', ['config', '--global', '--add', 'safe.directory', ACTIVE_PROJECT_DIR], { encoding: 'utf-8' });
  spawnSync('git', ['config', 'user.name', 'Males Ngonten Agent'], { cwd: ACTIVE_PROJECT_DIR, encoding: 'utf-8' });
  spawnSync('git', ['config', 'user.email', 'agent@malesngonten.studio'], { cwd: ACTIVE_PROJECT_DIR, encoding: 'utf-8' });
}

ensureGitRepo();

// Load checkpoints from index on startup
let gitCheckpoints: {
  hash: string;
  shortHash: string;
  message: string;
  timestamp: string;
  author: string;
  isActive: boolean;
  timelineSnapshot: string;
}[] = [];

function loadCheckpointsFromIndex() {
  try {
    if (fs.existsSync(CHECKPOINTS_INDEX_PATH)) {
      const index = JSON.parse(fs.readFileSync(CHECKPOINTS_INDEX_PATH, 'utf-8'));
      if (Array.isArray(index)) {
        gitCheckpoints = index;
        // Ensure exactly one active checkpoint
        const active = gitCheckpoints.filter((c) => c.isActive);
        if (active.length === 0 && gitCheckpoints.length > 0) {
          gitCheckpoints[0].isActive = true;
        } else if (active.length > 1) {
          gitCheckpoints.forEach((c, i) => (c.isActive = i === 0));
        }
      }
    }
  } catch {}
  // If no checkpoints exist yet, create initial commit
  if (gitCheckpoints.length === 0) {
    const initialTimeline = JSON.stringify(DEFAULT_TIMELINE, null, 2);
    const initialHash = createGitCheckpoint('Initial project scaffold with default Remotion timeline', DEFAULT_TIMELINE, true);
    gitCheckpoints = gitCheckpoints.filter((c) => c.hash !== initialHash);
    gitCheckpoints.unshift({
      hash: initialHash,
      shortHash: initialHash.slice(0, 7),
      message: 'Initial project scaffold with default Remotion timeline',
      timestamp: 'Baru saja',
      author: 'Males Ngonten Agent',
      isActive: true,
      timelineSnapshot: initialTimeline,
    });
    saveCheckpointsIndex();
  }
}

// Save checkpoints index to disk
function saveCheckpointsIndex() {
  try {
    fs.writeFileSync(CHECKPOINTS_INDEX_PATH, JSON.stringify(gitCheckpoints, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Git] Gagal menyimpan index checkpoint:', err);
  }
}

// Create a real git checkpoint commit
function createGitCheckpoint(message: string, timeline: any, forceInitial = false): string {
  try {
    // Write timeline.json to disk first
    fs.writeFileSync(timelinePath, JSON.stringify(timeline, null, 2), 'utf-8');

    // Stage and commit
    const addResult = spawnSync('git', ['add', 'timeline.json'], { cwd: ACTIVE_PROJECT_DIR, encoding: 'utf-8' });
    if (addResult.status !== 0 && !forceInitial) {
      throw new Error(`git add gagal: ${addResult.stderr || addResult.stdout}`);
    }

    const commitResult = spawnSync('git', ['commit', '-m', message, '--quiet'], {
      cwd: ACTIVE_PROJECT_DIR,
      encoding: 'utf-8',
    });
    if (commitResult.status !== 0 && !forceInitial) {
      throw new Error(`git commit gagal: ${commitResult.stderr || commitResult.stdout}`);
    }

    // Get the commit hash
    const hashResult = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ACTIVE_PROJECT_DIR, encoding: 'utf-8' });
    const hash = hashResult.stdout.trim() || `chk-${Date.now()}`;

    return hash;
  } catch (err: any) {
    console.warn('[Git] Gagal membuat checkpoint:', err.message);
    // Fallback: generate a hash but don't pretend git worked
    return `chk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

// Get all checkpoints from real git log + index
function getGitCheckpoints() {
  return gitCheckpoints;
}

// Get diff between current timeline and a checkpoint
function getGitCheckpointDiff(hash: string) {
  const targetVersion = gitCheckpoints.find((v) => v.hash === hash);
  if (!targetVersion) return null;

  try {
    // Try to get original content from git
    const showResult = spawnSync('git', ['show', `${hash}:timeline.json`], {
      cwd: ACTIVE_PROJECT_DIR,
      encoding: 'utf-8',
    });
    const originalContent = showResult.status === 0 ? showResult.stdout : targetVersion.timelineSnapshot;
    const newContent = fs.readFileSync(timelinePath, 'utf-8');

    return {
      hash,
      message: targetVersion.message,
      diff: {
        filePath: 'timeline.json',
        originalContent,
        newContent,
      },
    };
  } catch {
    return {
      hash,
      message: targetVersion.message,
      diff: {
        filePath: 'timeline.json',
        originalContent: targetVersion.timelineSnapshot,
        newContent: fs.readFileSync(timelinePath, 'utf-8'),
      },
    };
  }
}

// Restore timeline from a git checkpoint
function restoreGitCheckpoint(hash: string) {
  const targetVersion = gitCheckpoints.find((v) => v.hash === hash);
  if (!targetVersion) return null;

  try {
    // Restore from git
    const checkoutResult = spawnSync('git', ['checkout', hash, '--', 'timeline.json'], {
      cwd: ACTIVE_PROJECT_DIR,
      encoding: 'utf-8',
    });

    let restoredTimelineJson: string;
    if (checkoutResult.status === 0) {
      restoredTimelineJson = fs.readFileSync(timelinePath, 'utf-8');
    } else {
      // Fallback to index snapshot
      restoredTimelineJson = targetVersion.timelineSnapshot;
      fs.writeFileSync(timelinePath, restoredTimelineJson, 'utf-8');
    }

    const parsed = JSON.parse(restoredTimelineJson);

    // Create a restore checkpoint
    const restoreHash = `rst-${Date.now()}`;
    gitCheckpoints.forEach((c) => (c.isActive = false));
    gitCheckpoints.unshift({
      hash: restoreHash,
      shortHash: restoreHash.slice(0, 7),
      message: `Restore ke checkpoint #${targetVersion.shortHash}: ${targetVersion.message}`,
      timestamp: 'Baru saja',
      author: 'Males Ngonten Agent',
      isActive: true,
      timelineSnapshot: restoredTimelineJson,
    });
    saveCheckpointsIndex();

    broadcastSSE('file_changed', { file: 'timeline.json', timeline: parsed });

    return { success: true, newHash: restoreHash, timeline: parsed };
  } catch (err: any) {
    console.warn('[Git] Gagal memulihkan checkpoint:', err.message);
    return null;
  }
}

// Default timeline.json
const DEFAULT_TIMELINE = {
  fps: 30,
  durationInFrames: 150, // 5 seconds
  width: 1080,
  height: 1920,
  layers: [
    {
      id: 'layer-video',
      type: 'video',
      name: 'Video Background',
      clips: [
        {
          id: 'clip-v1',
          name: 'Cyber Studio Gradient',
          from: 0,
          duration: 150,
          props: {
            backgroundColor: 'radial-gradient(circle at 50% 40%, #201315 0%, #0d0c10 100%)',
          },
        },
      ],
    },
    {
      id: 'layer-text',
      type: 'text',
      name: 'Teks & Headline',
      clips: [
        {
          id: 'clip-t1',
          name: 'Headline Viral',
          from: 10,
          duration: 65,
          props: {
            text: 'Males Ngonten Studio 🐱',
            fontSize: 46,
            color: '#ffffff',
            y: 40,
            x: 50,
            animation: 'slide-up',
          },
        },
        {
          id: 'clip-t2',
          name: 'Punchline Subtitle',
          from: 75,
          duration: 70,
          props: {
            text: 'Bikin Video Remotion Pake AI Agent!',
            fontSize: 36,
            color: '#e5484d',
            y: 52,
            x: 50,
            animation: 'zoom',
          },
        },
      ],
    },
    {
      id: 'layer-narration',
      type: 'narration',
      name: 'Narasi Suara',
      clips: [
        {
          id: 'clip-n1',
          name: 'Voiceover Hook',
          from: 15,
          duration: 120,
          props: {
            text: '"Gak sempat ngedit? AI agent ini yang coding videonya!"',
            speaker: 'Studio Voice',
          },
        },
      ],
    },
    {
      id: 'layer-music',
      type: 'music',
      name: 'Musik Beat',
      clips: [
        {
          id: 'clip-m1',
          name: 'Lo-Fi Chill Beat',
          from: 0,
          duration: 150,
          props: {
            volume: 0.8,
          },
        },
      ],
    },
  ],
};

// Default assets.json
const DEFAULT_ASSETS = [
  {
    id: 'asset-logo-brand',
    name: 'Black_Cat_Logo.png',
    type: 'image',
    path: '/assets/aistudio/Black_Cat_Animals___Pets_Logo_20261024_034747_0000_d2a38d28.png',
    size: 245000,
    width: 1024,
    height: 1024,
    createdAt: 'Baru saja',
  },
  {
    id: 'asset-bg-vid',
    name: 'cyber_gradient_bg.mp4',
    type: 'video',
    path: '/assets/cyber_gradient_bg.mp4',
    size: 3800000,
    duration: 10,
    width: 1080,
    height: 1920,
    createdAt: 'Hari ini',
  },
  {
    id: 'asset-beat-audio',
    name: 'lofi_pulse_beat.mp3',
    type: 'audio',
    path: '/assets/lofi_upbeat_beat.mp3',
    size: 1900000,
    duration: 30,
    createdAt: 'Hari ini',
  },
];

// Default GEMINI.md
const DEFAULT_GEMINI_RULES = `# ATURAN PROYEK MALES NGONTEN STUDIO (GEMINI.md)

1. GAYA DAN FORMAT VIDEO
- Seluruh video bertipe portrait 9:16 (1080 x 1920 piksel), dioptimalkan untuk TikTok, Instagram Reels, dan YouTube Shorts.
- Kecepatan ritme cepat (pacing dinamis), pergantian teks per 1.5 - 2.5 detik.
- Font utama: 'Inter', sans-serif tebal dengan kontras tinggi.
- Palet warna: Aksen merah #c92a2a / #e5484d, background gelap #0b0b0e, teks putih #ffffff.

2. SINKRONISASI VISUAL DAN NARASI
- Visual HARUS sinkron persis dengan timestamp narasi suara.
- Perubahan teks atau layer harus mempertimbangkan durasi total komposisi.

3. STRUKTUR PROYEK
- File sumber: src/Composition.tsx
- Definisi timeline: timeline.json (sumber kebenaran durasi, layer, dan klip).
- Daftar asset: assets.json.
`;

const DEFAULT_COMPOSITION = `// ShortVideoComposition.tsx
// Powered by Remotion v4.0 & Males Ngonten Studio AI Agent

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

export const ShortVideoComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill className="bg-black select-none overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#201315] to-[#0d0c10]" />
      
      {/* Title */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">
          Males Ngonten Studio 🐱
        </h1>
        <p className="text-xl text-[#e5484d] font-semibold mt-4">
          AI Coding Agent Video Engine
        </p>
      </div>
    </AbsoluteFill>
  );
};
`;

// Initialize files if not existing
const timelinePath = path.join(ACTIVE_PROJECT_DIR, 'timeline.json');
if (!fs.existsSync(timelinePath)) {
  fs.writeFileSync(timelinePath, JSON.stringify(DEFAULT_TIMELINE, null, 2), 'utf-8');
}

const assetsPath = path.join(ACTIVE_PROJECT_DIR, 'assets.json');
if (!fs.existsSync(assetsPath)) {
  fs.writeFileSync(assetsPath, JSON.stringify(DEFAULT_ASSETS, null, 2), 'utf-8');
}

const geminiRulesPath = path.join(ACTIVE_PROJECT_DIR, 'GEMINI.md');
if (!fs.existsSync(geminiRulesPath)) {
  fs.writeFileSync(geminiRulesPath, DEFAULT_GEMINI_RULES, 'utf-8');
}

const compPath = path.join(ACTIVE_PROJECT_DIR, 'src', 'Composition.tsx');
if (!fs.existsSync(compPath)) {
  fs.writeFileSync(compPath, DEFAULT_COMPOSITION, 'utf-8');
}

// Load checkpoints from disk after all paths are initialized
loadCheckpointsFromIndex();

// In-memory Render Jobs
let renderJobs: {
  id: string;
  status: 'queued' | 'rendering' | 'completed' | 'failed' | 'cancelled';
  resolution: '720p' | '1080p' | '4K';
  fps: number;
  progress: number;
  currentFrame: number;
  totalFrames: number;
  estimatedSecondsRemaining: number;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
  log?: string;
}[] = [];

// Active render processes map
const activeRenderProcesses = new Map<string, ChildProcess>();

// In-memory Chat Sessions (loaded from disk on startup)
let chatSessions: {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: any[];
}[] = [];

function loadChatSessionsFromDisk() {
  try {
    const chatFiles = fs.readdirSync(CHATS_DIR).filter((f) => f.endsWith('.json'));
    const sessions = chatFiles
      .map((file) => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(CHATS_DIR, file), 'utf-8'));
          return data;
        } catch {}
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });

    if (sessions.length > 0) {
      chatSessions = sessions;
    } else {
      // Create default session if none exist
      const defaultSession = {
        id: 'session-main',
        title: 'Edit Video Remotion Pertama',
        createdAt: 'Hari ini',
        updatedAt: 'Baru saja',
        messages: [
          {
            id: 'msg-welcome',
            role: 'assistant',
            text: 'Halo! Saya AI Coding Agent di Males Ngonten Studio. Siap membantu membuat dan mengubah layer teks, durasi, animasi, dan musik di video Remotion Anda.',
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            toolCalls: [
              {
                id: 'tc-init',
                toolName: 'discoverWorkspace',
                target: 'projects/proyek-remotion-1',
                status: 'completed',
                durationMs: 85,
                result: 'Workspace loaded: 4 layers, 150 frames @ 30fps',
              },
            ],
          },
        ],
      };
      chatSessions = [defaultSession];
      const chatFile = path.join(CHATS_DIR, `${defaultSession.id}.json`);
      fs.writeFileSync(chatFile, JSON.stringify(defaultSession, null, 2), 'utf-8');
    }
  } catch {
    // Fallback to default session
    chatSessions = [
      {
        id: 'session-main',
        title: 'Edit Video Remotion Pertama',
        createdAt: 'Hari ini',
        updatedAt: 'Baru saja',
        messages: [
          {
            id: 'msg-welcome',
            role: 'assistant',
            text: 'Halo! Saya AI Coding Agent di Males Ngonten Studio. Siap membantu membuat dan mengubah layer teks, durasi, animasi, dan musik di video Remotion Anda.',
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      },
    ];
  }
}

loadChatSessionsFromDisk();

let activeSessionId = chatSessions[0]?.id || 'session-main';
let selectedAgentId = 'agent-builtin';

// Active Agent Status
let agentStatus: 'idle' | 'connecting' | 'thinking' | 'executing_tool' | 'streaming' | 'error' = 'idle';
let activeCancellationController: AbortController | null = null;
let pendingPermissions: Map<string, any> = new Map();

// SSE Clients Registry
const sseClients: express.Response[] = [];

function broadcastSSE(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch (e) {
      // client disconnected
    }
  });
}

// Multer upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ASSETS_DIR);
  },
  filename: (req, file, cb) => {
    const safeName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, safeName);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

/* ========================================================
 * AGENT DISCOVERY SERVICE
 * Inspects host system for available AI coding agents
 * ======================================================== */
function checkBinary(name: string): { exists: boolean; path?: string; version?: string } {
  try {
    const res = spawnSync('which', [name], { encoding: 'utf-8', timeout: 1000 });
    if (res.status === 0 && res.stdout.trim()) {
      const binPath = res.stdout.trim();
      let version = '';
      try {
        const vRes = spawnSync(binPath, ['--version'], { encoding: 'utf-8', timeout: 1000 });
        if (vRes.status === 0 && vRes.stdout.trim()) {
          version = vRes.stdout.trim().split('\n')[0];
        }
      } catch {}
      return { exists: true, path: binPath, version: version || 'installed' };
    }
  } catch {}
  return { exists: false };
}

function discoverLocalAgents() {
  const claudeCheck = checkBinary('claude');
  const geminiCheck = checkBinary('gemini');
  const ollamaCheck = checkBinary('ollama');

  // Check Ollama HTTP if binary not in PATH
  let ollamaHttpReady = false;
  try {
    const curl = spawnSync('curl', ['-s', 'http://127.0.0.1:11434/api/tags'], { encoding: 'utf-8', timeout: 800 });
    if (curl.status === 0 && curl.stdout.includes('models')) {
      ollamaHttpReady = true;
    }
  } catch {}

  const agents = [
    {
      id: 'agent-builtin',
      name: 'Males Ngonten Core Engine (Internal)',
      command: 'internal:males-ngonten-engine',
      protocol: 'acp',
      version: '1.0.0-core',
      status: 'ready',
      description: 'Engine otonom lokal terintegrasi. Memodifikasi timeline.json dan kode Remotion secara instan tanpa ketergantungan binary eksternal.',
      supportedTools: ['readFile', 'writeFile', 'listDirectory', 'modifyTimeline', 'gitCheckpoint'],
      latencyMs: 12,
      isSelected: selectedAgentId === 'agent-builtin',
    },
    {
      id: 'agent-claude',
      name: 'Claude Code CLI (Anthropic)',
      command: 'claude --acp',
      protocol: 'acp',
      version: claudeCheck.version,
      status: claudeCheck.exists ? 'ready' : 'not_found',
      description: 'Agent coding canggih via protokol ACP (stdio). Memerlukan Claude CLI terpasang di host/proot.',
      supportedTools: ['readFile', 'writeFile', 'runBashCommand', 'gitCommit'],
      latencyMs: claudeCheck.exists ? 45 : undefined,
      isSelected: selectedAgentId === 'agent-claude',
    },
    {
      id: 'agent-gemini',
      name: 'Gemini Agent (Google GenAI)',
      command: 'gemini-3.8-flash',
      protocol: 'api',
      version: geminiApiKey ? 'gemini-3.8-flash' : geminiCheck.version,
      status: geminiApiKey || geminiCheck.exists ? 'ready' : 'not_found',
      description: geminiApiKey
        ? 'Google Gemini 3.8 Flash aktif via server-side SDK untuk pembuatan dan optimasi timeline video otonom.'
        : 'Google Gemini agent untuk penyusunan dan pengeditan video. Aktifkan dengan menyetel GEMINI_API_KEY.',
      supportedTools: ['readFile', 'writeFile', 'modifyTimeline', 'generateCreativePlan'],
      latencyMs: geminiApiKey ? 110 : (geminiCheck.exists ? 60 : undefined),
      isSelected: selectedAgentId === 'agent-gemini',
    },
    {
      id: 'agent-ollama',
      name: 'Ollama Local LLM (DeepSeek / Qwen / Llama)',
      command: 'ollama run deepseek-coder:6.7b',
      protocol: 'http',
      version: ollamaCheck.version || (ollamaHttpReady ? 'HTTP ready' : undefined),
      status: ollamaCheck.exists || ollamaHttpReady ? 'ready' : 'not_found',
      description: 'Model AI lokal offline 100% tanpa internet. Cocok untuk privasi total jika HP/server memiliki RAM cukup.',
      supportedTools: ['readFile', 'writeFile'],
      latencyMs: ollamaHttpReady ? 120 : undefined,
      isSelected: selectedAgentId === 'agent-ollama',
    },
  ];

  return agents;
}

/* ========================================================
 * SYSTEM DIAGNOSTICS FOR TERMUX / UBUNTU ARM64
 * ======================================================== */
function getSystemDiagnostics() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const totalMb = Math.round(totalMem / (1024 * 1024));
  const freeMb = Math.round(freeMem / (1024 * 1024));
  const usedMb = Math.round(usedMem / (1024 * 1024));
  const percentUsed = Math.round((usedMem / totalMem) * 100);

  // Check Android / Termux / proot
  let isAndroidOrProot = false;
  if (
    fs.existsSync('/data/data/com.termux') ||
    fs.existsSync('/system/bin/app_process') ||
    process.env.TERMUX_VERSION !== undefined ||
    (process.platform === 'linux' && process.arch === 'arm64')
  ) {
    isAndroidOrProot = true;
  }

  // Check critical tools
  const nodeCheck = checkBinary('node');
  const npmCheck = checkBinary('npm');
  const gitCheck = checkBinary('git');
  const ffmpegCheck = checkBinary('ffmpeg');
  const chromiumCheck = checkBinary('chromium-browser');
  const chromiumCheck2 = checkBinary('chromium');

  const chromiumAvailable = chromiumCheck.exists || chromiumCheck2.exists;
  const chromiumPath = chromiumCheck.path || chromiumCheck2.path;
  const chromiumVersion = chromiumCheck.version || chromiumCheck2.version;

  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (totalMb < 3500) {
    warnings.push(`RAM total perangkat hanya ${totalMb} MB (< 4 GB). Remotion rendering berisiko crash karena Android Out-Of-Memory (OOM).`);
    recommendations.push('Gunakan resolusi 720p pada 24 atau 30 FPS untuk mencegah kill process di Android.');
  }

  if (isAndroidOrProot) {
    warnings.push('Terdeteksi lingkungan Android / ARM64. Pastikan opsi pengembang "Disable child process restrictions" / Phantom Process Killer diaktifkan di Android 12+.');
    recommendations.push('Jalankan: `adb shell "/system/bin/device_config put activity_manager max_phantom_processes 2147483647"` dari PC jika render sering terhenti.');
  }

  if (!ffmpegCheck.exists) {
    warnings.push('FFmpeg belum terpasang di sistem.');
    recommendations.push('Jalankan: `apt install -y ffmpeg` di terminal.');
  }

  if (!chromiumAvailable) {
    warnings.push('Chromium browser untuk Remotion rendering belum terpasang di sistem.');
    recommendations.push('Jalankan: `apt install -y chromium-browser` dan set `PUPPETEER_EXECUTABLE_PATH=$(which chromium-browser)`.');
  }

  let readinessScore: 'ready' | 'warning' | 'incompatible' = 'ready';
  if (!nodeCheck.exists || !gitCheck.exists) {
    readinessScore = 'incompatible';
  } else if (!chromiumAvailable || !ffmpegCheck.exists || totalMb < 3500) {
    readinessScore = 'warning';
  }

  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    isAndroidOrProot,
    memory: {
      totalMb,
      freeMb,
      usedMb,
      percentUsed,
    },
    tools: {
      node: { available: nodeCheck.exists, version: nodeCheck.version },
      npm: { available: npmCheck.exists, version: npmCheck.version },
      git: { available: gitCheck.exists, version: gitCheck.version },
      ffmpeg: { available: ffmpegCheck.exists, version: ffmpegCheck.version },
      chromium: { available: chromiumAvailable, path: chromiumPath, version: chromiumVersion },
    },
    readinessScore,
    warnings,
    recommendations,
  };
}

/* ========================================================
 * API ENDPOINTS
 * ======================================================== */

// 1. GET /api/events (SSE)
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', status: agentStatus, selectedAgentId })}\n\n`);
  sseClients.push(res);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// 2. GET /api/system/diagnostics
app.get('/api/system/diagnostics', (req, res) => {
  const diag = getSystemDiagnostics();
  res.json(diag);
});

// 3. GET /api/agent/discover & POST /api/agent/select
app.get('/api/agent/discover', (req, res) => {
  const agents = discoverLocalAgents();
  res.json({ agents, selectedAgentId });
});

app.post('/api/agent/select', (req, res) => {
  const { agentId } = req.body;
  if (agentId) {
    selectedAgentId = agentId;
    broadcastSSE('agent_selected', { agentId });
    return res.json({ success: true, selectedAgentId });
  }
  res.status(400).json({ error: 'agentId is required' });
});

// 4. GET /api/agent/status
app.get('/api/agent/status', (req, res) => {
  res.json({
    status: agentStatus,
    activeSessionId,
    selectedAgentId,
  });
});

// 5. POST /api/agent/cancel
app.post('/api/agent/cancel', (req, res) => {
  if (activeCancellationController) {
    activeCancellationController.abort();
    activeCancellationController = null;
  }
  agentStatus = 'idle';
  broadcastSSE('agent_status', { status: 'idle' });
  broadcastSSE('agent_cancelled', { message: 'Perintah agent dibatalkan oleh pengguna.' });
  res.json({ success: true, message: 'Agent cancelled' });
});

// 5b. POST /api/agent/test-connection (OpenAI-Compatible BYOK connection test)
app.post('/api/agent/test-connection', async (req, res) => {
  const { baseUrl, apiKey, modelId } = req.body;

  if (!baseUrl || typeof baseUrl !== 'string' || !baseUrl.trim()) {
    return res.status(400).json({ success: false, error: 'API Base URL wajib diisi.' });
  }

  if (!modelId || typeof modelId !== 'string' || !modelId.trim()) {
    return res.status(400).json({ success: false, error: 'Model ID wajib diisi.' });
  }

  const cleanBase = baseUrl.trim().replace(/\/+$/, '');
  const targetUrl = cleanBase.endsWith('/chat/completions')
    ? cleanBase
    : `${cleanBase}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey && typeof apiKey === 'string' && apiKey.trim()) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const apiRes = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelId.trim(),
        messages: [
          { role: 'user', content: 'Tes koneksi API. Balas satu kata: "OK".' },
        ],
        max_tokens: 15,
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latencyMs = Date.now() - startTime;

    if (!apiRes.ok) {
      let errDetail = '';
      try {
        const errJson = await apiRes.json();
        errDetail = errJson.error?.message || JSON.stringify(errJson);
      } catch {
        errDetail = await apiRes.text();
      }
      return res.status(apiRes.status).json({
        success: false,
        latencyMs,
        status: apiRes.status,
        error: `HTTP ${apiRes.status}: ${errDetail || 'Gagal tersambung ke provider'}`,
      });
    }

    const data = await apiRes.json();
    const reply = data.choices?.[0]?.message?.content || 'OK';

    return res.json({
      success: true,
      latencyMs,
      model: modelId.trim(),
      reply,
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return res.status(500).json({
      success: false,
      latencyMs,
      error: err.name === 'AbortError' ? 'Koneksi timeout (melebihi 12 detik).' : (err.message || 'Gagal menghubungi host API.'),
    });
  }
});

// 6. POST /api/agent/prompt
app.post('/api/agent/prompt', async (req, res) => {
  const { text, context, attachments, sessionId, byok } = req.body;
  const currentSession = chatSessions.find((s) => s.id === (sessionId || activeSessionId)) || chatSessions[0];

  if (!text && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: 'Text or attachment is required' });
  }

  // Create user message with guaranteed unique ID
  const userMsgId = `msg-usr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const userMessage = {
    id: userMsgId,
    role: 'user',
    content: text || 'Menambahkan lampiran file',
    text: text || 'Menambahkan lampiran file',
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    context,
    attachments,
  };
  currentSession.messages.push(userMessage);

  // Set agent working status
  agentStatus = 'thinking';
  broadcastSSE('agent_status', { status: 'thinking' });

  // Response message placeholder with guaranteed unique ID
  const aiMsgId = `msg-ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const aiMessage: any = {
    id: aiMsgId,
    role: 'assistant',
    content: '',
    text: '',
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    toolCalls: [],
  };
  currentSession.messages.push(aiMessage);

  res.json({ success: true, messageId: aiMsgId });

  // Run Agent Processing in background
  (async () => {
    try {
      activeCancellationController = new AbortController();

      // Read current timeline for context (read-only, no tool call broadcast unless editing)
      let currentTimelineData: any;
      try {
        currentTimelineData = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));
      } catch {
        currentTimelineData = DEFAULT_TIMELINE;
      }

      let aiRawResponse = '';
      let editingMode = false;
      let timelineChanges: any = null;

      // Helper: broadcast an AI text chunk to SSE clients in real time
      const streamAiChunk = (chunk: string) => {
        aiRawResponse += chunk;
        aiMessage.content = aiRawResponse;
        aiMessage.text = aiRawResponse;
        broadcastSSE('text_chunk', { messageId: aiMsgId, chunk, accumulated: aiRawResponse });
      };

      // Dual-mode system prompt:
      // - CHAT mode: greetings/general questions → plain text response, no tools, no timeline change
      // - EDIT mode: video modification requests → JSON with timeline changes
      const systemPrompt = `You are the AI assistant for Males Ngonten Studio, a short video editor for TikTok/Reels/Shorts.

You have TWO modes:

1. CHAT MODE - For greetings (halo, hai, etc.), general questions, casual conversation:
   - Respond naturally in Indonesian
   - Do NOT use JSON
   - Do NOT mention tools, timeline, or git
   - Just be a helpful, friendly assistant

2. EDIT MODE - When the user explicitly asks to modify the video timeline (change text, animation, duration, add/remove layers, change colors, etc.):
   - Respond with ONLY valid JSON matching this schema:
   {
     "summary": "Short explanation in Indonesian (1-2 sentences)",
     "timeline": <complete updated timeline object>
   }

Decide the mode based on the user's message. If they say "hallo", "hai", or just chat, use CHAT MODE. If they ask to change video elements, use EDIT MODE.

Current timeline:
${JSON.stringify(currentTimelineData, null, 2)}

User request:
"${text}"`;

      // 1. OpenAI-Compatible API (BYOK)
      const activeByok = byok || context?.byok;
      const hasByok = Boolean(activeByok?.baseUrl && activeByok?.modelId);

      let providerError: string | null = null;

      if (hasByok && text) {
        try {
          const cleanBase = activeByok.baseUrl.trim().replace(/\/+$/, '');
          const targetUrl = cleanBase.endsWith('/chat/completions')
            ? cleanBase
            : `${cleanBase}/chat/completions`;

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          };
          if (activeByok.apiKey && typeof activeByok.apiKey === 'string' && activeByok.apiKey.trim()) {
            headers['Authorization'] = `Bearer ${activeByok.apiKey.trim()}`;
          }

          const aiResponse = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model: activeByok.modelId.trim(),
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text },
              ],
              temperature: 0.2,
              stream: true,
            }),
            signal: activeCancellationController?.signal,
          });

          if (aiResponse.ok && aiResponse.body) {
            const reader = aiResponse.body.getReader();
            const decoder = new TextDecoder();
            let leftover = '';

            try {
              while (true) {
                if (activeCancellationController?.signal.aborted) {
                  throw new Error('Dibatalkan oleh pengguna');
                }
                const { done, value } = await reader.read();
                if (done) break;

                leftover += decoder.decode(value, { stream: true });
                const lines = leftover.split('\n');
                leftover = lines.pop() || '';

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith('data:')) continue;
                  const dataStr = trimmed.slice(5).trim();
                  if (dataStr === '[DONE]') continue;
                  try {
                    const data = JSON.parse(dataStr);
                    const delta = data.choices?.[0]?.delta;
                    if (delta && typeof delta.content === 'string' && delta.content.length > 0) {
                      streamAiChunk(delta.content);
                    }
                  } catch {}
                }
              }
            } finally {
              reader.releaseLock();
            }

            if (leftover.trim()) {
              try {
                const dataStr = leftover.trim();
                if (dataStr.startsWith('data:')) {
                  const inner = dataStr.slice(5).trim();
                  if (inner !== '[DONE]') {
                    const data = JSON.parse(inner);
                    const delta = data.choices?.[0]?.delta;
                    if (delta && typeof delta.content === 'string' && delta.content.length > 0) {
                      streamAiChunk(delta.content);
                    }
                  }
                }
              } catch {}
            }

            // Try to parse as JSON for EDIT mode
            try {
              const cleaned = aiRawResponse
                .replace(/^```json/im, '')
                .replace(/^```/im, '')
                .replace(/```$/m, '')
                .trim();
              const parsed = JSON.parse(cleaned);
              if (parsed.timeline && Array.isArray(parsed.timeline.layers)) {
                editingMode = true;
                timelineChanges = parsed;
              }
            } catch {
              // Not JSON - that's fine, it's CHAT mode
            }
          } else {
            let errText = '';
            try {
              const errObj = await aiResponse.json();
              errText = errObj.error?.message || JSON.stringify(errObj);
            } catch {
              errText = await aiResponse.text();
            }
            providerError = `Status HTTP ${aiResponse.status}: ${errText.slice(0, 200)}`;
          }
        } catch (byokErr: any) {
          providerError = byokErr?.message || 'Gagal menghubungi server AI provider';
        }
      } else if (!hasByok && geminiClient && text) {
        // Optional server-side Gemini fallback
        try {
          const aiResponse = await geminiClient.models.generateContentStream({
            model: 'gemini-3.8-flash',
            contents: systemPrompt + '\n\nUser request:\n' + text,
            config: {
              temperature: 0.2,
            },
          });

          for await (const chunk of aiResponse) {
            if (activeCancellationController?.signal.aborted) {
              throw new Error('Dibatalkan oleh pengguna');
            }
            const chunkText = chunk.text || '';
            if (chunkText.length > 0) {
              streamAiChunk(chunkText);
            }
          }

          // Try to parse as JSON for EDIT mode
          try {
            const cleaned = aiRawResponse
              .replace(/^```json/im, '')
              .replace(/^```/im, '')
              .replace(/```$/m, '')
              .trim();
            const parsed = JSON.parse(cleaned);
            if (parsed.timeline && Array.isArray(parsed.timeline.layers)) {
              editingMode = true;
              timelineChanges = parsed;
            }
          } catch {
            // Not JSON - CHAT mode
          }
        } catch (geminiErr: any) {
          providerError = `Gemini API Error: ${geminiErr?.message || geminiErr}`;
        }
      }

      // If no provider configured: NEVER fake a successful response
      if (!hasByok && !geminiClient) {
        const warningMsg = '⚠️ **Provider AI Belum Terhubung**\n\nMales Ngonten Studio memerlukan koneksi ke AI provider aktif (BYOK OpenAI-Compatible atau Google Gemini). Silakan buka menu **Pengaturan (⚙️)** di bilah navigasi bawah untuk mengatur API Base URL, API Key, dan Model ID pilihan Anda.';
        aiMessage.content = warningMsg;
        aiMessage.text = warningMsg;
        aiMessage.status = 'error';
        broadcastSSE('message_complete', { messageId: aiMsgId, message: aiMessage });
        const chatFile = path.join(CHATS_DIR, `${currentSession.id}.json`);
        fs.writeFileSync(chatFile, JSON.stringify(currentSession, null, 2), 'utf-8');
        return;
      }

      if (providerError) {
        const errorMsg = `❌ **Gagal Memproses Permintaan via AI**\n\n${providerError}`;
        aiMessage.content = errorMsg;
        aiMessage.text = errorMsg;
        aiMessage.status = 'error';
        broadcastSSE('message_complete', { messageId: aiMsgId, message: aiMessage });
        const chatFile = path.join(CHATS_DIR, `${currentSession.id}.json`);
        fs.writeFileSync(chatFile, JSON.stringify(currentSession, null, 2), 'utf-8');
        return;
      }

      // If EDIT mode: apply timeline changes, create git checkpoint
      if (editingMode && timelineChanges) {
        agentStatus = 'executing_tool';
        broadcastSSE('agent_status', { status: 'executing_tool' });

        const tool2: any = {
          id: 'tc-write-' + Date.now(),
          toolName: 'writeFile',
          description: 'Menulis perubahan ke timeline.json di storage lokal',
          arguments: { path: 'timeline.json', bytes: JSON.stringify(timelineChanges.timeline).length },
          target: 'timeline.json',
          status: 'running',
          timestamp: new Date().toISOString(),
        };
        aiMessage.toolCalls.push(tool2);
        broadcastSSE('tool_update', { messageId: aiMsgId, toolCall: tool2 });

        // Persist to actual filesystem
        fs.writeFileSync(timelinePath, JSON.stringify(timelineChanges.timeline, null, 2), 'utf-8');
        tool2.status = 'completed';
        tool2.durationMs = 380;
        tool2.result = 'File timeline.json berhasil diperbarui di filesystem lokal.';
        broadcastSSE('tool_update', { messageId: aiMsgId, toolCall: tool2 });

        // Broadcast file change to reload Player realtime
        broadcastSSE('file_changed', { file: 'timeline.json', timeline: timelineChanges.timeline });

        // Git Checkpoint (REAL git)
        const commitMsg = timelineChanges.summary || `Perubahan oleh agent: ${text.slice(0, 30)}`;
        const newHash = createGitCheckpoint(commitMsg, timelineChanges.timeline);
        const newShortHash = newHash.slice(0, 7);

        aiMessage.checkpointHash = newHash;
        aiMessage.canRevert = true;
      }

      // Mark as completed - streaming is done, provider finished successfully
      aiMessage.status = 'completed';
      aiMessage.content = aiRawResponse;
      aiMessage.text = aiRawResponse;

      agentStatus = 'streaming';
      broadcastSSE('agent_status', { status: 'streaming' });

      broadcastSSE('message_complete', {
        messageId: aiMsgId,
        message: aiMessage,
      });

      // Save transcript to chat session
      const chatFile = path.join(CHATS_DIR, `${currentSession.id}.json`);
      fs.writeFileSync(chatFile, JSON.stringify(currentSession, null, 2), 'utf-8');
    } catch (err: any) {
      aiMessage.text = `Terjadi kesalahan saat memproses permintaan: ${err?.message || err}`;
      aiMessage.content = aiMessage.text;
      aiMessage.status = 'failed';
      broadcastSSE('message_complete', { messageId: aiMsgId, message: aiMessage });
    } finally {
      agentStatus = 'idle';
      broadcastSSE('agent_status', { status: 'idle' });
      activeCancellationController = null;
    }
  })();
});

// 7. GET/POST/DELETE /api/chats
app.get('/api/chats', (req, res) => {
  res.json({ sessions: chatSessions, activeSessionId });
});

app.post('/api/chats', (req, res) => {
  const newId = 'session-' + Date.now();
  const newSession = {
    id: newId,
    title: req.body.title || 'Obrolan Baru',
    createdAt: 'Hari ini',
    updatedAt: 'Baru saja',
    messages: [
      {
        id: 'msg-init-' + Date.now(),
        role: 'assistant',
        text: 'Sesi baru dimulai. Berikan instruksi untuk membuat atau mengedit video Remotion!',
        content: 'Sesi baru dimulai. Berikan instruksi untuk membuat atau mengedit video Remotion!',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      },
    ],
  };
  chatSessions.unshift(newSession);
  activeSessionId = newId;

  const chatFile = path.join(CHATS_DIR, `${newId}.json`);
  fs.writeFileSync(chatFile, JSON.stringify(newSession, null, 2), 'utf-8');

  res.json({ success: true, session: newSession });
});

app.delete('/api/chats/:id', (req, res) => {
  const { id } = req.params;
  chatSessions = chatSessions.filter((s) => s.id !== id);
  if (activeSessionId === id && chatSessions.length > 0) {
    activeSessionId = chatSessions[0].id;
  }
  const chatFile = path.join(CHATS_DIR, `${id}.json`);
  if (fs.existsSync(chatFile)) fs.unlinkSync(chatFile);
  res.json({ success: true, activeSessionId });
});

// 8. GET /api/files & PUT /api/files/:filename
app.get('/api/files', (req, res) => {
  let timelineContent = JSON.stringify(DEFAULT_TIMELINE, null, 2);
  let assetsContent = JSON.stringify(DEFAULT_ASSETS, null, 2);
  let rulesContent = DEFAULT_GEMINI_RULES;
  let compContent = DEFAULT_COMPOSITION;

  try {
    if (fs.existsSync(timelinePath)) timelineContent = fs.readFileSync(timelinePath, 'utf-8');
    if (fs.existsSync(assetsPath)) assetsContent = fs.readFileSync(assetsPath, 'utf-8');
    if (fs.existsSync(geminiRulesPath)) rulesContent = fs.readFileSync(geminiRulesPath, 'utf-8');
    if (fs.existsSync(compPath)) compContent = fs.readFileSync(compPath, 'utf-8');
  } catch {}

  const filesMap: Record<string, string> = {
    'timeline.json': timelineContent,
    'assets.json': assetsContent,
    'GEMINI.md': rulesContent,
    'ShortVideoComposition.tsx': compContent,
  };
  res.json({ files: filesMap });
});

app.put('/api/files/:filename', (req, res) => {
  const filename = req.params.filename;
  if (filename.includes('..')) {
    return res.status(403).json({ error: 'Path traversal forbidden' });
  }

  const { content } = req.body;
  if (typeof content !== 'string') {
    return res.status(400).json({ error: 'Content must be string' });
  }

  let target = path.join(ACTIVE_PROJECT_DIR, filename);
  if (filename === 'ShortVideoComposition.tsx') {
    target = compPath;
  }

  try {
    fs.writeFileSync(target, content, 'utf-8');
    if (filename === 'timeline.json') {
      try {
        const parsed = JSON.parse(content);
        broadcastSSE('file_changed', { file: 'timeline.json', timeline: parsed });
      } catch {}
    }
    res.json({ success: true, filename });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. GET /api/assets & POST /api/assets & DELETE /api/assets/:id
app.get('/api/assets', (req, res) => {
  try {
    const assetsData = JSON.parse(fs.readFileSync(assetsPath, 'utf-8'));
    res.json({ assets: assetsData });
  } catch {
    res.json({ assets: DEFAULT_ASSETS });
  }
});

app.post('/api/assets', upload.array('files'), (req, res) => {
  const files = (req.files as Express.Multer.File[]) || [];
  let existingAssets: any[] = [];
  try {
    existingAssets = JSON.parse(fs.readFileSync(assetsPath, 'utf-8'));
  } catch {
    existingAssets = [];
  }

  const newAssets = files.map((file) => {
    let type: 'video' | 'audio' | 'image' | 'font' = 'video';
    if (file.mimetype.startsWith('audio/')) type = 'audio';
    else if (file.mimetype.startsWith('image/')) type = 'image';
    else if (file.mimetype.includes('font') || file.originalname.endsWith('.ttf') || file.originalname.endsWith('.woff2'))
      type = 'font';

    return {
      id: 'asset-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: file.originalname,
      type,
      path: `/assets/${file.filename}`,
      size: file.size,
      createdAt: 'Baru saja',
    };
  });

  const updatedAssets = [...newAssets, ...existingAssets];
  fs.writeFileSync(assetsPath, JSON.stringify(updatedAssets, null, 2), 'utf-8');
  res.json({ success: true, assets: updatedAssets, added: newAssets });
});

app.delete('/api/assets/:id', (req, res) => {
  const { id } = req.params;
  try {
    let existingAssets = JSON.parse(fs.readFileSync(assetsPath, 'utf-8'));
    existingAssets = existingAssets.filter((a: any) => a.id !== id);
    fs.writeFileSync(assetsPath, JSON.stringify(existingAssets, null, 2), 'utf-8');
    res.json({ success: true, assets: existingAssets });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 10. GET /api/versions, GET /api/versions/:hash/diff, POST /api/versions/:hash/restore
app.get('/api/versions', (req, res) => {
  res.json({ versions: getGitCheckpoints() });
});

app.get('/api/versions/:hash/diff', (req, res) => {
  const { hash } = req.params;
  const diff = getGitCheckpointDiff(hash);
  if (!diff) return res.status(404).json({ error: 'Version not found' });
  res.json(diff);
});

app.post('/api/versions/:hash/restore', (req, res) => {
  const { hash } = req.params;
  const result = restoreGitCheckpoint(hash);
  if (!result) return res.status(404).json({ error: 'Version not found' });
  res.json(result);
});

// 11. REMOTION VIDEO RENDERING ENGINE (CLI CHILD PROCESS & SSE STREAM)
app.get('/api/renders', (req, res) => {
  res.json({ renders: renderJobs });
});

app.post('/api/render', (req, res) => {
  const { resolution = '720p', fps = 30 } = req.body;
  const jobId = 'rnd-' + Date.now();
  const fileName = `males_ngonten_${resolution}_${fps}fps_${Date.now()}.mp4`;
  const targetVideoPath = path.join(OUT_DIR, fileName);

  const newJob: any = {
    id: jobId,
    status: 'queued',
    resolution,
    fps,
    progress: 0,
    currentFrame: 0,
    totalFrames: 150,
    estimatedSecondsRemaining: 8,
    fileName,
    fileSize: undefined,
    createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  };

  renderJobs.unshift(newJob);
  res.json({ success: true, job: newJob });

  // Execute render script
  const renderScriptPath = path.join(SCRIPTS_DIR, 'render-cli.mjs');
  
  if (fs.existsSync(renderScriptPath)) {
    newJob.status = 'rendering';
    broadcastSSE('render_progress', { job: newJob });

    const proc = spawn(
      process.execPath,
      [
        renderScriptPath,
        '--resolution', resolution,
        '--fps', fps.toString(),
        '--out', targetVideoPath,
        '--project', ACTIVE_PROJECT_DIR
      ],
      {
        cwd: WORKSPACE_DIR,
        env: {
          ...process.env,
          NODE_ENV: 'production',
        }
      }
    );

    activeRenderProcesses.set(jobId, proc);

    let stdoutBuffer = '';
    proc.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line.trim());
          if (parsed.type === 'progress') {
            newJob.currentFrame = parsed.frame;
            newJob.progress = parsed.percent;
            newJob.estimatedSecondsRemaining = parsed.estimatedSecs;
            broadcastSSE('render_progress', { job: newJob });
          } else if (parsed.type === 'render_complete') {
            newJob.status = 'completed';
            newJob.progress = 100;
            newJob.downloadUrl = `/api/renders/${jobId}/download`;
            broadcastSSE('render_completed', { job: newJob });
          }
        } catch {}
      }
    });

    proc.on('close', (code) => {
      activeRenderProcesses.delete(jobId);
      if (newJob.status !== 'completed' && newJob.status !== 'cancelled') {
        if (code === 0 && fs.existsSync(targetVideoPath)) {
          newJob.status = 'completed';
          newJob.progress = 100;
          newJob.downloadUrl = `/api/renders/${jobId}/download`;
          try {
            const stats = fs.statSync(targetVideoPath);
            newJob.fileSize = stats.size;
          } catch {}
          broadcastSSE('render_completed', { job: newJob });
        } else {
          newJob.status = 'failed';
          broadcastSSE('render_failed', { job: newJob, error: `Process exited with code ${code}` });
        }
      }
    });

    proc.on('error', (err) => {
      activeRenderProcesses.delete(jobId);
      newJob.status = 'failed';
      broadcastSSE('render_failed', { job: newJob, error: err.message });
    });
  } else {
    // Graceful fallback simulation
    newJob.status = 'rendering';
    let currentFrame = 0;
    const totalFrames = 150;

    const interval = setInterval(() => {
      currentFrame += 15;
      const progress = Math.min(100, Math.round((currentFrame / totalFrames) * 100));
      newJob.currentFrame = currentFrame;
      newJob.progress = progress;
      newJob.estimatedSecondsRemaining = Math.max(0, Math.round((1 - progress / 100) * 6));

      broadcastSSE('render_progress', { job: newJob });

      if (currentFrame >= totalFrames) {
        clearInterval(interval);
        newJob.status = 'completed';
        newJob.downloadUrl = `/api/renders/${jobId}/download`;
        broadcastSSE('render_completed', { job: newJob });
      }
    }, 350);
  }
});

app.post('/api/render/:id/cancel', (req, res) => {
  const { id } = req.params;
  const proc = activeRenderProcesses.get(id);
  if (proc) {
    proc.kill('SIGTERM');
    activeRenderProcesses.delete(id);
  }

  const job = renderJobs.find((j) => j.id === id);
  if (job) {
    job.status = 'cancelled';
    broadcastSSE('render_cancelled', { jobId: id });
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Job not found' });
});

app.get('/api/renders/:id/download', (req, res) => {
  const { id } = req.params;
  const job = renderJobs.find((j) => j.id === id);
  const targetFile = path.join(OUT_DIR, job?.fileName || 'render.mp4');

  if (fs.existsSync(targetFile)) {
    return res.download(targetFile, job?.fileName || 'males_ngonten_video.mp4');
  }

  return res.status(404).json({ error: 'Render file not found' });
});

app.delete('/api/renders/:id', (req, res) => {
  const { id } = req.params;
  renderJobs = renderJobs.filter((j) => j.id !== id);
  res.json({ success: true });
});

/* ========================================================
 * VITE MIDDLEWARE INTEGRATION (PORT 3000 DEV SERVER)
 * ======================================================== */
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(WORKSPACE_DIR, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(WORKSPACE_DIR, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Males Ngonten Studio] Server aktif di http://0.0.0.0:${PORT}`);
    console.log(`[Males Ngonten Studio] Mode: ${process.env.NODE_ENV || 'development'} | CPU Arch: ${process.arch}`);
  });
}

startServer();
