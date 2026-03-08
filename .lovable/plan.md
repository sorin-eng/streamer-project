

## Castreamino — Full Audit, Redesign, and Completion Plan

### Internal Audit Findings

**Critical Bugs (will break at runtime):**
1. All 4 edge functions use `supabase.auth.getClaims(token)` which does NOT exist — causes 500 errors on report-upload, compute-commissions, webhook-dispatch, and check-compliance
2. `supabase/config.toml` has NO `verify_jwt = false` entries — edge functions will fail JWT verification
3. The `check_user_compliance` and `log_compliance_event` DB functions were never created (migration proposed but empty) — all compliance code using `as any` RPCs will fail
4. `age_verifications`, `disclaimer_acceptances`, `compliance_events`, `geo_restrictions`, `webhook_endpoints`, `webhook_deliveries` tables are MISSING from the database
5. `profiles` table has NO `kyc_status` column — all KYC UI code fails silently
6. `deal_messages` not added to realtime publication — real-time messaging broken
7. `on_auth_user_created` trigger may not exist (conditional creation in migration) — new signups might not auto-create profiles

**UI/UX Issues:**
8. All branding says "BrokerHub" — needs rename to "Castreamino"
9. Landing page is generic — needs casino-streamer industry-specific design
10. No dark mode toggle (CSS supports it but no switch in UI)
11. `App.css` has leftover Vite boilerplate conflicting with styles
12. Console error: `PublicRoute` component can't receive refs — needs wrapping
13. Messages page mobile: deal thread sidebar hidden on mobile with no way to select deals
14. Contracts page requires `?deal=` query param — no way to browse all contracts without clicking from Deals
15. Campaign create dialog always defaults to `cpa` deal type — no selector
16. `mockData.ts` and `types/index.ts` still contain old mock types (unused but dead code)

**Missing Features (Industry Pain Points):**
Based on research into casino-streamer collaboration challenges:
- **Payment transparency** — streamers complain about unclear commission calculations
- **Content compliance tracking** — casinos need to verify streamers include responsible gambling disclaimers  
- **Dispute resolution** — no mechanism when parties disagree on performance metrics
- **Multi-platform tracking** — streamers operate across Twitch, Kick, YouTube but platform tracks none
- **Streamer discovery** — casinos struggle to find the right streamers (no browse/filter page)

---

### Implementation Plan

#### Phase 1: Database Migration (fixes items 3-6)
Create missing tables, functions, columns, and realtime:
- `age_verifications` with user_id UNIQUE, date_of_birth, min_age_required, jurisdiction
- `disclaimer_acceptances` with user_id, disclaimer_type, disclaimer_version, ip_address
- `compliance_events` with event_type, entity_type, entity_id, user_id, details, severity
- `geo_restrictions` with entity_type, entity_id, blocked_country, reason
- `webhook_endpoints` with organization_id, url, secret, events[], active
- `webhook_deliveries` with endpoint_id, event_type, payload, response_status, attempts, delivered_at, next_retry_at
- Add `kyc_status TEXT DEFAULT 'unverified'` to profiles
- Create `check_user_compliance(_user_id)` SECURITY DEFINER function
- Create `log_compliance_event(...)` SECURITY DEFINER function
- Add realtime for `deal_messages`
- RLS for all new tables

#### Phase 2: Fix Edge Functions (items 1-2)
All 4 functions: replace `getClaims(token)` with `getClaims(token)` (the correct API per context docs) and add `verify_jwt = false` to config.toml:
```toml
[functions.check-compliance]
verify_jwt = false
[functions.report-upload]  
verify_jwt = false
[functions.compute-commissions]
verify_jwt = false
[functions.webhook-dispatch]
verify_jwt = false
```

