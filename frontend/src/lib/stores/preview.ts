import { get, writable } from 'svelte/store';
import { apiFetch } from '$lib/api/client';
import { t } from '$lib/i18n';
import type { GenerateJobResponse, GenerateJobStatus, GenerateRequestBody } from '$lib/api/types';

export type PreviewState = {
  loading: boolean;
  error: string;
  job: GenerateJobStatus | null;
  imageUrl: string;
  filename: string;
  prompt: string;
};

export type PromptFormState = {
  prompt: string;
  size: string;
  model: string;
  quality: GenerateRequestBody['quality'];
  outputFormat: GenerateRequestBody['output_format'];
  outputCompression: string;
  quantity: number;
  responseFormat: string;
  webhookUrl: string;
};

export type EditUploadSource = {
  id: string;
  file: File;
  label: string;
  previewUrl: string;
  previewLabel: string;
};

export type EditSourceState = {
  files: EditUploadSource[];
  selectedGalleryImageId: string;
  galleryLabel: string;
  galleryPreviewUrl: string;
  galleryPreviewLabel: string;
};

const initialPreviewState: PreviewState = {
  loading: false,
  error: '',
  job: null,
  imageUrl: '',
  filename: '',
  prompt: ''
};

export const DEFAULT_PROMPT_MODEL = 'gpt-image-2';
export const MAX_EDIT_SOURCE_IMAGES = 16;

export const initialPromptFormState: PromptFormState = {
  prompt: '',
  size: 'auto',
  model: DEFAULT_PROMPT_MODEL,
  quality: 'auto',
  outputFormat: 'png',
  outputCompression: '',
  quantity: 1,
  responseFormat: 'url',
  webhookUrl: ''
};

const initialEditSourceState: EditSourceState = {
  files: [],
  selectedGalleryImageId: '',
  galleryLabel: '',
  galleryPreviewUrl: '',
  galleryPreviewLabel: ''
};

function buildRequestBody(form: PromptFormState): GenerateRequestBody {
  const body: GenerateRequestBody = {
    prompt: form.prompt.trim(),
    size: form.size,
    model: form.model.trim(),
    n: Math.min(Math.max(Number(form.quantity) || 1, 1), 10),
    quality: form.quality,
    output_format: form.outputFormat,
    output_compression: null,
    response_format: form.responseFormat ? (form.responseFormat as 'url' | 'b64_json') : null,
    webhook_url: form.webhookUrl.trim() || null
  };

  if (form.outputFormat !== 'png' && form.outputCompression !== '') {
    body.output_compression = Math.min(Math.max(Number(form.outputCompression), 0), 100);
  }

  return body;
}

function isImageFile(file: File) {
  if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') return true;
  return /\.(avif|bmp|gif|heic|heif|ico|jpe?g|png|tiff?|webp)$/i.test(file.name);
}

