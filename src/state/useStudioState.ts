/**
 * Studio State Management Hook
 * Decouples the UI layer from communication protocols & mock adapters.
 * Connects directly to HttpAgentAdapter (ACP via SSE) and WorkspaceService.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  TimelineData,
  TimelineClip,
  TimelineLayer,
  ProjectAsset,
  RenderJob,
  DiscoveredAgent,
} from '../types';
import {
  AgentMessage,
  AgentSession,
  AgentStatus,
  AgentAttachment,
  AgentToolCall,
} from '../contracts/agentProtocol';
import { studioAgentClient } from '../services/HttpAgentAdapter';
import { studioWorkspace } from '../services/WorkspaceService';

export const INITIAL_STUDIO_TIMELINE: TimelineData = {
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

const DEFAULT_ASSETS: ProjectAsset[] = [
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

export function useStudioState() {
  const [timeline, setTimeline] = useState<TimelineData>(() => {
    try {
      const saved = localStorage.getItem('males_ngonten_timeline');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return INITIAL_STUDIO_TIMELINE;
  });

  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>('clip-t1');
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>('layer-text');
  const [splitMode, setSplitMode] = useState<
    '50-50' | 'player-focus' | 'canvas-full' | 'chat-focus'
  >('50-50');

  // Agent State
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-main');
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [activeToolCalls, setActiveToolCalls] = useState<AgentToolCall[]>([]);
  const [assets, setAssets] = useState<ProjectAsset[]>(DEFAULT_ASSETS);

  // Render Engine State
  const [currentRenderJob, setCurrentRenderJob] = useState<RenderJob | null>(null);
  const [completedRenderJobs, setCompletedRenderJobs] = useState<RenderJob[]>([]);

  // Sync timeline changes to backend and localStorage
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimelineToWorkspace = useCallback((newTimeline: TimelineData) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      studioWorkspace.saveTimeline(newTimeline);
    }, 400);
  }, []);

  // Realtime SSE listener for backend file modifications & renders
  useEffect(() => {
    studioAgentClient.onFileChanged((file, newTimeline) => {
      if (file === 'timeline.json' && newTimeline) {
        setTimeline(newTimeline);
      }
    });

    // Listen for render SSE events directly
    if (typeof window !== 'undefined') {
      const es = new EventSource('/api/events');
      es.addEventListener('render_progress', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.job) {
            setCurrentRenderJob(data.job);
          }
        } catch {}
      });

      es.addEventListener('render_completed', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.job) {
            setCurrentRenderJob(null);
            setCompletedRenderJobs((prev) => [
              data.job,
              ...prev.filter((j) => j.id !== data.job.id),
            ]);
          }
        } catch {}
      });

      es.addEventListener('render_cancelled', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.jobId) {
            setCurrentRenderJob(null);
          }
        } catch {}
      });

      return () => {
        es.close();
      };
    }
  }, []);

  // Load initial workspace state, timeline, assets, & sessions
  useEffect(() => {
    let mounted = true;

    // Load timeline from workspace
    studioWorkspace.getTimeline().then((tl) => {
      if (mounted && tl && tl.layers) {
        setTimeline(tl);
      }
    });

    // Load assets
    studioWorkspace.getAssets().then((ast) => {
      if (mounted && ast && ast.length > 0) {
        setAssets(ast);
      }
    });

    // Load existing renders
    fetch('/api/renders')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (mounted && data?.renders) {
          setCompletedRenderJobs(data.renders.filter((j: any) => j.status === 'completed'));
        }
      })
      .catch(() => {});

    // Connect agent
    studioAgentClient.connect().then(() => {
      if (!mounted) return;
      studioAgentClient.getSessions().then((sList) => {
        if (!mounted) return;
        setSessions(sList);
        if (sList.length > 0) {
          const firstId = sList[0].id;
          setActiveSessionId(firstId);
          studioAgentClient.switchSession(firstId).then((msgs) => {
            if (mounted) setMessages(msgs);
          });
        }
      });
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Selected clip object helper
  const selectedClip = (() => {
    if (!selectedClipId) return null;
    for (const l of timeline.layers) {
      const c = l.clips.find((item) => item.id === selectedClipId);
      if (c) return c;
    }
    return null;
  })();

  const selectedLayer = (() => {
    if (!selectedLayerId) return null;
    return timeline.layers.find((l) => l.id === selectedLayerId) || null;
  })();

  // Handle on-canvas drag & drop coordinate update
  const handleUpdateClipPosition = useCallback(
    (layerId: string, clipId: string, x: number, y: number) => {
      setTimeline((prev) => {
        const nextLayers = prev.layers.map((l) => {
          if (l.id !== layerId) return l;
          return {
            ...l,
            clips: l.clips.map((c) => {
              if (c.id !== clipId) return c;
              return {
                ...c,
                props: {
                  ...c.props,
                  x: Math.round(Math.max(5, Math.min(95, x))),
                  y: Math.round(Math.max(5, Math.min(95, y))),
                },
              };
            }),
          };
        });
        const next = { ...prev, layers: nextLayers };
        syncTimelineToWorkspace(next);
        return next;
      });
    },
    [syncTimelineToWorkspace]
  );

  // Handle timeline clip timing update (from, duration)
  const handleUpdateClipTiming = useCallback(
    (layerId: string, clipId: string, from: number, duration?: number) => {
      setTimeline((prev) => {
        const nextLayers = prev.layers.map((l) => {
          if (l.id !== layerId) return l;
          return {
            ...l,
            clips: l.clips.map((c) => {
              if (c.id !== clipId) return c;
              const newFrom = Math.max(0, Math.min(prev.durationInFrames - 5, Math.round(from)));
              const newDuration = duration !== undefined ? Math.max(5, Math.round(duration)) : c.duration;
              return {
                ...c,
                from: newFrom,
                duration: Math.min(newDuration, prev.durationInFrames - newFrom),
              };
            }),
          };
        });
        const next = { ...prev, layers: nextLayers };
        syncTimelineToWorkspace(next);
        return next;
      });
    },
    [syncTimelineToWorkspace]
  );

  // Select clip handler
  const handleSelectClip = useCallback((layerId: string, clipId: string) => {
    setSelectedLayerId(layerId);
    setSelectedClipId(clipId);
  }, []);

  // Send message to AI Agent
  const handleSendMessage = useCallback(
    async (text: string, attachments: AgentAttachment[] = []) => {
      if (!text.trim() && attachments.length === 0) return;

      setAgentStatus('thinking');
      const tempUserMsg: AgentMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachments: attachments.length > 0 ? attachments : undefined,
        context: {
          playheadFrame: currentFrame,
          playheadSec: parseFloat((currentFrame / timeline.fps).toFixed(2)),
          selectedClipId: selectedClipId || undefined,
        },
      };

      setMessages((prev) => [...prev, tempUserMsg]);

      try {
        const assistantMsg = await studioAgentClient.sendMessage(
          text,
          attachments,
          {
            timeline,
            currentFrame,
            selectedClip,
            activeFile: 'ShortVideoComposition.tsx',
          },
          (partialMsg, toolCall) => {
            if (toolCall) {
              setActiveToolCalls((prev) => {
                const filtered = prev.filter((t) => t.id !== toolCall.id);
                return [...filtered, toolCall];
              });
            }
          }
        );

        setMessages((prev) => [...prev, assistantMsg]);
        setAgentStatus('idle');

        // Apply changes to timeline if the agent modified keywords
        const lower = text.toLowerCase();
        if (
          lower.includes('headline') ||
          lower.includes('teks') ||
          lower.includes('subtitle') ||
          lower.includes('tulisan')
        ) {
          setTimeline((prev) => {
            const next = { ...prev };
            const textLayer = next.layers.find((l) => l.type === 'text');
            if (textLayer && textLayer.clips.length > 0) {
              const c = textLayer.clips[0];
              c.props = {
                ...c.props,
                animation: lower.includes('zoom')
                  ? 'zoom'
                  : lower.includes('bounce')
                  ? 'bounce'
                  : 'slide-up',
                y: lower.includes('atas') ? 30 : lower.includes('bawah') ? 68 : 42,
              };
            }
            syncTimelineToWorkspace(next);
            return { ...next };
          });
        }
      } catch (err) {
        setAgentStatus('idle');
      }
    },
    [currentFrame, timeline, selectedClip, selectedClipId, syncTimelineToWorkspace]
  );

  // Stop agent execution
  const handleStopAgent = useCallback(() => {
    studioAgentClient.abort();
    setAgentStatus('idle');
  }, []);

  // Switch chat session
  const handleSwitchSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId);
    const msgs = await studioAgentClient.switchSession(sessionId);
    setMessages(msgs);
  }, []);

  // Create new chat session
  const handleNewChat = useCallback(async () => {
    const newSession = await studioAgentClient.createSession();
    setSessions(await studioAgentClient.getSessions());
    setActiveSessionId(newSession.id);
    const msgs = await studioAgentClient.switchSession(newSession.id);
    setMessages(msgs);
  }, []);

  // Delete chat session
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    await studioAgentClient.deleteSession(sessionId);
    const updated = await studioAgentClient.getSessions();
    setSessions(updated);
    if (updated.length > 0) {
      setActiveSessionId(updated[0].id);
      const msgs = await studioAgentClient.switchSession(updated[0].id);
      setMessages(msgs);
    }
  }, []);

  // Render Management
  const handleStartRender = useCallback(
    async (resolution: '720p' | '1080p' | '4K', fps: number) => {
      try {
        const res = await fetch('/api/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolution, fps }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.job) {
            setCurrentRenderJob(data.job);
          }
        }
      } catch (e) {
        console.error('Failed to trigger render', e);
      }
    },
    []
  );

  const handleCancelRender = useCallback(async (jobId: string) => {
    try {
      await fetch(`/api/render/${jobId}/cancel`, { method: 'POST' });
      setCurrentRenderJob(null);
    } catch (e) {
      console.error('Failed to cancel render', e);
    }
  }, []);

  const handleDeleteRender = useCallback(async (jobId: string) => {
    try {
      await fetch(`/api/renders/${jobId}`, { method: 'DELETE' });
      setCompletedRenderJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (e) {
      console.error('Failed to delete render', e);
    }
  }, []);

  return {
    timeline,
    setTimeline,
    currentFrame,
    setCurrentFrame,
    isPlaying,
    setIsPlaying,
    selectedClipId,
    selectedLayerId,
    selectedClip,
    selectedLayer,
    splitMode,
    setSplitMode,
    agentStatus,
    sessions,
    activeSessionId,
    messages,
    activeToolCalls,
    assets,
    setAssets,
    currentRenderJob,
    completedRenderJobs,
    handleStartRender,
    handleCancelRender,
    handleDeleteRender,
    handleUpdateClipPosition,
    handleUpdateClipTiming,
    handleSelectClip,
    handleSendMessage,
    handleStopAgent,
    handleSwitchSession,
    handleNewChat,
    handleDeleteSession,
  };
}
