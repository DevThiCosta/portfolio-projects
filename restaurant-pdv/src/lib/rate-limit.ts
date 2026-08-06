import "server-only";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 2 * 60 * 1000;

// Chave é derivada de input não confiável (userId/username digitado no
// login) — sem um teto, alguém batendo o login com um valor diferente a
// cada tentativa faria esse Map crescer sem limite (DoS de memória). Como
// isso é só um rate limiter em memória de processo (comentário original),
// aceitamos o mais simples: se o mapa passar do teto, os registros mais
// antigos (já fora da janela, portanto inofensivos) são descartados antes
// de aceitar chaves novas.
const MAX_TRACKED_KEYS = 5000;

const attempts = new Map<string, number[]>();

function pruneStaleKeys(now: number) {
  for (const [k, timestamps] of attempts) {
    if (!timestamps.some((t) => now - t < WINDOW_MS)) {
      attempts.delete(k);
    }
  }
}

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
  const now = Date.now();
  if (!attempts.has(key) && attempts.size >= MAX_TRACKED_KEYS) {
    pruneStaleKeys(now);
  }
  const timestamps = attempts.get(key) ?? [];
  timestamps.push(now);
  attempts.set(key, timestamps);
}

export function clearAttempts(key: string) {
  attempts.delete(key);
}
