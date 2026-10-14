export { VERSION } from "./version.js";
export {
  defineBrand, createLogger, GuardError, VendorError, createGuards, LocalRouterAdapter, HttpRouterAdapter,
  recordCost, getCostReport, resetCosts, createDryRunResult, dispatchText, summarizeText,
} from "./core.js";
export type {
  BrandConfig, LogLevel, Logger, LoggerOptions, CapsConfig, QuietHoursConfig, GuardsConfig, Guards,
  DispatchReceipt, RouterAdapter, HttpRouterOptions, CostEntry, CostReport, DispatchOptions, DispatchResult,
  TopWord, TextSummary, SummarizeOptions,
} from "./core.js";
export {
  normalizePost, parseMetricsText, scorePost, rankPosts, compareFormats, recommendNext, createReport, reportMarkdown,
} from "./analytics.js";
export type {
  PostMetrics, ScoredPost, FormatComparison, RecommendationAction, Recommendation, AnalyticsReport,
} from "./analytics.js";

import { defineBrand, type BrandConfig } from "./core.js";
import { VERSION } from "./version.js";

export const DEFAULT_BRAND: BrandConfig = defineBrand({
  name: "Agentic analytics",
  command: "agentic-analytics",
  description: "Score social post results and recommend the next move.",
  keywords: ["analytics", "social", "metrics", "agentic-suite", "cli", "mcp"],
  version: VERSION,
});
