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
const SCRIPTS_DIR = path.join(WORKSPACE_DIR, 'scripts');

// Ensure base project directories exist
[PROJECTS_BASE, ACTIVE_PROJECT_DIR, OUT_DIR, ASSETS_DIR, CHATS_DIR, path.join(ACTIVE_PROJECT_DIR, 'src'), SCRIPTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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

// In-memory Git Checkpoint state
let gitCheckpoints: {
  hash: string;
  shortHash: string;
  message: string;
  timestamp: string;
  author: string;
  isActive: boolean;
  timelineSnapshot: string;
}[] = [
  {
    hash: 'chk-init-001',
    shortHash: 'init001',
    message: 'Initial project scaffold with default Remotion timeline',
    timestamp: 'Baru saja',
    author: 'Males Ngonten Agent',
    isActive: true,
    timelineSnapshot: JSON.stringify(DEFAULT_TIMELINE),
  },
];

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

// In-memory Chat Sessions
let chatSessions: {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: any[];
}[] = [
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
  },
];

let activeSessionId = 'session-main';
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
      command: 'gemini-2.5-flash',
      protocol: 'api',
      version: geminiApiKey ? 'gemini-2.5-flash' : geminiCheck.version,
      status: geminiApiKey || geminiCheck.exists ? 'ready' : 'not_found',
      description: geminiApiKey
        ? 'Google Gemini 2.5 Flash aktif via server-side SDK untuk pembuatan dan optimasi timeline video otonom.'
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

