import { apiFetch } from './api.js';

const CACHE_KEY = 'gpt-image-panel-version-check';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export async function checkAppVersion() {
  const local = await apiFetch('/api/version', {}, 'load version');
  renderVersionBadge({ current: local.version, state: 'current' });

  if (!local.github_repo) {
    return;
  }

  const latest = await fetchLatestVersion(local.github_repo);
  const hasUpdate = compareVersions(latest.version, local.version) > 0;

  renderVersionBadge({
    current: local.version,
    latest: latest.version,
    url: latest.url || local.release_url,
    state: hasUpdate ? 'update' : 'current',
  });
}

async function fetchLatestVersion(repo) {
  const cached = readCache(repo);
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) {
    return cached;
  }

  const releaseData = await fetchGitHubJson(
    `https://api.github.com/repos/${repo}/releases?per_page=1`,
  );
  const release = Array.isArray(releaseData) ? releaseData[0] : null;

  if (release?.tag_name) {
    return cacheLatestVersion({
      repo,
      version: normalizeVersion(release.tag_name),
      url: release.html_url,
    });
  }

  const tagData = await fetchGitHubJson(`https://api.github.com/repos/${repo}/tags?per_page=1`);
  const tag = Array.isArray(tagData) ? tagData[0] : null;

  if (!tag?.name) {
    throw new Error('No GitHub release or tag found');
  }

  return cacheLatestVersion({
    repo,
    version: normalizeVersion(tag.name),
    url: `https://github.com/${repo}/releases/tag/${tag.name}`,
  });
}

async function fetchGitHubJson(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' },
  });

  if (!res.ok) {
    throw new Error(`GitHub version check failed: ${res.status}`);
  }

  return res.json();
}

function cacheLatestVersion({ repo, version, url }) {
  const latest = {
    repo,
    version,
    url,
    checkedAt: Date.now(),
  };

  localStorage.setItem(CACHE_KEY, JSON.stringify(latest));
  return latest;
}

function readCache(repo) {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return cached?.repo === repo ? cached : null;
  } catch {
    return null;
  }
}

function renderVersionBadge({ current, latest, url, state }) {
  const badge = document.getElementById('versionBadge');
  if (!badge || !current) {
    return;
  }

  const currentText = formatVersion(current);
  const latestText = latest ? formatVersion(latest) : '';

  badge.textContent = state === 'update' && latestText ? `Update ${latestText}` : currentText;
  badge.title =
    state === 'update' && latestText
      ? `Current ${currentText}. Latest ${latestText}.`
      : `Current ${currentText}`;
  badge.href = state === 'update' && url ? url : '#';
  badge.removeAttribute('aria-disabled');

  if (state === 'update' && url) {
    badge.className =
      'rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold leading-5 text-amber-200 transition-colors hover:border-amber-300/70 hover:bg-amber-400/15';
  } else {
    badge.className =
      'rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-0.5 text-[11px] font-semibold leading-5 text-zinc-400 transition-colors';
    badge.removeAttribute('href');
    badge.setAttribute('aria-disabled', 'true');
  }
}

function compareVersions(a, b) {
  const left = versionParts(a);
  const right = versionParts(b);
  const length = Math.max(left.length, right.length);

  for (let i = 0; i < length; i += 1) {
    const current = left[i] || 0;
    const latest = right[i] || 0;
    if (current > latest) return 1;
    if (current < latest) return -1;
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
