# Streamer Project Checklist

_Last verified: April 14, 2026_

## How to use this file
This is the only project status tracker.

- `[x]` = done and should not be repeated
- `[ ]` = still open
- if something is partial, split it into done/open subtasks instead of lying about it

Strategy, scope, and sequencing live in `.lovable/plan.md`.
Do not create separate status or progress docs again.

## Current rule
Finish the product in mock/local mode before doing live Supabase, payments, email, webhooks, or analytics work.
Live integration findings below are parked until the local product is truly ready.

## Daily execution packs
Treat the long-term plan as day-sized work packets.
I only call a day **done** when every item in that packet is complete **and** the repo still passes validation.

### Day 1, finish the mock/local audit pass
Focus: remove ambiguity in the current product, close the remaining local-proof holes, and contain live leaks.

- [x] Move forgot/reset password pages off direct Supabase auth calls and onto the auth service seam
- [x] Guard mock mode from live realtime subscriptions in notifications/messages
- [x] Prove campaign creation and campaign-to-deals management flow in mock mode
- [x] Prove listings creation flow in mock mode
- [x] Audit every important route/page/button for intentional behavior
- [x] Audit every important form for validation, success feedback, and error feedback
- [x] Final audit for lingering direct/live coupling paths
- [x] Remove or contain out-of-phase live assumptions where they still leak into UX

Day-close proof:
- `npm test` ✅
- `npm run build` ✅

### Day 2, tighten the actual MVP workflow
Focus: make the product feel like one real casino ↔ streamer workflow instead of a pile of surfaces.

- [x] Reframe dashboards around the core workflow and next actions for each role
- [x] Reposition campaigns as optional intake instead of a parallel product
- [x] Reposition messages as deal-only communication tied to active partnerships
- [x] Trim sidebar/settings/workflow copy so the core path is visually primary
- [x] Reframe deals/contracts/reports copy around one continuous browse → deal → contract → report → commission path
- [x] Make contract creation and signing advance the workflow automatically instead of relying on manual state babysitting
- [x] Add stronger handoff actions between active deals, contract signing, messages, and reports
- [x] Decide which non-core pages/features stay in v1 and which get deferred
  - Keep `Deal Messages`, `Campaign Intake` / `Optional Campaigns`, `Profile`, and `Settings` in v1 as supporting tools, not primary workflow steps
  - Keep contracts and reports limited to deal states where those actions actually make sense
- [x] Run one more ruthless pass on any remaining non-core route actions that still distract from the MVP path

Day-close proof:
- `npm test` ✅ (62/62 passing on April 14, 2026)
- `npm run build` ✅

### Day 3, hardening and confidence pass
Focus: stop trusting happy-path demos and prove the product can survive real friction.

- [x] Improve mock-mode dev ergonomics outside the test harness
  - [x] Added mock-mode dev panel with seeded role shortcuts on the login route
  - [x] Added reset-to-seed action plus in-app role switching while staying inside local mock mode
- [x] Deep-proof age-gating behavior
  - [x] Reject impossible DOB inputs like `2026-02-30` instead of letting JS normalize them
  - [x] Use exact calendar cutoff math for the age-gate date picker instead of rough `365.25`-day subtraction
  - [x] Prove `ComplianceGate` actually blocks protected content until age verification and disclaimers are complete
  - [x] Keep protected content blocked when underage verification fails
- [x] Review and prove jurisdiction/compliance rules for gambling context
  - [x] Block direct inquiries when streamer audience hits casino restricted territories or has no overlap with accepted countries
  - [x] Block campaign applications when streamer audience misses target geography or includes restricted countries
  - [x] Add unit + mock-mode service/UI proof for allowed and blocked geo paths
- [x] Add end-to-end coverage for the main workflow
  - [x] Mock-mode contract → report → commission journey now covered in tests
  - [x] Mock-mode browse → inquiry → negotiation → contract → signatures → report → commission journey now covered on one deal
- [x] Run ugly edge-case pass across auth, deals, contracts, reports, and settings
  - [x] Require explicit cancellation reasons before a deal can be cancelled in UI or service code
  - [x] Reject malformed report CSV rows instead of silently converting garbage into zero-value events
  - [x] Reject inverted commission date ranges and bind report date labels to real inputs
  - [x] Reject blank contract durations and impossible revshare percentages before draft creation
  - [x] Trim auth inputs and reject blank display names instead of trusting whitespace garbage
  - [x] Trim blank wallet addresses to `null` instead of saving whitespace as payout data
