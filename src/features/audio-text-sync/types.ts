
export interface TranscriptTurn {
  speaker: 'user' | 'model';
  text: string;
  id: number;
}

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error' | 'closed';
