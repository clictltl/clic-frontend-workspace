import type { ClicBaseProject, ClicAsset } from '@clic/shared';

export type VariableType = 'text' | 'number';

export interface Variable {
  id: string;
  name: string;
  type: VariableType;
  defaultValue: string | number;
}

export interface ChatNode {
  id: string;
  type: 'start' | 'message' | 'open_question' | 'choice_question' | 'condition' | 'set_variable' | 'math' | 'end';
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface ChatEdge {
  id: string;
  sourceNode: string;
  sourceHandle: string;
  targetNode: string;
  targetHandle: string;
  color?: string;
}

export interface ChatbotProject extends ClicBaseProject {
  title: string;
  nodes: Record<string, ChatNode>;
  edges: Record<string, ChatEdge>;
  variables: Record<string, Variable>;
  assets: Record<string, ClicAsset>;
}