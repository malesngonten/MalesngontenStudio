import React from 'react';
import { Plus, MessageSquare, Trash2, Clock, Check } from 'lucide-react';
import { AgentSession } from '../../contracts/agentProtocol';
import { BottomSheet } from '../ui/BottomSheet';

interface ChatHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: AgentSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}

export const ChatHistorySheet: React.FC<ChatHistorySheetProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}) => {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Riwayat Percakapan AI Coding Agent"
      subtitle="Sesi proyek video & perintah ACP tersimpan di perangkat lokal"
    >
      <div className="space-y-3">
        {/* New chat button */}
        <button
          type="button"
          onClick={() => {
            onNewChat();
            onClose();
          }}
          className="tap w-full py-2.5 px-4 rounded-xl bg-[#c92a2a] hover:bg-[#b02525] text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Mulai Obrolan / Proyek Baru</span>
        </button>

        {/* Sessions list */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-0.5">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  isActive
                    ? 'bg-[#1e1416] border-[#e5484d] text-white'
                    : 'bg-[#15151a] border-[#25252e] text-[#8e8e9c] hover:border-[#33333d]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className="tap flex-1 flex items-start gap-2.5 text-left min-w-0"
                >
                  <MessageSquare
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      isActive ? 'text-[#e5484d]' : 'text-[#8e8e9c]'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#f2f2f3] truncate">
                      {session.title || 'Proyek Video'}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#717180] mt-0.5 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{session.updatedAt}</span>
                      <span>•</span>
                      <span>{session.messagesCount} pesan</span>
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {isActive && (
                    <span className="text-[10px] text-[#e5484d] font-bold px-2 py-0.5 rounded-full bg-[#3b171a] border border-red-900/50">
                      Aktif
                    </span>
                  )}
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      aria-label="Hapus obrolan"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="tap w-7 h-7 rounded-lg flex items-center justify-center text-[#717180] hover:text-red-400 hover:bg-[#202028]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
};
