#!/usr/bin/env node
import { readFileSync, realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { getCostReport, GuardError, VendorError } from "./core.js";
import { createReport, parseMetricsText, rankPosts, recommendNext, reportMarkdown } from "./analytics.js";
import { DEFAULT_BRAND } from "./index.js";
import { VERSION } from "./version.js";

export class UsageError extends Error { constructor(message: string) { super(message); this.name = "UsageError"; } }
export type CliCommand = "ingest" | "rank" | "recommend" | "report" | "costs" | "mcp" | "help" | "version";
export interface CliRequest { command: CliCommand; file?: string; markdown: boolean; }

export function parseArgs(argv: string[]): CliRequest {
  const request: CliRequest = { command: "help", markdown: false };
  const args = [...argv]; const first = args.shift();
  if (first === undefined || first === "--help" || first === "-h") return request;
  if (first === "--version" || first === "-V") return { ...request, command: "version" };
  if (!(["ingest", "rank", "recommend", "report", "costs", "mcp"] as string[]).includes(first)) throw new UsageError(`unknown command "${first}"`);
  request.command = first as CliCommand;
  while (args.length) {
    const flag = args.shift() as string;
    if (flag === "--file" && args.length) { request.file = args.shift() as string; continue; }
    if (flag === "--markdown" && request.command === "report") { request.markdown = true; continue; }
    throw new UsageError(`unknown flag "${flag}" for "${request.command}"`);
  }
  if (["ingest", "rank", "recommend", "report"].includes(request.command) && !request.file) throw new UsageError(`${request.command} needs --file`);
  return request;
}
export interface CliIo { out(line: string): void; err(line: string): void; readFile(path: string): string; }
function defaultIo(): CliIo { return { out: (line) => console.log(line), err: (line) => console.error(line), readFile: (path) => readFileSync(path, "utf8") }; }
function helpText(): string { return [
  `${DEFAULT_BRAND.name} ${VERSION}`, DEFAULT_BRAND.description, "", `Usage: ${DEFAULT_BRAND.command} <command> [flags]`, "", "Commands:",
  "  ingest --file <p>                 Validate and normalize JSON or CSV metrics.",
  "  rank --file <p>                   Score and rank posts.",
  "  recommend --file <p>              Recommend double-down, revise, or drop moves.",
  "  report --file <p> [--markdown]    Print a JSON or Markdown report.",
  "  costs                             Print the cost report as JSON.", "  mcp                               Start the MCP server on stdio.", "", "Flags:", "  --help, -h       Print this help.", "  --version, -V    Print the version.",
].join("\n"); }
function metrics(request: CliRequest, io: CliIo) { return parseMetricsText(io.readFile(request.file as string)); }
export async function runCli(argv: string[], io: CliIo = defaultIo()): Promise<number> {
  let request: CliRequest; try { request = parseArgs(argv); } catch (error) { io.err(error instanceof Error ? error.message : String(error)); io.err(`Run "${DEFAULT_BRAND.command} --help" for usage.`); return 2; }
  try {
    switch (request.command) {
      case "help": io.out(helpText()); return 0;
      case "version": io.out(VERSION); return 0;
      case "ingest": io.out(JSON.stringify(metrics(request, io))); return 0;
      case "rank": io.out(JSON.stringify(rankPosts(metrics(request, io)))); return 0;
      case "recommend": io.out(JSON.stringify(recommendNext(rankPosts(metrics(request, io))))); return 0;
      case "report": { const report = createReport(metrics(request, io)); io.out(request.markdown ? reportMarkdown(report) : JSON.stringify(report)); return 0; }
      case "costs": io.out(JSON.stringify(getCostReport())); return 0;
      case "mcp": { const { startMcp } = await import("./mcp.js"); await startMcp(); return 0; }
    }
  } catch (error) {
    if (error instanceof GuardError || error instanceof VendorError || error instanceof UsageError || error instanceof SyntaxError || error instanceof Error) { io.err(`${error.name}: ${error.message}`); return 1; }
    throw error;
  }
}
function isMainModule(): boolean { const invoked = process.argv[1]; if (!invoked) return false; try { return import.meta.url === pathToFileURL(realpathSync(invoked)).href; } catch { return false; } }
if (isMainModule()) runCli(process.argv.slice(2)).then((code) => { if (code !== 0) process.exit(code); }, (error: unknown) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
