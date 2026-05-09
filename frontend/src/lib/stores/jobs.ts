import { writable } from 'svelte/store';
import type { GenerateJobStatus } from '$lib/api/types';

export const jobsStore = writable<GenerateJobStatus[]>([]);

