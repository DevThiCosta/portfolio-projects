import "server-only";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 2 * 60 * 1000;

const attempts = new Map<string, number[]>();

/** Limitador em memória de processo — suficiente para uma única instância (o caso de um bar). */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (attempts.get(key) ?? []).filter(
    (t) => now - t < WINDOW_MS
  );
  attempts.set(key, timestamps);
  return timestamps.length >= MAX_ATTEMPTS;
}

export function registerAttempt(key: string) {
  const timestamps = attempts.get(key) ?? [];
  timestamps.push(Date.now());
  attempts.set(key, timestamps);
}

export function clearAttempts(key: string) {
  attempts.delete(key);
}
