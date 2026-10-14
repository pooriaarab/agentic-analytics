/** Pure analytics domain functions shared by the SDK, CLI, MCP, and worker. */

export interface PostMetrics {
  platform: string;
  hook: string;
  format: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  leads: number;
}

export interface ScoredPost extends PostMetrics {
  engagements: number;
  engagementRate: number;
  leadRate: number;
  score: number;
}

export interface FormatComparison {
  format: string;
  posts: number;
  impressions: number;
  engagements: number;
  leads: number;
  engagementRate: number;
  leadRate: number;
  averageScore: number;
}

export type RecommendationAction = "double-down" | "revise" | "drop";

export interface Recommendation {
  action: RecommendationAction;
  post: ScoredPost;
  reason: string;
  nextIdea: string;
}

export interface AnalyticsReport {
  summary: {
    posts: number;
    impressions: number;
    engagements: number;
    leads: number;
    engagementRate: number;
    leadRate: number;
    topPost?: ScoredPost;
  };
  ranked: ScoredPost[];
  formats: FormatComparison[];
  recommendations: Recommendation[];
}

const REQUIRED_FIELDS: (keyof PostMetrics)[] = [
  "platform", "hook", "format", "impressions", "likes", "comments", "shares", "clicks", "leads",
];
const NUMERIC_FIELDS: (keyof PostMetrics)[] = [
  "impressions", "likes", "comments", "shares", "clicks", "leads",
];

function finiteNonNegative(value: unknown, field: string): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
  return number;
}

export function normalizePost(post: PostMetrics): PostMetrics {
  if (typeof post !== "object" || post === null) throw new Error("post must be an object");
  for (const field of REQUIRED_FIELDS) {
    if (!(field in post)) throw new Error(`post is missing ${field}`);
  }
  const platform = String(post.platform).trim();
  const hook = String(post.hook).trim();
  const format = String(post.format).trim();
  if (!platform || !hook || !format) throw new Error("platform, hook, and format must not be empty");
  return {
    platform,
    hook,
    format,
    impressions: finiteNonNegative(post.impressions, "impressions"),
    likes: finiteNonNegative(post.likes, "likes"),
    comments: finiteNonNegative(post.comments, "comments"),
    shares: finiteNonNegative(post.shares, "shares"),
    clicks: finiteNonNegative(post.clicks, "clicks"),
    leads: finiteNonNegative(post.leads, "leads"),
  };
}

export function scorePost(post: PostMetrics): ScoredPost {
  const normalized = normalizePost(post);
  const engagements = normalized.likes + normalized.comments + normalized.shares;
  const engagementRate = normalized.impressions === 0 ? 0 : engagements / normalized.impressions;
  const leadRate = normalized.impressions === 0 ? 0 : normalized.leads / normalized.impressions;
  // Leads are weighted higher because they represent the intended business outcome.
  const score = engagementRate * 100 + leadRate * 500;
  return { ...normalized, engagements, engagementRate, leadRate, score };
}

export function rankPosts(posts: PostMetrics[]): ScoredPost[] {
  if (!Array.isArray(posts)) throw new Error("posts must be an array");
  return posts.map(scorePost).sort((a, b) =>
    b.score - a.score || b.leadRate - a.leadRate || b.engagementRate - a.engagementRate || b.impressions - a.impressions,
  );
}

export function compareFormats(posts: PostMetrics[] | ScoredPost[]): FormatComparison[] {
  const groups = new Map<string, ScoredPost[]>();
  for (const post of posts) {
    const scored = "score" in post ? post : scorePost(post);
    groups.set(scored.format, [...(groups.get(scored.format) ?? []), scored]);
  }
  return [...groups.entries()].map(([format, group]) => {
    const impressions = group.reduce((sum, post) => sum + post.impressions, 0);
    const engagements = group.reduce((sum, post) => sum + post.engagements, 0);
    const leads = group.reduce((sum, post) => sum + post.leads, 0);
    return {
      format,
      posts: group.length,
      impressions,
      engagements,
      leads,
      engagementRate: impressions === 0 ? 0 : engagements / impressions,
      leadRate: impressions === 0 ? 0 : leads / impressions,
      averageScore: group.reduce((sum, post) => sum + post.score, 0) / group.length,
    };
  }).sort((a, b) => b.averageScore - a.averageScore || a.format.localeCompare(b.format));
}

