import type { Block, Connection, Variable } from './chatbot';
import type { ClicAsset } from '@clic/shared';

export interface ProjectData {
  blocks: Block[];
  connections: Connection[];
  variables: Record<string, Variable>;
  assets: Record<string, ClicAsset>;
}