- [x] Run final pre-live QA pass
  - [x] `npm test` passed with `84/84` tests on April 14, 2026
  - [x] `npm run build` passed on April 14, 2026
  - [x] QA sweep found no `TODO` / `FIXME` markers or direct Supabase calls left in pages/components/hooks outside the service seams

Day-close proof:
- `npm test` ✅ (`86/86` passing on April 14, 2026)
- `npm run build` ✅ (passed on April 14, 2026)

### Day 4, reopen live backend safely
Focus: move from mock-complete MVP to real backend behavior without breaking the clean local product.

- [ ] Apply and verify the `organization_members` RLS recursion fix for live casino auth
- [ ] Fix and verify live browse-streamers query / relationship behavior
- [ ] Prove live streamer signup → login → profile → listing path
- [ ] Prove live casino-manager signup/login resolves organization context correctly
- [ ] Prove live dashboard/read models load intentionally for all main roles
- [ ] Keep mock mode behavior intact while live mode is repaired

Day-close proof:
- `npm test`
- `npm run build`
- `VITE_DATA_MODE=supabase npm run build`
- live role smoke test notes captured in this checklist

### Day 5, make the live workflow transact like a real product
Focus: convert the core workflow from local proof into a functioning live SaaS path.

- [ ] Prove live browse → inquiry/application → deal creation works
- [ ] Prove live contract generation/signing state changes work
- [ ] Prove live performance report upload path works
- [ ] Prove live commission computation / visibility works
- [ ] Prove notifications / unread state behave intentionally in live mode
- [ ] Decide whether webhooks ship in v1 or stay hidden until hardened
- [ ] If webhooks ship, prove live webhook creation, delivery logging, and failure behavior

Day-close proof:
- `npm test`
- `npm run build`
- end-to-end live workflow smoke from one casino path and one streamer path

### Day 6, commercial and compliance readiness
Focus: make the app trustworthy enough to operate as a real SaaS, not just a functioning demo.

- [ ] Finalize age-gating and jurisdiction behavior for gambling context
- [ ] Remove or lock down any dev/compliance bypass that must not survive production
- [ ] Decide and implement the real payout/payment approach for v1
- [ ] Add/verify admin audit visibility for sensitive actions
- [ ] Add baseline product analytics / key funnel visibility
- [ ] Add error monitoring / operational logging path
- [ ] Write the minimum operator SOP for support, moderation, and incident recovery

Day-close proof:
- `npm test`
- `npm run build`
- production-readiness checklist reviewed against actual app behavior

### Day 7, deployment and launch readiness
Focus: finish the boring but critical SaaS work so launch does not become a clown show.

- [ ] Final deployment target decided and configured
- [ ] Environment variables, secrets, and callback URLs verified
- [ ] Database migrations and rollback plan verified
- [ ] Domain / auth redirect / storage / email / webhook URLs verified
- [ ] Backup / restore / basic recovery path documented
- [ ] Final cross-role QA pass completed in the deployed environment
- [ ] Launch checklist written for first pilot customers

Day-close proof:
- deployed build live
- final QA pass complete
- launch checklist complete

## Phase 1, foundation seam and mock proof
### Architecture seam
- [x] Define shared domain/service interfaces
- [x] Add mock seeded store / mock app-data service
- [x] Add service registry
- [x] Refactor auth onto the registry
- [x] Make mock mode the default when `VITE_DATA_MODE` is unset
- [x] Keep `npm test` passing
- [x] Keep `npm run build` passing

### Route / role proof already done
- [x] Prove public login route works in mock mode
- [x] Prove signup validation + confirmation flow works in mock mode
- [x] Prove profile completeness KYC CTA routes to `/profile` instead of the legal compliance page
- [x] Prove streamer `/dashboard` access in mock mode
- [x] Prove deal action buttons route intentionally into `/messages` and `/contracts`
- [x] Prove the deals page empty state renders intentionally for a user with zero deals instead of crashing
- [x] Prove casino-manager `/streamers` access in mock mode
- [x] Prove admin `/admin/verifications` access in mock mode
- [x] Prove streamer redirect away from casino-only `/streamers`
- [x] Prove streamer `/reports` access in mock mode

