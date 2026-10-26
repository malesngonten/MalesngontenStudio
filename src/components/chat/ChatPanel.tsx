import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowUp,
  Square,
  Paperclip,
  RotateCcw,
  Sparkles,
  CheckCircle,
  Circle,
  X,
  FileCode,
  Layers,
  Clock,
  FolderOpen,
} from 'lucide-react';
import { ChatMessage, ProjectAsset, TimelineClip, TimelineLayer, PermissionRequest, CodeDiff } from '../../types';
import { ActivityLog } from './ActivityLog';
import { PermissionCard } from './PermissionCard';
import { DiffCard } from './DiffCard';
import { PillButton } from '../ui/PillButton';

interface ChatPanelProps {
  messages: ChatMessage[];
  isAgentWorking: boolean;
  onSendMessage: (text: string, context?: any, attachments?: ProjectAsset[]) => void;
  onStopAgent: () => void;
  onRevertCheckpoint: (hash: string) => void;
  onPermissionDecision: (messageId: string, decision: 'approved' | 'approved_session' | 'rejected') => void;
  onDiffDecision: (messageId: string, accept: boolean) => void;
  selectedLayer: TimelineLayer | null;
  selectedClip: TimelineClip | null;
  currentFrame: number;
  fps: number;
  activeFile: string;
  assets: ProjectAsset[];
  onOpenFileUpload: () => void;
}

