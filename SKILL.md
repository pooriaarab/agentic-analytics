---
name: agentic-analytics
description: Score social post results and recommend the next move. Keywords: analytics,social,metrics,agentic-suite,cli,mcp.
---

# agentic-analytics

Score social post results and recommend the next move.

## Use the SDK

```js
import { summarizeText, dispatchText } from "agentic-analytics";

summarizeText("some text");
await dispatchText("some text", { dryRun: true });
```

## Use the CLI

```sh
agentic-analytics summary --text "some text"
agentic-analytics dispatch --text "some text" --dry-run
```

## Use the MCP server

Start the server with `agentic-analytics mcp`. Call `summarize_text`
for stats, `dispatch_text` for routes, `get_cost_report` for costs.

## Rules

- Preview each route with dry run first.
- Report guard denials and adapter errors as failures.
- Read the cost report at the end.
