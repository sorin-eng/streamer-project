# Casino Streamer Project Plan

_Last updated: April 15, 2026_

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

## Product thesis
This cannot just be a marketplace that introduces casinos and streamers once.
If the product only helps them meet, they will go off-platform for the second deal.

The real product is a lightweight **partnership operating system** or **managed deal room** for recurring casino ↔ creator relationships.
Discovery is only the front door.
The sticky value has to live in the work that happens after the intro:
- terms and contract flow
- promo asset approvals
- delivery proof and performance reporting
- commission and payout visibility
- trust / compliance / dispute memory
- repeat-deal renewals

If the platform is easier, safer, and more legible than Telegram + spreadsheets + vibes, it can keep the relationship.
If it is only a directory, it gets bypassed.

## Core decision
- Lovable is for UI acceleration and shell generation only.
- GitHub/local repo is the real home of the app.
- The MVP must be proven end to end in mock/local mode before live integrations matter.
- If the project touches gambling, money, age restrictions, or geo restrictions, compliance is part of the product, not optional garnish.
- v1 is allowed to be concierge-heavy behind the scenes. Manual matching, manual payout ops, and manual exception handling are fine if the user-facing workflow is clear.

## Non-negotiable sequencing
**Finish the product locally before connecting live systems.**

Do not deepen live Supabase, payments, email, webhooks, or analytics until the app works end to end in mock/local mode.
Use fake/mock/local data first so flows can be proven cleanly.
Only after the product behaves correctly do we connect live services.

Also: do not reopen live backend work just because the first workflow technically works.
The mock/local product should first grow the sticky post-intro operating layer that makes repeat usage rational.

## Long-term MVP shape
Build only what is needed for the first real casino ↔ streamer workflow and the first real moat.

### Core workflow
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

### Sticky operating layer
- unified deal room / timeline per partnership
- promo asset approval tracker
- payout ledger + reconciliation view
- trust / compliance / dispute history
- repeat-deal / renewal flow

Everything else is secondary.
If a feature does not strengthen the core workflow or the sticky operating layer, it is probably noise.

## One-man-team model
This product should be built like an operator-led system, not a giant venture-backed marketplace cosplay.

### Sorin owns
- workflow truth
- product taste
- customer pain
- partnership sourcing
- manual concierge work when needed
- business decisions and scope calls

### John owns
- product translation
- technical planning
- code changes
- docs and checklists
- QA / validation
- identifying weak spots, fake complexity, and risk

### What stays manual in v1 if needed
- matching the first partners
- onboarding handholding
- payout execution outside the app
- compliance review for edge cases
- dispute resolution and exceptions

That is fine. The goal is not “fully automated on day one.”
The goal is “software meaningfully improves the workflow before automation is deepened.”

## Workflow
1. Define one painful workflow clearly
2. Use Lovable to generate UI speed-first
3. Keep GitHub/local repo authoritative
4. Build real logic through service seams and tests
5. Prove the core workflow locally in mock mode
6. Add the sticky post-intro operating layer in mock mode
7. Harden UX, validation, permissions, and compliance
8. Only then reconnect live backend/services
9. Prove the same workflow in live mode
10. Add commercial, compliance, analytics, and ops readiness
11. Only then deploy and validate live behavior as a real SaaS

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

## Phase 3, core workflow MVP
Build the surface needed for the core workflow, not a fake “big startup” shell.
The key path is:
1. casino finds streamer
2. streamer presents profile/listing
3. inquiry/application is created
4. deal is created and tracked
5. contract is signed
6. performance is reported
7. commission outcome is visible

The purpose of this phase is not just to show that one deal can happen.
It is to make the basic path feel coherent, legible, and worth using.

## Phase 4, sticky partnership OS layer
### Goal
Make the second and third deal easier to run on-platform than off-platform.

### Core deliverables
- a unified deal room / timeline for every partnership
- promo asset approval workflow tied to each deal
- payout ledger that explains expected, approved, pending, and paid states
- trust/history layer that compounds information over time
- repeat-deal / renewal mechanics that prefill known-good relationships

### Success condition
After one successful collaboration, both sides should feel friction when trying to leave the platform because the records, approvals, payout state, and relationship memory live here.

## Phase 5, hardening
- compliance checks
- age gating
- jurisdiction rules
- validation and error handling
- permissions and visibility boundaries
- end-to-end testing
- ugly edge cleanup before feature expansion

## Phase 6, live backend activation
Only begins after the mock/local MVP and sticky layer are genuinely complete.

- repair live auth / org-context blockers
- fix live query / relationship assumptions
- prove live role entry paths (streamer, casino manager, admin)
- keep mock mode intact while live mode is repaired

## Phase 7, live workflow completion
- prove live browse / discovery
- prove live inquiry or application creation
- prove live deal creation and progression
- prove live contract generation / signing state changes
- prove live asset approval / delivery proof flow
- prove live report upload and commission visibility
- prove live payout-status visibility
- decide what ships in v1 for notifications and webhooks

## Phase 8, SaaS readiness
- payment / payout path for v1
- production-safe compliance posture
- admin auditability
- analytics / funnel visibility
- logging / monitoring / error tracking
- support / moderation / recovery SOPs

## Phase 9, deployment and launch
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
- discovery is not the moat, workflow is
- keep the repo clean and scoped
- status belongs in `CHECKLIST.md`, not in random handoff files

## Short version
- Lovable = speed
- GitHub = truth
- mock/local = first proof
- sticky deal-room layer = moat
- live integrations = later
- deployment = after proof
- keep it small, real, and shippable
