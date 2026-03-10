// assets
export { default as logoClic } from './assets/logo-clic.svg';

// types
export * from './types/global.d';
export * from './types/asset';

// auth
export { useAuth, checkLogin } from './auth/auth';
export { default as AuthMenu } from './auth/AuthMenu.vue';

// utils
export { decodeHtml } from './utils/decodeHtml';
export { exportClicFile, importClicFile } from './utils/projectIO';
export { useSharedAssetStore } from './utils/useSharedAssetStore';
export { createSharedProjects } from './utils/useSharedProjects';

// ui
export { default as AppHeader } from './ui/AppHeader.vue';
export { default as FileMenu } from './ui/FileMenu.vue';
export { useToast } from './ui/useToast';
export { default as ToastContainer } from './ui/ToastContainer.vue';

// ui/modals
export { default as SaveAsModal } from './ui/modals/SaveAsModal.vue';
export { default as OpenProjectModal } from './ui/modals/OpenProjectModal.vue';
export { default as DeleteProjectModal } from './ui/modals/DeleteProjectModal.vue';
export { default as ShareModal } from './ui/modals/ShareModal.vue';
export { default as PublishModal } from './ui/modals/PublishModal.vue';
export { default as UnsavedChangesModal } from './ui/modals/UnsavedChangesModal.vue';
export { default as NeedSaveModal } from './ui/modals/NeedSaveModal.vue';
export { default as InvalidShareLinkModal } from './ui/modals/InvalidShareLinkModal.vue';