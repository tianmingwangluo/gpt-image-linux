import type { GenerateJobStatus } from '$lib/api/types';
import { DEFAULT_PROMPT_MODEL, initialPromptFormState, type PromptFormState } from '$lib/stores/preview';

export function normalizeJobQuality(value: string | null | undefined): PromptFormState['quality'] {
  if (value === 'auto' || value === 'low' || value === 'medium' || value === 'high') return value;
  return initialPromptFormState.quality;
}

export function normalizeJobOutputFormat(value: string | null | undefined): PromptFormState['outputFormat'] {
  if (value === 'png' || value === 'jpeg' || value === 'webp') return value;
  return initialPromptFormState.outputFormat;
}

export function jobToPromptForm(job: GenerateJobStatus, fallbackModel = DEFAULT_PROMPT_MODEL): PromptFormState {
  return {
    prompt: job.prompt || '',
    size: job.size || initialPromptFormState.size,
    model: job.model || fallbackModel || initialPromptFormState.model,
    quality: normalizeJobQuality(job.quality),
    outputFormat: normalizeJobOutputFormat(job.output_format),
    outputCompression: job.output_compression === null || job.output_compression === undefined ? '' : String(job.output_compression),
    quantity: Math.min(Math.max(Number(job.n) || initialPromptFormState.quantity, 1), 10),
    responseFormat: job.response_format === 'url' || job.response_format === 'b64_json' ? job.response_format : '',
    webhookUrl: ''
  };
}
