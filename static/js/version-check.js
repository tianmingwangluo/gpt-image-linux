import { apiFetch } from './api.js';

const VERSION_FILE_URL =
  'https://raw.githubusercontent.com/Z1rconium/gpt-image-linux/main/VERSION';

export async function checkAppVersion() {
  const local = await apiFetch('/api/version', {}, 'load version');
  renderVersionBadge({ current: local.version, state: 'current' });

  try {
    const latest = await fetchLatestVersion();
    const hasUpdate = compareVersions(latest, local.version) > 0;

    renderVersionBadge({
      current: local.version,
      latest,
      url: local.release_url,
      state: hasUpdate ? 'update' : 'current',
    });
  } catch {
    // Keep showing current version if remote check fails
  }
}

async function fetchLatestVersion() {
  const res = await fetch(VERSION_FILE_URL, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Version check failed: ${res.status}`);
  }
  const text = await res.text();
  return normalizeVersion(text);
}

function renderVersionBadge({ current, latest, url, state }) {
  const badge = document.getElementById('versionBadge');
  if (!badge || !current) {
    return;
  }

  const currentText = formatVersion(current);

  if (state === 'update') {
    badge.innerHTML = `${currentText} <span class="ml-1 rounded bg-amber-400/20 px-1 py-px text-[10px] text-amber-300">New</span>`;
    badge.title = `Current ${currentText}. Latest ${formatVersion(latest)}.`;
    badge.href = url || '#';
    badge.removeAttribute('aria-disabled');
    badge.className =
      'inline-flex items-center rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold leading-5 text-amber-200 transition-colors hover:border-amber-300/70 hover:bg-amber-400/15';
  } else {
    badge.textContent = currentText;
    badge.title = `Current ${currentText}`;
    badge.removeAttribute('href');
    badge.setAttribute('aria-disabled', 'true');
    badge.className =
      'rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-0.5 text-[11px] font-semibold leading-5 text-zinc-400 transition-colors';
  }
}

function compareVersions(a, b) {
  const left = versionParts(a);
  const right = versionParts(b);
  const length = Math.max(left.length, right.length);

  for (let i = 0; i < length; i += 1) {
    const l = left[i] || 0;
    const r = right[i] || 0;
    if (l > r) return 1;
    if (l < r) return -1;
  }

  return 0;
}

function versionParts(version) {
  return normalizeVersion(version)
    .split('.')
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));
}

function normalizeVersion(version) {
  return String(version || '')
    .trim()
    .replace(/^v/i, '');
}

function formatVersion(version) {
  const normalized = normalizeVersion(version);
  return normalized ? `v${normalized}` : '';
}
