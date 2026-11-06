import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Plus,
  Paperclip,
  X,
  FileCode,
  Music,
  Video,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Terminal,
  Sparkles,
  Bot,
  Sliders,
  Key,
  Mic,
} from 'lucide-react';
import { AgentMessage, AgentAttachment, AgentToolCall } from '../../contracts/agentProtocol';
import { MessageBubble } from './MessageBubble';

interface ChatPanelProps {
  messages: AgentMessage[];
  isAgentWorking: boolean;
  onSendMessage: (text: string, attachments: AgentAttachment[]) => void;
  onStopAgent: () => void;
  currentSec: string;
  selectedClipName?: string;
  prefilledPrompt?: string;
  onClose?: () => void;
  onOpenSettings?: () => void;
  byokModelId?: string;
  isByokConfigured?: boolean;
  streamingMessageId?: string | null;
  activeToolCalls?: AgentToolCall[];
}

const AI_DIRECTOR_PROMPTS = [
  '🔥 Bikin hook pembuka viral di detik 1',
  '✨ Tambah animasi zoom-in dinamis',
  '🎬 Geser teks headline ke posisi atas (30%)',
  '🎵 Sesuaikan durasi dengan beat audio',
  '🎨 Ubah palet warna jadi merah-hitam estetik',
  '📝 Tambahkan teks subtitle bold di tengah',
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isAgentWorking,
  onSendMessage,
  onStopAgent,
  currentSec,
  selectedClipName,
  prefilledPrompt,
  onClose,
  onOpenSettings,
  byokModelId,
  isByokConfigured,
  streamingMessageId = null,
  activeToolCalls = [],
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<AgentAttachment[]>([]);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [isMultiLine, setIsMultiLine] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync prefilled prompt when provided from canvas
  useEffect(() => {
    if (prefilledPrompt) {
      setInputText(prefilledPrompt);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const scrollH = textareaRef.current.scrollHeight;
        const expanded = prefilledPrompt.includes('\n') || scrollH > 40;
        setIsMultiLine(expanded);
        textareaRef.current.style.height = expanded ? `${Math.min(scrollH, 140)}px` : 'auto';
      }
      textareaRef.current?.focus();
    }
  }, [prefilledPrompt]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessageId]);

  // Adjust textarea height and border-radius dynamically based on line count
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      const expanded = text.includes('\n') || scrollH > 40;
      setIsMultiLine(expanded);
      textareaRef.current.style.height = expanded ? `${Math.min(scrollH, 140)}px` : 'auto';
    }
  };

  // Handle file attachment selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const type: AgentAttachment['type'] = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : file.type.startsWith('audio/')
        ? 'audio'
        : 'document';

      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const newAttachment: AgentAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: file.name,
          type,
          size: file.size,
          url,
          mimeType: file.type,
          previewUrl: type === 'image' ? url : undefined,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAgentWorking) {
      onStopAgent();
      return;
    }
    if (!inputText.trim() && attachments.length === 0) return;

    onSendMessage(inputText, attachments);
    setInputText('');
    setAttachments([]);
    setIsMultiLine(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleToolExpand = (toolId: string) => {
    setExpandedTools((prev) => ({ ...prev, [toolId]: !prev[toolId] }));
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#09090c] select-text relative overflow-hidden min-h-0">
      {/* Sleek Minimalist Top Header for Chat Panel (No harsh borders, soft dark gradient) */}
      <div className="h-12 px-4 flex items-center justify-between shrink-0 bg-gradient-to-b from-[#111116] to-[#09090c] shadow-xs sticky top-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-red-600/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-red-400" />
          </div>
          <span className="font-semibold text-sm sm:text-base text-white truncate">AI Director</span>
          <span className="text-xs font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full">
            ACP
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className={`tap flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-xs ${
                isByokConfigured
                  ? 'bg-emerald-950/60 text-emerald-300'
                  : 'bg-amber-950/60 text-amber-300 animate-pulse'
              }`}
              title="Pengaturan Koneksi AI Provider (BYOK)"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="max-w-[130px] truncate">
                {isByokConfigured ? byokModelId || 'AI Aktif' : 'Atur AI (BYOK)'}
              </span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="tap w-8 h-8 rounded-full flex items-center justify-center bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title="Sembunyikan Panel Chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Helper Banner when AI Provider is not yet configured */}
      {!isByokConfigured && onOpenSettings && (
        <div className="px-4 py-2.5 bg-gradient-to-r from-amber-950/70 via-zinc-900 to-zinc-900 flex items-center justify-between gap-3 shrink-0 text-xs sm:text-sm text-amber-200 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Key className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">
              AI Provider belum diatur. Masukkan Base URL & Model ID Anda.
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="tap px-3.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs shrink-0 transition-colors"
          >
            Atur Sekarang
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.json,.ts,.tsx,.txt"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Active Tool Calls Panel — AI agent file/terminal operations */}
      {activeToolCalls.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-zinc-900/60 border border-white/10 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              AI Agent Tool Calls
            </span>
            <span className="ml-auto text-[10px] text-zinc-500">
              {activeToolCalls.filter((t) => t.status === 'running').length} running
            </span>
          </div>
          <div className="space-y-2">
            {activeToolCalls.map((tool) => (
              <div
                key={tool.id}
                className={`p-2 rounded-lg border ${
                  tool.status === 'running'
                    ? 'border-zinc-700 bg-zinc-900/40 animate-pulse'
                    : tool.status === 'completed'
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-rose-500/30 bg-rose-950/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-zinc-400">{tool.toolName}</span>
                  <span
                    className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                      tool.status === 'running'
                        ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                        : tool.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {tool.status === 'running' ? 'Running' : tool.status === 'completed' ? 'Done' : 'Failed'}
                  </span>
                </div>
                <div className="text-xs text-zinc-300 break-all">{tool.description || JSON.stringify(tool.arguments).slice(0, 100)}</div>
                {tool.result && (
                  <div className="mt-1.5 text-[10px] text-zinc-500 break-all bg-zinc-950/50 p-1.5 rounded">
                    {typeof tool.result === 'object'
                      ? JSON.stringify(tool.result, null, 2).slice(0, 200)
                      : String(tool.result).slice(0, 200)}
                  </div>
                )}
                {tool.status === 'failed' && tool.result && (
                  <div className="mt-1.5 text-[10px] text-rose-400 break-all bg-rose-950/30 p-1.5 rounded border border-rose-500/20">
                    {String(tool.result).slice(0, 200)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Scroll Area — message bubbles via MessageBubble (user kanan, AI kiri + ikon luar) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 text-sm">
        {messages.length === 0 && (
          <div className="py-10 text-center space-y-4 max-w-md mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-850 text-zinc-300 text-xs font-medium shadow-md">
              <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-red-500 to-rose-400 text-white font-bold text-[11px] flex items-center justify-center">
                AI
              </span>
              <span>{byokModelId ? byokModelId : 'Direct Video Generation'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Build your video <br />
              <span className="bg-gradient-to-r from-red-400 via-rose-300 to-white bg-clip-text text-transparent">
                with AI Studio
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-xs leading-relaxed">
              Tulis instruksi dalam bahasa Indonesia untuk mengubah teks, durasi, animasi, dan musik Remotion secara langsung.
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={`${msg.id || 'msg'}-${index}`}
              className={`max-w-full`}
            >
              <MessageBubble
                msg={msg}
                isUser={isUser}
                streamingMessageId={streamingMessageId}
              />
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Modern Suggestion Chips */}
      <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 bg-gradient-to-r from-[#0d0d12] via-[#09090c] to-[#0d0d12]">
        {AI_DIRECTOR_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSendMessage(prompt, [])}
            disabled={isAgentWorking}
            className="tap whitespace-nowrap text-xs sm:text-sm font-medium px-4 py-2 rounded-full bg-gradient-to-r from-zinc-850 to-zinc-800 hover:from-zinc-800 hover:to-zinc-750 text-zinc-200 hover:text-white transition-all shrink-0 disabled:opacity-40 active:scale-95 shadow-sm"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Bottom Command Center Card - Unified Prompt Box */}
      <div className="p-3 sm:p-4 bg-gradient-to-t from-black via-[#09090d] to-[#09090c] shrink-0 z-10">
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 mb-2.5 overflow-x-auto no-scrollbar py-0.5">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-zinc-800 text-xs text-zinc-200 shadow-md"
              >
                {att.type === 'image' && att.url ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    className="w-5 h-5 object-cover rounded-full"
                  />
                ) : (
                  <Paperclip className="w-4 h-4 text-red-400" />
                )}
                <span className="max-w-[140px] truncate text-xs font-medium">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="tap w-5 h-5 rounded-full bg-zinc-700/70 flex items-center justify-center text-zinc-300 hover:text-red-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Unified Prompt Container Card - selalu tetap di bawah (tidak ter-scroll) */}
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-b from-[#181822] via-[#131319] to-[#0f0f14] rounded-3xl p-3 shadow-2xl transition-all flex flex-col gap-2.5 shrink-0 mb-2 overflow-hidden"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            dir="ltr"
            value={inputText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe a video idea and let AI do the rest..."
            className="w-full bg-zinc-850/60 text-white text-sm sm:text-base placeholder-zinc-500 resize-none outline-none px-4 py-2.5 min-h-[42px] max-h-[140px] font-sans text-left leading-relaxed transition-[border-radius,height,background-color] duration-200 ease-out focus:bg-zinc-800/80"
            style={{
              direction: 'ltr',
              textAlign: 'left',
              unicodeBidi: 'normal',
              borderRadius: isMultiLine ? '16px' : '9999px',
            }}
          />

          {/* Bottom Card Controls Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Lampirkan File / Media"
                className="tap w-9 h-9 rounded-full bg-zinc-800/90 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition-all shrink-0 shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                title="Pilih Model / Konfigurasi AI (BYOK)"
                className="tap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-all text-xs sm:text-sm font-semibold shadow-sm"
              >
                <span className="truncate max-w-[120px] sm:max-w-[160px]">
                  {byokModelId ? byokModelId : 'Model ⌵'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isAgentWorking ? (
                <button
                  type="button"
                  onClick={onStopAgent}
                  title="Batalkan proses"
                  className="tap w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-500 transition-all shrink-0 shadow-lg shadow-red-950/60"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputText.trim() && attachments.length === 0}
                  title="Kirim instruksi ke AI"
                  className="tap w-10 h-10 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 disabled:opacity-30 disabled:from-zinc-800 disabled:to-zinc-800 text-white flex items-center justify-center transition-all shrink-0 shadow-lg shadow-red-950/50 active:scale-95"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
