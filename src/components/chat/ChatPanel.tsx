import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowUp,
  Square,
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
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<AgentAttachment[]>([]);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync prefilled prompt when provided from canvas
  useEffect(() => {
    if (prefilledPrompt) {
      setInputText(prefilledPrompt);
      textareaRef.current?.focus();
    }
  }, [prefilledPrompt]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAgentWorking]);

  // Adjust textarea height automatically
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
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
    <div className="w-full h-full flex flex-col bg-[#09090b] select-text relative overflow-hidden">
      {/* Sleek Top Header for Chat Panel - Kapsul, Gradasi Jelas Tanpa Border */}
      <div className="h-10 px-3 sm:px-4 flex items-center justify-between shrink-0 bg-gradient-to-b from-[#141418] via-[#0d0d12] to-[#09090b] shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-red-600/30 to-rose-600/20 flex items-center justify-center">
            <Bot className="w-3 h-3 text-red-400" />
          </div>
          <span className="font-semibold text-xs text-white">AI Director Chat</span>
          <span className="text-[10px] font-mono text-zinc-300 bg-gradient-to-r from-zinc-800 to-zinc-900 px-2 py-0.5 rounded-full shadow-xs">
            ACP
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="tap w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-r from-zinc-800/60 to-zinc-900/60 text-zinc-400 hover:text-white transition-colors"
            title="Sembunyikan Panel Chat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.json,.ts,.tsx,.txt"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 space-y-3 min-h-0 text-sm">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              {/* Message Bubble - Kapsul Gradasi Jelas */}
              <div
                className={`rounded-3xl px-3.5 py-2.5 max-w-[92%] sm:max-w-[85%] text-left shadow-md ${
                  isUser
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white rounded-br-xs shadow-red-950/40'
                    : 'bg-gradient-to-b from-zinc-800/90 to-zinc-900/90 text-zinc-100 rounded-bl-xs shadow-black/40'
                }`}
              >
                {/* User Attachments Preview */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {msg.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-1.5 p-1 rounded-md bg-black/40 border border-white/10 text-[11px]"
                      >
                        {att.type === 'image' && att.url ? (
                          <img
                            src={att.url}
                            alt={att.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                            {att.type === 'audio' ? (
                              <Music className="w-3.5 h-3.5 text-emerald-400" />
                            ) : att.type === 'video' ? (
                              <Video className="w-3.5 h-3.5 text-sky-400" />
                            ) : (
                              <FileCode className="w-3.5 h-3.5 text-amber-400" />
                            )}
                          </div>
                        )}
                        <span className="truncate max-w-[100px] text-[10px]">{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assistant Identity Banner */}
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-white/5 text-[11px] text-zinc-400">
                    <div className="w-4 h-4 rounded overflow-hidden bg-[#c92a2a] shrink-0 flex items-center justify-center">
                      <img
                        src="/assets/aistudio/Black_Cat_Animals___Pets_Logo_20261024_034747_0000_d2a38d28.png"
                        alt="Cat Logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-semibold text-white">AI Director</span>
                    <span className="text-zinc-600">·</span>
                    <span className="font-mono text-[9px] text-zinc-500">Remotion ACP</span>
                  </div>
                )}

                {/* Markdown text */}
                <div className="prose prose-invert prose-xs max-w-none break-words leading-relaxed text-zinc-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* ACP Tool Executions */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                    {msg.toolCalls.map((tool) => {
                      const isExpanded = !!expandedTools[tool.id];
                      return (
                        <div
                          key={tool.id}
                          className="bg-black/30 border border-white/5 rounded-lg overflow-hidden text-xs"
                        >
                          <button
                            type="button"
                            onClick={() => toggleToolExpand(tool.id)}
                            className="w-full px-2 py-1 flex items-center justify-between text-left hover:bg-white/5 transition-colors gap-2"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Terminal className="w-3 h-3 text-red-400 shrink-0" />
                              <span className="font-mono text-[10px] text-zinc-300 font-medium truncate">
                                {tool.toolName}
                              </span>
                              {tool.durationMs && (
                                <span className="text-[9px] text-zinc-500 font-mono shrink-0">
                                  {tool.durationMs}ms
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {tool.status === 'completed' && (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              )}
                              {tool.status === 'running' && (
                                <span className="w-2.5 h-2.5 rounded-full border border-cyan-400 border-t-transparent animate-spin" />
                              )}
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3 text-zinc-500" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-zinc-500" />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-2 py-1.5 border-t border-white/5 bg-black/50 space-y-1 text-[10px] font-mono text-zinc-400">
                              {tool.description && <p>{tool.description}</p>}
                              {tool.result && (
                                <div className="text-emerald-400/90 bg-emerald-950/20 p-1 rounded border border-emerald-900/30">
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
                  className={`text-[9px] font-mono mt-1 ${
                    isUser ? 'text-red-200/70 text-right' : 'text-zinc-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Agent Working Status Bar - Kapsul Gradasi */}
        {isAgentWorking && (
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-zinc-800/95 via-zinc-850/95 to-zinc-900/95 px-4 py-2 rounded-full max-w-sm text-xs text-zinc-300 shadow-lg">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-red-500 border-t-transparent animate-spin shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate text-[11px]">AI Agent sedang meracik...</p>
              <p className="text-[10px] text-zinc-400 font-mono truncate">
                Remotion Live Recompile via ACP
              </p>
            </div>
            <button
              type="button"
              onClick={onStopAgent}
              className="tap px-3 py-1 bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 rounded-full text-[10px] text-white font-bold transition-all shadow-xs"
            >
              Stop
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Modern Suggestion Chips - Kapsul Gradasi Tanpa Border */}
      <div className="px-3 py-2 bg-gradient-to-b from-transparent to-[#09090b] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {AI_DIRECTOR_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSendMessage(prompt, [])}
            disabled={isAgentWorking}
            className="tap whitespace-nowrap text-[11px] px-3.5 py-1.5 rounded-full bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 hover:from-zinc-700/80 text-zinc-300 hover:text-white transition-all shrink-0 disabled:opacity-50 active:scale-95 shadow-xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Bottom Command Center Input Area - Kapsul & Gradasi Tanpa Border */}
      <div className="p-2.5 sm:p-3 bg-gradient-to-t from-black via-[#0d0d12] to-transparent shrink-0 z-10">
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-scrollbar py-0.5">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full bg-gradient-to-r from-zinc-800 to-zinc-900 text-xs text-zinc-300 shadow-sm"
              >
                {att.type === 'image' && att.url ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    className="w-4 h-4 object-cover rounded-full"
                  />
                ) : (
                  <Paperclip className="w-3 h-3 text-red-400" />
                )}
                <span className="max-w-[100px] truncate">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="tap w-4 h-4 rounded-full bg-zinc-700/60 flex items-center justify-center text-zinc-300 hover:text-red-400"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Command Form (Kapsul Bulat & Gradasi Jelas) */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-1.5 bg-gradient-to-r from-zinc-900/95 via-zinc-850/95 to-zinc-900/95 rounded-full p-1.5 transition-all shadow-lg ring-1 ring-white/5 focus-within:ring-2 focus-within:ring-red-500/50"
        >
          {/* File Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Lampirkan Gambar/Video/Audio"
            className="tap w-8 h-8 rounded-full bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 hover:from-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-white transition-all shrink-0 shadow-xs"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            dir="ltr"
            value={inputText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Perintahkan AI (misal: 'geser teks ke atas', 'bikin animasi zoom')..."
            className="flex-1 bg-transparent text-white text-xs placeholder-zinc-500 resize-none outline-none py-1 px-2 max-h-[100px] font-sans text-left leading-relaxed"
            style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'normal' }}
          />

          {/* Send / Stop Action Button (Kapsul Bulat) */}
          {isAgentWorking ? (
            <button
              type="button"
              onClick={onStopAgent}
              title="Batalkan proses"
              className="tap w-8 h-8 rounded-full bg-gradient-to-r from-red-700 to-rose-700 text-white flex items-center justify-center hover:from-red-600 hover:to-rose-600 transition-all shrink-0 shadow-md shadow-red-950/50"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputText.trim() && attachments.length === 0}
              title="Kirim instruksi ke AI"
              className="tap w-8 h-8 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 disabled:opacity-30 disabled:from-zinc-800 disabled:to-zinc-800 text-white flex items-center justify-center transition-all shrink-0 shadow-md shadow-red-950/50 active:scale-95"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
