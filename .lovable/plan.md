# Casino Streamer Project Plan

_Last updated: April 14, 2026_

## Canonical project docs
Use only these two docs for project management:
- `.lovable/plan.md` = long-term plan, scope, sequencing, guardrails
- `CHECKLIST.md` = execution checklist and done/open state

Do not create `CURRENT_STATUS.md`, `PROGRESS.md`, or other side-status docs again.
If something is done, mark it in `CHECKLIST.md`.
If strategy changes, update this file.

## Big picture
Build the casino ↔ streamer SaaS as a real repo-driven MVP, not a Lovable-only demo.
Use Lovable for speed, GitHub as source of truth, and coding sessions for the real build.
Keep the scope tight enough that this becomes a launchable product instead of a glitter-covered mess.

## Core decision
- Lovable is for UI acceleration and shell generation only.
- GitHub/local repo is the real home of the app.
- The MVP must be proven end to end in mock/local mode before live integrations matter.
- If the project touches gambling, money, age restrictions, or geo restrictions, compliance is part of the product, not optional garnish.

## Non-negotiable sequencing
**Finish the product locally before connecting live systems.**

Do not deepen live Supabase, payments, email, webhooks, or analytics until the app works end to end in mock/local mode.
Use fake/mock/local data first so flows can be proven cleanly.
Only after the product behaves correctly do we connect live services.

## Long-term MVP shape
Build only what is needed for the first real casino ↔ streamer workflow:
- landing page
- signup/login
- streamer profile/dashboard
- casino browse / discovery surface
- inquiry or application seam
- deal creation / deal tracking
- contract signing step
- performance reporting step
- commission visibility
- admin review / moderation surface

Everything else is secondary.
If a feature does not strengthen that path, it is probably noise.

## Workflow
1. Plan the MVP clearly
2. Use Lovable to generate UI speed-first
3. Keep GitHub/local repo authoritative
4. Build real logic through service seams and tests
5. Prove flows locally in mock mode
6. Harden UX, validation, and compliance
7. Only then reconnect live backend/services
8. Prove the same workflow in live mode
9. Add commercial, compliance, analytics, and ops readiness
10. Only then deploy and validate live behavior as a real SaaS

## Phase 1, foundation seam
### Goal
Make the platform feel real end to end with fake/local data before live integrations.

### Must work
- every route works
- every important button does something intentional
- every important form validates properly
- every important action has success and error feedback
- every role flow works end to end
- every page has real copy, states, and logic
- fake/mock/local backend is enough to simulate the real system cleanly

### Foundation work
- define shared service interfaces
- add a mock seeded store
- add a service registry
- refactor auth onto the registry
- keep the app typechecking/building clean
- avoid dependency churn unless it is genuinely required

## Phase 2, core app plumbing
- finish the service-backed data layer
- replace direct backend coupling with clean service access
- wire the main app flows through the registry
- make mock mode useful for fast dev and testing
- continue separating auth/data concerns from UI concerns

## Phase 3, MVP product surface
Build the surface needed for the core workflow, not a fake “big startup” shell.
The key path is:
1. casino finds streamer
2. streamer presents profile/listing
3. inquiry/application is created
4. deal is created and tracked
5. contract is signed
6. performance is reported
7. commission outcome is visible

## Phase 4, hardening
- compliance checks
- age gating
- jurisdiction rules
- validation and error handling
- end-to-end testing
- ugly edge cleanup before feature expansion

## Phase 5, live backend activation
Only begins after the mock/local MVP is genuinely complete.

- repair live auth / org-context blockers
- fix live query / relationship assumptions
- prove live role entry paths (streamer, casino manager, admin)
- keep mock mode intact while live mode is repaired

## Phase 6, live workflow completion
- prove live browse / discovery
- prove inquiry or application creation
- prove deal creation and progression
- prove contract generation / signing state changes
- prove report upload and commission visibility
- decide what ships in v1 for notifications and webhooks

## Phase 7, SaaS readiness
- payment / payout path for v1
- production-safe compliance posture
- admin auditability
- analytics / funnel visibility
- logging / monitoring / error tracking
- support / moderation / recovery SOPs

## Phase 8, deployment and launch
- environment / secrets / callback correctness
- migrations and rollback plan
- deployment target and domain setup
- storage / email / webhook endpoint validation
- deployed-environment QA
- pilot launch checklist

## Execution model
### Primary builder
Persistent repo-driven coding workflow for:
- code changes
- architecture cleanup
- route-by-route fixes
- state management cleanup
- component logic
- mock data layer
- test scaffolding
- QA checklist execution

### Lovable is UI accelerator only
- landing page polish
- page layout generation
- visual cleanup
- component scaffolding
- copy placement

### Strategy / PM use
Use planning prompts and coding sessions for:
- PRDs
- policy drafts
- onboarding logic
- pricing ideas
- role flows
- build prompts

## Rules / guardrails
- do not build everything inside Lovable forever
- do not overcomplicate v1
- do not start with 25 features
- do not ignore compliance if gambling/money is involved
- do not pretend flaky work is done
- keep the repo clean and scoped
- status belongs in `CHECKLIST.md`, not in random handoff files

## Short version
- Lovable = speed
- GitHub = truth
- mock/local = first proof
- live integrations = later
- deployment = after proof
- keep it small, real, and shippable