const QUICK_ACTIONS = [
  'Tambah subtitle',
  'Ganti musik',
  'Zoom klip',
  'Tambah transisi',
  'Buat caption animasi',
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isAgentWorking,
  onSendMessage,
  onStopAgent,
  onRevertCheckpoint,
  onPermissionDecision,
  onDiffDecision,
  selectedLayer,
  selectedClip,
  currentFrame,
  fps,
  activeFile,
  assets,
  onOpenFileUpload,
}) => {
  const [inputText, setInputText] = useState('');
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedAttachments, setSelectedAttachments] = useState<ProjectAsset[]>([]);
  
  // Context chips removable by user
  const [includeLayerCtx, setIncludeLayerCtx] = useState(true);
  const [includeTimeCtx, setIncludeTimeCtx] = useState(true);
  const [includeFileCtx, setIncludeFileCtx] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAgentWorking]);

  // Sync external text clear or programmatic reset
  useEffect(() => {
    if (inputRef.current && inputText === '' && inputRef.current.value !== '') {
      inputRef.current.value = '';
    }
  }, [inputText]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    // Detect '@' for mentions
    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1 && lastAt === val.length - 1) {
      setShowMentionMenu(true);
      setMentionQuery('');
    } else if (lastAt !== -1 && showMentionMenu) {
      setMentionQuery(val.slice(lastAt + 1));
    } else {
      setShowMentionMenu(false);
    }
  };

  const handleSelectMention = (itemText: string) => {
    const currentVal = inputRef.current ? inputRef.current.value : inputText;
    const lastAt = currentVal.lastIndexOf('@');
    const newText = (lastAt !== -1 ? currentVal.slice(0, lastAt) : currentVal) + `@${itemText} `;
    if (inputRef.current) {
      inputRef.current.value = newText;
      inputRef.current.focus();
    }
    setInputText(newText);
    setShowMentionMenu(false);
  };

  const handleSend = () => {
    const textToSend = inputRef.current ? inputRef.current.value : inputText;
    if (isAgentWorking) {
      onStopAgent();
      return;
    }

    if (!textToSend.trim() && selectedAttachments.length === 0) return;

    // Structured context from UI
    const playheadSec = Number((currentFrame / fps).toFixed(2));
    const contextData: any = {};
    if (includeLayerCtx && selectedLayer) {
      contextData.selectedLayer = selectedLayer.name;
      if (selectedClip) contextData.selectedClipId = selectedClip.name;
    }
    if (includeTimeCtx) {
      contextData.playheadFrame = currentFrame;
      contextData.playheadSec = playheadSec;
    }
    if (includeFileCtx && activeFile) {
      contextData.activeFile = activeFile;
    }
    contextData.assetsCount = assets.length;

    onSendMessage(textToSend, contextData, selectedAttachments);
    
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setInputText('');
    setSelectedAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredAssets = assets.filter((a) =>
    a.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#0e0e10] overflow-hidden relative">
      {/* Messages area - flex-1 scroll, bottom aligned */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {/* Empty state with prompt suggestions */}
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 my-auto select-none">
            <div className="w-12 h-12 rounded-full bg-[#18181b] border border-[#27272c] flex items-center justify-center text-[#e5484d] mb-3 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-[#f2f2f3]">Studio Hermes AI Agent</h4>
            <p className="text-xs text-[#8b8b94] max-w-[270px] mt-1 mb-4 leading-relaxed">
              Tulis instruksi dalam bahasa Indonesia untuk mengedit video secara otomatis, atau pilih aksi cepat:
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 max-w-[320px]">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => onSendMessage(action)}
                  className="tap text-[11px] px-3 py-1.5 rounded-full bg-[#18181b] hover:bg-[#222226] border border-[#27272c] hover:border-[#303036] text-[#8b8b94] hover:text-[#f2f2f3] active:scale-95 transition-all"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {/* Message Bubble */}
              <div
                className={`text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#e5484d] text-white rounded-2xl rounded-br-xs px-3.5 py-2.5 max-w-[85%] shadow-sm'
                    : 'bg-[#222226] text-[#f2f2f3] rounded-2xl rounded-bl-xs px-3.5 py-2.5 max-w-[90%] border border-[#303036] shadow-sm'
                }`}
              >
                {/* Attachments inside bubble */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {msg.attachments.map((att) => (
                      <span
                        key={att.id}
                        className="bg-black/30 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"
                      >
                        <FolderOpen className="w-2.5 h-2.5" />
                        {att.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Context chips if sent */}
                {msg.context && Object.keys(msg.context).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5 text-[9px] opacity-80 font-mono">
                    {msg.context.selectedLayer && (
                      <span className="bg-black/20 px-1.5 py-0.5 rounded">
                        Track: {msg.context.selectedLayer}
                      </span>
                    )}
                    {msg.context.playheadSec !== undefined && (
                      <span className="bg-black/20 px-1.5 py-0.5 rounded">
                        {msg.context.playheadSec}s
                      </span>
                    )}
                  </div>
                )}

                {/* Text Content with Markdown */}
                <div className="prose prose-invert prose-xs max-w-none break-words">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                </div>

                {/* 6.9 Agent Plan Checklist */}
                {msg.plan && msg.plan.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-[#303036] space-y-1">
                    <div className="text-[10px] font-semibold text-[#8b8b94] uppercase tracking-wider mb-1">
                      Rencana Aksi:
                    </div>
                    {msg.plan.map((item) => (
                      <div key={item.id} className="flex items-center gap-1.5 text-[11px]">
                        {item.completed ? (
                          <CheckCircle className="w-3.5 h-3.5 text-[#5fd3b0] shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-[#8b8b94] shrink-0" />
                        )}
                        <span className={item.completed ? 'line-through text-[#8b8b94]' : 'text-[#f2f2f3]'}>
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 6.2 Tool Call Activity Log */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <ActivityLog logs={msg.toolCalls} />
                )}

                {/* 6.3 Action Permission Card */}
                {msg.permission && (
                  <PermissionCard
                    permission={msg.permission}
                    onDecision={(dec) => onPermissionDecision(msg.id, dec)}
                  />
                )}

                {/* 6.7 Diff Code Review */}
                {msg.diff && (
                  <DiffCard
                    diff={msg.diff}
                    onAccept={() => onDiffDecision(msg.id, true)}
                    onReject={() => onDiffDecision(msg.id, false)}
                  />
                )}
              </div>

              {/* 6.4 Auto-checkpoint revert chip */}
              {msg.canRevert && msg.checkpointHash && (
                <div className="mt-1">
                  <button
                    type="button"
                    onClick={() => onRevertCheckpoint(msg.checkpointHash!)}
                    className="tap inline-flex items-center gap-1 text-[10px] text-[#8b8b94] hover:text-[#f2f2f3] bg-[#18181b] border border-[#27272c] px-2 py-1 rounded-full transition-colors"
                  >
                    <RotateCcw className="w-2.5 h-2.5 text-[#e5484d]" />
                    <span>Kembalikan sebelum perubahan ini</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}

        {/* Typing / Agent working indicator */}
        {isAgentWorking && (
          <div className="flex items-center gap-2 text-xs text-[#8b8b94] bg-[#18181b] border border-[#27272c] rounded-full px-3 py-1.5 w-fit animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#e5484d] animate-ping" />
            <span>AI Agent sedang mengedit project...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Area: Controls, Chips, and Input (Anchored together cleanly) */}
      <div className="relative px-3 py-2 bg-[#0e0e10] border-t border-[#27272c]/50 shrink-0 space-y-1.5">
        {/* Mention Popup Menu - Anchored strictly directly above the input box */}
        {showMentionMenu && (
          <div className="absolute bottom-full mb-2 left-3 right-3 bg-[#18181b] border border-[#303036] rounded-2xl p-2 shadow-2xl z-40 max-h-48 overflow-y-auto">
            <div className="text-[10px] font-semibold text-[#8b8b94] uppercase px-2 py-1 text-[#8b8b94]">
              Sebut Asset atau File (@)
            </div>
            {filteredAssets.length === 0 ? (
              <div className="text-xs text-[#8b8b94] px-2 py-1.5">Tidak ada asset cocok</div>
            ) : (
              filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleSelectMention(asset.name)}
                  className="tap w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#222226] text-left text-xs transition-colors"
                >
                  <span className="text-[#f2f2f3] font-medium">{asset.name}</span>
                  <span className="text-[10px] text-[#8b8b94] uppercase">{asset.type}</span>
                </button>
              ))
            )}
            <button
              type="button"
              onClick={() => handleSelectMention(activeFile)}
              className="tap w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#222226] text-left text-xs transition-colors border-t border-[#27272c] mt-1"
            >
              <span className="text-[#7aa7ff] font-medium font-code">{activeFile}</span>
              <span className="text-[10px] text-[#8b8b94]">File Aktif</span>
            </button>
          </div>
        )}

        {/* 6.10 Quick Action Chips (Shown as sleek scrollable pills when messages exist) */}
        {messages.length > 0 && (
          <div className="overflow-x-auto flex items-center gap-1.5 no-scrollbar py-0.5">
            <span className="text-[10px] font-semibold text-[#76767f] uppercase shrink-0">Aksi:</span>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => onSendMessage(action)}
                className="tap whitespace-nowrap text-[10px] px-2.5 py-0.5 rounded-full bg-[#18181b] hover:bg-[#222226] border border-[#27272c] text-[#8b8b94] hover:text-[#f2f2f3] active:scale-95 transition-all shrink-0"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* 6.5 Context Chips & Attachment Chips Bar (Compact inline row) */}
        {((includeLayerCtx && selectedLayer) || includeTimeCtx || (includeFileCtx && activeFile) || selectedAttachments.length > 0) && (
          <div className="overflow-x-auto flex items-center gap-1.5 text-[10px] no-scrollbar py-0.5">
            {includeLayerCtx && selectedLayer && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#222226] text-[#b39dff] border border-[#303036] shrink-0">
                <Layers className="w-2.5 h-2.5" />
                <span className="truncate max-w-[80px]">{selectedLayer.name}</span>
                <button
                  type="button"
                  onClick={() => setIncludeLayerCtx(false)}
                  className="text-[#8b8b94] hover:text-white ml-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {includeTimeCtx && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#222226] text-[#7aa7ff] border border-[#303036] shrink-0">
                <Clock className="w-2.5 h-2.5" />
                <span>{Number((currentFrame / fps).toFixed(1))}s</span>
                <button
                  type="button"
                  onClick={() => setIncludeTimeCtx(false)}
                  className="text-[#8b8b94] hover:text-white ml-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {includeFileCtx && activeFile && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#222226] text-[#5fd3b0] border border-[#303036] shrink-0">
                <FileCode className="w-2.5 h-2.5" />
                <span className="truncate max-w-[80px]">{activeFile}</span>
                <button
                  type="button"
                  onClick={() => setIncludeFileCtx(false)}
                  className="text-[#8b8b94] hover:text-white ml-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {/* Selected file attachments */}
            {selectedAttachments.map((att) => (
              <span
                key={att.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#3b2427] text-[#e5484d] border border-[#e5484d]/40 shrink-0"
              >
                <FolderOpen className="w-2.5 h-2.5" />
                <span className="truncate max-w-[80px]">{att.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedAttachments((prev) => prev.filter((a) => a.id !== att.id))
                  }
                  className="text-[#e5484d] hover:text-white ml-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input Capsule */}
        <div className="flex items-center bg-[#222226] border border-[#303036] rounded-full px-2 py-1 focus-within:border-[#e5484d]/60 transition-colors">
          {/* Tombol Paperclip */}
          <button
            type="button"
            aria-label="Lampirkan file asset"
            onClick={onOpenFileUpload}
            className="tap w-9 h-9 flex items-center justify-center text-[#8b8b94] hover:text-[#f2f2f3] active:scale-95 transition-transform shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Input transparan dengan konfigurasi native LTR (uncontrolled DOM untuk mencegah reset caret) */}
          <input
            ref={inputRef}
            type="text"
            dir="ltr"
            lang="id"
            defaultValue=""
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Minta AI edit videonya..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 bg-transparent px-2 text-xs sm:text-sm text-[#f2f2f3] placeholder-[#76767f] focus:outline-hidden text-left [direction:ltr] select-text"
            style={{
              direction: 'ltr',
              textAlign: 'left',
              unicodeBidi: 'plaintext',
              userSelect: 'text',
              WebkitUserSelect: 'text',
            }}
          />

          {/* Tombol kirim bulat merah berikon ArrowUp (atau Stop persegi saat agent bekerja) */}
          <button
            type="button"
            aria-label={isAgentWorking ? 'Hentikan agent' : 'Kirim instruksi ke agent'}
            onClick={handleSend}
            disabled={!isAgentWorking && !inputText.trim() && selectedAttachments.length === 0}
            className={`tap w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
              isAgentWorking
                ? 'bg-[#e5484d] hover:bg-[#d93d42] text-white animate-pulse'
                : inputText.trim() || selectedAttachments.length > 0
                ? 'bg-[#e5484d] hover:bg-[#d93d42] text-white active:scale-95 shadow-sm'
                : 'bg-[#303036] text-[#76767f] opacity-50 cursor-not-allowed'
            }`}
          >
            {isAgentWorking ? (
              <Square className="w-3.5 h-3.5 fill-white" />
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
