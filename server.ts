import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Directories
const WORKSPACE_DIR = process.cwd();
const PROJECTS_BASE = path.join(WORKSPACE_DIR, 'projects');
const ACTIVE_PROJECT_DIR = path.join(PROJECTS_BASE, 'proyek-remotion-1');
const OUT_DIR = path.join(ACTIVE_PROJECT_DIR, 'out');
const ASSETS_DIR = path.join(ACTIVE_PROJECT_DIR, 'public', 'assets');
const CHATS_DIR = path.join(ACTIVE_PROJECT_DIR, '.hermes', 'chats');

// Ensure base project directories exist
[PROJECTS_BASE, ACTIVE_PROJECT_DIR, OUT_DIR, ASSETS_DIR, CHATS_DIR, path.join(ACTIVE_PROJECT_DIR, 'src')].forEach((dir) => {
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
      name: 'Video',
      clips: [
        {
          id: 'clip-v1',
          name: 'Background Cyber Gradient',
          from: 0,
          duration: 150,
          props: {
            backgroundColor: 'radial-gradient(circle at 50% 40%, #1f1b2e 0%, #0d0c14 100%)',
          },
        },
      ],
    },
    {
      id: 'layer-text',
      type: 'text',
      name: 'Teks',
      clips: [
        {
          id: 'clip-t1',
          name: 'Headline Viral',
          from: 10,
          duration: 65,
          props: {
            text: 'Studio Hermes Remotion',
            fontSize: 48,
            color: '#ffffff',
            y: 42,
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
            text: 'AI Agent Short-Video Editor',
            fontSize: 38,
            color: '#e5484d',
            y: 50,
            x: 50,
            animation: 'zoom',
          },
        },
      ],
    },
    {
      id: 'layer-narration',
      type: 'narration',
      name: 'Narasi',
      clips: [
        {
          id: 'clip-n1',
          name: 'Voiceover Hook',
          from: 15,
          duration: 120,
          props: {
            text: '"Edit video pendek langsung dari HP dengan AI agent realtime!"',
            speaker: 'Hermes Voice',
          },
        },
      ],
    },
    {
      id: 'layer-music',
      type: 'music',
      name: 'Musik',
      clips: [
        {
          id: 'clip-m1',
          name: 'Upbeat Lo-fi Pulse',
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
    id: 'asset-bg-1',
    name: 'cyber_gradient_bg.mp4',
    type: 'video',
    path: '/assets/cyber_gradient_bg.mp4',
    size: 4200000,
    duration: 10,
    width: 1080,
    height: 1920,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'asset-audio-1',
    name: 'lofi_upbeat_beat.mp3',
    type: 'audio',
    path: '/assets/lofi_upbeat_beat.mp3',
    size: 2100000,
    duration: 30,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'asset-logo-1',
    name: 'hermes_badge.png',
    type: 'image',
    path: '/assets/hermes_badge.png',
    size: 450000,
    width: 512,
    height: 512,
    createdAt: new Date().toISOString(),
  },
];

// Default GEMINI.md
const DEFAULT_GEMINI_RULES = `# ATURAN PROYEK STUDIO HERMES REMOTION (GEMINI.md)

1. GAYA DAN FORMAT VIDEO
- Seluruh video bertipe portrait 9:16 (1080 x 1920 piksel), dioptimalkan untuk TikTok, Instagram Reels, dan YouTube Shorts.
- Kecepatan ritme cepat (pacing dinamis), pergantian teks per 1.5 - 2.5 detik.
- Font utama: 'Inter Variable' untuk UI dan judul, sans-serif tebal dengan kontras tinggi.
- Palet warna: Aksen merah #e5484d, background gelap #0e0e10, teks putih #ffffff.

2. SINKRONISASI VISUAL DAN NARASI
- Visual HARUS sinkron persis dengan timestamp narasi suara.
- Statistik / data angka harus dimunculkan dengan animasi counter atau grafik naik.
- Poin daftar harus ditampilkan sebagai kartu bertahap satu per satu (staggered).

3. STRUKTUR PROYEK
- File sumber: src/Composition.tsx
- Definisi timeline: timeline.json (sumber kebenaran durasi, layer, dan klip).
- Daftar asset: assets.json.
- Jangan menyentuh file di luar folder proyek aktif. Semua perubahan wajib melalui tool file proyek.
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
    hash: 'a1b2c3d4e5f67890123456789abcdef012345678',
    shortHash: 'a1b2c3d',
    message: 'Initial project scaffold with default Remotion timeline',
    timestamp: 'Baru saja',
    author: 'Hermes Agent',
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
}[] = [];

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
    title: 'Edit Video Pendek Pertama',
    createdAt: 'Hari ini',
    updatedAt: 'Baru saja',
    messages: [
      {
        id: 'msg-welcome',
        role: 'assistant',
        text: 'Halo! Saya Hermes AI agent. Silakan ketik perintah untuk mengubah teks, klip, musik, atau durasi video Remotion ini. Kamu juga bisa menyentuh chip aksi cepat di bawah!',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        plan: [
          { id: 'p1', title: 'Siapkan komposisi Remotion portrait 9:16', completed: true },
          { id: 'p2', title: 'Sinkronkan layer dan timeline dengan Player', completed: true },
        ],
      },
    ],
  },
];

let activeSessionId = 'session-main';

// Active Agent Status
let agentStatus: 'connected' | 'working' | 'disconnected' = 'connected';
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
 * 7. API BRIDGE ENDPOINTS
 * ======================================================== */

// 1. GET /api/events (SSE)
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', status: agentStatus })}\n\n`);
  sseClients.push(res);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// 2. GET /api/agent/status
app.get('/api/agent/status', (req, res) => {
  res.json({
    status: agentStatus,
    activeSessionId,
    model: 'gemini-3.8-flash',
  });
});

// 3. POST /api/agent/cancel
app.post('/api/agent/cancel', (req, res) => {
  if (activeCancellationController) {
    activeCancellationController.abort();
    activeCancellationController = null;
  }
  agentStatus = 'connected';
  broadcastSSE('agent_status', { status: 'connected' });
  broadcastSSE('agent_cancelled', { message: 'Perintah agent dibatalkan oleh pengguna.' });
  res.json({ success: true, message: 'Agent cancelled' });
});

// 4. POST /api/agent/permission
app.post('/api/agent/permission', (req, res) => {
  const { id, decision } = req.body;
  const pending = pendingPermissions.get(id);
  if (pending) {
    pending.resolve(decision);
    pendingPermissions.delete(id);
    broadcastSSE('permission_resolved', { id, decision });
    return res.json({ success: true, decision });
  }
  res.status(404).json({ error: 'Permission request not found' });
});

// 5. POST /api/agent/prompt
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
    text: text || 'Menambahkan lampiran file',
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    context,
    attachments,
  };
  currentSession.messages.push(userMessage);

  // Set agent working status
  agentStatus = 'working';
  broadcastSSE('agent_status', { status: 'working' });

  // Response message placeholder
  const aiMsgId = 'msg-' + (Date.now() + 1);
  const aiMessage: any = {
    id: aiMsgId,
    role: 'assistant',
    text: '',
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    toolCalls: [],
    plan: [
      { id: 'step-1', title: 'Analisis instruksi & baca timeline.json', completed: false },
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

      // Read current timeline & rules
      let currentTimelineData: any;
      try {
        currentTimelineData = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));
      } catch {
        currentTimelineData = DEFAULT_TIMELINE;
      }

      let rulesData = '';
      try {
        rulesData = fs.readFileSync(geminiRulesPath, 'utf-8');
      } catch {
        rulesData = DEFAULT_GEMINI_RULES;
      }

      // Tool call 1: Read Project Files
      const tool1: any = {
        id: 'tc-read-' + Date.now(),
        toolName: 'readFile',
        target: 'timeline.json',
        status: 'running',
      };
      aiMessage.toolCalls.push(tool1);
      broadcastSSE('tool_update', { messageId: aiMsgId, toolCall: tool1 });

      await new Promise((r) => setTimeout(r, 400));
      tool1.status = 'completed';
      tool1.durationMs = 280;
      aiMessage.plan[0].completed = true;
      broadcastSSE('tool_update', { messageId: aiMsgId, toolCall: tool1 });
      broadcastSSE('plan_update', { messageId: aiMsgId, plan: aiMessage.plan });

      // Determine editing actions based on user prompt
      const promptLower = (text || '').toLowerCase();
      let modificationSummary = '';
      let updatedTimeline = JSON.parse(JSON.stringify(currentTimelineData));

      if (promptLower.includes('subtitle') || promptLower.includes('caption') || promptLower.includes('teks')) {
        // Add or modify dynamic subtitle / caption text
        const textLayer = updatedTimeline.layers.find((l: any) => l.type === 'text');
        if (textLayer) {
          const newClip = {
            id: 'clip-t-' + Date.now(),
            name: 'Subtitle Baru',
            from: 20,
            duration: 80,
            props: {
              text: promptLower.includes('caption') ? '🔥 RAHASIA VIDEO VIRAL 2026' : '⚡ Konten Kreatif Otomatis!',
              fontSize: 42,
              color: '#5fd3b0',
              y: 45,
              x: 50,
              animation: 'bounce',
            },
          };
          textLayer.clips.push(newClip);
          modificationSummary = 'Menambahkan klip teks animasi baru dengan efek bounce.';
        }
      } else if (promptLower.includes('musik') || promptLower.includes('lagu') || promptLower.includes('audio')) {
        const musicLayer = updatedTimeline.layers.find((l: any) => l.type === 'music');
        if (musicLayer) {
          musicLayer.clips = [
            {
              id: 'clip-m-' + Date.now(),
              name: 'Cinematic Cyber Beat (Updated)',
              from: 0,
              duration: updatedTimeline.durationInFrames,
              props: { volume: 0.95 },
            },
          ];
          modificationSummary = 'Mengganti track musik latar dengan Cinematic Cyber Beat.';
        }
      } else if (promptLower.includes('zoom') || promptLower.includes('transisi')) {
        const textLayer = updatedTimeline.layers.find((l: any) => l.type === 'text');
        if (textLayer && textLayer.clips.length > 0) {
          textLayer.clips[0].props.animation = 'zoom';
          textLayer.clips[0].props.fontSize = 52;
          modificationSummary = 'Mengubah animasi teks utama menjadi Zoom efek 3D dinamis.';
        }
      } else {
        // General creative enhancement
        const textLayer = updatedTimeline.layers.find((l: any) => l.type === 'text');
        if (textLayer && textLayer.clips.length > 0) {
          textLayer.clips[0].props.text = text.length < 35 ? text : text.slice(0, 35) + '...';
          modificationSummary = `Memperbarui teks utama sesuai instruksi: "${text.slice(0, 30)}..."`;
        }
      }

      // Tool call 2: Write timeline.json
      const tool2: any = {
        id: 'tc-write-' + Date.now(),
        toolName: 'writeFile',
        target: 'timeline.json',
        status: 'running',
      };
      aiMessage.toolCalls.push(tool2);
      broadcastSSE('tool_update', { messageId: aiMsgId, toolCall: tool2 });

      await new Promise((r) => setTimeout(r, 600));

      // Persist updated timeline
      fs.writeFileSync(timelinePath, JSON.stringify(updatedTimeline, null, 2), 'utf-8');
      tool2.status = 'completed';
      tool2.durationMs = 450;
      aiMessage.plan[1].completed = true;
      broadcastSSE('tool_update', { messageId: aiMsgId, toolCall: tool2 });
      broadcastSSE('plan_update', { messageId: aiMsgId, plan: aiMessage.plan });

      // Broadcast file change to reload Player realtime
      broadcastSSE('file_changed', { file: 'timeline.json', timeline: updatedTimeline });

      // Code Diff generation
      const originalJson = JSON.stringify(currentTimelineData, null, 2);
      const newJson = JSON.stringify(updatedTimeline, null, 2);
      aiMessage.diff = {
        filePath: 'timeline.json',
        originalContent: originalJson,
        newContent: newJson,
        diffSummary: modificationSummary || 'Pembaruan layer dan durasi timeline Remotion.',
      };

      // Tool call 3: Git Checkpoint Commit
      const newHash = 'chk-' + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
      const newShortHash = newHash.slice(0, 7);
      const commitMsg = modificationSummary || `Perubahan oleh AI agent: ${text.slice(0, 30)}`;

      gitCheckpoints.forEach((c) => (c.isActive = false));
      gitCheckpoints.unshift({
        hash: newHash,
        shortHash: newShortHash,
        message: commitMsg,
        timestamp: 'Baru saja',
        author: 'Hermes Agent',
        isActive: true,
        timelineSnapshot: newJson,
      });

      aiMessage.checkpointHash = newHash;
      aiMessage.canRevert = true;
      aiMessage.plan[2].completed = true;

      // Stream final reply text
      aiMessage.text = `Perubahan berhasil diterapkan ke proyek Remotion!\n\n- **Aksi**: ${modificationSummary}\n- **Checkpoint Git**: \`#${newShortHash}\`\n- **Status Player**: Preview ter-update otomatis secara realtime.\n\nKamu dapat menekan tombol **Terima** atau **Batalkan** pada kartu diff di bawah.`;

      broadcastSSE('message_complete', {
        messageId: aiMsgId,
        message: aiMessage,
      });

      // Save transcript JSON to .hermes/chats/
      const chatFile = path.join(CHATS_DIR, `${currentSession.id}.json`);
      fs.writeFileSync(chatFile, JSON.stringify(currentSession, null, 2), 'utf-8');
    } catch (err: any) {
      aiMessage.text = `Terjadi kesalahan saat memproses permintaan: ${err?.message || err}`;
      broadcastSSE('message_complete', { messageId: aiMsgId, message: aiMessage });
    } finally {
      agentStatus = 'connected';
      broadcastSSE('agent_status', { status: 'connected' });
      activeCancellationController = null;
    }
  })();
});

