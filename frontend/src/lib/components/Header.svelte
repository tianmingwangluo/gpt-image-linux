<script lang="ts">
  export let activeJobsCount = 0;
  export let version = '';
  export let releaseUrl: string | null = null;
  export let onOpenJobs: () => void = () => {};
  export let onOpenSettings: () => void = () => {};
</script>

<header class="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
  <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
    <div class="flex items-center gap-3">
      <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500">
        <span class="text-sm font-black text-zinc-950">I</span>
      </div>
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-base font-semibold text-zinc-100">GPT Image Panel</h1>
          {#if version}
            <a
              href={releaseUrl || undefined}
              target="_blank"
              rel="noreferrer"
              class="rounded-md border border-zinc-700 px-2 py-0.5 text-[11px] font-semibold leading-5 text-zinc-400 transition-colors hover:text-zinc-100"
            >
              {version}
            </a>
          {/if}
        </div>
        <p class="hidden text-xs text-zinc-500 sm:block">Image Generation Interface</p>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="relative rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        title="Job History"
        aria-label="Job History"
        on:click={onOpenJobs}
      >
        <span class="text-sm font-semibold leading-none">Jobs</span>
        {#if activeJobsCount}
          <span class="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-emerald-500 px-1 text-[10px] font-semibold leading-4 text-zinc-950">
            {activeJobsCount}
          </span>
        {/if}
      </button>
      <button
        type="button"
        class="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        title="Settings"
        aria-label="Settings"
        on:click={onOpenSettings}
      >
        <span class="text-sm font-semibold leading-none">Set</span>
      </button>
    </div>
  </div>
</header>
