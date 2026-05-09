import { writable } from 'svelte/store';

export const accessStore = writable({
  authenticated: false,
  loading: true,
  gateVisible: false,
  error: ''
});

