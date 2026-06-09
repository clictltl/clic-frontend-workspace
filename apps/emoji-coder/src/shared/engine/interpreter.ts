import { reactive } from 'vue';

export type SpeedFn = () => number;
export type ActionHandler = (node: any, engine: TurtleEngine) => void | Promise<void>;

export class TurtleEngine {
  public state = reactive({
    isRunning: false,
    turtleX: 0,
    turtleY: 0,
    turtleRotation: 90,
    paintedCells: [] as string[],
    gridWidth: 8,
    gridHeight: 8
  });

  private getSleepTime: SpeedFn;
  private actionHandlers: Record<string, ActionHandler> = {};

  constructor(getSleepTime: SpeedFn) {
    this.getSleepTime = getSleepTime;
  }

  public registerAction(actionName: string, handler: ActionHandler) {
    this.actionHandlers[actionName] = handler;
  }

  // Permite que as bibliotecas (físicas) pausem a animação
  public async sleepTick() {
    await new Promise(resolve => setTimeout(resolve, this.getSleepTime()));
  }

  public async executeNode(node: any) {
    if (!this.state.isRunning) return;

    const handler = this.actionHandlers[node.action];
    if (handler) {
      await handler(node, this);
    } else {
      console.warn(`[TurtleEngine] Ação desconhecida ignorada: ${node.action}`);
    }
  }

  public async run(ast: any[], gridWidth: number, gridHeight: number) {
    this.resetRuntime();
    this.state.gridWidth = gridWidth;
    this.state.gridHeight = gridHeight;
    this.state.isRunning = true;

    for (const node of ast) {
      await this.executeNode(node);
      if (!this.state.isRunning) break;
    }

    this.state.isRunning = false;
  }

  public stop() {
    this.resetRuntime();
  }

  private resetRuntime() {
    this.state.isRunning = false;
    this.state.turtleX = 0;
    this.state.turtleY = 0;
    this.state.turtleRotation = 90;
    this.state.paintedCells = [];
  }
}