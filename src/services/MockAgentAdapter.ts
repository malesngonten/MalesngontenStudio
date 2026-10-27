/**
 * Mock Agent Client Adapter (ACP Implementation)
 * Provides high-fidelity simulation of an Agent Client Protocol daemon
 * Easily replaceable with a real WebSocket or HTTP connection to local Claude/Gemini/ACP server.
 */

import {
  IAgentClient,
  AgentStatus,
  AgentMessage,
  AgentSession,
  AgentToolCall,
  AgentAttachment,
} from '../contracts/agentProtocol';
import { TimelineData, TimelineClip } from '../types';

export class MockAgentAdapter implements IAgentClient {
  private status: AgentStatus = 'idle';
  private abortController: AbortController | null = null;
  private sessions: AgentSession[] = [
    {
      id: 'session-main',
      title: 'Intro Short Video Males Ngonten',
      createdAt: 'Hari ini, 10:15',
      updatedAt: 'Baru saja',
      messagesCount: 3,
    },
    {
      id: 'session-flashsale',
      title: 'Promo Flash Sale 9:16 TikTok',
      createdAt: 'Kemarin',
      updatedAt: 'Kemarin, 19:40',
      messagesCount: 6,
    },
    {
      id: 'session-quote',
      title: 'Reels Motivasi "Males Ribet"',
      createdAt: '25 Okt 2026',
      updatedAt: '25 Okt 2026',
      messagesCount: 4,
    },
  ];

