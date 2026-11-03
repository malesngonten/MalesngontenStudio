/**
 * HttpAgentAdapter
 * Real client implementation connecting the UI with the Node.js backend & ACP via SSE and REST.
 * Falls back safely to MockAgentAdapter if the backend server is unreachable.
 */

import {
  IAgentClient,
  AgentStatus,
  AgentMessage,
  AgentSession,
  AgentAttachment,
  AgentToolCall,
} from '../contracts/agentProtocol';
import { TimelineData, TimelineClip, DiscoveredAgent } from '../types';
import { agentClientInstance as mockInstance } from './MockAgentAdapter';

export class HttpAgentAdapter implements IAgentClient {
  private status: AgentStatus = 'idle';
  private eventSource: EventSource | null = null;
  private backendAvailable = true;
  private currentSessionId = 'session-main';
  private onToolUpdateCallback?: (msgId: string, tool: AgentToolCall) => void;
  private onFileChangedCallback?: (file: string, data: any) => void;

  constructor() {
    this.initSSE();
  }

  private onTextChunkCallback?: (msgId: string, chunk: string) => void;

  private initSSE() {
    if (typeof window === 'undefined') return;

    try {
      this.eventSource = new EventSource('/api/events');

      this.eventSource.onopen = () => {
        this.backendAvailable = true;
        this.status = 'idle';
      };

      this.eventSource.onerror = () => {
        // Dev server or background task disconnected
        this.backendAvailable = false;
      };

      this.eventSource.addEventListener('agent_status', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.status = data.status;
        } catch {}
      });

