export interface TelemetrySession {
  session_id: string;
  student_name: string;
  student_login: string;
  session_start: string;
  session_end: string;
  event_count: number;
}

export interface TelemetryEvent {
  id?: string | number;
  project_uuid?: string;
  user_id?: string | number;
  session_id?: string;
  app_type?: string;
  event_type: 'mutation' | 'semantic' | 'system';
  action_name: string;
  payload: any; // Mantemos 'any' ou 'Record<string, any>' pois o payload varia livremente
  client_timestamp: string;
  created_at?: string;
  _relativeTime: number; // Tempo injetado dinamicamente pelo useReplayEngine
}

export interface TelemetrySessionsResponse {
  success: boolean;
  meta?: { limit_reached?: boolean };
  sessions: TelemetrySession[];
}