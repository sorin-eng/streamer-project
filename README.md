# Streamer Project

Casino ↔ streamer marketplace MVP, built as a real repo-driven app instead of a Lovable-only demo.

## Canonical docs
Use only these two project-management docs:
- `.lovable/plan.md` — long-term plan, scope, sequencing, guardrails
- `CHECKLIST.md` — execution checklist and done/open state

Do not create separate `CURRENT_STATUS.md`, `PROGRESS.md`, or other handoff/status files again.
Status lives in `CHECKLIST.md`.

## Current build rule
Finish the product in mock/local mode before connecting live Supabase, payments, email, webhooks, or analytics.

## Stack
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (parked for deeper live work until the checklist allows it)

## Local development
```sh
npm i
npm run dev
npm test
npm run build
```

## Data mode
- default mode: mock/local
- Supabase mode exists for later live validation, not for early proof of completion

## Repo rule
Lovable can help generate UI, but the repo is the source of truth.
If the repo and Lovable disagree, trust the repo.
