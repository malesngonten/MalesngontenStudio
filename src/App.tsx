import React, { useState, useCallback } from 'react';
import { useStudioState } from './state/useStudioState';
import { Header, StudioView } from './components/header/Header';
import { RemotionPreview } from './components/player/RemotionPreview';
import { ChatPanel } from './components/chat/ChatPanel';
import { PromptDock } from './components/chat/PromptDock';
import { LiveAgentActivityCard } from './components/chat/LiveAgentActivityCard';
import { StoryboardView } from './components/storyboard/StoryboardView';
import { CodeEditorPanel } from './components/code/CodeEditorPanel';
import { AssetTab } from './components/assets/AssetTab';
import { RenderTab } from './components/render/RenderTab';
import { AgentDiscoveryDrawer } from './components/agent/AgentDiscoveryDrawer';
import { ChatHistorySheet } from './components/history/ChatHistorySheet';
import { BottomSheet } from './components/ui/BottomSheet';
import { ProjectAsset, TimelineClip, TimelineLayer } from './types';
import { Timeline } from './components/timeline/Timeline';
import { BottomToolbar } from './components/toolbar/BottomToolbar';
import { UnifiedSettingsSheet } from './components/settings/UnifiedSettingsSheet';
import { studioWorkspace } from './services/WorkspaceService';
import { Bot, X, Sparkles } from 'lucide-react';

