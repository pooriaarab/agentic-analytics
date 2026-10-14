# agentic-analytics

[![npm version](https://img.shields.io/npm/v/agentic-analytics)](https://www.npmjs.com/package/agentic-analytics) [![Downloads/month](https://img.shields.io/npm/dm/agentic-analytics)](https://www.npmjs.com/package/agentic-analytics) [![MIT license](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/license/mit)

[Package](https://www.npmjs.com/package/agentic-analytics) · [Input guide](#integration-guides) · [API](#runtime-surfaces) · [Support](https://github.com/pooriaarab/agentic-analytics/issues)

agentic-analytics is an open-source social post analytics toolkit for developers and agents. It ranks supplied metrics, compares formats, and produces rule-based next moves. Reports run locally through a JavaScript SDK, command-line interface (CLI), or Model Context Protocol (MCP) server.

## Install

```sh
npm install agentic-analytics
```

Use Node.js 18 or later. TypeScript declarations are included. The package has two direct runtime dependencies.

## Score your first post

Save a sample metrics file. No credentials or environment variables are required.

```sh
cat > metrics.json <<'JSON'
[{"platform":"LinkedIn","hook":"Stop guessing","format":"carousel","impressions":1000,"likes":40,"comments":8,"shares":5,"clicks":30,"leads":4}]
JSON
npx agentic-analytics report --file metrics.json --markdown
```

The report prints `Posts: 1`, `Engagement rate: 5.30%`, and `Lead rate: 0.40%`.
Its next move is `double-down` for this sample.
The SDK produces the same report:

```js
import { createReport, reportMarkdown } from 'agentic-analytics';

const report = createReport([{
  platform: 'LinkedIn', hook: 'Stop guessing', format: 'carousel',
  impressions: 1000, likes: 40, comments: 8, shares: 5,
  clicks: 30, leads: 4,
}]);
console.log(reportMarkdown(report));
```

## How it works

```text
JSON / CSV → normalize metrics → score and rank → compare formats
                                             → recommend next moves
                                             → JSON / Markdown report
                SDK / CLI / MCP share these functions
```

## Why it exists

Buffer Insights and Hootsuite Analytics offer social reporting dashboards.
agentic-analytics provides a local calculation library for metrics you already have.
You can use its report functions in scripts and agent workflows without connecting a social account.

## Compare

Checked 2026-10-14 against source and the linked product documentation.

| Scope | agentic-analytics | [Buffer Insights](https://buffer.com/insights) | [Hootsuite Analytics](https://help.hootsuite.com/s/article/types-of-analytics-reports) |
| --- | --- | --- | --- |
| Interface | SDK, CLI, MCP | Buffer dashboard | Hootsuite reports |
| Input | Supplied JSON or CSV | Connected social channels | Connected social account data |
| Execution | Your Node.js process | Managed application | Managed application |
| Report output | JSON and Markdown | Dashboard; PDF or CSV on paid plans | Dashboard and report exports |

Buffer describes channel access in its [Insights guide](https://support.buffer.com/en-us/articles/using-insights-in-buffer-x4gLauQU5a).
Hootsuite describes exports in its [report export guide](https://help.hootsuite.com/s/article/export-analytics-report).

## Coverage

There are zero branded platform connectors. `platform` is a user-supplied label, not an integration selector.

| Input / surface | Status | Scope |
| --- | --- | --- |
| JSON array | Implemented | Post metrics |
| JSON object with `posts` array | Implemented | Post metrics |
| CSV | Implemented | Fixed field schema |
| Social network APIs | — | No account connection or data fetching |
| Generic HTTP text router | SDK utility | Sends `{text}` to your endpoint; not a metrics connector |
| Local text router | Local receipt only | No external delivery |

Local tests verify parsing, scoring, and exposed surfaces. There are no provider credentials to verify for analytics.

## Common use cases

1. **LinkedIn analysts:** convert exported metrics into the schema, then compare carousel and text formats.
2. **Node.js developers:** embed `createReport` in an internal review script.
3. **MCP client developers:** ask an agent to rank supplied metrics through `rank_posts`.
4. **Content teams:** generate a Markdown report from CSV for a review document.

## Features

- **Validation:** require platform, hook, format, and six non-negative numeric metrics.
- **Ranking:** sort by score, then lead rate, engagement rate, and impressions.
- **Format comparison:** aggregate impressions, engagements, leads, and average scores per format.
- **Recommendations:** assign `double-down`, `revise`, or `drop` through score thresholds.
- **Reports:** expose totals, ranked posts, format comparisons, and recommendations as JSON or Markdown.
- **Text utilities:** export text statistics, generic routers, guards, and process-local cost counters separately from analytics.

## Runtime surfaces

Analytics SDK exports are `normalizePost`, `parseMetricsText`, `scorePost`, `rankPosts`, `compareFormats`, `recommendNext`, `createReport`, and `reportMarkdown`.
The SDK also exports `summarizeText`, `dispatchText`, local and HTTP routers, and logging, guard, and cost helpers.

CLI data commands are `ingest`, `rank`, `recommend`, and `report`; each requires `--file`.
Other commands are `costs` and `mcp`. Help uses no arguments, `--help`, or `-h`.
Version uses `--version` or `-V`. Literal `help` and `version` commands are not accepted.

```sh
npx agentic-analytics ingest --file metrics.json
npx agentic-analytics rank --file metrics.json
npx agentic-analytics recommend --file metrics.json
npx agentic-analytics report --file metrics.json --markdown
npx agentic-analytics costs
npx agentic-analytics mcp
```

MCP tools are `ingest_metrics`, `rank_posts`, `recommend_next`, `analytics_report`, and `get_cost_report`.
The four analytics tools accept JSON or CSV through `text`. `analytics_report` also accepts optional `markdown`.

```json
{"mcpServers":{"agentic-analytics":{"command":"npx","args":["agentic-analytics","mcp"]}}}
```

The self-hosted Worker source serves `GET /health` and `POST /report`.
Report requests require a JSON body with a metrics `text` string.
There is no managed endpoint supplied by this package.

## Delivery and behavior limits

Analytics functions do not fetch metrics, publish posts, or attribute leads to conversions.
You must supply comparable measurements and consistent time windows.
Engagements equal likes plus comments plus shares. Clicks are retained but do not affect the score.
Score equals `engagementRate * 100 + leadRate * 500`; it is not capped at 100.
Rates use impressions as the denominator. Zero impressions produce zero rates.
Recommendations use relative score thresholds, not a trained model or statistical significance test.
`recommendNext` expects an already ranked list; call `rankPosts` first.
Format grouping combines matching format labels across platforms.
CSV parsing supports quoted commas and escaped quotes, but not multiline cells.
Analytics does not record cost units. Generic SDK dispatch utilities track character units in process memory, not currency.
The HTTP text router has a ten-second default timeout and no built-in retries or authentication headers.

## Integration guides

Supply every field shown below. JSON also accepts `{ "posts": [...] }`.
Convert platform exports into this schema before importing them; no branded export adapter exists.

```csv
platform,hook,format,impressions,likes,comments,shares,clicks,leads
LinkedIn,Stop guessing,carousel,1000,40,8,5,30,4
```

Numbers must be finite and non-negative. Platform, hook, and format labels must be non-empty.
Use `parseMetricsText` to validate input before calling report functions.
No `.env` loading is needed for local analytics.

## Status

Version 0.1.0 is an early release. The API and recommendation rules can change before 1.0.
[Report bugs or request support](https://github.com/pooriaarab/agentic-analytics/issues).
Public case studies are not yet published in this repository.
Contributors can run `npm run build`, `npm run typecheck`, and `npm test`.

## FAQ

### What does agentic-analytics analyze?

agentic-analytics analyzes supplied social post metrics. It computes engagement rates, lead rates, rankings, and format summaries.

### Which integrations are verified?

agentic-analytics has no branded social network integrations. Local tests verify JSON and CSV calculation paths.

### Does agentic-analytics provide a managed analytics dashboard?

agentic-analytics runs in your process and returns reports. It does not supply a managed dashboard or persistent metrics store.

### How is agentic-analytics different from Buffer Insights?

agentic-analytics calculates reports from metrics you supply. Buffer Insights provides reporting within Buffer for connected channels.

### How is agentic-analytics different from Hootsuite Analytics?

agentic-analytics offers local functions and agent tools for a fixed metrics schema. Hootsuite Analytics offers account-based dashboards and reports.

### Can agentic-analytics fetch LinkedIn metrics?

agentic-analytics does not fetch LinkedIn metrics. Convert your data into the required schema and pass it as JSON or CSV.

### Are the next moves generated by an AI model?

agentic-analytics assigns next moves with deterministic score thresholds. The text templates use the supplied format, platform, and hook.

### Does agentic-analytics require API keys?

agentic-analytics requires no API keys for analytics. Its separate HTTP text utility sends data to an endpoint you choose.

### How does agentic-analytics score posts?

agentic-analytics adds engagement rate times 100 to lead rate times 500. Clicks are stored but excluded from this formula.

## License

MIT. Copyright Pooria Arab.
