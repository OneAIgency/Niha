/**
 * Extract a user-friendly error message from an API error (Axios-shaped).
 * Handles FastAPI's { detail: string | ValidationError[] } and generic Error.
 */
export function getApiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { detail?: string | { msg?: string }[]; message?: string } } }).response;
    const d = res?.data?.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d) && d[0]?.msg) return String(d[0].msg);
    const m = res?.data?.message;
    if (typeof m === 'string') return m;
  }
  return (err as Error)?.message ?? 'Something went wrong.';
}
