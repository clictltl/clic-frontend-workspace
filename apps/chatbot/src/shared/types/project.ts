import type { Block, Connection, Variable } from './chatbot';
import type { ClicAsset, ClicBaseProject } from '@clic/shared';

export interface ProjectData extends ClicBaseProject {
  blocks: Block[];
  connections: Connection[];
  variables: Record<string, Variable>;
  assets: Record<string, ClicAsset>;
}