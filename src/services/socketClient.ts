import { authService } from './authService';
import {
  ProcessStatus,
  WebSocketInboundMessage,
  WebSocketOutboundMessage,
} from '../types/terminal';

type OutputListener = (data: string) => void;
type StatusListener = (status: ProcessStatus, cwd: string, pid?: number) => void;
type HistoryListener = (buffer: string, cwd: string, status: ProcessStatus, clientsCount: number) => void;
type PromptListener = (question: string, defaultAction?: 'yes' | 'no') => void;
type ClientsCountListener = (count: number) => void;
type ConnectionListener = (connected: boolean) => void;

class SocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private isIntentionalClose = false;

  private outputListeners = new Set<OutputListener>();
  private statusListeners = new Set<StatusListener>();
  private historyListeners = new Set<HistoryListener>();
  private promptListeners = new Set<PromptListener>();
  private clientsCountListeners = new Set<ClientsCountListener>();
  private connectionListeners = new Set<ConnectionListener>();

  public connect() {
    this.isIntentionalClose = false;
    const token = authService.getToken();
    if (!token) return;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.notifyConnection(true);
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WebSocketOutboundMessage = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      this.ws.onclose = () => {
        this.notifyConnection(false);
        this.ws = null;
        if (!this.isIntentionalClose) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        this.notifyConnection(false);
      };
    } catch (err) {
      console.error('WebSocket connection initialization error:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (authService.isAuthenticated()) {
        this.connect();
      }
    }, 2500);
  }

  public disconnect() {
    this.isIntentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyConnection(false);
  }

  public send(msg: WebSocketInboundMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn('Socket not open, cannot send message:', msg);
    }
  }

  public sendInput(text: string) {
    this.send({ type: 'input', data: text });
  }

  public sendSignal(signal: 'SIGINT' | 'SIGTERM') {
    this.send({ type: 'signal', signal });
  }

  public clear() {
    this.send({ type: 'clear' });
  }

  public restart() {
    this.send({ type: 'restart' });
  }

  public setCwd(path: string) {
    this.send({ type: 'set_cwd', path });
  }

  private handleMessage(msg: WebSocketOutboundMessage) {
    switch (msg.type) {
      case 'output':
        this.outputListeners.forEach((cb) => cb(msg.data));
        break;
      case 'history':
        this.historyListeners.forEach((cb) => cb(msg.buffer, msg.cwd, msg.status, msg.clientsCount));
        break;
      case 'status':
        this.statusListeners.forEach((cb) => cb(msg.status, msg.cwd, msg.pid));
        break;
      case 'prompt_detected':
        this.promptListeners.forEach((cb) => cb(msg.question, msg.defaultAction));
        break;
      case 'clients_count':
        this.clientsCountListeners.forEach((cb) => cb(msg.count));
        break;
      case 'cleared':
        this.historyListeners.forEach((cb) => cb('', '', 'idle', 1));
        break;
    }
  }

  private notifyConnection(connected: boolean) {
    this.connectionListeners.forEach((cb) => cb(connected));
  }

  // Subscriptions
  public onOutput(cb: OutputListener) {
    this.outputListeners.add(cb);
    return () => this.outputListeners.delete(cb);
  }

  public onStatus(cb: StatusListener) {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  public onHistory(cb: HistoryListener) {
    this.historyListeners.add(cb);
    return () => this.historyListeners.delete(cb);
  }

  public onPrompt(cb: PromptListener) {
    this.promptListeners.add(cb);
    return () => this.promptListeners.delete(cb);
  }

  public onClientsCount(cb: ClientsCountListener) {
    this.clientsCountListeners.add(cb);
    return () => this.clientsCountListeners.delete(cb);
  }

  public onConnection(cb: ConnectionListener) {
    this.connectionListeners.add(cb);
    return () => this.connectionListeners.delete(cb);
  }
}

export const socketClient = new SocketClient();