// 6. GET/POST/DELETE /api/chats
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
        text: 'Sesi baru dimulai. Berikan instruksi untuk mengedit video Remotion!',
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

// 7. GET /api/projects & POST /api/projects/:id/open
let projectsList = ['proyek-remotion-1', 'tiktok-ads-template', 'motion-quotes-demo'];
let currentProjectName = 'proyek-remotion-1';

app.get('/api/projects', (req, res) => {
  res.json({ projects: projectsList, current: currentProjectName });
});

app.post('/api/projects', (req, res) => {
  const name = req.body.name || `proyek-remotion-${projectsList.length + 1}`;
  if (!projectsList.includes(name)) {
    projectsList.push(name);
  }
  res.json({ success: true, name });
});

app.post('/api/projects/:id/open', (req, res) => {
  const { id } = req.params;
  if (projectsList.includes(id)) {
    currentProjectName = id;
    broadcastSSE('project_opened', { project: id });
    return res.json({ success: true, project: id });
  }
  res.status(404).json({ error: 'Project not found' });
});

// 8. GET /api/files & GET/PUT /api/files/*path (Prevent path traversal)
app.get('/api/files', (req, res) => {
  let timelineContent = JSON.stringify(DEFAULT_TIMELINE, null, 2);
  let assetsContent = JSON.stringify(DEFAULT_ASSETS, null, 2);
  let rulesContent = DEFAULT_GEMINI_RULES;

  try {
    if (fs.existsSync(timelinePath)) timelineContent = fs.readFileSync(timelinePath, 'utf-8');
    if (fs.existsSync(assetsPath)) assetsContent = fs.readFileSync(assetsPath, 'utf-8');
    if (fs.existsSync(geminiRulesPath)) rulesContent = fs.readFileSync(geminiRulesPath, 'utf-8');
  } catch {}

  const filesMap: Record<string, string> = {
    'timeline.json': timelineContent,
    'assets.json': assetsContent,
    'GEMINI.md': rulesContent,
    'src/Composition.tsx': `// Remotion Short Video Composition
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const MyComposition = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill className="bg-black text-white flex items-center justify-center">
      <h1 className="text-3xl font-bold">Studio Hermes Remotion</h1>
    </AbsoluteFill>
  );
};
`,
  };
  res.json({ files: filesMap });
});

