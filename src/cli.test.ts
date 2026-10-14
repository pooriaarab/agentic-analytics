import { describe, expect, test } from "vitest";
import { parseArgs, runCli, UsageError, type CliIo } from "./cli.js";
const sample = JSON.stringify([{ platform: "x", hook: "hello", format: "text", impressions: 100, likes: 5, comments: 1, shares: 1, clicks: 2, leads: 1 }]);
function testIo(): CliIo & { outLines: string[]; errLines: string[] } { const outLines: string[] = []; const errLines: string[] = []; return { outLines, errLines, out: (line) => outLines.push(line), err: (line) => errLines.push(line), readFile: () => sample }; }
describe("parseArgs", () => {
 test("empty args print help", () => expect(parseArgs([]).command).toBe("help"));
 test("rank takes a file", () => expect(parseArgs(["rank", "--file", "metrics.json"])).toMatchObject({ command: "rank", file: "metrics.json" }));
 test("report takes markdown", () => expect(parseArgs(["report", "--file", "metrics.json", "--markdown"]).markdown).toBe(true));
 test("unknown command throws", () => expect(() => parseArgs(["frobnicate"])).toThrow(UsageError));
 test("rank without file throws", () => expect(() => parseArgs(["rank"])).toThrow(/needs --file/));
});
describe("runCli", () => {
 test("rank prints scored JSON", async () => { const io = testIo(); expect(await runCli(["rank", "--file", "a.json"], io)).toBe(0); expect(JSON.parse(io.outLines[0])[0]).toHaveProperty("score"); });
 test("recommend prints moves", async () => { const io = testIo(); await runCli(["recommend", "--file", "a.json"], io); expect(JSON.parse(io.outLines[0])[0]).toHaveProperty("action"); });
 test("bad usage exits 2", async () => { const io = testIo(); expect(await runCli(["bogus"], io)).toBe(2); });
});
