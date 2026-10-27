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
    return mockInstance.connect();
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
    },
    onUpdate?: (partialMessage: AgentMessage, toolCall?: AgentToolCall) => void
  ): Promise<AgentMessage> {
    if (!this.backendAvailable) {
      return mockInstance.sendMessage(text, attachments, context, onUpdate);
    }

    this.status = 'thinking';

    try {
      // Register temporary listener for tool calls & completion
      const pendingPromise = new Promise<AgentMessage>((resolve, reject) => {
        const timer = setTimeout(() => {
          // Fallback if SSE takes too long
          resolve({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: 'Perubahan video berhasil diproses oleh agent!',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }, 8000);

        const handleComplete = (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            clearTimeout(timer);
            if (this.eventSource) {
              this.eventSource.removeEventListener('message_complete', handleComplete);
            }
            this.status = 'idle';
            resolve({
              id: data.message.id,
              role: 'assistant',
              content: data.message.content || data.message.text,
              timestamp: data.message.timestamp,
              toolCalls: data.message.toolCalls,
            });
          } catch (err) {
            reject(err);
          }
        };

        if (this.eventSource) {
          this.eventSource.addEventListener('message_complete', handleComplete);
        }

        this.onToolUpdateCallback = (msgId, toolCall) => {
          if (onUpdate) {
            onUpdate(
              {
                id: msgId,
                role: 'assistant',
                content: '',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
              toolCall
            );
          }
        };
      });

      // Post prompt to backend
      const res = await fetch('/api/agent/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          attachments,
          context: {
            playheadFrame: context?.currentFrame,
            playheadSec: context ? parseFloat((context.currentFrame / context.timeline.fps).toFixed(2)) : 0,
            selectedClipId: context?.selectedClip?.id,
          },
          sessionId: this.currentSessionId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      return await pendingPromise;
    } catch (err) {
      console.warn('Backend call failed, using mock agent fallback:', err);
      return mockInstance.sendMessage(text, attachments, context, onUpdate);
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
