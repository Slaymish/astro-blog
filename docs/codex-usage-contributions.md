# Codex usage contributions

The calculator currently uses illustrative NZD subscription prices, modelled short-window and weekly capacities, and a hypothetical NZ$7 per extra coding hour. No community data has been collected. It is not a statement of official Codex allowances.

## Intended contribution journey

1. A visitor opens the Codex skill source on GitHub and runs it explicitly through Codex.
2. The skill reads local Codex session records and produces one JSON file for manual inspection. It never submits data automatically.
3. The visitor uploads that JSON file to a future ingestion endpoint and can optionally associate a GitHub username.
4. The endpoint validates version, size and field allowlists, rejects identifying or raw transcript content, deduplicates session identifiers, and aggregates only accepted measurements.
5. The public dataset includes sample counts, time window, model and reasoning level, collection version, confidence intervals, and update time.

The skill and upload endpoint are **not implemented yet**. Do not imply that contributions are currently accepted.

## Proposed export contract (draft v1)

```json
{
  "schemaVersion": 1,
  "collectorVersion": "0.1.0",
  "sessions": [
    {
      "model": "gpt-6.1-sol",
      "reasoningEffort": "high",
      "durationSeconds": 2100,
      "inputTokens": 48000,
      "cachedInputTokens": 31000,
      "outputTokens": 7600
    }
  ]
}
```

Numbers above are illustrative. No paths, prompts, source code, filenames, usernames, device identifiers, project names or raw transcripts should be exported. Include only fields that can be reliably extracted from supported local records. Anonymity cannot be guaranteed simply by removing obvious identifiers. Public contributor acknowledgement must be opt-in.

## Statistical safeguards

Report observed samples by model and reasoning effort. Duration and token use describe consumption but do not establish subscription quotas. Independent observations of actual five-hour and weekly resets are required before treating limits as empirical. Prefer contributor-level bootstrap resampling to avoid falsely treating hundreds of sessions from one person as independent users. Publish uncertainty and effective contributor counts with every estimate.
