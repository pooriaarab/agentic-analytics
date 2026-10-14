import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, test } from "vitest";
import { createMcpServer } from "./mcp.js";
const text = JSON.stringify([{ platform: "x", hook: "hello", format: "text", impressions: 100, likes: 5, comments: 1, shares: 1, clicks: 2, leads: 1 }]);
function textOf(result: unknown): string { return (result as { content: { text: string }[] }).content[0].text; }
describe("mcp server", () => {
 test("serves analytics tools", async () => { const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair(); const server = createMcpServer(); await server.connect(serverTransport); const client = new Client({ name: "probe", version: "0.0.0" }); await client.connect(clientTransport); try { const names = (await client.listTools()).tools.map((tool) => tool.name).sort(); expect(names).toEqual(["analytics_report", "get_cost_report", "ingest_metrics", "rank_posts", "recommend_next"]); const result = await client.callTool({ name: "rank_posts", arguments: { text } }); expect(JSON.parse(textOf(result))[0]).toHaveProperty("score"); } finally { await client.close(); await server.close(); } });
 test("invalid metrics returns tool error", async () => { const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair(); const server = createMcpServer(); await server.connect(serverTransport); const client = new Client({ name: "probe", version: "0.0.0" }); await client.connect(clientTransport); try { const result = await client.callTool({ name: "rank_posts", arguments: { text: "{bad" } }); expect(textOf(result)).toContain("error"); } finally { await client.close(); await server.close(); } });
});