#### Phase 3: Full Rebrand to "Castreamino" + UI Redesign (items 8-11)
- New color scheme: Deep purple/violet primary (#7C3AED) with electric amber accent (#F59E0B) — evokes entertainment/streaming energy
- New brand icon: Replace Zap with a custom streaming/gaming icon approach (Play circle + signal)
- Update ALL references: BrokerHub → Castreamino across Index, LoginPage, SignupPage, DashboardLayout, LegalPages, ComplianceGate, NotFound
- Delete `App.css` (unused boilerplate)
- Enhanced landing page with:
  - Animated hero with industry stats ("$2.1B spent on streamer marketing in 2025")
  - Three-step flow section (Post → Match → Earn)
  - Social proof section (mock testimonials from casinos/streamers)
  - Feature grid: Compliance, Payments, Analytics, Messaging
  - CTA sections for each role
  - Footer with proper links
- Add dark mode as default (forced dark) since this is an entertainment/gaming platform
- Improve sidebar with role-specific icons and grouped sections

#### Phase 4: Fix All Broken Interactions (items 12-16)
- Fix `PublicRoute` ref warning — no functional issue but clean up
- Messages: Add mobile deal selector dropdown visible on small screens
- Contracts: Load all user contracts by default (no dealId required), with deal filter option
- Campaign creation: Add deal_type selector (CPA/RevShare/Hybrid/Flat Fee)
- Remove dead `mockData.ts` and `types/index.ts` mock types

#### Phase 5: Industry-Specific Features
- **Streamer Discovery Page** (`/streamers`): Browse verified streamers with filters (platform, geo, viewers, niche) — visible to casino_manager role
- **Deal type selector** in campaign creation
- **Commission breakdown panel** in deal detail — shows CPA/revshare calculation transparently
- **useContracts hook enhancement** — load without requiring dealId, show all user's contracts
- **Mobile-responsive deal selector** for messages

#### Phase 6: Polish for Launch
- Add loading skeletons on all data-fetching pages
- Ensure every button has proper disabled/loading states
- Update all legal pages with "Castreamino" branding
- 404 page with Castreamino branding
- Ensure seamless navigation — no blank pages, no dead-end states

---

### Files to Create/Edit

**New files:**
- `supabase/migrations/[timestamp]_compliance_tables.sql` (via migration tool)

**Edited files (all):**
- `supabase/config.toml` — add verify_jwt config
- `supabase/functions/check-compliance/index.ts` — fix auth
- `supabase/functions/compute-commissions/index.ts` — fix auth
- `supabase/functions/report-upload/index.ts` — fix auth
- `supabase/functions/webhook-dispatch/index.ts` — fix auth
- `src/index.css` — new color scheme (purple/amber)
- `src/pages/Index.tsx` — full landing page redesign
- `src/pages/LoginPage.tsx` — rebrand
- `src/pages/SignupPage.tsx` — rebrand + deal type selector
- `src/pages/DashboardPage.tsx` — rebrand
- `src/pages/CampaignsPage.tsx` — add deal_type selector to create dialog
- `src/pages/DealsPage.tsx` — already good, rebrand
- `src/pages/MessagesPage.tsx` — add mobile deal selector
- `src/pages/ContractPage.tsx` — load all contracts without dealId requirement
- `src/pages/ProfilePage.tsx` — rebrand
- `src/pages/ReportsPage.tsx` — rebrand
- `src/pages/AdminPages.tsx` — rebrand
- `src/pages/LegalPages.tsx` — rebrand
- `src/pages/NotFound.tsx` — rebrand
- `src/components/DashboardLayout.tsx` — new brand, icon, colors
- `src/components/ComplianceGate.tsx` — rebrand disclaimer text
- `src/components/ComplianceBypassBanner.tsx` — no changes needed
- `src/components/RouteGuard.tsx` — no changes needed
- `src/hooks/useCompliance.ts` — update disclaimer text references
- `src/hooks/useSupabaseData.ts` — fix useContracts to work without dealId
- `src/App.tsx` — remove App.css import if present
- Delete `src/App.css`
- Delete `src/data/mockData.ts`

---

### Expected Outcome

After implementation:
1. Sign up works → profile auto-created → compliance gates functional
2. Age gate + disclaimers appear and record properly
3. KYC upload → admin review → status update all work
4. Campaign CRUD with deal type selection
5. Application → Accept → Deal + Contract auto-creation
6. Real-time messaging between deal parties
7. Report upload + commission computation via working edge functions
8. All pages branded "Castreamino" with new purple/amber entertainment aesthetic
9. Mobile-responsive throughout
10. Zero blank pages, zero dead buttons

