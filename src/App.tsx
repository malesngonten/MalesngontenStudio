import React, { useState, useCallback } from 'react';
import {
  MessageSquare,
  Layers,
  FileCode,
  FolderOpen,
  Sliders,
  Sparkles,
  SplitSquareVertical,
  Maximize2,
  Minimize2,
  Tv,
} from 'lucide-react';

import { useStudioState } from './state/useStudioState';
import { Header } from './components/header/Header';
import { RemotionPreview } from './components/player/RemotionPreview';
import { ChatPanel } from './components/chat/ChatPanel';
import { TimelineDetailPanel } from './components/timeline/TimelineDetailPanel';
import { CodeEditorPanel } from './components/code/CodeEditorPanel';
import { AssetTab } from './components/assets/AssetTab';
import { ChatHistorySheet } from './components/history/ChatHistorySheet';
import { BottomSheet } from './components/ui/BottomSheet';
import { ProjectAsset, TimelineClip, TimelineLayer } from './types';

const COMPOSITION_SAMPLE_CODE = `// ShortVideoComposition.tsx
// Powered by Remotion v4.0 & Males Ngonten Studio AI Agent

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { TimelineData } from '../types';

export const ShortVideoComposition: React.FC<{ timeline: TimelineData }> = ({ timeline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Active layers rendered deterministically per frame
  return (
    <AbsoluteFill className="bg-black select-none overflow-hidden font-sans">
      {/* 1. Dynamic Background Layer */}
      {/* 2. Text Motion Layer with Spring Animations */}
      {/* 3. Subtitles & Narration Layer */}
      {/* 4. Audio Waveform Visualizer */}
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
  } = useStudioState();

  // Bottom secondary drawer for Timeline / Code / Assets / Settings
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'timeline' | 'code' | 'assets' | 'settings'>('none');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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

  // Toggle layout split mode (50-50 -> player-focus -> chat-focus)
  const handleToggleSplitMode = useCallback(() => {
    setSplitMode((prev) => {
      if (prev === '50-50') return 'player-focus';
      if (prev === 'player-focus') return 'chat-focus';
      return '50-50';
    });
  }, [setSplitMode]);

  // Handle timeline clip props update from detail panel
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

  // Handle asset upload
  const handleUploadAssets = useCallback(
    (newFiles: File[]) => {
      const added: ProjectAsset[] = newFiles.map((file) => ({
        id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: file.name,
        type: file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('video/')
          ? 'video'
          : 'audio',
        path: URL.createObjectURL(file),
        size: file.size,
        createdAt: 'Baru saja',
      }));
      setAssets((prev) => [...added, ...prev]);
    },
    [setAssets]
  );

  // Dynamic vertical split height calculation
  const getPlayerHeightClass = () => {
    switch (splitMode) {
      case 'player-focus':
        return 'h-[65%] sm:h-[60%]';
      case 'chat-focus':
        return 'h-[35%] sm:h-[35%]';
      case '50-50':
      default:
        return 'h-[50%]';
    }
  };

  const getChatHeightClass = () => {
    switch (splitMode) {
      case 'player-focus':
        return 'h-[35%] sm:h-[40%]';
      case 'chat-focus':
        return 'h-[65%] sm:h-[65%]';
      case '50-50':
      default:
        return 'h-[50%]';
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const currentSec = (currentFrame / timeline.fps).toFixed(2);
  const totalAssetsSize = assets.reduce((sum, a) => sum + (a.size || 0), 0);

  return (
    <div className="w-full h-dvh max-h-dvh flex flex-col bg-[#0b0b0e] text-[#f2f2f5] antialiased overflow-hidden select-none font-sans">
      {/* 1. Brand Header */}
      <Header
        agentStatus={agentStatus}
        sessionsCount={sessions.length}
        activeSessionTitle={activeSession?.title}
        splitMode={splitMode}
        onToggleSplitMode={handleToggleSplitMode}
        onOpenChatHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setActiveDrawer('settings')}
        onNewChat={handleNewChat}
      />

      {/* 2. Main 50:50 Vertical Split Workspace */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {/* Top Half: Remotion Video Player */}
        <section
          className={`w-full ${getPlayerHeightClass()} flex flex-col transition-all duration-200 border-b border-[#23232b] relative shrink-0`}
        >
          <RemotionPreview
            timeline={timeline}
            currentFrame={currentFrame}
            onFrameUpdate={handleFrameUpdate}
            isPlaying={isPlaying}
            onPlayPauseToggle={handlePlayPauseToggle}
            selectedClipId={selectedClipId}
            onSelectClip={handleSelectClip}
            onUpdateClipPosition={handleUpdateClipPosition}
          />
        </section>

        {/* Mini Navigation Bar between Player & Chat */}
        <div className="h-[34px] px-3 bg-[#131318] border-b border-[#23232b] flex items-center justify-between gap-2 shrink-0 select-none">
          {/* Active Session & Agent Indicator */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="tap flex items-center gap-1.5 text-xs text-[#a4a4b4] hover:text-white font-medium truncate"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#e5484d] shrink-0" />
              <span className="truncate max-w-[180px] sm:max-w-[320px]">
                {activeSession?.title || 'Sesi Video'}
              </span>
            </button>
          </div>

          {/* Tools & Panels Switcher */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveDrawer('timeline')}
              title="Buka Timeline Multi-Track"
              className={`tap px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                activeDrawer === 'timeline'
                  ? 'bg-[#c92a2a] text-white'
                  : 'text-[#8e8e9c] hover:text-white hover:bg-[#1f1f28]'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Timeline</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDrawer('code')}
              title="Lihat Kode Remotion TSX"
              className={`tap px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                activeDrawer === 'code'
                  ? 'bg-[#c92a2a] text-white'
                  : 'text-[#8e8e9c] hover:text-white hover:bg-[#1f1f28]'
              }`}
            >
              <FileCode className="w-3 h-3" />
              <span>Code</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDrawer('assets')}
              title="Aset Media"
              className={`tap px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                activeDrawer === 'assets'
                  ? 'bg-[#c92a2a] text-white'
                  : 'text-[#8e8e9c] hover:text-white hover:bg-[#1f1f28]'
              }`}
            >
              <FolderOpen className="w-3 h-3" />
              <span>Aset</span>
            </button>
          </div>
        </div>

        {/* Bottom Half: AI Agent Chat Panel */}
        <section
          className={`w-full ${getChatHeightClass()} flex flex-col transition-all duration-200 min-h-0 relative`}
        >
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
          />
        </section>
      </main>

      {/* 3. Drawers & Modals */}
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

      {/* Multi-track Timeline Drawer */}
      <BottomSheet
        isOpen={activeDrawer === 'timeline'}
        onClose={() => setActiveDrawer('none')}
        title="Timeline Multi-Track Remotion"
        subtitle="Geser playhead atau klip untuk mengatur waktu muncul dan durasi"
      >
        <div className="space-y-4">
          <TimelineDetailPanel
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
          />
        </div>
      </BottomSheet>

      {/* Code Inspector Drawer */}
      <BottomSheet
        isOpen={activeDrawer === 'code'}
        onClose={() => setActiveDrawer('none')}
        title="Remotion TSX Code & Timeline JSON"
        subtitle="Arsitektur kode deklaratif ShortVideoComposition.tsx"
      >
        <div className="h-[55vh]">
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
      </BottomSheet>

      {/* Assets Drawer */}
      <BottomSheet
        isOpen={activeDrawer === 'assets'}
        onClose={() => setActiveDrawer('none')}
        title="Penyimpanan Aset Media"
        subtitle="Aset lokal yang dapat digunakan oleh AI agent dalam video"
      >
        <AssetTab
          assets={assets}
          onUploadAssets={handleUploadAssets}
          onDeleteAsset={(id) => setAssets((prev) => prev.filter((a) => a.id !== id))}
          onUseAssetInChat={(asset: ProjectAsset) => {
            handleSendMessage(
              `Tolong masukkan aset "${asset.name}" sebagai background video di timeline`,
              []
            );
            setActiveDrawer('none');
          }}
          usedBytes={totalAssetsSize}
          maxBytes={500 * 1024 * 1024}
        />
      </BottomSheet>

      {/* Settings / Open Source ACP Info Drawer */}
      <BottomSheet
        isOpen={activeDrawer === 'settings'}
        onClose={() => setActiveDrawer('none')}
        title="Tentang Males Ngonten Studio"
        subtitle="Arsitektur Open-Source AI Coding Agent & Remotion Video Engine"
      >
        <div className="space-y-4 text-xs text-[#a0a0af]">
          <div className="flex items-center gap-3 p-3 bg-[#15151c] rounded-xl border border-[#262633]">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#c92a2a] shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/Black_Cat_Animals___Pets_Logo_20261024_034747_0000_d2a38d28.png"
                alt="Males Ngonten Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Males Ngonten Studio</p>
              <p className="text-[11px] text-[#787889]">
                Versi 1.0 • Protokol ACP (Agent Client Protocol)
              </p>
            </div>
          </div>

          <div className="p-3 bg-[#121217] rounded-xl border border-white/5 space-y-2">
            <p className="font-semibold text-white">Visi Jangka Panjang:</p>
            <p className="leading-relaxed">
              Platform open-source untuk pembuatan & pengeditan video otomatis tanpa repot.
              Mendukung beragam AI agent (Claude, Gemini, DeepSeek, Ollama lokal) melalui protokol
              standar ACP, menggunakan Remotion sebagai mesin rendering deterministik di perangkat
              pengguna.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2.5 rounded-lg bg-[#15151c] border border-white/5">
              <span className="text-[#6d6d7e]">Video Engine:</span>
              <p className="font-semibold text-white mt-0.5">Remotion v4.0</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#15151c] border border-white/5">
              <span className="text-[#6d6d7e]">Agent Protocol:</span>
              <p className="font-semibold text-white mt-0.5">ACP v1.0 Standard</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#15151c] border border-white/5">
              <span className="text-[#6d6d7e]">Workspace:</span>
              <p className="font-semibold text-white mt-0.5">Local Device Storage</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#15151c] border border-white/5">
              <span className="text-[#6d6d7e]">Target Format:</span>
              <p className="font-semibold text-white mt-0.5">9:16 Portrait (Shorts)</p>
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
