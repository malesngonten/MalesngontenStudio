import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { AgentMessage, AgentAttachment, AgentToolCall } from '../../contracts/agentProtocol';

interface ChatPanelProps {
  messages: AgentMessage[];
  isAgentWorking: boolean;
  onSendMessage: (text: string, attachments: AgentAttachment[]) => void;
  onStopAgent: () => void;
  currentSec: string;
  selectedClipName?: string;
}

const QUICK_PROMPTS = [
  '🔥 Bikin headline viral di detik 1',
  '✨ Ubah animasi jadi zoom dinamis',
  '🎬 Geser teks ke posisi atas (30%)',
  '🎵 Sesuaikan beat musik latar',
  '⏱️ Percepat durasi tayang klip',
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isAgentWorking,
  onSendMessage,
  onStopAgent,
  currentSec,
  selectedClipName,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<AgentAttachment[]>([]);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAgentWorking]);

  // Adjust textarea height automatically
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
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
    <div className="w-full h-full flex flex-col bg-[#0e0e12] select-text relative overflow-hidden">
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
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3.5 min-h-0 text-sm">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              {/* Message Bubble Container */}
              <div
                className={`rounded-2xl px-3.5 py-2.5 max-w-[92%] sm:max-w-[85%] text-left shadow-sm ${
                  isUser
                    ? 'bg-[#c92a2a] text-white rounded-br-xs'
                    : 'bg-[#18181f] text-[#f0f0f3] border border-[#262630] rounded-bl-xs'
                }`}
              >
                {/* User Attachments Preview if any */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {msg.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg bg-black/30 border border-white/10 text-xs"
                      >
                        {att.type === 'image' && att.url ? (
                          <img
                            src={att.url}
                            alt={att.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                            {att.type === 'audio' ? (
                              <Music className="w-4 h-4 text-emerald-300" />
                            ) : att.type === 'video' ? (
                              <Video className="w-4 h-4 text-sky-300" />
                            ) : (
                              <FileCode className="w-4 h-4 text-amber-300" />
                            )}
                          </div>
                        )}
                        <div className="min-w-0 pr-1">
                          <p className="font-medium text-[11px] truncate max-w-[120px]">
                            {att.name}
                          </p>
                          <p className="text-[9px] opacity-70">
                            {Math.round(att.size / 1024)} KB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assistant Brand Avatar Kicker */}
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-white/5 text-[11px] text-[#8e8e9c]">
                    <div className="w-4 h-4 rounded overflow-hidden bg-[#c92a2a] shrink-0 flex items-center justify-center">
                      <img
                        src="/assets/aistudio/Black_Cat_Animals___Pets_Logo_20261024_034747_0000_d2a38d28.png"
                        alt="Cat Logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-semibold text-white">Agent Remotion</span>
                    <span>·</span>
                    <span className="font-mono text-[10px] text-[#717180]">ACP</span>
                  </div>
                )}

                {/* Markdown text */}
                <div className="prose prose-invert prose-xs max-w-none break-words leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* ACP Tool Execution Logs inside Assistant Message */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5">
                    {msg.toolCalls.map((tool) => {
                      const isExpanded = !!expandedTools[tool.id];
                      return (
                        <div
                          key={tool.id}
                          className="bg-[#111116] border border-[#2a2a35] rounded-xl overflow-hidden text-xs"
                        >
                          {/* Tool Header Summary */}
                          <button
                            type="button"
                            onClick={() => toggleToolExpand(tool.id)}
                            className="w-full px-2.5 py-1.5 flex items-center justify-between text-left hover:bg-[#16161d] transition-colors gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Terminal className="w-3.5 h-3.5 text-[#e5484d] shrink-0" />
                              <span className="font-mono text-[11px] text-[#e0e0ea] font-medium truncate">
                                {tool.toolName}
                              </span>
                              {tool.durationMs && (
                                <span className="text-[10px] text-[#696978] font-mono shrink-0">
                                  {tool.durationMs}ms
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {tool.status === 'completed' && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                              {tool.status === 'running' && (
                                <span className="w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                              )}
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-[#737382]" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-[#737382]" />
                              )}
                            </div>
                          </button>

                          {/* Tool Expanded Details */}
                          {isExpanded && (
                            <div className="px-2.5 pb-2 pt-1 border-t border-[#202028] bg-[#0b0b0e] space-y-1 text-[11px] font-mono">
                              {tool.description && (
                                <p className="text-[#a0a0af]">{tool.description}</p>
                              )}
                              {tool.arguments && (
                                <div className="text-[#7c7c8d] bg-black/40 p-1.5 rounded border border-white/5 overflow-x-auto">
                                  <span className="text-cyan-400">args:</span>{' '}
                                  {JSON.stringify(tool.arguments)}
                                </div>
                              )}
                              {tool.result && (
                                <div className="text-emerald-400/90 bg-emerald-950/20 p-1.5 rounded border border-emerald-900/30">
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
                    isUser ? 'text-red-200/80 text-right' : 'text-[#6c6c7b]'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Thinking Status Box */}
        {isAgentWorking && (
          <div className="flex items-center gap-2.5 bg-[#171720] border border-[#2b2b38] px-3 py-2 rounded-2xl max-w-[85%] text-xs text-[#a0a0b0]">
            <span className="w-4 h-4 rounded-full border-2 border-[#e5484d] border-t-transparent animate-spin shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">Agent sedang memproses...</p>
              <p className="text-[10px] text-[#787889] font-mono truncate">
                Protokol ACP • Memperbarui Remotion Composition
              </p>
            </div>
            <button
              type="button"
              onClick={onStopAgent}
              className="tap px-2 py-1 bg-red-950 hover:bg-red-900 border border-red-700/60 rounded text-[10px] text-red-200 font-bold"
            >
              Stop
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3 py-1.5 bg-[#0b0b0e] border-t border-[#1d1d24] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSendMessage(prompt, [])}
            disabled={isAgentWorking}
            className="tap whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full bg-[#181820] hover:bg-[#23232c] text-[#a7a7b5] hover:text-white border border-[#24242e] transition-colors shrink-0 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Sticky Bottom Input Area */}
      <div className="p-2.5 bg-[#111116] border-t border-[#23232b] shrink-0 z-10">
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 mb-2 overflow-x-auto no-scrollbar py-1">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 px-2 py-1 bg-[#1a1a22] border border-[#2e2e3a] rounded-lg text-xs shrink-0 text-white"
              >
                {att.type === 'image' && att.url ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    className="w-5 h-5 object-cover rounded"
                  />
                ) : (
                  <Paperclip className="w-3.5 h-3.5 text-[#e5484d]" />
                )}
                <span className="max-w-[110px] truncate text-[11px]">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="tap w-4 h-4 rounded-full flex items-center justify-center text-[#8e8e9c] hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 bg-[#17171e] border border-[#2b2b36] rounded-2xl p-1.5 focus-within:border-[#e5484d] transition-colors"
        >
          {/* File Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Lampirkan Gambar/Video/Audio/Kode"
            className="tap w-9 h-9 rounded-xl flex items-center justify-center text-[#8e8e9c] hover:text-white hover:bg-[#242430] transition-colors shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Text Input (Strict LTR, Natural Entry) */}
          <textarea
            ref={textareaRef}
            rows={1}
            dir="ltr"
            value={inputText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Ketik instruksi edit video (misal: 'geser teks ke atas', 'tambah headline')..."
            className="flex-1 bg-transparent text-white text-xs placeholder-[#666675] resize-none outline-none py-2 px-1 max-h-[120px] font-sans text-left"
            style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'normal' }}
          />

          {/* Send or Stop Button */}
          {isAgentWorking ? (
            <button
              type="button"
              onClick={onStopAgent}
              title="Batalkan proses"
              className="tap w-9 h-9 rounded-xl bg-red-950 text-red-400 border border-red-700/60 flex items-center justify-center hover:bg-red-900 transition-colors shrink-0"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputText.trim() && attachments.length === 0}
              title="Kirim pesan ke Agent"
              className="tap w-9 h-9 rounded-xl bg-[#c92a2a] hover:bg-[#b02525] disabled:opacity-40 disabled:hover:bg-[#c92a2a] text-white flex items-center justify-center transition-all shrink-0 shadow-sm"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
