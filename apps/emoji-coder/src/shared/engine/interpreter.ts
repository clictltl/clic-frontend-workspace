import { reactive } from 'vue';

export type SpeedFn = () => number;
export type ActionHandler = (node: any, engine: TurtleEngine) => void | Promise<void>;

export class TurtleEngine {
  public state = reactive({
    status: 'IDLE' as 'IDLE' | 'RUNNING' | 'PAUSED',
    turtleX: 0,
    turtleY: 0,
    turtleRotation: 90,
    paintedCells: {} as Record<string, string>,
    gridWidth: 8,
    gridHeight: 8,
    currentStep: 0,
    totalSteps: 0
  });

  private getSleepTime: SpeedFn;
  private actionHandlers: Record<string, ActionHandler> = {};
  
  private resolveStep: (() => void) | null = null;
  private abortFlag = false;

  public onHighlight: (blockId: string | null) => void = () => {};

  constructor(getSleepTime: SpeedFn) {
    this.getSleepTime = getSleepTime;
  }

  // Getter público para as bibliotecas saberem se o código foi interrompido
  public get isAborted() {
    return this.abortFlag;
  }

  // Cálculo Agnóstico: Lê a árvore sem precisar saber que 'REPEAT' existe!
  private calculateTotalSteps(ast: any[]): number {
    let total = 0;
    for (const node of ast) {
      if (node.isControl && node.body) {
        total += (node.count || 1) * this.calculateTotalSteps(node.body);
      } else if (!node.isControl) {
        total += 1; // Apenas ações físicas contam
      }
    }
    return total;
  }

  public registerAction(actionName: string, handler: ActionHandler) {
    this.actionHandlers[actionName] = handler;
  }

  public async sleepTick() {
    if (this.abortFlag) return;
    if (this.state.status === 'PAUSED') {
      await new Promise(resolve => setTimeout(resolve, 20));
    } else {
      await new Promise(resolve => setTimeout(resolve, this.getSleepTime()));
    }
  }

  private async checkPause() {
    if (this.state.status === 'PAUSED' && !this.abortFlag) {
      await new Promise<void>(resolve => { this.resolveStep = resolve; });
      this.resolveStep = null; 
    }
  }

  public async executeNode(node: any) {
    if (this.abortFlag) return;

    // 1. Ilumina o bloco
    if (node.blockId) {
      this.onHighlight(node.blockId);
    }

    // 2. Só trava o "Passo a Passo" se for uma Ação Física! 
    // Blocos de Controle (como o REPEAT) passam direto por aqui sem pausar.
    if (!node.isControl) {
      await this.checkPause();
    }
    
    if (this.abortFlag) return;

    // 3. Incrementa contador
    if (!node.isControl) {
      this.state.currentStep += 1;
    }

    // 4. Executa a Ação ou Repetição
    const handler = this.actionHandlers[node.action];
    if (handler) {
      await handler(node, this);
    } else {
      console.warn(`[TurtleEngine] Ação desconhecida ignorada: ${node.action}`);
    }

    // 5. Só espera a animação de tempo da tartaruga se for Ação Física
    if (!node.isControl) {
      await this.sleepTick();
    }
  }

  // BOTÃO: PLAY 
  public async play(ast: any[], gridWidth: number, gridHeight: number) {
    if (this.state.status === 'PAUSED') {
      this.state.status = 'RUNNING';
      if (this.resolveStep) this.resolveStep(); 
      return;
    }

    this.resetWorld();
    this.state.totalSteps = this.calculateTotalSteps(ast); // <-- Agora sim, calcula os passos!
    this.state.gridWidth = gridWidth;
    this.state.gridHeight = gridHeight;
    this.state.status = 'RUNNING';
    this.abortFlag = false;

    for (const node of ast) {
      await this.executeNode(node);
      if (this.abortFlag) break;
    }

    if (!this.abortFlag) {
      this.state.status = 'IDLE';
      this.onHighlight(null);
    }
  }

  public pause() {
    if (this.state.status === 'RUNNING') this.state.status = 'PAUSED';
  }

  public async step(ast: any[], gridWidth: number, gridHeight: number) {
    if (this.state.status === 'IDLE') {
      this.state.status = 'PAUSED';
      this.abortFlag = false;
      this.playFromStep(ast, gridWidth, gridHeight);
      setTimeout(() => { if (this.resolveStep) this.resolveStep(); }, 0);
    } else if (this.state.status === 'PAUSED') {
      if (this.resolveStep) this.resolveStep();
    }
  }

  private async playFromStep(ast: any[], gridWidth: number, gridHeight: number) {
    this.resetWorld();
    this.state.totalSteps = this.calculateTotalSteps(ast); // <-- Também calcula aqui!
    this.state.gridWidth = gridWidth;
    this.state.gridHeight = gridHeight;
    
    for (const node of ast) {
      await this.executeNode(node);
      if (this.abortFlag) break;
    }
    
    if (!this.abortFlag) {
      this.state.status = 'IDLE';
      this.onHighlight(null);
    }
  }

  public reset() {
    this.abortFlag = true;
    this.state.status = 'IDLE';
    this.onHighlight(null);
    if (this.resolveStep) this.resolveStep(); 
    this.resetWorld();
  }

  private resetWorld() {
    this.state.turtleX = 0;
    this.state.turtleY = 0;
    this.state.turtleRotation = 90;
    this.state.paintedCells = {};
    this.state.currentStep = 0;
    this.state.totalSteps = 0;
  }
}