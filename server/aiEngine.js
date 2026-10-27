/**
 * Optional bridge to the Python orchestration service in /ai-engine.
 *
 * When AI_ENGINE_URL is unset the server uses the deterministic TypeScript-free
 * JS engine, so the platform is fully functional without Python installed.
 * When set, the richer pipeline (hybrid retrieval, reranking, optional LLM
 * enrichment) takes over and the JS result is the fallback on any failure.
 */
const ENGINE_URL = process.env.AI_ENGINE_URL?.replace(/\/$/, '') ?? '';
const TIMEOUT_MS = Number(process.env.AI_ENGINE_TIMEOUT_MS ?? 9000);

let warned = false;

export function engineConfigured() {
  return Boolean(ENGINE_URL);
}

export async function callEngine(pathname, payload) {
  if (!ENGINE_URL) return null;
  try {
    const response = await fetch(`${ENGINE_URL}${pathname}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`engine responded ${response.status}`);
    return await response.json();
  } catch (error) {
    if (!warned) {
      console.warn('[atlas] AI engine unavailable, using local engine:', error.message);
      warned = true;
    }
    return null;
  }
}
