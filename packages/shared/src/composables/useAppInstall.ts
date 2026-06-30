import { ref, onMounted, onUnmounted } from 'vue';

export function useAppInstall() {
  const deferredPrompt = ref<any>(null);
  const isInstallable = ref(false);

  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault();
    deferredPrompt.value = e;
    isInstallable.value = true;
  };

  const handleAppInstalled = () => {
    isInstallable.value = false;
    deferredPrompt.value = null;
  };

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', handleAppInstalled);
  });

  const promptInstall = async () => {
    if (!deferredPrompt.value) return;
    deferredPrompt.value.prompt();
    const { outcome } = await deferredPrompt.value.userChoice;
    if (outcome === 'accepted') isInstallable.value = false;
    deferredPrompt.value = null;
  };

  return { isInstallable, promptInstall };
}