const COMPOSITION_SAMPLE_CODE = `// ShortVideoComposition.tsx
// Powered by Remotion v4.0 & Males Ngonten Studio AI Agent

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

export const ShortVideoComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill className="bg-black select-none overflow-hidden font-sans">
      {/* Dynamic Ambient Background */}
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

export default function App() {
  const {
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
    agentSettings,
    handleUpdateSettings,
  } = useStudioState();

  // Active Main View (AI-first tabs: Studio, Storyboard, Kode, Aset)
  const [activeView, setActiveView] = useState<StudioView>('studio');

  // Timeline track overlay visibility state (Clean floating overlay on top of full-height player)
  const [isTimelineVisible, setIsTimelineVisible] = useState<boolean>(false);

  // Full AI Conversation / ACP Thoughts slide-over sheet
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState<boolean>(false);

  // Chat panel visibility state for expansive studio
  const [isDesktopChatOpen, setIsDesktopChatOpen] = useState<boolean>(true);

  // Modals / Drawers
  const [isRenderOpen, setIsRenderOpen] = useState(false);
  const [isAgentDrawerOpen, setIsAgentDrawerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);

  // Pre-filled prompt from canvas element action
  const [prefilledPrompt, setPrefilledPrompt] = useState<string>('');

  // Code editor state
  const [activeFile, setActiveFile] = useState('ShortVideoComposition.tsx');
  const [filesState, setFilesState] = useState<Record<string, string>>({
    'ShortVideoComposition.tsx': COMPOSITION_SAMPLE_CODE,
    'timeline.json': JSON.stringify(timeline, null, 2),
    'GEMINI.md': '# ATURAN PROYEK MALES NGONTEN STUDIO\n1. Format 9:16 portrait (1080x1920)\n2. Pacing cepat 1.5 - 2.5 detik per klip\n3. Animasi spring dengan damping Remotion.',
  });

  // Play/pause toggle
  const handlePlayPauseToggle = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, [setIsPlaying]);

  // Frame scrub
  const handleFrameUpdate = useCallback(
    (frame: number) => {
      setCurrentFrame(frame);
    },
    [setCurrentFrame]
  );

  // Smart timeline toggle: on mobile, yields chat so Remotion player is never squeezed
  const handleToggleTimeline = useCallback(() => {
    setIsTimelineVisible((prev) => {
      const next = !prev;
      if (next && typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsDesktopChatOpen(false);
      }
      return next;
    });
  }, []);

  // Smart chat toggle: on mobile, yields timeline so Remotion player is never squeezed
  const handleToggleChat = useCallback(() => {
    setIsDesktopChatOpen((prev) => {
      const next = !prev;
      if (next && typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsTimelineVisible(false);
      }
      return next;
    });
  }, []);

  // Handle timeline clip props update
  const handleUpdateClipProps = useCallback(
    (layerId: string, clipId: string, updatedProps: any) => {
      setTimeline((prev) => {
        const nextLayers = prev.layers.map((l) => {
          if (l.id !== layerId) return l;
          return {
            ...l,
            clips: l.clips.map((c) => {
              if (c.id !== clipId) return c;
              return {
                ...c,
                props: { ...c.props, ...updatedProps },
              };
            }),
          };
        });
        return { ...prev, layers: nextLayers };
      });
    },
    [setTimeline]
  );

  // Handle delete clip
  const handleDeleteClip = useCallback(
    (layerId: string, clipId: string) => {
      setTimeline((prev) => {
        const nextLayers = prev.layers.map((l) => {
          if (l.id !== layerId) return l;
          return {
            ...l,
            clips: l.clips.filter((c) => c.id !== clipId),
          };
        });
        return { ...prev, layers: nextLayers };
      });
    },
    [setTimeline]
  );

  // Real Asset upload to backend storage & assets.json
  const handleUploadAssets = useCallback(
    async (newFiles: File[]) => {
      try {
        const updated = await studioWorkspace.uploadAssets(newFiles);
        setAssets(updated);
      } catch (e) {
        console.error('Failed to upload asset files to server:', e);
      }
    },
    [setAssets]
  );


  // Dynamic vertical split height calculation
  const getPlayerHeightClass = () => {
    switch (splitMode) {
      case 'canvas-full':
        return 'h-full md:w-full';
      case 'player-focus':
        return 'h-[65%] sm:h-[62%] md:w-[62%]';
      case 'chat-focus':
        return 'h-[35%] sm:h-[35%] md:w-[35%]';
      case '50-50':
      default:
        return 'h-[50%] md:w-1/2';
    }
  };

  const getChatHeightClass = () => {
    switch (splitMode) {
      case 'canvas-full':
        return 'hidden';
      case 'player-focus':
        return 'h-[35%] sm:h-[38%] md:w-[38%]';
      case 'chat-focus':
        return 'h-[65%] sm:h-[65%] md:w-[65%]';
      case '50-50':
      default:
        return 'h-[50%] md:w-1/2';
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const currentSec = (currentFrame / timeline.fps).toFixed(2);
  const totalAssetsSize = assets.reduce((sum, a) => sum + (a.size || 0), 0);

  const latestAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
  const isAgentActive =
    agentStatus === 'thinking' ||
    agentStatus === 'executing_tool' ||
    agentStatus === 'streaming' ||
    activeToolCalls.some((t) => t.status === 'running');

  return (
    <div className="w-full h-dvh max-h-dvh flex flex-col bg-[#09090b] text-[#f4f4f5] antialiased overflow-hidden select-none font-sans">
      {/* 1. Icon-Only Clean Header (No sidebar, no text clutter, no settings gear) */}
      <Header
        onOpenRender={() => setIsRenderOpen(true)}
        isRendering={!!currentRenderJob}
        agentStatus={agentStatus}
      />

      {/* 2. Main Workspace (with pb-14 for fixed bottom toolbar) */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative pb-14">
        {/* VIEW 1: STUDIO (Full-Height Immersive Remotion Canvas + Live Agent Streaming Card + Non-Overlapping Bottom Surface) */}
        {activeView === 'studio' && (
          <div className="w-full h-full flex flex-col overflow-hidden relative bg-[#070709]">
            {/* FULL-HEIGHT HERO: Remotion Video Canvas with Unrestricted 2-Finger Pinch-to-Zoom */}
            <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
              <RemotionPreview
                timeline={timeline}
                currentFrame={currentFrame}
                onFrameUpdate={handleFrameUpdate}
                isPlaying={isPlaying}
                onPlayPauseToggle={handlePlayPauseToggle}
                selectedClipId={selectedClipId}
                onSelectClip={handleSelectClip}
                onUpdateClipPosition={handleUpdateClipPosition}
                onPromptElementAction={(text, action) => {
                  setPrefilledPrompt(`Tolong ubah elemen "${text}": ${action}`);
                }}
                isTimelineOpen={isTimelineVisible}
                onToggleTimeline={() => setIsTimelineVisible((prev) => !prev)}
              />
            </div>

            {/* REALTIME AI STREAMING & ACP ACTIVITY CARD (Shows what file is being written, ACP tool checklist, progress) */}
            {isAgentActive && (
              <div className="shrink-0 pb-1 z-30">
                <LiveAgentActivityCard
                  status={agentStatus}
                  activeToolCalls={
                    activeToolCalls.length > 0
                      ? activeToolCalls
                      : latestAssistantMsg?.toolCalls || []
                  }
                  streamingText={latestAssistantMsg?.content}
                  activeFile={activeFile}
                  onStop={handleStopAgent}
                  onOpenFullChat={() => setIsChatDrawerOpen(true)}
                />
              </div>
            )}

            {/* BOTTOM SURFACE: When Timeline is active, show Timeline and HIDE floating prompt! */}
            {isTimelineVisible ? (
              <div className="shrink-0 max-h-[175px] overflow-y-auto bg-gradient-to-b from-[#14141c] to-[#0a0a0e] p-2 z-30 animate-in slide-in-from-bottom duration-150">
                <div className="flex items-center justify-between px-3 py-1 text-xs text-zinc-400">
                  <span className="font-semibold text-white">Track Timeline</span>
                  <button
                    type="button"
                    onClick={() => setIsTimelineVisible(false)}
                    className="tap w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
                    title="Tutup Timeline"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Timeline
                  timeline={timeline}
                  currentFrame={currentFrame}
                  onSeek={handleFrameUpdate}
                  selectedClipId={selectedClipId}
                  onSelectClip={(clip, layer) => handleSelectClip(layer.id, clip.id)}
                  onUpdateClipTiming={handleUpdateClipTiming}
                />
              </div>
            ) : (
              /* When Timeline is NOT active: Show the Clean Floating Prompt Dock */
              <div className="shrink-0 z-20">
                <PromptDock
                  onSendMessage={handleSendMessage}
                  isAgentWorking={isAgentActive}
                  onStopAgent={handleStopAgent}
                  prefilledPrompt={prefilledPrompt}
                  byokModelId={agentSettings.modelId}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  isTimelineOpen={isTimelineVisible}
                  onToggleTimeline={() => setIsTimelineVisible((prev) => !prev)}
                  onOpenFullChat={() => setIsChatDrawerOpen(true)}
                  messagesCount={messages.length}
                />
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: STORYBOARD & SCENE CARDS */}
        {activeView === 'storyboard' && (
          <StoryboardView
            timeline={timeline}
            currentFrame={currentFrame}
            onSeek={handleFrameUpdate}
            selectedClip={selectedClip}
            selectedLayer={selectedLayer}
            onSelectClip={(clip: TimelineClip, layer: TimelineLayer) =>
              handleSelectClip(layer.id, clip.id)
            }
            onAddLayerClick={() => {}}
            onUpdateClipProps={handleUpdateClipProps}
            onUpdateClipTiming={handleUpdateClipTiming}
            onDeleteClip={handleDeleteClip}
            onCommandAI={(prompt) => {
              setActiveView('studio');
              setPrefilledPrompt(prompt);
            }}
          />
        )}

        {/* VIEW 3: KODE (Remotion TSX & JSON Editor) */}
        {activeView === 'code' && (
          <div className="w-full h-full p-3 sm:p-4 bg-[#09090b]">
            <div className="w-full h-full rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
              <CodeEditorPanel
                files={filesState}
                activeFile={activeFile}
                onSelectFile={(f) => setActiveFile(f)}
                onSaveFile={(f, content) =>
                  setFilesState((prev) => ({ ...prev, [f]: content }))
                }
                isAgentEditingFile={agentStatus !== 'idle'}
              />
            </div>
          </div>
        )}

        {/* VIEW 4: ASET (Media Storage & Uploads) */}
        {activeView === 'assets' && (
          <div className="w-full h-full p-3 sm:p-4 bg-[#09090b] overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <AssetTab
                assets={assets}
                onUploadAssets={handleUploadAssets}
                onDeleteAsset={async (id) => {
                  try {
                    const updated = await studioWorkspace.deleteAsset(id);
                    setAssets(updated);
                  } catch (e) {
                    console.error('Failed to delete asset on server:', e);
                    setAssets((prev) => prev.filter((a) => a.id !== id));
                  }
                }}
                onUseAssetInChat={(asset: ProjectAsset) => {

                  setActiveView('studio');
                  handleSendMessage(
                    `Tolong gunakan aset media "${asset.name}" sebagai background di video`,
                    []
                  );
                }}
                usedBytes={totalAssetsSize}
                maxBytes={500 * 1024 * 1024}
              />
            </div>
          </div>
        )}
      </main>

      {/* 3. Drawers & Dialogs */}

      {/* Chat History Drawer */}
      <ChatHistorySheet
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSwitchSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />

      {/* Agent Discovery & ARM64 Diagnostics Drawer */}
      <AgentDiscoveryDrawer
        isOpen={isAgentDrawerOpen}
        onClose={() => setIsAgentDrawerOpen(false)}
      />

      {/* Render & Export Video Modal */}
      <BottomSheet
        isOpen={isRenderOpen}
        onClose={() => setIsRenderOpen(false)}
        title="Ekspor Video Remotion MP4"
        subtitle="Rendering deterministik lokal via Remotion CLI"
      >
        <div className="h-[55vh]">
          <RenderTab
            currentJob={currentRenderJob}
            completedJobs={completedRenderJobs}
            onStartRender={handleStartRender}
            onCancelRender={handleCancelRender}
            onDeleteRender={handleDeleteRender}
          />
        </div>
      </BottomSheet>

      {/* Settings / Open Source Info Modal */}
      <BottomSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Tentang Males Ngonten Studio"
        subtitle="Studio Pembuatan Video Berbasis AI Coding Agent & Remotion Engine"
      >
        <div className="space-y-4 text-xs text-zinc-400">
          <div className="flex items-center gap-3 p-3.5 bg-zinc-900/80 rounded-2xl border border-white/5">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#c92a2a] shrink-0 flex items-center justify-center shadow-md">
              <img
                src="/assets/aistudio/Black_Cat_Animals___Pets_Logo_20261024_034747_0000_d2a38d28.png"
                alt="Males Ngonten Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Males Ngonten Studio</p>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                v1.0 • Protokol ACP (Agent Client Protocol)
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-zinc-900/40 rounded-2xl border border-white/5 space-y-2">
            <p className="font-semibold text-white">Konsep AI Studio:</p>
            <p className="leading-relaxed">
              Males Ngonten Studio dirancang agar pengguna cukup memberikan instruksi natural
              kepada AI Agent. AI Agent secara langsung mengubah komposisi kode Remotion secara
              deklaratif, memperbarui preview secara real-time, dan merender video MP4 berkualitas
              tinggi secara lokal di perangkat Anda.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5">
              <span className="text-zinc-500">Video Engine:</span>
              <p className="font-semibold text-white mt-1">Remotion v4.0</p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5">
              <span className="text-zinc-500">Agent Protocol:</span>
              <p className="font-semibold text-white mt-1">ACP JSON-RPC stdio</p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5">
              <span className="text-zinc-500">Target Output:</span>
              <p className="font-semibold text-white mt-1">9:16 Shorts / TikTok</p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5">
              <span className="text-zinc-500">Target Device:</span>
              <p className="font-semibold text-white mt-1">Termux + Ubuntu ARM64</p>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Full AI Director Chat & Execution Drawer */}
      <BottomSheet
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        title="AI Director Percakapan & Log"
        subtitle="Riwayat interaksi, eksekusi tool ACP, dan perubahan komposisi"
      >
        <div className="h-[75vh]">
          <ChatPanel
            messages={messages}
            isAgentWorking={
              agentStatus === 'thinking' ||
              agentStatus === 'executing_tool' ||
              agentStatus === 'streaming'
            }
            onSendMessage={handleSendMessage}
            onStopAgent={handleStopAgent}
            currentSec={currentSec}
            selectedClipName={selectedClip?.name}
            prefilledPrompt={prefilledPrompt}
            onClose={() => setIsChatDrawerOpen(false)}
            onOpenSettings={() => setIsAiSettingsOpen(true)}
            byokModelId={agentSettings.modelId}
            isByokConfigured={Boolean(agentSettings.apiBaseUrl && agentSettings.modelId)}
          />
        </div>
      </BottomSheet>

      {/* Comprehensive Application Settings Sheet (AI BYOK, Project Rules, Video parameters, System Info, Reset) */}
      <UnifiedSettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={agentSettings}
        onUpdateSettings={handleUpdateSettings}
        projectRules={filesState['GEMINI.md']}
        onUpdateProjectRules={(rules) =>
          setFilesState((prev) => ({ ...prev, ['GEMINI.md']: rules }))
        }
        onResetAll={() => {
          localStorage.clear();
          window.location.reload();
        }}
      />

      {/* 4. Fixed Horizontally Scrollable Bottom Toolbar with Pinned Chat AI Primary Button */}
      <BottomToolbar
        activeView={activeView}
        onSelectView={setActiveView}
        isChatOpen={isChatDrawerOpen}
        onToggleChat={() => setIsChatDrawerOpen((prev) => !prev)}
        isTimelineVisible={isTimelineVisible}
        onToggleTimeline={() => setIsTimelineVisible((prev) => !prev)}
        sessionsCount={sessions.length}
        onOpenChatHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isAiConfigured={Boolean(agentSettings.apiBaseUrl && agentSettings.modelId)}
      />
    </div>
  );
}