      this.eventSource.addEventListener('tool_update', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (this.onToolUpdateCallback && data.toolCall) {
            this.onToolUpdateCallback(data.messageId, data.toolCall);
          }
        } catch {}
      });

      this.eventSource.addEventListener('text_chunk', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (this.onTextChunkCallback && data.chunk) {
            this.onTextChunkCallback(data.messageId, data.chunk);
          }
        } catch {}
      });

      this.eventSource.addEventListener('file_changed', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (this.onFileChangedCallback) {
            this.onFileChangedCallback(data.file, data.timeline);
          }
        } catch {}
      });
    } catch {
      this.backendAvailable = false;
    }
  }

  public onFileChanged(cb: (file: string, data: any) => void) {
    this.onFileChangedCallback = cb;
  }

  async connect(): Promise<boolean> {
    try {
      const res = await fetch('/api/agent/status', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        this.status = data.status || 'idle';
        this.backendAvailable = true;
        return true;
      }
    } catch (e) {
      this.backendAvailable = false;
    }
    return false;
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  async sendMessage(
    text: string,
    attachments: AgentAttachment[] = [],
    context?: {
      timeline: TimelineData;
      currentFrame: number;
      selectedClip?: TimelineClip | null;
      activeFile?: string;
      byok?: {
        baseUrl: string;
        apiKey: string;
        modelId: string;
      };
    },
    onUpdate?: (partialMessage: AgentMessage, toolCall?: AgentToolCall) => void
  ): Promise<AgentMessage> {
    this.status = 'thinking';
    let streamingAccumulated = '';
    let currentMsgId = '';

    try {
      // Register listener for tool calls, text chunks & completion
      const pendingPromise = new Promise<AgentMessage>((resolve, reject) => {
        const handleComplete = (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            const msg = data.message || data;
            const status = msg.status || 'completed';
            if (this.eventSource) {
              this.eventSource.removeEventListener('message_complete', handleComplete);
            }

            if (status === 'failed' || status === 'error') {
              this.status = 'idle';
              reject(new Error(msg.content || msg.text || 'AI provider error'));
              return;
            }

            this.status = 'idle';
            resolve({
              id: msg.id,
              role: 'assistant',
              content: msg.content || msg.text || streamingAccumulated,
              text: msg.text || msg.content || streamingAccumulated,
              timestamp: msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              toolCalls: msg.toolCalls,
              checkpointHash: msg.checkpointHash,
              canRevert: msg.canRevert,
              status: msg.status,
            });
          } catch (err) {
            reject(err);
          }
        };

        const handleCancelled = (e: MessageEvent) => {
          try {
            if (this.eventSource) {
              this.eventSource.removeEventListener('agent_cancelled', handleCancelled);
            }
            this.status = 'idle';
            reject(new Error('Dibatalkan oleh pengguna'));
          } catch {
            reject(new Error('Dibatalkan oleh pengguna'));
          }
        };

        if (this.eventSource) {
          this.eventSource.addEventListener('message_complete', handleComplete);
          this.eventSource.addEventListener('agent_cancelled', handleCancelled);
        }

        this.onTextChunkCallback = (msgId, chunk) => {
          currentMsgId = msgId;
          streamingAccumulated += chunk;
          if (onUpdate) {
            onUpdate({
              id: msgId,
              role: 'assistant',
              content: streamingAccumulated,
              text: streamingAccumulated,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
          }
        };

        this.onToolUpdateCallback = (msgId, toolCall) => {
          if (onUpdate) {
            onUpdate(
              {
                id: msgId,
                role: 'assistant',
                content: streamingAccumulated,
                text: streamingAccumulated,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
              toolCall
            );
          }
        };
      });

      // Post prompt to backend with byok config
      const res = await fetch('/api/agent/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          attachments,
          byok: context?.byok,
          context: {
            playheadFrame: context?.currentFrame,
            playheadSec: context ? parseFloat((context.currentFrame / context.timeline.fps).toFixed(2)) : 0,
            selectedClipId: context?.selectedClip?.id,
          },
          sessionId: this.currentSessionId,
        }),
      });

      if (!res.ok) {
        let errDetail = '';
        try {
          const errObj = await res.json();
          errDetail = errObj.error || JSON.stringify(errObj);
        } catch {
          errDetail = await res.text();
        }
        throw new Error(`Server returned HTTP ${res.status}: ${errDetail}`);
      }

      return await pendingPromise;
    } catch (err: any) {
      this.status = 'idle';
      const errMsg: AgentMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `❌ Gagal memproses permintaan: ${err?.message || 'Server tidak dapat dihubungi'}`,
        text: `❌ Gagal memproses permintaan: ${err?.message || 'Server tidak dapat dihubungi'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      if (onUpdate) onUpdate(errMsg);
      return errMsg;
    }
  }


  abort(): void {
    if (this.backendAvailable) {
      fetch('/api/agent/cancel', { method: 'POST' }).catch(() => {});
    }
    mockInstance.abort();
    this.status = 'idle';
  }

  async getSessions(): Promise<AgentSession[]> {
    if (!this.backendAvailable) {
      return mockInstance.getSessions();
    }
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        return data.sessions.map((s: any) => ({
          id: s.id,
          title: s.title,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          messagesCount: s.messages?.length || 0,
        }));
      }
    } catch {}
    return mockInstance.getSessions();
  }

  async switchSession(sessionId: string): Promise<AgentMessage[]> {
    this.currentSessionId = sessionId;
    if (!this.backendAvailable) {
      return mockInstance.switchSession(sessionId);
    }
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        const found = data.sessions.find((s: any) => s.id === sessionId);
        if (found) {
          return found.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content || m.text,
            timestamp: m.timestamp,
            attachments: m.attachments,
            toolCalls: m.toolCalls,
          }));
        }
      }
    } catch {}
    return mockInstance.switchSession(sessionId);
  }

  async createSession(title?: string): Promise<AgentSession> {
    if (!this.backendAvailable) {
      return mockInstance.createSession(title);
    }
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || 'Sesi Video Baru' }),
      });
      if (res.ok) {
        const data = await res.json();
        this.currentSessionId = data.session.id;
        return {
          id: data.session.id,
          title: data.session.title,
          createdAt: data.session.createdAt,
          updatedAt: data.session.updatedAt,
          messagesCount: 1,
        };
      }
    } catch {}
    return mockInstance.createSession(title);
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (this.backendAvailable) {
      try {
        await fetch(`/api/chats/${sessionId}`, { method: 'DELETE' });
      } catch {}
    }
    await mockInstance.deleteSession(sessionId);
  }

  async discoverAgents(): Promise<DiscoveredAgent[]> {
    try {
      const res = await fetch('/api/agent/discover');
      if (res.ok) {
        const data = await res.json();
        return data.agents;
      }
    } catch {}

    // Fallback if backend unreachable
    return [
      {
        id: 'agent-builtin',
        name: 'Males Ngonten Core Engine (Internal)',
        command: 'internal:males-ngonten-engine',
        protocol: 'acp',
        version: '1.0.0',
        status: 'ready',
        description: 'Engine otonom lokal. Mengedit timeline.json dan Remotion TSX secara instan.',
        supportedTools: ['readFile', 'writeFile', 'modifyTimeline'],
        latencyMs: 15,
        isSelected: true,
      },
      {
        id: 'agent-claude',
        name: 'Claude Code CLI (Anthropic)',
        command: 'claude --acp',
        protocol: 'acp',
        status: 'not_found',
        description: 'Agent coding canggih via protokol ACP stdio.',
        supportedTools: ['readFile', 'writeFile', 'runBashCommand'],
      },
    ];
  }

  async selectAgent(agentId: string): Promise<boolean> {
    try {
      const res = await fetch('/api/agent/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const studioAgentClient = new HttpAgentAdapter();
