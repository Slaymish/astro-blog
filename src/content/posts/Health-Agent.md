---
title: "HealthAgent: Apple Health Data Ingestion and Insights"
description: "A Next.js app that ingests Apple Health exports, normalizes them to Postgres, and produces daily/weekly insights with a lightweight GCP pipeline."
pubDate: 2025-01-19
tags: ["health", "apple-health", "nextjs", "postgres", "gcp", "cloud-run", "prisma", "fastify", "llm", "neon", "ai"]
---

HealthAgent is my attempt to turn all the stats available in Apple Health into something I can actually read and act on. Instead of drowning in raw stats, I get a quick "what happened / what to do next" view.

## Why I built it

I'm very interested in improving my health, so I wanted a single place to see how nutrition, activity, and recovery connect. I track nutrition in Macrofactor on my iPhone, and my Apple Watch tracks workouts, heart rate, and activity. I could view these separately in Macrofactor or Apple Health, but I wanted to compare the trends side by side and decide which signals mattered.

Macrofactor automatically writes nutrition data to Apple Health, and Apple Watch workouts go there too. That made Apple Health the hub, so I set up a daily export to my own service using the iOS app Health Auto Export, which can post selected data to a REST API.

## What it does

- Ingests Apple Health Auto Export JSON and stores the raw file (local in dev, GCS in cloud).
- Normalises the data into Postgres and rolls it up into daily metrics.
- Presents trends and next actions in a Next.js UI, with an optional weekly insights pass (gated by `INSIGHTS_ENABLED`).
- Supports multi-user access via GitHub auth (NextAuth), with per-user ingest tokens and scoped data.
- It runs a daily pipeline and can automatically generate insights, which is why I call it an agent.

<img
  src="/images/posts/status_screenshot.png"
  alt="HealthAgent status summary screenshot"
  style="max-width: 720px; width: 100%; height: auto;"
/>


## What I am working on now

With everything normalised in the database (I use Neon since it is cheap and does not need to be always on), I can ask an LLM to surface insights: "Your sleep was down this week and sugar was up," or "Training volume increased while recovery dipped." The goal is to find correlations and surface them automatically, and that is the focus of my current HealthAgent iteration.

## CI + infrastructure

- Cloud Build runs Prisma migrations, builds/pushes the Fastify API Docker image, and deploys to Cloud Run.
- Secrets are managed in Secret Manager.
- Raw files live in a GCS bucket.
- The database is an external/serverless Postgres to keep costs low.
- Cloud Scheduler triggers `/api/pipeline/run` daily with `X-PIPELINE-TOKEN` and `X-USER-ID`.
- The frontend is deployed on Vercel.

If you want to have a look at the current iteration, it is live at https://health.hamishburke.dev. Feel free to sign in and try it.

Or check out the code on GitHub: https://github.com/Slaymish/HealthAgent
