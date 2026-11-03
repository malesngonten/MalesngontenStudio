import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
import { AgentMessage, AgentAttachment } from '../../contracts/agentProtocol';

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
  }, [messages, isAgentWorking]);

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
    <div className="w-full h-full flex flex-col bg-[#09090c] select-text relative overflow-hidden">
      {/* Sleek Minimalist Top Header for Chat Panel (No harsh borders, soft dark gradient) */}
      <div className="h-12 px-4 flex items-center justify-between shrink-0 bg-gradient-to-b from-[#111116] to-[#09090c] shadow-xs">
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

      {/* Messages Scroll Area with Modern, Legible Typography */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 min-h-0 text-sm">
        {messages.length === 0 && (
          <div className="py-10 text-center space-y-4 max-w-md mx-auto flex flex-col items-center">
            {/* Model Announcement Pill Badge (Directly inspired by Reference Screenshot) */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-850 text-zinc-300 text-xs font-medium shadow-md">
              <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-red-500 to-rose-400 text-white font-bold text-[11px] flex items-center justify-center">
                AI
              </span>
              <span>{byokModelId ? byokModelId : 'Direct Video Generation'}</span>
            </div>

            {/* Bold Modern Hero Headline (Exact vibe of Reference Screenshot) */}
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
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              {/* Message Bubble - Symmetrical & Clean */}
              <div
                className={`rounded-2xl px-4 py-3 max-w-[92%] sm:max-w-[85%] text-left shadow-lg ${
                  isUser
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white rounded-br-xs'
                    : 'bg-zinc-850/90 text-zinc-100 rounded-bl-xs ring-1 ring-white/5'
                }`}
              >
                {/* User Attachments Preview */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {msg.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full bg-black/40 text-xs font-medium"
                      >
                        {att.type === 'image' && att.url ? (
                          <img
                            src={att.url}
                            alt={att.name}
                            className="w-7 h-7 object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                            {att.type === 'audio' ? (
                              <Music className="w-3.5 h-3.5 text-emerald-400" />
                            ) : att.type === 'video' ? (
                              <Video className="w-3.5 h-3.5 text-sky-400" />
                            ) : (
                              <FileCode className="w-3.5 h-3.5 text-amber-400" />
                            )}
                          </div>
                        )}
                        <span className="truncate max-w-[120px]">{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assistant Identity Banner */}
                {!isUser && (
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-white/[0.08] text-xs text-zinc-400">
                    <div className="w-4 h-4 rounded-full overflow-hidden bg-[#c92a2a] shrink-0 flex items-center justify-center">
                      <img
                        src="/assets/aistudio/Black_Cat_Animals___Pets_Logo_20261024_034747_0000_d2a38d28.png"
                        alt="Cat Logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-semibold text-white">AI Director</span>
                    <span className="text-zinc-600">·</span>
                    <span className="font-mono text-[10px] text-zinc-400">Remotion Agent</span>
                  </div>
                )}

                {/* Markdown text with comfortable line-height and size */}
                <div className="prose prose-invert prose-sm max-w-none break-words leading-relaxed text-zinc-100 font-sans">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* ACP Tool Executions */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-2.5 pt-1.5 space-y-1.5">
                    {msg.toolCalls.map((tool) => {
                      const isExpanded = !!expandedTools[tool.id];
                      return (
                        <div
                          key={tool.id}
                          className="bg-black/35 rounded-xl overflow-hidden text-xs"
                        >
                          <button
                            type="button"
                            onClick={() => toggleToolExpand(tool.id)}
                            className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-white/5 transition-colors gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Terminal className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              <span className="font-mono text-xs text-zinc-300 font-medium truncate">
                                {tool.toolName}
                              </span>
                              {tool.durationMs && (
                                <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                                  {tool.durationMs}ms
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {tool.status === 'completed' && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                              {tool.status === 'running' && (
                                <span className="w-3 h-3 rounded-full border border-cyan-400 border-t-transparent animate-spin" />
                              )}
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-3 py-2 bg-black/50 space-y-1 text-xs font-mono text-zinc-400">
                              {tool.description && <p>{tool.description}</p>}
                              {tool.result && (
                                <div className="text-emerald-300 bg-emerald-950/40 p-2 rounded-lg mt-1">
                                  {tool.result}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Message Timestamp */}
                <div
                  className={`text-[10px] font-mono mt-1.5 ${
                    isUser ? 'text-red-200/70 text-right' : 'text-zinc-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Agent Working Status Bar */}
        {isAgentWorking && (
          <div className="flex items-center gap-3 bg-zinc-850 px-4 py-2.5 rounded-2xl max-w-sm text-sm text-zinc-200 shadow-xl ring-1 ring-white/10">
            <span className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate text-xs">AI Agent sedang meracik...</p>
              <p className="text-[11px] text-zinc-400 font-mono truncate">
                Remotion Recompile via ACP
              </p>
            </div>
            <button
              type="button"
              onClick={onStopAgent}
              className="tap px-3 py-1 bg-red-600 hover:bg-red-500 rounded-full text-xs text-white font-bold transition-all shrink-0"
            >
              Stop
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Modern Suggestion Chips (Directly Inspired by Google AI Studio Screenshot) */}
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

      {/* Bottom Command Center Card - Unified Prompt Box (Directly Inspired by Reference Screenshot) */}
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

        {/* Unified Prompt Container Card with Soft Gradient Surface (No Harsh Borders) */}
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-b from-[#181822] via-[#131319] to-[#0f0f14] rounded-3xl p-3 shadow-2xl transition-all flex flex-col gap-2.5"
        >
          {/* Main Input Textarea with Dynamic Border Radius */}
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

          {/* Bottom Card Controls Row: (+) Attachment, Model Picker, and Sparkle/Send */}
          <div className="flex items-center justify-between pt-1">
            {/* Left Controls */}
            <div className="flex items-center gap-2">
              {/* Plus (+) Attachment Button (Circle) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Lampirkan File / Media"
                className="tap w-9 h-9 rounded-full bg-zinc-800/90 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition-all shrink-0 shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Model Picker Pill (like "Default ⌵" in reference screenshot) */}
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

            {/* Right Controls: Send / Stop */}
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
