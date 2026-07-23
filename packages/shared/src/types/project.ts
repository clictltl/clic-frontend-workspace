export interface ClicBaseProject {
  uuid: string; // O ID universal para Telemetria e Session Replay
  meta: {
    version: string;     // Ex: '1.0.0' (Para retrocompatibilidade no futuro)
    createdAt: string;   // Data de criação em ISO
    updatedAt: string;   // Data da última modificação
    [key: string]: any;  // Permite que os apps adicionem campos extras (como 'name') sem quebrar
  };
}