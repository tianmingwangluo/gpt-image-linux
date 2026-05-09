import { writable } from 'svelte/store';
import type { GenerateJobStatus } from '$lib/api/types';

export type PreviewState = {
  loading: boolean;
  error: string;
  job: GenerateJobStatus | null;
  imageUrl: string;
  filename: string;
  prompt: string;
};

export const previewStore = writable<PreviewState>({
  loading: false,
  error: '',
  job: null,
  imageUrl: '',
  filename: '',
  prompt: ''
});

