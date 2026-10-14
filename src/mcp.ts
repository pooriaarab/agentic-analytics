import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createLogger, getCostReport, type Logger } from "./core.js";
import { createReport, parseMetricsText, rankPosts, recommendNext, reportMarkdown } from "./analytics.js";
import { DEFAULT_BRAND } from "./index.js";
export interface McpDeps { logger?: Logger; }
const sourceShape = { text: z.string().describe("Metrics in JSON or CSV text.") };
const okResult = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value) }] });
const errorResult = (error: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }) }], isError: true as const });
const safely = (fn: () => unknown) => { try { return okResult(fn()); } catch (error) { return errorResult(error); } };
export function createMcpServer(_deps: McpDeps = {}): McpServer {
  const server = new McpServer({ name: DEFAULT_BRAND.command, version: DEFAULT_BRAND.version });
  server.registerTool("ingest_metrics", { description: "Validate and normalize JSON or CSV post metrics.", inputSchema: sourceShape, annotations: { readOnlyHint: true } }, async ({ text }) => safely(() => parseMetricsText(text)));
  server.registerTool("rank_posts", { description: "Score and rank JSON or CSV post metrics.", inputSchema: sourceShape, annotations: { readOnlyHint: true } }, async ({ text }) => safely(() => rankPosts(parseMetricsText(text))));
  server.registerTool("recommend_next", { description: "Recommend double-down, revise, or drop next moves from metrics.", inputSchema: sourceShape, annotations: { readOnlyHint: true } }, async ({ text }) => safely(() => recommendNext(rankPosts(parseMetricsText(text)))));
  server.registerTool("analytics_report", { description: "Produce a metrics report. Set markdown true for a Markdown result.", inputSchema: { ...sourceShape, markdown: z.boolean().optional() }, annotations: { readOnlyHint: true } }, async ({ text, markdown }) => safely(() => { const report = createReport(parseMetricsText(text)); return markdown ? { markdown: reportMarkdown(report) } : report; }));
  server.registerTool("get_cost_report", { description: "Read the cost report for this session.", inputSchema: {}, annotations: { readOnlyHint: true } }, async () => okResult(getCostReport()));
  return server;
}
export async function startMcp(deps: McpDeps = {}): Promise<void> { const server = createMcpServer(deps); await server.connect(new StdioServerTransport()); }
