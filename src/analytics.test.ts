import { describe, expect, test } from "vitest";
import { compareFormats, createReport, parseMetricsText, rankPosts, recommendNext, reportMarkdown, scorePost } from "./analytics.js";
const posts = [
  { platform: "linkedin", hook: "Winning hook", format: "carousel", impressions: 1000, likes: 50, comments: 10, shares: 10, clicks: 20, leads: 5 },
  { platform: "linkedin", hook: "Weak hook", format: "text", impressions: 1000, likes: 2, comments: 0, shares: 0, clicks: 1, leads: 0 },
];
describe("analytics", () => {
  test("scores engagement and lead rates", () => { expect(scorePost(posts[0])).toMatchObject({ engagements: 70, engagementRate: 0.07, leadRate: 0.005 }); });
  test("ranks and recommends", () => { const ranked = rankPosts(posts); expect(ranked[0].hook).toBe("Winning hook"); expect(recommendNext(ranked).map((item) => item.action)).toContain("double-down"); });
  test("compares formats and reports markdown", () => { const report = createReport(posts); expect(compareFormats(posts)).toHaveLength(2); expect(reportMarkdown(report)).toContain("# Analytics report"); });
  test("imports JSON and CSV", () => { expect(parseMetricsText(JSON.stringify(posts))).toHaveLength(2); expect(parseMetricsText("platform,hook,format,impressions,likes,comments,shares,clicks,leads\nlinkedin,Hi,text,10,1,2,3,4,5")[0].leads).toBe(5); });
});
