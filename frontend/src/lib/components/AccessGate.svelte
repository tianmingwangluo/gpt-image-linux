<script lang="ts">
  export let visible = false;
  export let error = '';
  export let loading = false;
  export let onUnlock: (accessKey: string) => Promise<void> | void = () => {};

  let accessKey = '';
  let localError = '';

  async function submit() {
    const value = accessKey.trim();
    if (!value) {
      localError = 'Please enter the access key';
      return;
    }
    localError = '';
    await onUnlock(value);
  }
</script>

{#if visible}
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950 px-4">
    <div class="fade-in w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl">
      <div class="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
        <span class="text-lg text-emerald-400">#</span>
      </div>
      <h2 class="text-lg font-semibold text-zinc-100">Access Key</h2>
      <form class="mt-5 space-y-4" on:submit|preventDefault={submit}>
        <input
          bind:value={accessKey}
          type="password"
          autocomplete="current-password"
          placeholder="Enter access key"
          class="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 font-mono text-sm text-zinc-100 transition-colors placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
        />
        <button
          type="submit"
          disabled={loading}
          class="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Unlocking...' : 'Unlock'}
        </button>
      </form>
      {#if error || localError}
        <p class="mt-3 text-sm text-red-400">{error || localError}</p>
      {/if}
    </div>
  </div>
{/if}

