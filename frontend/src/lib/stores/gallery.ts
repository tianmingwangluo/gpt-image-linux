import { writable } from 'svelte/store';
import type { GalleryResponse } from '$lib/api/types';

export type GalleryFilters = {
  prompt: string;
  model: string;
  preset: string;
  size: string;
  dateFrom: string;
  dateTo: string;
  favorite: boolean;
};

export const defaultGalleryFilters: GalleryFilters = {
  prompt: '',
  model: '',
  preset: '',
  size: '',
  dateFrom: '',
  dateTo: '',
  favorite: false
};

export const galleryStore = writable<GalleryResponse | null>(null);
export const galleryFiltersStore = writable<GalleryFilters>({ ...defaultGalleryFilters });

