import React from 'react';
import { Plus, MessageSquare, Trash2, Clock, Check } from 'lucide-react';
import { ChatSession } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { PillButton } from '../ui/PillButton';

interface ChatHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
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
      title="Riwayat Percakapan AI"
      subtitle="Sesi disimpan di .hermes/chats/ proyek aktif"
    >
      <div className="space-y-3">
        {/* New chat button */}
        <PillButton
          variant="red"
          size="md"
          fullWidth
          onClick={() => {
            onNewChat();
            onClose();
          }}
          className="w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Obrolan Baru</span>
        </PillButton>

        {/* Sessions list */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                  isActive
                    ? 'bg-[#222226] border-[#e5484d] text-white'
                    : 'bg-[#18181b] border-[#27272c] text-[#8b8b94] hover:border-[#303036]'
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
                  <MessageSquare className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-[#e5484d]' : 'text-[#8b8b94]'}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#f2f2f3] truncate">
                      {session.title || 'Obrolan Tanpa Judul'}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#76767f] mt-0.5 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{session.updatedAt}</span>
                      <span>•</span>
                      <span>{session.messages.length} pesan</span>
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {isActive && (
                    <span className="text-[10px] text-[#e5484d] font-bold px-2 py-0.5 rounded-full bg-[#3b2427]">
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
                      className="tap w-7 h-7 rounded-full flex items-center justify-center text-[#76767f] hover:text-red-400 hover:bg-[#121214]"
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