app.put('/api/files/:filename', (req, res) => {
  const filename = req.params.filename;
  // Security: prevent path traversal
  if (filename.includes('..')) {
    return res.status(403).json({ error: 'Path traversal forbidden' });
  }

  const { content } = req.body;
  if (typeof content !== 'string') {
    return res.status(400).json({ error: 'Content must be string' });
  }

  const target = path.join(ACTIVE_PROJECT_DIR, filename);
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
      createdAt: new Date().toISOString(),
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

  // Non-destructive restore: create new commit copying target version content
  const restoredTimelineJson = targetVersion.timelineSnapshot;
  fs.writeFileSync(timelinePath, restoredTimelineJson, 'utf-8');

  const restoreHash = 'rst-' + Math.random().toString(16).substring(2, 10);
  gitCheckpoints.forEach((v) => (v.isActive = false));
  gitCheckpoints.unshift({
    hash: restoreHash,
    shortHash: restoreHash.slice(0, 7),
    message: `Restore ke checkpoint #${targetVersion.shortHash}: ${targetVersion.message}`,
    timestamp: 'Baru saja',
    author: 'Hermes Agent',
    isActive: true,
    timelineSnapshot: restoredTimelineJson,
  });

  const parsed = JSON.parse(restoredTimelineJson);
  broadcastSSE('file_changed', { file: 'timeline.json', timeline: parsed });

  res.json({ success: true, newHash: restoreHash, timeline: parsed });
});

