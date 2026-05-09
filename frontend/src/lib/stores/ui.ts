import { writable } from 'svelte/store';

export const uiStore = writable({
  settingsOpen: false,
  jobsOpen: false,
  lightboxOpen: false,
  sizeDialogOpen: false,
  toast: ''
});

