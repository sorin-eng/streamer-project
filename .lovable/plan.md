

## Gap Analysis: What's Missing Until Full SaaS Completion

After auditing the full codebase, here is a prioritized breakdown of what remains.

---

### CRITICAL (Must-Have for Launch)

**1. Email Verification is Disabled / Not Enforced**
Signup calls `supabase.auth.signUp()` but there is no check that users confirm their email before accessing the platform. Users land directly on the dashboard. Need to either enable email confirmation flow with a "check your inbox" screen, or explicitly auto-confirm if that is the intent.

**2. No Stripe / Payment Integration**
The platform charges an 8% fee on deals but has zero payment infrastructure. There is no way to actually collect the platform fee, process streamer payouts, or handle invoicing. This is the single biggest gap for a revenue-generating SaaS.

**3. No File Upload for Reports**
The Reports page has a CSV text area but no actual file upload to storage. Casinos paste raw CSV text — there is no drag-and-drop file upload, no storage bucket for report files, and the `file_url` column on `report_uploads` is never populated.

**4. No Contract Generation**
The Contract page displays contracts but there is no UI or logic to *create* a contract. When a deal moves to `contract_pending`, nothing auto-generates a contract record. Casinos have no way to draft contract terms.

---

### HIGH (Expected for Production SaaS)

**5. No Avatar Upload**
Profile pages reference `avatar_url` but there is no file upload UI. Users cannot set a profile picture.

**6. No Deal State Transition Validation on Client**
`validate_deal_transition` RPC exists in the database but is never called from the client. Deal state changes happen without checking if the transition is valid.

**7. No Admin Role Management**
Admin can view users but cannot assign/change roles, suspend accounts, or manage organizations.

**8. No Webhook Configuration UI**
`webhook_endpoints` and `webhook_deliveries` tables exist, and a `webhook-dispatch` edge function is deployed, but there is no UI for casinos to register webhook endpoints.

**9. Notification Preferences Not Persisted**
The Settings page has an email notification toggle, but it is local state only — the preference is not saved to the database.

---

### MEDIUM (Polish for Competitive SaaS)

**10. No Realtime Chat**
Messages use polling (`refetchInterval: 5000`) instead of Supabase Realtime subscriptions. Functional but not instant.

**11. No Search/Filter on Key Pages**
Deals, Messages, and Admin pages have no search or filter controls.

**12. No Pagination**
All list queries fetch everything with no pagination. Will break with scale (>1000 row limit).

**13. No Email Notifications**
The `notify` edge function creates in-app notifications but sends no emails. No SMTP/Resend integration.

**14. No Password Change UI**
No way for logged-in users to change their password from the Settings page.

---

### Implementation Plan

| Step | What | Effort |
|------|-------|--------|
| 1 | **Stripe integration** — enable Stripe, create checkout for platform fees, add payout tracking | Large |
| 2 | **Contract auto-generation** — create contract record when deal enters `contract_pending`, add terms builder UI | Medium |
| 3 | **Email confirmation flow** — add "check your inbox" screen, handle unconfirmed state | Small |
| 4 | **File upload for reports & avatars** — create storage bucket, add upload UI to Profile and Reports | Medium |
| 5 | **Deal transition validation** — call `validate_deal_transition` RPC before state changes | Small |
| 6 | **Admin user management** — role change, account suspend, org management | Medium |
| 7 | **Realtime chat** — replace polling with Supabase Realtime channel | Small |
| 8 | **Pagination** — add cursor/offset pagination to Deals, Campaigns, Streamers, Admin lists | Medium |
| 9 | **Password change & notification prefs** — persist to DB, add password update form | Small |

Steps 1-4 are essential for a functioning revenue-generating SaaS. Steps 5-9 are production hardening.

