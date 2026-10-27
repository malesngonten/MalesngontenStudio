/**
 * Studio State Management Hook
 * Decouples the UI layer from communication protocols & mock adapters.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  TimelineData,
  TimelineClip,
  TimelineLayer,
  ProjectAsset,
} from '../types';
import {
  AgentMessage,
  AgentSession,
  AgentStatus,
  AgentAttachment,
  AgentToolCall,
} from '../contracts/agentProtocol';
import { agentClientInstance } from '../services/MockAgentAdapter';

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
  const [splitMode, setSplitMode] = useState<'50-50' | 'player-focus' | 'chat-focus'>('50-50');

  // Agent State
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-main');
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [activeToolCalls, setActiveToolCalls] = useState<AgentToolCall[]>([]);
  const [assets, setAssets] = useState<ProjectAsset[]>(DEFAULT_ASSETS);

  // Sync timeline changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('males_ngonten_timeline', JSON.stringify(timeline));
    } catch (e) {
      // ignore
    }
  }, [timeline]);

  // Load initial sessions & connect agent
  useEffect(() => {
    let mounted = true;
    agentClientInstance.connect().then(() => {
      if (!mounted) return;
      agentClientInstance.getSessions().then((sList) => {
        if (!mounted) return;
        setSessions(sList);
        if (sList.length > 0) {
          const firstId = sList[0].id;
          setActiveSessionId(firstId);
          agentClientInstance.switchSession(firstId).then((msgs) => {
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
        return { ...prev, layers: nextLayers };
      });
    },
    []
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
        return { ...prev, layers: nextLayers };
      });
    },
    []
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
        const assistantMsg = await agentClientInstance.sendMessage(
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

        // Apply changes to timeline if the agent triggered timeline tools
        const lower = text.toLowerCase();
        if (lower.includes('headline') || lower.includes('teks') || lower.includes('subtitle') || lower.includes('tulisan')) {
          setTimeline((prev) => {
            const next = { ...prev };
            const textLayer = next.layers.find((l) => l.type === 'text');
            if (textLayer && textLayer.clips.length > 0) {
              const c = textLayer.clips[0];
              c.props = {
                ...c.props,
                animation: lower.includes('zoom') ? 'zoom' : lower.includes('bounce') ? 'bounce' : 'slide-up',
                y: lower.includes('atas') ? 30 : lower.includes('bawah') ? 68 : 42,
              };
            }
            return { ...next };
          });
        }
      } catch (err) {
        setAgentStatus('idle');
      }
    },
    [currentFrame, timeline, selectedClip, selectedClipId]
  );

  // Stop agent execution
  const handleStopAgent = useCallback(() => {
    agentClientInstance.abort();
    setAgentStatus('idle');
  }, []);

  // Switch chat session
  const handleSwitchSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId);
    const msgs = await agentClientInstance.switchSession(sessionId);
    setMessages(msgs);
  }, []);

  // Create new chat session
  const handleNewChat = useCallback(async () => {
    const newSession = await agentClientInstance.createSession();
    setSessions(await agentClientInstance.getSessions());
    setActiveSessionId(newSession.id);
    const msgs = await agentClientInstance.switchSession(newSession.id);
    setMessages(msgs);
  }, []);

  // Delete chat session
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    await agentClientInstance.deleteSession(sessionId);
    const updated = await agentClientInstance.getSessions();
    setSessions(updated);
    if (updated.length > 0) {
      setActiveSessionId(updated[0].id);
      const msgs = await agentClientInstance.switchSession(updated[0].id);
      setMessages(msgs);
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
