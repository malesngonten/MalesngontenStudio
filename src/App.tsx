import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  SquarePlay,
  Folder,
  History,
  Download,
  MessageSquare,
  FileCode,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import {
  TimelineData,
  TimelineClip,
  TimelineLayer,
  ProjectAsset,
  ChatMessage,
  ChatSession,
  GitVersion,
  RenderJob,
  AgentSettings,
  LayerType,
} from './types';

import { Header } from './components/header/Header';
import { RemotionPreview } from './components/player/RemotionPreview';
import { Timeline } from './components/timeline/Timeline';
import { TimelineDetailPanel } from './components/timeline/TimelineDetailPanel';
import { SegmentedControl } from './components/ui/SegmentedControl';
import { ChatPanel } from './components/chat/ChatPanel';
import { CodeEditorPanel } from './components/code/CodeEditorPanel';
import { AssetTab } from './components/assets/AssetTab';
import { VersionTab } from './components/versions/VersionTab';
import { RenderTab } from './components/render/RenderTab';

import { BottomSheet } from './components/ui/BottomSheet';
import { ChatHistorySheet } from './components/history/ChatHistorySheet';
import { ProjectRulesSheet } from './components/settings/ProjectRulesSheet';
import { AgentSettingsSheet } from './components/settings/AgentSettingsSheet';
import { AddLayerSheet } from './components/timeline/AddLayerSheet';

