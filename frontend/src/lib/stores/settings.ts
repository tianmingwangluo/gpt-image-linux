import { derived, writable } from 'svelte/store';
import type { SettingsResponse } from '$lib/api/types';

export const settingsStore = writable<SettingsResponse | null>(null);
export const responsesMode = derived(settingsStore, ($settings) => $settings?.api_path === '/v1/responses');