export function recommendNext(ranked: ScoredPost[]): Recommendation[] {
  if (!Array.isArray(ranked)) throw new Error("ranked must be an array");
  if (ranked.length === 0) return [];
  const scores = ranked.map((post) => post.score);
  const high = scores[Math.max(0, Math.ceil(scores.length / 3) - 1)] ?? 0;
  const low = scores[Math.min(scores.length - 1, Math.floor((scores.length * 2) / 3))] ?? 0;
  return ranked.map((post) => {
    let action: RecommendationAction;
    let reason: string;
    if (post.score >= high && (post.leads > 0 || post.engagements > 0)) {
      action = "double-down";
      reason = `Ranks highly with ${(post.engagementRate * 100).toFixed(2)}% engagement and ${(post.leadRate * 100).toFixed(2)}% lead rate.`;
    } else if (post.score <= low && ranked.length > 1) {
      action = "drop";
      reason = `Ranks at the bottom with ${(post.engagementRate * 100).toFixed(2)}% engagement and ${(post.leadRate * 100).toFixed(2)}% lead rate.`;
    } else {
      action = "revise";
      reason = `Shows mixed results; preserve the topic but test a clearer hook or call to action.`;
    }
    return {
      action,
      post,
      reason,
      nextIdea: action === "double-down"
        ? `Create another ${post.format} for ${post.platform} using the winning hook pattern: ${post.hook}`
        : action === "revise"
          ? `Rewrite this ${post.format} hook and test a more specific benefit: ${post.hook}`
          : `Retire this ${post.format} approach and reallocate effort to a stronger format.`,
    };
  });
}

export function createReport(posts: PostMetrics[]): AnalyticsReport {
  const ranked = rankPosts(posts);
  const impressions = ranked.reduce((sum, post) => sum + post.impressions, 0);
  const engagements = ranked.reduce((sum, post) => sum + post.engagements, 0);
  const leads = ranked.reduce((sum, post) => sum + post.leads, 0);
  return {
    summary: {
      posts: ranked.length,
      impressions,
      engagements,
      leads,
      engagementRate: impressions === 0 ? 0 : engagements / impressions,
      leadRate: impressions === 0 ? 0 : leads / impressions,
      topPost: ranked[0],
    },
    ranked,
    formats: compareFormats(ranked),
    recommendations: recommendNext(ranked),
  };
}

export function reportMarkdown(report: AnalyticsReport): string {
  const percent = (value: number) => `${(value * 100).toFixed(2)}%`;
  const lines = [
    "# Analytics report",
    "",
    `- Posts: ${report.summary.posts}`,
    `- Impressions: ${report.summary.impressions}`,
    `- Engagement rate: ${percent(report.summary.engagementRate)}`,
    `- Lead rate: ${percent(report.summary.leadRate)}`,
    "",
    "## Format comparison",
    "",
    "| Format | Posts | Engagement rate | Lead rate |",
    "| --- | ---: | ---: | ---: |",
    ...report.formats.map((format) => `| ${format.format} | ${format.posts} | ${percent(format.engagementRate)} | ${percent(format.leadRate)} |`),
    "",
    "## Next moves",
    "",
    ...report.recommendations.map((recommendation) => `- **${recommendation.action}** — ${recommendation.nextIdea} ${recommendation.reason}`),
  ];
  return lines.join("\n");
}

export function parseMetricsText(text: string): PostMetrics[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const value: unknown = JSON.parse(trimmed);
    const rows = Array.isArray(value) ? value : (typeof value === "object" && value !== null && "posts" in value ? (value as { posts: unknown }).posts : undefined);
    if (!Array.isArray(rows)) throw new Error("JSON input must be an array or an object with a posts array");
    return rows.map((row) => normalizePost(row as PostMetrics));
  }
  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift() ?? "").map((header) => header.trim());
  if (headers.length === 0) return [];
  return lines.map((line, index) => {
    const fields = parseCsvLine(line);
    if (fields.length !== headers.length) throw new Error(`CSV row ${index + 2} has ${fields.length} fields; expected ${headers.length}`);
    const row = Object.fromEntries(headers.map((header, fieldIndex) => [header, fields[fieldIndex]]));
    return normalizePost(row as unknown as PostMetrics);
  });
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1; } else quoted = !quoted;
    } else if (char === "," && !quoted) { values.push(value); value = ""; } else value += char;
  }
  if (quoted) throw new Error("CSV contains an unclosed quote");
  values.push(value);
  return values;
}