// Initial default timeline
const INITIAL_TIMELINE: TimelineData = {
  fps: 30,
  durationInFrames: 150,
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
            fontSize: 44,
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
            fontSize: 36,
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

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'studio' | 'asset' | 'version' | 'render'>('studio');
  const [studioSubTab, setStudioSubTab] = useState<'chat' | 'timeline' | 'code'>('chat');

  // Project state
  const [currentProject, setCurrentProject] = useState('proyek-remotion-1');
  const [projectList, setProjectList] = useState<string[]>(['proyek-remotion-1', 'tiktok-ads-template', 'motion-quotes-demo']);

  // Timeline & Player
  const [timeline, setTimeline] = useState<TimelineData>(INITIAL_TIMELINE);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClip, setSelectedClip] = useState<TimelineClip | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<TimelineLayer | null>(null);
  const [compilationError, setCompilationError] = useState<string | null>(null);

  // Files & Code Editor
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({
    'timeline.json': JSON.stringify(INITIAL_TIMELINE, null, 2),
    'assets.json': '[]',
    'GEMINI.md': '# ATURAN PROYEK STUDIO HERMES REMOTION',
    'src/Composition.tsx': '// Remotion Short Video Composition',
  });
  const [activeFile, setActiveFile] = useState('timeline.json');

  // Assets
  const [assets, setAssets] = useState<ProjectAsset[]>([]);

  // Agent & Chat
  const [agentStatus, setAgentStatus] = useState<'connected' | 'working' | 'disconnected'>('connected');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState('session-main');
  const [isAgentWorking, setIsAgentWorking] = useState(false);
  const [isAgentEditingFile, setIsAgentEditingFile] = useState(false);
  const [autoFixCount, setAutoFixCount] = useState(0);

  // Versions & Renders
  const [versions, setVersions] = useState<GitVersion[]>([]);
  const [currentRenderJob, setCurrentRenderJob] = useState<RenderJob | null>(null);
  const [completedRenderJobs, setCompletedRenderJobs] = useState<RenderJob[]>([]);

  // Settings & Sheets
  const [rulesContent, setRulesContent] = useState('');
  const [agentSettings, setAgentSettings] = useState<AgentSettings>({
    model: 'gemini-3.8-flash',
    permissionMode: 'ask',
    autoFixErrors: true,
    maxAutoFixAttempts: 3,
  });

  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [isProjectRulesOpen, setIsProjectRulesOpen] = useState(false);
  const [isAgentSettingsOpen, setIsAgentSettingsOpen] = useState(false);
  const [isAddLayerOpen, setIsAddLayerOpen] = useState(false);
  const [diffViewModal, setDiffViewModal] = useState<{ original: string; new: string; message: string } | null>(null);

  // Keep a ref to activeSessionId for SSE listeners without reconnecting
  const activeSessionIdRef = useRef(activeSessionId);
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // Initial Data Fetch
  useEffect(() => {
    // 1. Fetch files
    fetch('/api/files')
      .then((r) => r.json())
      .then((data) => {
        if (data.files) {
          setProjectFiles(data.files);
          try {
            const parsed = JSON.parse(data.files['timeline.json']);
            setTimeline(parsed);
          } catch {}
        }
      })
      .catch(() => {});

    // 2. Fetch assets
    fetch('/api/assets')
      .then((r) => r.json())
      .then((data) => {
        if (data.assets) setAssets(data.assets);
      })
      .catch(() => {});

    // 3. Fetch chats
    fetch('/api/chats')
      .then((r) => r.json())
      .then((data) => {
        if (data.sessions) {
          setChatSessions(data.sessions);
          if (data.activeSessionId) setActiveSessionId(data.activeSessionId);
        }
      })
      .catch(() => {});

    // 4. Fetch versions
    fetch('/api/versions')
      .then((r) => r.json())
      .then((data) => {
        if (data.versions) setVersions(data.versions);
      })
      .catch(() => {});

    // 5. Fetch rules
    fetch('/api/rules')
      .then((r) => r.json())
      .then((data) => {
        if (data.rules) setRulesContent(data.rules);
      })
      .catch(() => {});

    // 6. Fetch renders
    fetch('/api/renders')
      .then((r) => r.json())
      .then((data) => {
        if (data.renders) setCompletedRenderJobs(data.renders);
      })
      .catch(() => {});
  }, []);

  // SSE Event Stream Listener
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      setAgentStatus('connected');
    };

    eventSource.onerror = () => {
      setAgentStatus('disconnected');
    };

    eventSource.addEventListener('agent_status', (e: any) => {
      const data = JSON.parse(e.data);
      setAgentStatus(data.status);
      setIsAgentWorking(data.status === 'working');
    });

    eventSource.addEventListener('file_changed', (e: any) => {
      const data = JSON.parse(e.data);
      if (data.file === 'timeline.json' && data.timeline) {
        setTimeline(data.timeline);
        setProjectFiles((prev) => ({
          ...prev,
          'timeline.json': JSON.stringify(data.timeline, null, 2),
        }));
      }
    });

    eventSource.addEventListener('tool_update', (e: any) => {
      const { messageId, toolCall } = JSON.parse(e.data);
      const targetSessionId = activeSessionIdRef.current;
      setChatSessions((prev) =>
        prev.map((session) => {
          if (session.id !== targetSessionId) return session;
          return {
            ...session,
            messages: session.messages.map((m) => {
              if (m.id !== messageId) return m;
              const existingCalls = m.toolCalls || [];
              const idx = existingCalls.findIndex((tc) => tc.id === toolCall.id);
              let updatedCalls;
              if (idx !== -1) {
                updatedCalls = [...existingCalls];
                updatedCalls[idx] = toolCall;
              } else {
                updatedCalls = [...existingCalls, toolCall];
              }
              return { ...m, toolCalls: updatedCalls };
            }),
          };
        })
      );
    });

    eventSource.addEventListener('plan_update', (e: any) => {
      const { messageId, plan } = JSON.parse(e.data);
      const targetSessionId = activeSessionIdRef.current;
      setChatSessions((prev) =>
        prev.map((session) => {
          if (session.id !== targetSessionId) return session;
          return {
            ...session,
            messages: session.messages.map((m) =>
              m.id === messageId ? { ...m, plan } : m
            ),
          };
        })
      );
    });

    eventSource.addEventListener('message_complete', (e: any) => {
      const { messageId, message } = JSON.parse(e.data);
      const targetSessionId = activeSessionIdRef.current;
      setChatSessions((prev) =>
        prev.map((session) => {
          if (session.id !== targetSessionId) return session;
          return {
            ...session,
            messages: session.messages.map((m) =>
              m.id === messageId ? { ...m, ...message } : m
            ),
          };
        })
      );
      setIsAgentWorking(false);
      setIsAgentEditingFile(false);

      // Refresh versions list
      fetch('/api/versions')
        .then((r) => r.json())
        .then((d) => {
          if (d.versions) setVersions(d.versions);
        });

      // Browser Notification if supported and task complete
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Studio Hermes Remotion', {
          body: 'Perubahan video oleh AI agent telah selesai diterapkan!',
          icon: '/favicon.ico',
        });
      }
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    });

    eventSource.addEventListener('render_progress', (e: any) => {
      const { job } = JSON.parse(e.data);
      setCurrentRenderJob(job);
    });

    eventSource.addEventListener('render_completed', (e: any) => {
      const { job } = JSON.parse(e.data);
      setCurrentRenderJob(null);
      setCompletedRenderJobs((prev) => [job, ...prev.filter((j) => j.id !== job.id)]);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    });

    return () => {
      eventSource.close();
    };
  }, []);

  // Request Notification permission when user first engages with agent
  const requestNotifyPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // Chat Actions
  const handleSendMessage = async (text: string, context?: any, attachments?: ProjectAsset[]) => {
    requestNotifyPermission();
    setIsAgentWorking(true);
    setIsAgentEditingFile(true);

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      context,
      attachments,
    };

    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === activeSessionId
          ? { ...session, messages: [...session.messages, userMsg] }
          : session
      )
    );

    try {
      await fetch('/api/agent/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          context,
          attachments,
          sessionId: activeSessionId,
        }),
      });
    } catch {
      setIsAgentWorking(false);
      setIsAgentEditingFile(false);
    }
  };

  const handleStopAgent = async () => {
    await fetch('/api/agent/cancel', { method: 'POST' });
    setIsAgentWorking(false);
    setIsAgentEditingFile(false);
  };

  const handlePermissionDecision = async (
    messageId: string,
    decision: 'approved' | 'approved_session' | 'rejected'
  ) => {
    await fetch('/api/agent/permission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: messageId, decision }),
    });
  };

  const handleDiffDecision = (messageId: string, accept: boolean) => {
    if (!accept) {
      // Revert to latest previous checkpoint
      if (versions.length > 1) {
        handleRestoreVersion(versions[1].hash);
      }
    }
  };

  const handleRevertCheckpoint = (hash: string) => {
    handleRestoreVersion(hash);
  };

  const handleRestoreVersion = async (hash: string) => {
    const res = await fetch('/api/versions/' + hash + '/restore', { method: 'POST' });
    const data = await res.json();
    if (data.timeline) {
      setTimeline(data.timeline);
      setProjectFiles((prev) => ({
        ...prev,
        'timeline.json': JSON.stringify(data.timeline, null, 2),
      }));
    }
    const versRes = await fetch('/api/versions').then((r) => r.json());
    if (versRes.versions) setVersions(versRes.versions);
  };

  const handleViewDiff = async (hash: string) => {
    const res = await fetch(`/api/versions/${hash}/diff`);
    const data = await res.json();
    if (data.diff) {
      setDiffViewModal({
        original: data.diff.originalContent,
        new: data.diff.newContent,
        message: data.message,
      });
    }
  };

  // Code Editor Auto-Save
  const handleSaveFile = async (fileName: string, content: string) => {
    setProjectFiles((prev) => ({ ...prev, [fileName]: content }));

    if (fileName === 'timeline.json') {
      try {
        const parsed = JSON.parse(content);
        setTimeline(parsed);
        setCompilationError(null);
      } catch (e: any) {
        setCompilationError(`timeline.json: Format JSON tidak valid (${e.message})`);
      }
    }

    await fetch(`/api/files/${encodeURIComponent(fileName)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  };

  // Ask AI to fix error (auto-fix up to 3x)
  const handleAskAiFix = (err: string) => {
    if (autoFixCount < 3) {
      setAutoFixCount((c) => c + 1);
      handleSendMessage(`Perbaiki error kompilasi video berikut:\n\`\`\`\n${err}\n\`\`\``);
    } else {
      handleSendMessage(`Bantuan perbaikan manual: kompilasi gagal 3 kali dengan error:\n\`\`\`\n${err}\n\`\`\``);
    }
  };

  // Asset Upload
  const handleUploadAssets = async (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    const res = await fetch('/api/assets', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.assets) setAssets(data.assets);
  };

  const handleDeleteAsset = async (id: string) => {
    const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.assets) setAssets(data.assets);
  };

  const handleUseAssetInChat = (asset: ProjectAsset) => {
    setActiveTab('studio');
    setStudioSubTab('chat');
    handleSendMessage(`Gunakan asset @${asset.name} pada layer yang sesuai.`);
  };

  // Add Layer
  const handleAddLayer = (type: LayerType, name: string) => {
    const newLayer: TimelineLayer = {
      id: 'layer-' + type + '-' + Date.now(),
      type,
      name,
      clips: [
        {
          id: 'clip-' + Date.now(),
          name: `${name} Clip`,
          from: currentFrame,
          duration: Math.min(60, timeline.durationInFrames - currentFrame),
          props: {
            text: type === 'text' ? 'Teks Baru' : undefined,
            fontSize: 32,
            color: '#ffffff',
          },
        },
      ],
    };

    const updatedTimeline: TimelineData = {
      ...timeline,
      layers: [...timeline.layers, newLayer],
    };
    setTimeline(updatedTimeline);
    handleSaveFile('timeline.json', JSON.stringify(updatedTimeline, null, 2));
  };

  const handleUpdateClipProps = (layerId: string, clipId: string, updatedProps: any) => {
    setTimeline((prev) => {
      const nextLayers = prev.layers.map((layer) => {
        if (layer.id !== layerId) return layer;
        return {
          ...layer,
          clips: layer.clips.map((clip) => {
            if (clip.id !== clipId) return clip;
            return {
              ...clip,
              props: {
                ...clip.props,
                ...updatedProps,
              },
            };
          }),
        };
      });
      const nextTimeline = { ...prev, layers: nextLayers };
      handleSaveFile('timeline.json', JSON.stringify(nextTimeline, null, 2));
      return nextTimeline;
    });
  };

  const handleUpdateClipTiming = (layerId: string, clipId: string, from: number, duration?: number) => {
    setTimeline((prev) => {
      const nextLayers = prev.layers.map((layer) => {
        if (layer.id !== layerId) return layer;
        return {
          ...layer,
          clips: layer.clips.map((clip) => {
            if (clip.id !== clipId) return clip;
            const maxStart = Math.max(0, prev.durationInFrames - 5);
            const clampedFrom = Math.max(0, Math.min(maxStart, Math.round(from)));
            const clampedDuration =
              duration !== undefined ? Math.max(5, Math.round(duration)) : clip.duration;
            return {
              ...clip,
              from: clampedFrom,
              duration: clampedDuration,
            };
          }),
        };
      });
      const nextTimeline = { ...prev, layers: nextLayers };

      // Update selectedClip if active
      setSelectedClip((curr) => {
        if (curr?.id === clipId) {
          const maxStart = Math.max(0, prev.durationInFrames - 5);
          const clampedFrom = Math.max(0, Math.min(maxStart, Math.round(from)));
          const clampedDuration =
            duration !== undefined ? Math.max(5, Math.round(duration)) : curr.duration;
          return {
            ...curr,
            from: clampedFrom,
            duration: clampedDuration,
          };
        }
        return curr;
      });

      handleSaveFile('timeline.json', JSON.stringify(nextTimeline, null, 2));
      return nextTimeline;
    });
  };

  const handleDeleteClip = (layerId: string, clipId: string) => {
    setTimeline((prev) => {
      const nextLayers = prev.layers.map((layer) => {
        if (layer.id !== layerId) return layer;
        return {
          ...layer,
          clips: layer.clips.filter((clip) => clip.id !== clipId),
        };
      });
      const nextTimeline = { ...prev, layers: nextLayers };
      handleSaveFile('timeline.json', JSON.stringify(nextTimeline, null, 2));
      return nextTimeline;
    });
    setSelectedClip(null);
  };

  // Render Studio Actions
  const handleStartRender = async (resolution: '720p' | '1080p' | '4K', fps: number) => {
    const res = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution, fps }),
    });
    const data = await res.json();
    if (data.job) setCurrentRenderJob(data.job);
  };

  const handleCancelRender = async (id: string) => {
    await fetch(`/api/render/${id}/cancel`, { method: 'POST' });
    setCurrentRenderJob(null);
  };

  const handleDeleteRender = async (id: string) => {
    await fetch(`/api/renders/${id}`, { method: 'DELETE' });
    setCompletedRenderJobs((prev) => prev.filter((j) => j.id !== id));
  };

  // Project Switch & Create
  const handleSelectProject = async (name: string) => {
    setCurrentProject(name);
    await fetch(`/api/projects/${name}/open`, { method: 'POST' });
  };

  const handleCreateNewProject = async () => {
    const name = `proyek-remotion-${projectList.length + 1}`;
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setProjectList((prev) => [...prev, name]);
    handleSelectProject(name);
  };

  // Active chat session messages
  const activeSession = chatSessions.find((s) => s.id === activeSessionId) || chatSessions[0] || {
    id: 'default',
    title: 'Obrolan Utama',
    createdAt: 'Hari ini',
    updatedAt: 'Baru saja',
    messages: [],
  };

  // Storage calculation
  const totalAssetBytes = assets.reduce((sum, a) => sum + (a.size || 0), 0);
  const maxStorageBytes = 100 * 1024 * 1024; // 100MB

  return (
    <div className="flex justify-center bg-black min-h-dvh text-[#f2f2f3]">
      {/* Mobile-first centered container: max 480px, exactly 390px default */}
      <div className="w-full max-w-[480px] h-dvh flex flex-col bg-[#0e0e10] border-x border-[#27272c] overflow-hidden shadow-2xl relative">
        {/* 4. Global Header 50px */}
        <Header
          currentProject={currentProject}
          projectList={projectList}
          onSelectProject={handleSelectProject}
          onCreateNewProject={handleCreateNewProject}
          agentStatus={agentStatus}
          onReconnectAgent={() => setAgentStatus('connected')}
          onOpenChatHistory={() => setIsChatHistoryOpen(true)}
          onOpenProjectRules={() => setIsProjectRulesOpen(true)}
          onOpenAgentSettings={() => setIsAgentSettingsOpen(true)}
        />

        {/* Main Content Area - Flex-1 */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          {/* TAB 1: STUDIO */}
          {activeTab === 'studio' && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* REMOTION PLAYER: SELALU ADA DI HALAMAN UTAMA */}
              <RemotionPreview
                timeline={timeline}
                currentFrame={currentFrame}
                onFrameUpdate={setCurrentFrame}
                isPlaying={isPlaying}
                onPlayPauseToggle={() => setIsPlaying(!isPlaying)}
                onAddLayerClick={() => setIsAddLayerOpen(true)}
                compilationError={compilationError}
                onAskAiFix={handleAskAiFix}
              />

              {/* STUDIO DECK: 3 MODE FOKUS (Chat Agent | Timeline | Edit Kode) */}
              <div className="px-3 py-1.5 bg-[#121214] border-b border-[#27272c] shrink-0">
                <SegmentedControl
                  value={studioSubTab}
                  onChange={setStudioSubTab}
                  options={[
                    { value: 'chat', label: 'Chat Agent', icon: <MessageSquare className="w-3.5 h-3.5" /> },
                    { value: 'timeline', label: 'Timeline', icon: <Layers className="w-3.5 h-3.5" /> },
                    { value: 'code', label: 'Edit Kode', icon: <FileCode className="w-3.5 h-3.5" /> },
                  ]}
                />
              </div>

              {/* WORKSPACE VIEW: 100% LUAS SESUAI MODE */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {studioSubTab === 'chat' && (
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Mini Timeline Scrubber (1 Baris) di bawah Player agar tetap bisa seek saat chat */}
                    <div className="px-3 py-1 bg-[#121214]/60 border-b border-[#27272c] flex items-center gap-2 select-none shrink-0">
                      <span className="text-[10px] font-mono text-[#8b8b94] shrink-0">
                        {((currentFrame) / timeline.fps).toFixed(1)}s
                      </span>
                      <div
                        onPointerDown={(e) => {
                          const target = e.currentTarget;
                          target.setPointerCapture(e.pointerId);
                          setIsPlaying(false);
                          const updateFrame = (clientX: number) => {
                            const rect = target.getBoundingClientRect();
                            const clickX = clientX - rect.left;
                            const ratio = Math.min(1, Math.max(0, clickX / rect.width));
                            setCurrentFrame(Math.round(ratio * timeline.durationInFrames));
                          };
                          updateFrame(e.clientX);

                          const onPointerMove = (ev: PointerEvent) => {
                            updateFrame(ev.clientX);
                          };
                          const onPointerUp = () => {
                            window.removeEventListener('pointermove', onPointerMove);
                            window.removeEventListener('pointerup', onPointerUp);
                          };
                          window.addEventListener('pointermove', onPointerMove);
                          window.addEventListener('pointerup', onPointerUp);
                        }}
                        className="relative flex-1 h-[14px] bg-[#17171a] rounded-full overflow-hidden cursor-pointer border border-[#27272c] touch-none"
                      >
                        {/* Playhead progress */}
                        <div
                          className="h-full bg-[#e5484d]/40 rounded-full"
                          style={{
                            width: `${(currentFrame / timeline.durationInFrames) * 100}%`,
                          }}
                        />
                        {/* Scrubber thumb */}
                        <div
                          className="absolute top-0 bottom-0 w-2.5 bg-white rounded-full shadow-sm -ml-1 pointer-events-none"
                          style={{
                            left: `${(currentFrame / timeline.durationInFrames) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-[#76767f] shrink-0">
                        {((timeline.durationInFrames) / timeline.fps).toFixed(1)}s
                      </span>
                    </div>

                    {/* Chat Panel - Full Remaining Height */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <ChatPanel
                        messages={activeSession.messages}
                        isAgentWorking={isAgentWorking}
                        onSendMessage={handleSendMessage}
                        onStopAgent={handleStopAgent}
                        onRevertCheckpoint={handleRevertCheckpoint}
                        onPermissionDecision={handlePermissionDecision}
                        onDiffDecision={handleDiffDecision}
                        selectedLayer={selectedLayer}
                        selectedClip={selectedClip}
                        currentFrame={currentFrame}
                        fps={timeline.fps}
                        activeFile={activeFile}
                        assets={assets}
                        onOpenFileUpload={() => setActiveTab('asset')}
                      />
                    </div>
                  </div>
                )}

                {studioSubTab === 'timeline' && (
                  <TimelineDetailPanel
                    timeline={timeline}
                    currentFrame={currentFrame}
                    onSeek={(frame) => {
                      setCurrentFrame(frame);
                      setIsPlaying(false);
                    }}
                    selectedClip={selectedClip}
                    selectedLayer={selectedLayer}
                    onSelectClip={(clip, layer) => {
                      setSelectedClip(clip);
                      setSelectedLayer(layer);
                    }}
                    onAddLayerClick={() => setIsAddLayerOpen(true)}
                    onUpdateClipProps={handleUpdateClipProps}
                    onUpdateClipTiming={handleUpdateClipTiming}
                    onDeleteClip={handleDeleteClip}
                  />
                )}

                {studioSubTab === 'code' && (
                  <CodeEditorPanel
                    files={projectFiles}
                    activeFile={activeFile}
                    onSelectFile={setActiveFile}
                    onSaveFile={handleSaveFile}
                    isAgentEditingFile={isAgentEditingFile}
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ASSET */}
          {activeTab === 'asset' && (
            <AssetTab
              assets={assets}
              onUploadAssets={handleUploadAssets}
              onDeleteAsset={handleDeleteAsset}
              onUseAssetInChat={handleUseAssetInChat}
              usedBytes={totalAssetBytes}
              maxBytes={maxStorageBytes}
            />
          )}

          {/* TAB 3: VERSI */}
          {activeTab === 'version' && (
            <VersionTab
              versions={versions}
              onRestoreVersion={handleRestoreVersion}
              onViewDiff={handleViewDiff}
            />
          )}

          {/* TAB 4: RENDER */}
          {activeTab === 'render' && (
            <RenderTab
              currentJob={currentRenderJob}
              completedJobs={completedRenderJobs}
              onStartRender={handleStartRender}
              onCancelRender={handleCancelRender}
              onDeleteRender={handleDeleteRender}
            />
          )}
        </main>

        {/* 4. Tab Bar Bawah 56px + Safe-Area */}
        <nav
          role="tablist"
          aria-label="Navigasi Utama"
          className="h-[56px] bg-[#121214] border-t border-[#27272c] flex items-center justify-around px-2 select-none shrink-0 safe-pb z-30"
        >
          {[
            { id: 'studio', label: 'Studio', icon: <SquarePlay className="w-5 h-5" /> },
            { id: 'asset', label: 'Asset', icon: <Folder className="w-5 h-5" /> },
            { id: 'version', label: 'Versi', icon: <History className="w-5 h-5" /> },
            { id: 'render', label: 'Render', icon: <Download className="w-5 h-5" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id as any)}
                className={`tap flex-1 h-[48px] flex flex-col items-center justify-center gap-1 rounded-full transition-colors ${
                  isActive ? 'text-[#e5484d]' : 'text-[#8b8b94] hover:text-[#f2f2f3]'
                }`}
              >
                <div className="shrink-0">{tab.icon}</div>
                <span className={`text-[11px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Sheets & Modals */}
        <ChatHistorySheet
          isOpen={isChatHistoryOpen}
          onClose={() => setIsChatHistoryOpen(false)}
          sessions={chatSessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onNewChat={async () => {
            const res = await fetch('/api/chats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Obrolan Baru' }) });
            const data = await res.json();
            if (data.session) {
              setChatSessions((prev) => [data.session, ...prev]);
              setActiveSessionId(data.session.id);
            }
          }}
          onDeleteSession={async (id) => {
            await fetch(`/api/chats/${id}`, { method: 'DELETE' });
            setChatSessions((prev) => prev.filter((s) => s.id !== id));
          }}
        />

        <ProjectRulesSheet
          isOpen={isProjectRulesOpen}
          onClose={() => setIsProjectRulesOpen(false)}
          rulesContent={rulesContent}
          onSaveRules={async (rules) => {
            setRulesContent(rules);
            await fetch('/api/rules', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ rules }),
            });
          }}
        />

        <AgentSettingsSheet
          isOpen={isAgentSettingsOpen}
          onClose={() => setIsAgentSettingsOpen(false)}
          settings={agentSettings}
          onUpdateSettings={(newSettings) =>
            setAgentSettings((prev) => ({ ...prev, ...newSettings }))
          }
        />

        <AddLayerSheet
          isOpen={isAddLayerOpen}
          onClose={() => setIsAddLayerOpen(false)}
          onAddLayer={handleAddLayer}
        />

        {/* Diff Inspection Modal */}
        {diffViewModal && (
          <BottomSheet
            isOpen={true}
            onClose={() => setDiffViewModal(null)}
            title="Pratinjau Diff Versi"
            subtitle={diffViewModal.message}
          >
            <div className="space-y-3 font-mono text-[11px] max-h-[60vh] overflow-y-auto">
              <div>
                <span className="text-red-400 font-bold block mb-1">- Versi Sebelumnya:</span>
                <pre className="p-2.5 rounded-xl bg-red-950/20 text-red-300 border border-red-900/30 whitespace-pre-wrap">
                  {diffViewModal.original.slice(0, 500)}
                </pre>
              </div>
              <div>
                <span className="text-[#5fd3b0] font-bold block mb-1">+ Versi Terpilih:</span>
                <pre className="p-2.5 rounded-xl bg-[#12302a]/30 text-[#a2ecd8] border border-[#2f6f5f]/30 whitespace-pre-wrap">
                  {diffViewModal.new.slice(0, 500)}
                </pre>
              </div>
            </div>
          </BottomSheet>
        )}
      </div>
    </div>
  );
}