function createPreviewStore() {
  const { subscribe, set, update } = writable<PreviewState>(initialPreviewState);
  let lastRequest: GenerateRequestBody | null = null;
  let lastAction: 'generate' | 'edit' = 'generate';
  let nextEditSourceId = 0;

  function setPreview(next: PreviewState) {
    set(next);
  }

  function setError(message: string) {
    update((current) => ({ ...current, loading: false, error: message }));
  }

  function setSubmissionError(error: unknown) {
    const message = error instanceof Error ? error.message : get(t).messages.requestFailed;
    update((current) => ({ ...current, loading: false, error: message, job: null }));
  }

  function clearPreview(closeActiveJobSource?: () => void) {
    closeActiveJobSource?.();
    set(initialPreviewState);
  }

  function editSourceCount(source: EditSourceState) {
    return source.files.length + (source.selectedGalleryImageId ? 1 : 0);
  }

  function revokeEditSourceUrls(source: EditSourceState) {
    source.files.forEach((upload) => URL.revokeObjectURL(upload.previewUrl));
  }

  function makeUploadSource(file: File): EditUploadSource {
    const objectUrl = URL.createObjectURL(file);
    nextEditSourceId += 1;
    return {
      id: `upload-${Date.now()}-${nextEditSourceId}`,
      file,
      label: file.name,
      previewUrl: objectUrl,
      previewLabel: file.name
    };
  }

  function clearEditSource(input?: HTMLInputElement) {
    revokeEditSourceUrls(get(editSourceStore));
    editSourceStore.set({ ...initialEditSourceState, files: [] });
    if (input) input.value = '';
  }

  function handleEditFile(event: Event, input?: HTMLInputElement) {
    const target = event.currentTarget as HTMLInputElement;
    const selectedFiles = Array.from(target.files || []);
    if (!selectedFiles.length) {
      target.value = '';
      return;
    }

    const validFiles = selectedFiles.filter(isImageFile);
    const invalidCount = selectedFiles.length - validFiles.length;
    if (!validFiles.length) {
      setError(get(t).messages.imageUploadRequired);
      target.value = '';
      return;
    }

    const current = get(editSourceStore);
    const availableSlots = MAX_EDIT_SOURCE_IMAGES - editSourceCount(current);
    if (availableSlots <= 0) {
      setError(get(t).messages.editSourceLimit(MAX_EDIT_SOURCE_IMAGES));
      target.value = '';
      return;
    }

    const acceptedFiles = validFiles.slice(0, availableSlots);
    const overLimitCount = validFiles.length - acceptedFiles.length;
    if (invalidCount > 0) setError(get(t).messages.imageUploadRequired);
    if (overLimitCount > 0) setError(get(t).messages.editSourceSomeSkipped(MAX_EDIT_SOURCE_IMAGES));

    const nextUploads = acceptedFiles.map(makeUploadSource);
    editSourceStore.update((source) => ({
      ...source,
      files: [...source.files, ...nextUploads]
    }));
    if (input) input.value = '';
    else target.value = '';
  }

  function setGalleryEditSource(imageId: string, label: string, previewUrl: string, previewLabel: string) {
    const current = get(editSourceStore);
    if (!current.selectedGalleryImageId && editSourceCount(current) >= MAX_EDIT_SOURCE_IMAGES) {
      setError(get(t).messages.editSourceLimit(MAX_EDIT_SOURCE_IMAGES));
      return false;
    }

    editSourceStore.update((source) => ({
      ...source,
      selectedGalleryImageId: imageId,
      galleryLabel: label,
      galleryPreviewUrl: previewUrl,
      galleryPreviewLabel: previewLabel
    }));
    return true;
  }

  function clearGalleryEditSource(imageId?: string) {
    editSourceStore.update((source) => {
      if (imageId && source.selectedGalleryImageId !== imageId) return source;
      return {
        ...source,
        selectedGalleryImageId: '',
        galleryLabel: '',
        galleryPreviewUrl: '',
        galleryPreviewLabel: ''
      };
    });
  }

  async function generateImage(
    form: PromptFormState,
    makeQueuedPreview: (prompt: string, operation: NonNullable<GenerateJobResponse['operation']>) => PreviewState,
    trackJob: (jobId: string) => void,
    loadJobs: () => Promise<void>
  ) {
    const body = buildRequestBody(form);
    if (!body.prompt) {
      setError(get(t).messages.promptRequired);
      return;
    }
    lastRequest = body;
    lastAction = 'generate';
    set(makeQueuedPreview(body.prompt, 'generation'));

    try {
      const job = await apiFetch<GenerateJobResponse>(
        '/api/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        },
        'starting image generation'
      );
      trackJob(job.job_id);
      await loadJobs();
    } catch (error) {
      setSubmissionError(error);
    }
  }

  async function editImage(
    form: PromptFormState,
    editSource: EditSourceState,
    makeQueuedPreview: (prompt: string, operation: NonNullable<GenerateJobResponse['operation']>) => PreviewState,
    trackJob: (jobId: string) => void,
    loadJobs: () => Promise<void>
  ) {
    const sourceCount = editSourceCount(editSource);
    if (sourceCount === 0) {
      setError(get(t).messages.editSourceRequired);
      return;
    }
    if (sourceCount > MAX_EDIT_SOURCE_IMAGES) {
      setError(get(t).messages.editSourceLimit(MAX_EDIT_SOURCE_IMAGES));
      return;
    }

    const body = buildRequestBody(form);
    if (!body.prompt) {
      setError(get(t).messages.promptRequired);
      return;
    }
    lastRequest = body;
    lastAction = 'edit';
    set(makeQueuedPreview(body.prompt, 'edit'));

    const formData = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, String(value));
      }
    });

    let endpoint = '/api/edits';
    if (editSource.selectedGalleryImageId) {
      endpoint = `/api/edits/from-gallery/${encodeURIComponent(editSource.selectedGalleryImageId)}`;
    }
    const uploadFieldName = sourceCount > 1 ? 'image[]' : 'image';
    editSource.files.forEach((source) => {
      formData.append(uploadFieldName, source.file, source.file.name);
    });

    try {
      const job = await apiFetch<GenerateJobResponse>(
        endpoint,
        {
          method: 'POST',
          body: formData
        },
        'starting image edit'
      );
      trackJob(job.job_id);
      await loadJobs();
    } catch (error) {
      setSubmissionError(error);
    }
  }

  function regenerate(setForm: (form: PromptFormState) => void, generate: () => void, edit: () => void) {
    if (!lastRequest) return;
    setForm({
      prompt: lastRequest.prompt,
      size: lastRequest.size,
      model: lastRequest.model,
      quantity: lastRequest.n,
      quality: lastRequest.quality,
      outputFormat: lastRequest.output_format,
      outputCompression: lastRequest.output_compression === null || lastRequest.output_compression === undefined ? '' : String(lastRequest.output_compression),
      responseFormat: lastRequest.response_format || '',
      webhookUrl: lastRequest.webhook_url || ''
    });
    if (lastAction === 'edit') edit();
    else generate();
  }

  function cleanup() {
    revokeEditSourceUrls(get(editSourceStore));
  }

  return {
    subscribe,
    setPreview,
    setError,
    clearPreview,
    clearEditSource,
    handleEditFile,
    setGalleryEditSource,
    clearGalleryEditSource,
    generateImage,
    editImage,
    regenerate,
    cleanup
  };
}

export const previewStore = createPreviewStore();
export const editSourceStore = writable<EditSourceState>(initialEditSourceState);
