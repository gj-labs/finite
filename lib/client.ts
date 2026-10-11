"use client";
// Browser-side helpers. All Arcade calls go through /api/arcade/* so the key stays on the server.

export async function arcade<T = any>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`/api/arcade/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(humanize(data?.error || `Request failed (${res.status})`));
  return data as T;
}

export function humanize(msg: string) {
  if (/401|unauthor/i.test(msg)) return "Arcade didn't accept the API key. Check ARCADE_API_KEY in .env.local and restart.";
  if (/403/.test(msg)) return "This Arcade account isn't allowed to do that yet — check you've joined the hackathon organization.";
  if (/412/.test(msg)) return "Arcade needs drop-ship enabled for single keepsakes. (Finite sends it — try again.)";
  if (/429/.test(msg)) return "Arcade is busy right now. Give it a few seconds and try again.";
  if (/fetch failed|network|ENOTFOUND|ECONN/i.test(msg)) return "Couldn't reach Arcade. Check your internet connection and try again.";
  return msg.replace(/^Arcade [^ ]+ failed \(\d+\): /, "Arcade said: ");
}

export type JobResult = { patternId?: string; productId?: string };

// Poll a job every 5s until it succeeds or fails (3-minute timeout).
export async function pollJob(
  jobId: string,
  onTick?: (secondsElapsed: number) => void,
  timeoutMs = 3 * 60 * 1000
): Promise<JobResult> {
  const start = Date.now();
  // first check sooner so demo mode feels responsive
  let wait = 2500;
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, wait));
    wait = 5000;
    onTick?.(Math.round((Date.now() - start) / 1000));
    const job = await arcade<{ status: string; result: JobResult | null; error: { message: string } | null }>("job", { jobId });
    if (job.status === "succeeded") {
      if (!job.result) throw new Error("Arcade finished but didn't return a result. Try again.");
      return job.result;
    }
    if (job.status === "failed") throw new Error(job.error?.message ? `Arcade couldn't finish: ${job.error.message}` : "Arcade couldn't finish this one. Try again.");
  }
  throw new Error("This is taking longer than usual. Arcade may still finish — try checking again in a minute.");
}

export const rid = (prefix: string) => `finite-${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