// 11. POST /api/render, POST /api/render/:id/cancel, GET /api/renders, GET /api/renders/:id/download
app.get('/api/renders', (req, res) => {
  res.json({ renders: renderJobs.filter((j) => j.status === 'completed') });
});

app.post('/api/render', (req, res) => {
  const { resolution = '720p', fps = 30 } = req.body;
  const jobId = 'rnd-' + Date.now();

  const newJob: any = {
    id: jobId,
    status: 'queued',
    resolution,
    fps,
    progress: 0,
    currentFrame: 0,
    totalFrames: 150,
    estimatedSecondsRemaining: 6,
    fileName: `hermes_${resolution}_${fps}fps_${Date.now()}.mp4`,
    fileSize: resolution === '4K' ? 14200000 : resolution === '1080p' ? 8400000 : 3800000,
    createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  };

  renderJobs.unshift(newJob);
  res.json({ success: true, job: newJob });

  // Simulate rendering frames over SSE
  let currentFrame = 0;
  const totalFrames = 150;
  newJob.status = 'rendering';

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
  }, 400);
});

app.post('/api/render/:id/cancel', (req, res) => {
  const { id } = req.params;
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
  // Send a lightweight MP4 placeholder or binary buffer with HTTP Range support
  const dummyBuffer = Buffer.alloc(1024 * 100); // 100KB dummy video payload
  const range = req.headers.range;

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="${job?.fileName || 'hermes-render.mp4'}"`);

  if (range) {
    res.status(206);
    res.setHeader('Content-Range', `bytes 0-${dummyBuffer.length - 1}/${dummyBuffer.length}`);
    res.setHeader('Accept-Ranges', 'bytes');
  }
  res.send(dummyBuffer);
});

app.delete('/api/renders/:id', (req, res) => {
  const { id } = req.params;
  renderJobs = renderJobs.filter((j) => j.id !== id);
  res.json({ success: true });
});

// 12. GET/PUT /api/rules (GEMINI.md)
app.get('/api/rules', (req, res) => {
  try {
    const rules = fs.readFileSync(geminiRulesPath, 'utf-8');
    res.json({ rules });
  } catch {
    res.json({ rules: DEFAULT_GEMINI_RULES });
  }
});

app.put('/api/rules', (req, res) => {
  const { rules } = req.body;
  if (typeof rules !== 'string') return res.status(400).json({ error: 'Invalid content' });
  fs.writeFileSync(geminiRulesPath, rules, 'utf-8');
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
    console.log(`[Studio Hermes] Full-stack Bridge Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