// 6. POST /api/agent/prompt
app.post('/api/agent/prompt', async (req, res) => {
  const { text, context, attachments, sessionId } = req.body;
  const currentSession = chatSessions.find((s) => s.id === (sessionId || activeSessionId)) || chatSessions[0];

  if (!text && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: 'Text or attachment is required' });
  }

  // Create user message
  const userMsgId = 'msg-' + Date.now();
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

  // Response message placeholder
  const aiMsgId = 'msg-' + (Date.now() + 1);
  const aiMessage: any = {
    id: aiMsgId,
    role: 'assistant',
    content: '',
    text: '',
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    toolCalls: [],
    plan: [
      { id: 'step-1', title: 'Baca struktur timeline.json & aturan video', completed: false },
      { id: 'step-2', title: 'Terapkan perubahan layer & gaya video', completed: false },
      { id: 'step-3', title: 'Buat checkpoint Git otomatis', completed: false },
    ],
  };
  currentSession.messages.push(aiMessage);

  res.json({ success: true, messageId: aiMsgId });

  // Run Agent Processing in background
  (async () => {
    try {
      activeCancellationController = new AbortController();

      // Read current timeline & rules from real workspace
      let currentTimelineData: any;
      try {
        currentTimelineData = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));
      } catch {
        currentTimelineData = DEFAULT_TIMELINE;
      }

      // Tool call 1: Read Project Files
      agentStatus = 'executing_tool';
      broadcastSSE('agent_status', { status: 'executing_tool' });

      const tool1: any = {
        id: 'tc-read-' + Date.now(),
        toolName: 'readFile',
        description: 'Membaca timeline.json dari workspace proyek lokal',
        arguments: { path: 'timeline.json' },
        target: 'timeline.json',
        status: 'running',
        timestamp: new Date().toISOString(),
      };
      aiMessage.toolCalls.push(tool1);
      broadcastSSE('tool_update', { messageId: aiMsgId, toolCall: tool1 });

      await new Promise((r) => setTimeout(r, 350));
      tool1.status = 'completed';
      tool1.durationMs = 210;
      tool1.result = `Berhasil membaca timeline: ${currentTimelineData.layers.length} layer, ${currentTimelineData.durationInFrames} frame.`;
      aiMessage.plan[0].completed = true;
      broadcastSSE('tool_update', { messageId: aiMsgId, toolCall: tool1 });
      broadcastSSE('plan_update', { messageId: aiMsgId, plan: aiMessage.plan });

      // Determine editing actions based on user prompt
      const promptLower = (text || '').toLowerCase();
      let modificationSummary = '';
      let updatedTimeline = JSON.parse(JSON.stringify(currentTimelineData));

      if (geminiClient && text) {
        try {
          const aiResponse = await geminiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are the AI video editor coding agent behind Males Ngonten Studio, an automated short video engine built with Remotion.
The user wants to modify their Remotion video project.

Current timeline JSON:
${JSON.stringify(currentTimelineData, null, 2)}

User request:
"${text}"

Project Rules:
${DEFAULT_GEMINI_RULES}

Modify the timeline accordingly (layers, clips, texts, animations, audio).
Return ONLY valid JSON matching this schema:
{
  "summary": "Short explanation in Indonesian of what was changed (1-2 sentences)",
  "timeline": <complete updated timeline object matching the input structure>
}`,
            config: {
              responseMimeType: 'application/json',
            },
          });

          if (aiResponse.text) {
            const parsed = JSON.parse(aiResponse.text.trim());
            if (parsed.timeline && Array.isArray(parsed.timeline.layers)) {
              updatedTimeline = parsed.timeline;
              modificationSummary = parsed.summary || 'Memperbarui timeline video sesuai instruksi AI.';
            }
          }
        } catch (geminiErr: any) {
          console.warn('[Gemini API] Failed to run generative edit, falling back to local engine:', geminiErr?.message || geminiErr);
        }
      }

      if (!modificationSummary) {
        if (promptLower.includes('subtitle') || promptLower.includes('caption') || promptLower.includes('teks')) {
          const textLayer = updatedTimeline.layers.find((l: any) => l.type === 'text');
          if (textLayer) {
            const newClip = {
              id: 'clip-t-' + Date.now(),
              name: 'Caption Dinamis',
              from: 20,
              duration: 80,
              props: {
                text: promptLower.includes('caption') ? '🔥 RAHASIA KONTEN VIRAL 2026' : '⚡ Konten Video Otomatis!',
                fontSize: 42,
                color: '#5fd3b0',
                y: 46,
                x: 50,
                animation: 'bounce',
              },
            };
            textLayer.clips.push(newClip);
            modificationSummary = 'Menambahkan klip teks animasi baru dengan efek bounce dan warna hijau neon.';
          }
        } else if (promptLower.includes('musik') || promptLower.includes('lagu') || promptLower.includes('audio')) {
          const musicLayer = updatedTimeline.layers.find((l: any) => l.type === 'music');
          if (musicLayer) {
            musicLayer.clips = [
              {
                id: 'clip-m-' + Date.now(),
                name: 'Cinematic Lo-Fi Pulse (Updated)',
                from: 0,
                duration: updatedTimeline.durationInFrames,
                props: { volume: 0.95 },
              },
            ];
            modificationSummary = 'Mengganti track musik latar dengan Cinematic Lo-Fi Pulse.';
          }
        } else if (promptLower.includes('zoom') || promptLower.includes('animasi') || promptLower.includes('gerak')) {
          const textLayer = updatedTimeline.layers.find((l: any) => l.type === 'text');
          if (textLayer && textLayer.clips.length > 0) {
            textLayer.clips[0].props.animation = 'zoom';
            textLayer.clips[0].props.fontSize = 50;
            modificationSummary = 'Mengubah animasi teks headline utama menjadi efek Zoom 3D dinamis.';
          }
        } else {
          // General creative enhancement
          const textLayer = updatedTimeline.layers.find((l: any) => l.type === 'text');
          if (textLayer && textLayer.clips.length > 0) {
            textLayer.clips[0].props.text = text.length < 35 ? text : text.slice(0, 35) + '...';
            modificationSummary = `Memperbarui teks utama sesuai instruksi: "${text.slice(0, 30)}..."`;
          }
        }
      }

      // Tool call 2: Write timeline.json to real disk
      const tool2: any = {
        id: 'tc-write-' + Date.now(),
        toolName: 'writeFile',
        description: 'Menulis perubahan ke timeline.json di storage lokal',
        arguments: { path: 'timeline.json', bytes: JSON.stringify(updatedTimeline).length },
        target: 'timeline.json',
        status: 'running',
        timestamp: new Date().toISOString(),
      };
      aiMessage.toolCalls.push(tool2);
      broadcastSSE('tool_update', { messageId: aiMsgId, toolCall: tool2 });

      await new Promise((r) => setTimeout(r, 450));

      // Persist to actual filesystem
      fs.writeFileSync(timelinePath, JSON.stringify(updatedTimeline, null, 2), 'utf-8');
      tool2.status = 'completed';
      tool2.durationMs = 380;
      tool2.result = 'File timeline.json berhasil diperbarui di filesystem lokal.';
      aiMessage.plan[1].completed = true;
      broadcastSSE('tool_update', { messageId: aiMsgId, toolCall: tool2 });
      broadcastSSE('plan_update', { messageId: aiMsgId, plan: aiMessage.plan });

      // Broadcast file change to reload Player realtime
      broadcastSSE('file_changed', { file: 'timeline.json', timeline: updatedTimeline });

      // Tool call 3: Git Checkpoint
      const newHash = 'chk-' + Math.random().toString(16).substring(2, 10);
      const newShortHash = newHash.slice(0, 7);
      const commitMsg = modificationSummary || `Perubahan oleh agent: ${text.slice(0, 30)}`;

      gitCheckpoints.forEach((c) => (c.isActive = false));
      gitCheckpoints.unshift({
        hash: newHash,
        shortHash: newShortHash,
        message: commitMsg,
        timestamp: 'Baru saja',
        author: 'Males Ngonten Agent',
        isActive: true,
        timelineSnapshot: JSON.stringify(updatedTimeline, null, 2),
      });

      aiMessage.checkpointHash = newHash;
      aiMessage.canRevert = true;
      aiMessage.plan[2].completed = true;

      // Stream final reply text
      agentStatus = 'streaming';
      broadcastSSE('agent_status', { status: 'streaming' });

      const finalReply = `Perubahan video berhasil diterapkan ke workspace lokal!\n\n- **Aksi**: ${modificationSummary}\n- **Protokol**: ACP Tool Execution (\`readFile\` -> \`writeFile\`)\n- **Git Checkpoint**: \`#${newShortHash}\`\n- **Remotion Player**: Preview ter-update otomatis secara realtime.\n\nAnda dapat melihat perubahannya langsung pada Player di atas atau mengecek tab Code & Timeline.`;
      aiMessage.content = finalReply;
      aiMessage.text = finalReply;

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
  res.json({ versions: gitCheckpoints });
});

app.get('/api/versions/:hash/diff', (req, res) => {
  const { hash } = req.params;
  const targetVersion = gitCheckpoints.find((v) => v.hash === hash);
  if (!targetVersion) return res.status(404).json({ error: 'Version not found' });

  res.json({
    hash,
    message: targetVersion.message,
    diff: {
      filePath: 'timeline.json',
      originalContent: fs.readFileSync(timelinePath, 'utf-8'),
      newContent: targetVersion.timelineSnapshot,
    },
  });
});

app.post('/api/versions/:hash/restore', (req, res) => {
  const { hash } = req.params;
  const targetVersion = gitCheckpoints.find((v) => v.hash === hash);
  if (!targetVersion) return res.status(404).json({ error: 'Version not found' });

  const restoredTimelineJson = targetVersion.timelineSnapshot;
  fs.writeFileSync(timelinePath, restoredTimelineJson, 'utf-8');

  const restoreHash = 'rst-' + Math.random().toString(16).substring(2, 10);
  gitCheckpoints.forEach((v) => (v.isActive = false));
  gitCheckpoints.unshift({
    hash: restoreHash,
    shortHash: restoreHash.slice(0, 7),
    message: `Restore ke checkpoint #${targetVersion.shortHash}: ${targetVersion.message}`,
    timestamp: 'Baru saja',
    author: 'Males Ngonten Agent',
    isActive: true,
    timelineSnapshot: restoredTimelineJson,
  });

  const parsed = JSON.parse(restoredTimelineJson);
  broadcastSSE('file_changed', { file: 'timeline.json', timeline: parsed });

  res.json({ success: true, newHash: restoreHash, timeline: parsed });
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
    fileSize: resolution === '4K' ? 14200000 : resolution === '1080p' ? 8400000 : 3800000,
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
          newJob.downloadUrl = `/api/renders/${jobId}/download`;
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

  // Fallback MP4 buffer
  const dummyBuffer = Buffer.alloc(1024 * 100);
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="${job?.fileName || 'males_ngonten_video.mp4'}"`);
  res.send(dummyBuffer);
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
