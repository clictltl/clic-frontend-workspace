import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const toasts = ref<Toast[]>([]);

export function useToast() {
  const add = (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = uuidv4();
    toasts.value.push({ id, message, type });

    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }
  };

  const remove = (id: string) => {
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