import { ref, shallowRef } from 'vue';
import type { TelemetryEvent } from '@clic/shared';

export function useReplayEngine() {
  const timeline = shallowRef<TelemetryEvent[]>([]);
  const isPlaying = ref(false);
  
  // O relógio virtual em milissegundos
  const currentTime = ref(0);
  const duration = ref(0);
  const playbackSpeed = ref(1); // 1x, 2x, 4x...
  
  let animationFrameId: number | null = null;
  let lastFrameTime = 0;
  let eventIndex = 0;

  // Ganchos para a interface (Callbacks)
  const isSeeking = ref(false); // Flag para desativar animações pesadas durante o Fast-Forward
  let onEventCallback: ((event: TelemetryEvent, isSeeking: boolean) => void) | null = null;
  let onFrameZeroCallback: ((state: any) => void) | null = null;

  const onEvent = (cb: (event: TelemetryEvent, isSeeking: boolean) => void) => { onEventCallback = cb; };
  const onFrameZero = (cb: (state: any) => void) => { onFrameZeroCallback = cb; };

  const loadTimeline = (events: TelemetryEvent[]) => {
    timeline.value = events;
    if (events.length === 0) return;

    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    if (!firstEvent || !lastEvent) return;

    // Converte os timestamps em milissegundos absolutos para calcularmos o tempo relativo
    const startTime = new Date(firstEvent.client_timestamp).getTime();
    const endTime = new Date(lastEvent.client_timestamp).getTime();
    duration.value = Math.max(endTime - startTime, 1000); // Mínimo de 1 segundo

    // Injeta o tempo relativo (T=0) em cada evento para facilitar a leitura no Loop
    events.forEach(ev => {
      ev._relativeTime = new Date(ev.client_timestamp).getTime() - startTime;
    });

    reset();
  };

  const reset = () => {
    pause();
    currentTime.value = 0;
    eventIndex = 0;

    // O Frame Zero (project_loaded) dita como o mundo estava antes do aluno mexer
    const firstEvent = timeline.value[0];
    if (firstEvent && firstEvent.action_name === 'project_loaded') {
      if (onFrameZeroCallback) onFrameZeroCallback(firstEvent.payload?.initial_state);
      eventIndex = 1; // Pula o Frame Zero no loop normal
    }
  };

  const play = () => {
    if (isPlaying.value) return;
    if (currentTime.value >= duration.value) reset(); // Auto-restart se chegou no fim
    isPlaying.value = true;
    lastFrameTime = performance.now();
    loop();
  };

  const pause = () => {
    isPlaying.value = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
  };

  // O "Coração" que bate a cada frame do monitor do pesquisador (60 FPS)
  const loop = () => {
    if (!isPlaying.value) return;

    const now = performance.now();
    const delta = (now - lastFrameTime) * playbackSpeed.value;
    lastFrameTime = now;

    currentTime.value += delta;

    // Dispara todos os eventos que ficaram no passado em relação ao cursor de tempo atual
    while (eventIndex < timeline.value.length) {
      const currentEvent = timeline.value[eventIndex];
      // Se não houver evento ou ele ainda estiver no futuro, quebra o loop
      if (!currentEvent || currentEvent._relativeTime > currentTime.value) break;
      
      if (onEventCallback) onEventCallback(currentEvent, false);
      eventIndex++;
    }

    // Encerra ou chama o próximo quadro
    if (currentTime.value >= duration.value) {
      currentTime.value = duration.value;
      pause();
    } else {
      animationFrameId = requestAnimationFrame(loop);
    }
  };

  const seekTo = (targetTime: number) => {
    if (timeline.value.length === 0) return;
    
    const wasPlaying = isPlaying.value;
    pause();
    isSeeking.value = true;
    
    reset(); // Reseta o mundo para o Frame Zero
    
    // Fast-Forward: Aplica os eventos instantaneamente até o tempo alvo
    while (eventIndex < timeline.value.length) {
      const currentEvent = timeline.value[eventIndex];
      if (!currentEvent || currentEvent._relativeTime > targetTime) break;
      
      if (onEventCallback) onEventCallback(currentEvent, true);
      eventIndex++;
    }
    
    currentTime.value = targetTime;
    isSeeking.value = false;
    
    if (wasPlaying) play(); // Retoma a reprodução se estava rodando
  };

  return {
    timeline,
    isPlaying,
    isSeeking,
    currentTime,
    duration,
    playbackSpeed,
    loadTimeline,
    play,
    pause,
    reset,
    seekTo,
    onEvent,
    onFrameZero
  };
}