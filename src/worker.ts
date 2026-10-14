import { createReport, parseMetricsText } from "./analytics.js";
import { VERSION } from "./version.js";
export interface WorkerEnv { PACK_NAME?: string; }
function json(value: unknown, status = 200): Response { return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } }); }
export default { async fetch(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/health") return json({ ok: true, pack: env.PACK_NAME ?? "agentic-analytics", version: VERSION });
  if (request.method === "POST" && url.pathname === "/report") {
    try { const body = await request.json() as { text?: unknown }; if (typeof body.text !== "string") return json({ error: "body needs a metrics text string" }, 400); return json(createReport(parseMetricsText(body.text))); } catch (error) { return json({ error: error instanceof Error ? error.message : "invalid body" }, 400); }
  }
  return json({ error: "not found" }, 404);
} };
