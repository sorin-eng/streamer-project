

## Plan: Complete BrokerHub to Full Use-Ready Status

### Current State Assessment

The app has a solid frontend and core DB schema (profiles, campaigns, deals, contracts, commissions, etc.), but several critical backend components are **missing from the database**:

**Missing from DB (migration was proposed but never applied):**
- `age_verifications` table
- `disclaimer_acceptances` table
- `compliance_events` table
- `geo_restrictions` table
- `webhook_endpoints` table
- `webhook_deliveries` table
- `kyc_status` column on `profiles`
- `check_user_compliance()` function
- `log_compliance_event()` function
- `documents` storage bucket

**Code issues:**
- All compliance-related code uses `as any` casts because types don't exist
- Edge functions use `supabase.auth.getClaims()` which doesn't exist in the JS client — should use `supabase.auth.getUser()`
- `supabase/config.toml` has no `verify_jwt = false` settings for edge functions
- `report_uploads` table has no UPDATE RLS policy (edge function can't update status)
- No `contracts` nav link in sidebar for casino/streamer roles
- Missing deal creation flow from accepted applications (casino can accept but no deal gets created)

---

### Implementation Plan

#### 1. Database Migration — Compliance Tables + Missing Columns
Create the missing compliance infrastructure:
- `age_verifications`, `disclaimer_acceptances`, `compliance_events`, `geo_restrictions`
- `webhook_endpoints`, `webhook_deliveries`
- Add `kyc_status TEXT DEFAULT 'unverified'` to `profiles`
- Create `check_user_compliance(_user_id)` and `log_compliance_event(...)` functions
- Create `documents` storage bucket with user-scoped RLS
- Add UPDATE policy on `report_uploads` for edge function use
- Add realtime publication for `deal_messages`
- RLS policies for all new tables

#### 2. Fix Edge Functions
- Replace `supabase.auth.getClaims(token)` with `supabase.auth.getUser()` in all 4 edge functions
- Add `verify_jwt = false` to `config.toml` for functions that validate auth manually
- Fix `report-upload` to use service role for status updates (since RLS blocks the user update)

#### 3. Wire Missing UI Flows
- **Accept Application → Create Deal**: When casino accepts an application, auto-create a deal + contract stub
- **Contracts nav link**: Add `/contracts` to sidebar navigation for casino_manager and streamer
- **Deal state transitions**: Add buttons to advance deal state (negotiation → contract_pending → active → completed)
- **Compute commissions button**: Add trigger in Reports page for casino managers

#### 4. Fix TypeScript — Remove `as any` Casts
Once the migration applies and types regenerate, update:
- `useCompliance.ts` — remove all `as any` casts on Supabase calls
- `AdminPages.tsx` — remove `as any` for `kyc_status` and `log_compliance_event`
- `ContractPage.tsx` — remove `as any` for `log_compliance_event`

#### 5. Polish for Production Readiness
- Add password validation (min 6 chars) on signup
- Add loading states for all mutation buttons
- Add error boundaries
- Ensure mobile responsive sidebar works
- Add "Contracts" link to sidebar nav

---

### Technical Details

**Migration SQL** will include ~200 lines covering:
- 6 new tables with proper RLS
- 2 new DB functions (security definer)
- 1 storage bucket
- ALTER TABLE profiles ADD COLUMN kyc_status
- Realtime publication for deal_messages

**Edge function fixes** — all 4 functions need the same auth pattern fix:
```typescript
// Before (broken):
const { data: claimsData } = await supabase.auth.getClaims(token);
const userId = claimsData.claims.sub;

// After (correct):
const { data: { user }, error } = await supabase.auth.getUser();
const userId = user.id;
```

**Config.toml** additions:
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

---

### Expected Outcome
After implementation, a user can:
1. Sign up as casino or streamer
2. Pass age gate and disclaimer acceptance
3. Upload KYC docs → admin reviews → verified
4. Casino creates campaigns → streamers apply
5. Casino accepts application → deal auto-created with contract
6. Parties negotiate via real-time messages
7. Both sign contract (KYC-gated)
8. Casino uploads performance reports
9. Commissions computed and tracked
10. Full audit trail of all actions

