# Agentic analytics

Score social post results and recommend the next move.

`agentic-analytics` is a local, no-network analytics pack for your own brand accounts. It imports JSON or CSV performance metrics, scores posts, compares formats, and gives data-backed next moves. The SDK, CLI, and MCP server expose the same domain functions.

## Install and verify

```sh
npm install
npm run build
npm run typecheck
npm test
```

## Metrics input

JSON can be an array (or `{ "posts": [...] }`), and CSV must use these headers:

```json
[{"platform":"linkedin","hook":"Stop guessing","format":"carousel","impressions":1000,"likes":40,"comments":8,"shares":5,"clicks":30,"leads":4}]
```

```csv
platform,hook,format,impressions,likes,comments,shares,clicks,leads
linkedin,Stop guessing,carousel,1000,40,8,5,30,4
```

## CLI

```sh
node dist/cli.js ingest --file metrics.json
node dist/cli.js rank --file metrics.csv
node dist/cli.js recommend --file metrics.json
node dist/cli.js report --file metrics.json --markdown
node dist/cli.js costs
node dist/cli.js mcp
```

## Library

```ts
import { parseMetricsText, rankPosts, recommendNext, createReport, reportMarkdown } from "agentic-analytics";

const posts = parseMetricsText(metricsText);
const ranked = rankPosts(posts);
const nextMoves = recommendNext(ranked);
console.log(reportMarkdown(createReport(posts)));
```

`scorePost` computes engagement rate as `(likes + comments + shares) / impressions` and lead rate as `leads / impressions`. Scores prioritize lead rate while retaining engagement as a signal.

## MCP tools

- `ingest_metrics`
- `rank_posts`
- `recommend_next`
- `analytics_report`
- `get_cost_report`

All analytics tools are read-only and accept metrics as JSON or CSV text. No external network access is required.
