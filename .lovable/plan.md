

## Next Steps — Round 3: Email Notifications, TypeScript Cleanup, and Final Polish

Here's what remains to get Castreamino launch-ready:

### Step 1: Email Notification Edge Function

Create a `notify` edge function that sends transactional emails for key events:
- **New deal inquiry** — when a casino contacts a streamer via the marketplace
- **New message** — when a new message is posted in a deal thread
- **Deal state change** — when a deal moves to `contract_pending`, `active`, or `completed`
- **Application status change** — when an application is accepted/rejected

The function will use the Lovable AI model to generate email HTML, or use a simple HTML template approach. It will be invoked from the client after key mutations (deal creation, message send, state transition). It reads the recipient's email from `auth.users` via the service role client.

Since this is transactional email (not auth email), we need to check if there's a suitable approach. We'll create the edge function and use the LOVABLE_API_KEY or a simple SMTP/Resend integration.

### Step 2: TypeScript Cleanup

Replace all `as any` casts across 11 page files by:
- Updating `src/types/supabase-joins.ts` with missing interfaces (e.g. `CampaignWithOrg`, `StreamerProfileWithDisplay`)
- Casting query results to these types in `useSupabaseData.ts` hooks
- Removing `as any` from DealsPage, ContractPage, MessagesPage, CampaignsPage, StreamersPage, StreamerDetailPage, ListingsPage, ProfilePage, DashboardPage, ReportsPage

### Step 3: Mobile Responsiveness Final Pass

- Landing page: verify stats/features grid stacking on `sm:` breakpoints
- StreamersPage: already has `overflow-x-auto` — verify it works
- MessagesPage: already uses `100dvh` — verify chat input stays visible
- DashboardLayout sidebar: ensure it collapses properly on mobile

### Step 4: Error & Loading States Polish

- Add proper skeleton loaders on data-heavy pages (Deals, Messages, Streamers)
- Add error boundary fallbacks with retry buttons
- Add toast notifications for all mutation failures consistently

### Step 5: SEO & Landing Page Final Touch

- Add structured data (JSON-LD) for the landing page
- Add a `/pricing` or "How It Works" section explaining the 8% commission model to build trust
- Add footer links to Terms and Privacy pages (already exist at `/legal/*`)

---

**Implementation order:** Steps 1 → 2 → 3 → 4 → 5. Steps 1-2 are the highest value. Steps 3-5 are polish for launch confidence.

