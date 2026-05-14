export const ACTIVE_JOB_STATUSES = new Set(['queued', 'running']);

export function isActiveJobStatus(status: string | null | undefined) {
  return Boolean(status && ACTIVE_JOB_STATUSES.has(status));
}
