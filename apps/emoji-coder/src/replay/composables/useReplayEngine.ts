import { ref, shallowRef } from 'vue';

export function useReplayEngine() {
  const timeline = shallowRef<any[]>([]);
  const isPlaying = ref(false);
  
  // O relógio virtual em milissegundos
  const currentTime = ref(0);
  const duration = ref(0);
  const playbackSpeed = ref(1); // 1x, 2x, 4x...
  
  let animationFrameId: number | null = null;
  let lastFrameTime = 0;
  let eventIndex = 0;

  // Ganchos para a interface (Callbacks)
  let onEventCallback: ((event: any) => void) | null = null;
  let onFrameZeroCallback: ((state: any) => void) | null = null;

  const onEvent = (cb: (event: any) => void) => { onEventCallback = cb; };
  const onFrameZero = (cb: (state: any) => void) => { onFrameZeroCallback = cb; };

  const loadTimeline = (events: any[]) => {
    timeline.value = events;
    if (events.length === 0) return;

    // Converte os timestamps em milissegundos absolutos para calcularmos o tempo relativo
    const startTime = new Date(events[0].client_timestamp).getTime();
    const endTime = new Date(events[events.length - 1].client_timestamp).getTime();
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
    if (timeline.value.length > 0 && timeline.value[0].action_name === 'project_loaded') {
      if (onFrameZeroCallback) onFrameZeroCallback(timeline.value[0].payload.initial_state);
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
    while (eventIndex < timeline.value.length && timeline.value[eventIndex]._relativeTime <= currentTime.value) {
      if (onEventCallback) onEventCallback(timeline.value[eventIndex]);
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

  return {
    timeline,
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    loadTimeline,
    play,
    pause,
    reset,
    onEvent,
    onFrameZero
  };
}