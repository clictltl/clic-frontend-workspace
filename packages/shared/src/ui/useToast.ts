import { ref } from 'vue';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const toasts = ref<Toast[]>([]);
let nextId = 1;

export function useToast() {
  const add = (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = nextId++;
    toasts.value.push({ id, message, type });

    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }
  };

  const remove = (id: number) => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  };

  return {
    toasts,
    add,
    remove,
    success: (msg: string) => add(msg, 'success'),
    error: (msg: string) => add(msg, 'error'),
    info: (msg: string) => add(msg, 'info'),
  };
}