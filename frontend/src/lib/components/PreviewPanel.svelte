<script lang="ts">
  import type { GenerateJobStatus } from '$lib/api/types';
  import { downloadUrl, stageLabel } from '$lib/utils/format';

  export let loading = false;
  export let error = '';
  export let job: GenerateJobStatus | null = null;
  export let imageUrl = '';
  export let filename = '';
  export let prompt = '';
  export let onRegenerate: () => void = () => {};
  export let onClear: () => void = () => {};
</script>

<section class="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
  <div class="mb-4 flex items-center justify-between gap-3">
    <div class="min-w-0">
      <h2 class="text-sm font-semibold text-zinc-100">Preview</h2>
      <p class="mt-1 truncate text-xs text-zinc-500">{prompt || 'Latest generation or edit result'}</p>
    </div>
    <div class="flex shrink-0 items-center gap-2">
      {#if filename}
        <a href={downloadUrl(filename)} class="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800">Download</a>
      {/if}
      <button type="button" class="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40" disabled={!job && !imageUrl} on:click={onRegenerate}>
        Regenerate
      </button>
      <button type="button" class="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800" on:click={onClear}>
        Clear
      </button>
    </div>
  </div>

  {#if error}
    <div class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
  {/if}

  <div class={`mt-4 flex min-h-[360px] items-center justify-center overflow-hidden rounded-xl border border-zinc-800 ${imageUrl ? 'bg-zinc-950' : 'preview-empty'}`}>
    {#if loading}
      <div class="flex max-w-sm flex-col items-center px-6 text-center">
        <span class="spinner"></span>
        <p class="mt-4 text-sm font-semibold text-zinc-100">{job?.message || 'Working on image'}</p>
        <p class="mt-2 text-xs text-zinc-400">{stageLabel(job) || 'Queued'}</p>
      </div>
    {:else if imageUrl}
      <img src={imageUrl} alt="Generated preview" class="max-h-[640px] max-w-full rounded-lg object-contain" />
    {:else}
      <div class="px-6 text-center">
        <p class="text-sm font-medium text-zinc-300">No preview yet</p>
        <p class="mt-2 text-xs text-zinc-500">Generate or edit an image to show the result.</p>
      </div>
    {/if}
  </div>

  {#if job}
    <div class="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-500 sm:grid-cols-4">
      <div class="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
        <div class="text-zinc-600">Status</div>
        <div class="mt-1 text-zinc-300">{job.status}</div>
      </div>
      <div class="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
        <div class="text-zinc-600">Size</div>
        <div class="mt-1 text-zinc-300">{job.size || '-'}</div>
      </div>
      <div class="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
        <div class="text-zinc-600">Model</div>
        <div class="mt-1 truncate text-zinc-300">{job.model || '-'}</div>
      </div>
      <div class="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
        <div class="text-zinc-600">Duration</div>
        <div class="mt-1 text-zinc-300">{job.duration || '-'}</div>
      </div>
    </div>
  {/if}
</section>