  private sessionMessages: Record<string, AgentMessage[]> = {
    'session-main': [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: `Halo! Selamat datang di **Males Ngonten Studio** 🎬🐱\n\nSaya adalah AI coding agent berbasis protokol **ACP (Agent Client Protocol)** untuk engine **Remotion**. Anda tidak perlu repot ngedit manual:\n\n- Ketik instruksi (misal: *"geser teks ke atas"*, *"tambah subtitle viral"*, *"ganti warna teks"*)\n- Lampirkan gambar atau audio untuk dimasukkan ke komposisi\n- Atau geser langsung teks di preview canvas video saat video di-pause!`,
        timestamp: '10:15',
      },
      {
        id: 'msg-ex-1',
        role: 'user',
        content: 'Bikin headline lebih menarik dan atur munculnya di detik ke-1',
        timestamp: '10:16',
      },
      {
        id: 'msg-ex-2',
        role: 'assistant',
        content: 'Siap! Saya telah mengupdate layer teks di `timeline.json` dan menambahkan efek animasi `slide-up` dengan damping spring Remotion di detik 1.0 (frame 30).',
        timestamp: '10:16',
        toolCalls: [
          {
            id: 'tc-init-1',
            toolName: 'remotion_edit_timeline',
            description: 'Memperbarui klip Headline Viral di timeline.json',
            arguments: {
              layerId: 'layer-text',
              clipId: 'clip-t1',
              from: 30,
              duration: 75,
              animation: 'slide-up',
            },
            status: 'completed',
            result: 'Success: Timeline updated and rendered into player',
            durationMs: 84,
            timestamp: '10:16',
          },
        ],
      },
    ],
  };

  private activeSessionId: string = 'session-main';

  async connect(): Promise<boolean> {
    this.status = 'connecting';
    await new Promise((r) => setTimeout(r, 400));
    this.status = 'idle';
    return true;
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  async getSessions(): Promise<AgentSession[]> {
    return [...this.sessions];
  }

  async switchSession(sessionId: string): Promise<AgentMessage[]> {
    this.activeSessionId = sessionId;
    if (!this.sessionMessages[sessionId]) {
      this.sessionMessages[sessionId] = [
        {
          id: `msg-init-${sessionId}`,
          role: 'assistant',
          content: 'Sesi percakapan baru aktif. Apa yang ingin kita buat untuk video ini?',
          timestamp: 'Baru saja',
        },
      ];
    }
    return [...this.sessionMessages[sessionId]];
  }

  async createSession(title?: string): Promise<AgentSession> {
    const newId = `session-${Date.now()}`;
    const newSession: AgentSession = {
      id: newId,
      title: title || `Proyek Baru #${this.sessions.length + 1}`,
      createdAt: 'Baru saja',
      updatedAt: 'Baru saja',
      messagesCount: 1,
    };
    this.sessions.unshift(newSession);
    this.sessionMessages[newId] = [
      {
        id: `msg-welcome-${newId}`,
        role: 'assistant',
        content: `Sesi **${newSession.title}** dimulai. Silakan kirim ide konten, teks hook, atau lampirkan aset video/gambar Anda!`,
        timestamp: 'Baru saja',
      },
    ];
    this.activeSessionId = newId;
    return newSession;
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions = this.sessions.filter((s) => s.id !== sessionId);
    delete this.sessionMessages[sessionId];
    if (this.activeSessionId === sessionId && this.sessions.length > 0) {
      this.activeSessionId = this.sessions[0].id;
    }
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.status = 'idle';
  }

  async sendMessage(
    text: string,
    attachments: AgentAttachment[] = [],
    context?: {
      timeline: TimelineData;
      currentFrame: number;
      selectedClip?: TimelineClip | null;
      activeFile?: string;
    },
    onUpdate?: (partialMessage: AgentMessage, toolCall?: AgentToolCall) => void
  ): Promise<AgentMessage> {
    this.abortController = new AbortController();
    this.status = 'thinking';

    const userMsgId = `user-${Date.now()}`;
    const userMsg: AgentMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: attachments.length > 0 ? attachments : undefined,
      context: {
        playheadFrame: context?.currentFrame,
        playheadSec: context?.currentFrame ? parseFloat((context.currentFrame / (context.timeline?.fps || 30)).toFixed(2)) : 0,
        selectedClipId: context?.selectedClip?.id,
        activeFile: context?.activeFile,
      },
    };

    if (!this.sessionMessages[this.activeSessionId]) {
      this.sessionMessages[this.activeSessionId] = [];
    }
    this.sessionMessages[this.activeSessionId].push(userMsg);

    // Simulate Agent Thinking Delay
    await new Promise((r) => setTimeout(r, 600));
    if (this.abortController?.signal.aborted) {
      this.status = 'idle';
      throw new Error('Agent task aborted');
    }

    this.status = 'executing_tool';

    // Generate tool calls based on prompt
    const toolCalls: AgentToolCall[] = [];
    const lower = text.toLowerCase();

    if (attachments && attachments.length > 0) {
      const toolInspect: AgentToolCall = {
        id: `tc-attach-${Date.now()}`,
        toolName: 'workspace_inspect_media',
        description: `Memeriksa format & metadata file: ${attachments[0].name}`,
        arguments: {
          file: attachments[0].name,
          type: attachments[0].type,
          size: `${Math.round(attachments[0].size / 1024)} KB`,
        },
        status: 'running',
        timestamp: 'Baru saja',
      };
      toolCalls.push(toolInspect);
      onUpdate?.({
        id: `assistant-stream-${Date.now()}`,
        role: 'assistant',
        content: `Menganalisis file lampiran \`${attachments[0].name}\`...`,
        timestamp: 'Baru saja',
        toolCalls: [...toolCalls],
      }, toolInspect);

      await new Promise((r) => setTimeout(r, 700));
      toolInspect.status = 'completed';
      toolInspect.result = `Asset metadata loaded. Added to workspace registry.`;
      toolInspect.durationMs = 120;
    }

    if (lower.includes('headline') || lower.includes('teks') || lower.includes('subtitle') || lower.includes('tulisan') || lower.includes('geser') || lower.includes('posisi')) {
      const toolTimeline: AgentToolCall = {
        id: `tc-timeline-${Date.now()}`,
        toolName: 'remotion_edit_timeline',
        description: 'Memperbarui koordinat & animasi layer teks di timeline.json',
        arguments: {
          targetLayer: 'layer-text',
          animation: lower.includes('zoom') ? 'zoom' : lower.includes('bounce') ? 'bounce' : 'slide-up',
          x: 50,
          y: lower.includes('atas') ? 30 : lower.includes('bawah') ? 70 : 45,
          color: lower.includes('merah') ? '#e5484d' : '#ffffff',
        },
        status: 'running',
        timestamp: 'Baru saja',
      };
      toolCalls.push(toolTimeline);
      onUpdate?.({
        id: `assistant-stream-${Date.now()}`,
        role: 'assistant',
        content: 'Mengupdate timing dan properti visual di engine Remotion...',
        timestamp: 'Baru saja',
        toolCalls: [...toolCalls],
      }, toolTimeline);

      await new Promise((r) => setTimeout(r, 800));
      toolTimeline.status = 'completed';
      toolTimeline.result = 'timeline.json updated successfully. Frame re-rendered.';
      toolTimeline.durationMs = 95;
    } else if (lower.includes('musik') || lower.includes('lagu') || lower.includes('audio')) {
      const toolAudio: AgentToolCall = {
        id: `tc-audio-${Date.now()}`,
        toolName: 'remotion_sync_audio',
        description: 'Menyesuaikan volume dan durasi layer musik',
        arguments: {
          layerId: 'layer-music',
          volume: 0.85,
          fadeInFrames: 15,
        },
        status: 'running',
        timestamp: 'Baru saja',
      };
      toolCalls.push(toolAudio);
      await new Promise((r) => setTimeout(r, 600));
      toolAudio.status = 'completed';
      toolAudio.result = 'Audio track mixed with timeline audio visualizer.';
      toolAudio.durationMs = 110;
    } else {
      // Default diagnostic / lint tool
      const toolDiag: AgentToolCall = {
        id: `tc-diag-${Date.now()}`,
        toolName: 'remotion_validate_composition',
        description: 'Verifikasi frame integrity & props ShortVideoComposition',
        arguments: {
          composition: 'ShortVideoComposition.tsx',
          fps: context?.timeline.fps || 30,
          totalFrames: context?.timeline.durationInFrames || 150,
        },
        status: 'completed',
        durationMs: 45,
        result: '0 compilation errors. Composition is valid.',
        timestamp: 'Baru saja',
      };
      toolCalls.push(toolDiag);
    }

    this.status = 'streaming';

    // Craft intelligent response
    let responseText = '';
    if (attachments.length > 0) {
      responseText = `Aset **${attachments[0].name}** berhasil diterima dan didaftarkan ke workspace! Saya telah menyiapkannya untuk dijadikan layer visual atau background di timeline Remotion.`;
    } else if (lower.includes('headline') || lower.includes('teks') || lower.includes('subtitle')) {
      responseText = `Teks berhasil diubah dan diselaraskan dengan komposisi Remotion! Posisi koordinat \`(x, y)\` dan animasi telah diperbarui di \`timeline.json\`. Anda juga bisa langsung menyeret (*drag*) teks di layar preview video saat video di-pause.`;
    } else if (lower.includes('musik') || lower.includes('audio')) {
      responseText = `Musik latar telah disinkronkan dengan durasi timeline (${((context?.timeline.durationInFrames || 150) / 30).toFixed(1)} detik). Visualizer bar di pojok kanan atas preview akan otomatis berdenyut mengikuti frame.`;
    } else {
      responseText = `Instruksi *"${text}"* telah selesai diproses oleh coding agent via protokol ACP. Semua perubahan langsung tercermin secara instan di Remotion Player di bagian atas.`;
    }

    const assistantMsg: AgentMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };

    this.sessionMessages[this.activeSessionId].push(assistantMsg);
    this.status = 'idle';

    // Update session metadata
    const active = this.sessions.find((s) => s.id === this.activeSessionId);
    if (active) {
      active.updatedAt = 'Baru saja';
      active.messagesCount = this.sessionMessages[this.activeSessionId].length;
    }

    return assistantMsg;
  }
}

export const agentClientInstance = new MockAgentAdapter();
