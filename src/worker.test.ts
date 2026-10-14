import { describe, expect, test } from "vitest";
import worker from "./worker.js";
describe("worker", () => {
 test("GET /health reports ok", async () => { const response = await worker.fetch(new Request("https://pack.test/health"), { PACK_NAME: "probe" }); expect(await response.json()).toMatchObject({ ok: true, pack: "probe" }); });
 test("POST /report returns analytics", async () => { const response = await worker.fetch(new Request("https://pack.test/report", { method: "POST", body: JSON.stringify({ text: JSON.stringify([{ platform: "x", hook: "h", format: "text", impressions: 1, likes: 1, comments: 0, shares: 0, clicks: 0, leads: 0 }]) }) }), {}); expect(await response.json()).toMatchObject({ summary: { posts: 1 } }); });
});