### Core mock journeys already done
- [x] Prove streamer onboarding → first listing
- [x] Prove casino inquiry → deal creation
- [x] Prove streamer contract signing flow

### Mock/local proof still open
- [x] Audit every important route/page/button for intentional behavior
- [x] Audit every important form for validation, success feedback, and error feedback
- [x] Prove listing creation validation + success flow in mock mode
- [x] Prove streamer profile update form in mock mode
- [x] Prove settings password validation feedback in mock mode
- [x] Prove settings notification toggle feedback + persistence in mock mode
- [x] Prove casino contract draft creation from deals flow in mock mode
- [x] Prove report upload / performance reporting flow in mock mode
- [x] Prove commission visibility / payout outcome flow in mock mode
- [x] Prove admin verification / moderation path in mock mode
- [x] Prove settings and webhook-related UX behaves intentionally in mock mode

## Phase 2, core app plumbing
### Done
- [x] Create service-backed auth + app-data layer
- [x] Keep mock and Supabase implementations behind the same seam
- [x] Move major app flows away from direct backend coupling
- [x] Add cleaner error extraction / surfacing helper
- [x] Improve app structure so routes/pages are less glued straight to backend calls
- [x] Contain deals/application read models so users only load their own org/user data in both mock and Supabase service paths

### Still open
- [x] Final audit for lingering direct/live coupling paths
- [x] Improve mock-mode dev ergonomics outside the test harness
- [x] Remove or contain out-of-phase live assumptions where they still leak into UX

## Phase 3, MVP product surface
### Surfaces already present
- [x] Landing page
- [x] Signup / login flow
- [x] Streamer dashboard / profile surface
- [x] Casino browse/campaign/deal surface exists
- [x] Contract surface exists
- [x] Messages surface exists
- [x] Reports / commissions surface exists
- [x] Admin panel exists

### Improvements already landed
- [x] Dashboard analytics / chart surfaces
- [x] Reports filtering, analytics, and CSV export
- [x] Deals overview cards, priority queue, and workflow progress
- [x] Onboarding checklist and stronger step gating
- [x] Profile completeness CTA improvements

### MVP tightening still open
- [ ] Reduce the product to one clean core workflow: browse → inquiry/application → deal → contract → report → commission
- [ ] Remove fake-feeling or low-value surface area that distracts from MVP
- [ ] Make each step in the core workflow feel complete in mock/local mode
- [x] Decide which non-core pages/features stay in v1 and which get deferred

## Phase 4, hardening
### Already started
- [x] Add initial compliance-related surfaces/hooks
- [x] Fix age-verification birthday edge case so users are not rounded up to legal age before their birthday
- [x] Add route-level lazy loading
- [x] Clean up Vite chunking
- [x] Split chart wrappers into lazy per-chart implementations
- [x] Reduce main entry bundle to about `87.8 KB raw / 25.2 KB gzip`
- [x] Remove the old `>500 KB` Vite warning

### Still open
- [x] Deep-proof age-gating behavior
- [x] Review and prove jurisdiction/compliance rules for gambling context
- [x] Add end-to-end coverage for the main workflow
- [x] Run ugly edge-case pass across auth, deals, contracts, reports, and settings
- [x] Run final pre-live QA pass

## Parked live integration findings
These are useful, but they are **not the next step**.
Resume them only after the mock/local gates above are satisfied.

- [x] Confirm `VITE_DATA_MODE=supabase npm run build` passes
- [x] Confirm read-only Supabase probe works
- [x] Prove real streamer signup/login/profile/listing path exists
- [x] Identify live casino auth blocker: recursive `organization_members` RLS (`42P17`)
- [x] Identify live browse-streamers query bug (`PGRST200` relationship issue)
- [x] Prepare local DB fix: `supabase/migrations/20260414144000_fix_org_member_rls_recursion.sql`
- [x] Prepare local frontend live-query fix in `src/core/services/supabase/supabaseAppDataService.ts`
- [x] Prepare clearer live error surfacing in campaign/streamer pages

## Current next moves
1. Finish **Day 2** completely.
2. Then finish **Day 3** completely.
3. Then finish **Day 4** through **Day 7** to get to full SaaS completion.

## Last verification snapshot
- `npm test` ✅ (`9` files, `55` tests passed on April 14, 2026)
- `npm run build` ✅
- `VITE_DATA_MODE=supabase npm run build` ✅ (diagnostic only, out of sequence)
