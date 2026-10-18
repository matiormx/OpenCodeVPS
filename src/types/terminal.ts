export type ProcessStatus = 'idle' | 'running' | 'waiting_confirmation' | 'error';

export interface DirectiveMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  status?: 'pending' | 'completed' | 'failed';
  diffs?: FileDiff[];
  confirmationPrompt?: {
    text: string;
    actionYes: string;
    actionNo: string;
  };
}

export interface FileDiff {
  filename: string;
  status: 'modified' | 'created' | 'deleted';
  additions: number;
  deletions: number;
  patch?: string;
}

export type WebSocketInboundMessage =
  | { type: 'auth'; token: string }
  | { type: 'input'; data: string }
  | { type: 'signal'; signal: 'SIGINT' | 'SIGTERM' }
  | { type: 'set_cwd'; path: string }
  | { type: 'restart' }
  | { type: 'clear' }
  | { type: 'get_history' };

export type WebSocketOutboundMessage =
  | { type: 'auth_success'; user: string }
  | { type: 'auth_error'; message: string }
  | { type: 'output'; data: string; timestamp: number }
  | { type: 'history'; buffer: string; cwd: string; status: ProcessStatus; clientsCount: number }
  | { type: 'status'; status: ProcessStatus; cwd: string; pid?: number }
  | { type: 'clients_count'; count: number }
  | { type: 'prompt_detected'; question: string; defaultAction?: 'yes' | 'no' }
  | { type: 'plan_detected'; plan: string; diffs?: FileDiff[] }
  | { type: 'error'; message: string }
  | { type: 'cleared' };
