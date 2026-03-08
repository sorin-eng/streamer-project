

## What's Missing for a Revenue-Generating Launch

After reviewing the entire codebase, the platform has solid core functionality but is missing the single most important thing: **a monetization model**. There is currently zero mechanism for Castreamino to generate income. Beyond that, several features are needed to make it feel complete and trustworthy enough for users to pay.

### Priority 1: Revenue Model (Platform Commission + Subscription)

The platform needs at least one revenue stream. The most natural fit for a marketplace like this is a **hybrid model**:

**A. Platform commission on deals** — Take a percentage (e.g. 5-10%) of every deal closed through the platform. This requires:
- A `platform_fee_pct` config or column on deals
- Automatic fee calculation when a deal moves to `active` state
- A fee display in the deal/contract UI so both parties see the breakdown
- An admin dashboard showing platform revenue

**B. Optional premium subscription** — Offer a paid tier for casinos (e.g. "Priority access to top streamers", "Featured placement in streamer feeds", "Advanced analytics"). This requires:
- Integration with a payment processor (Stripe or Polar)
- A pricing page on the landing site
- Subscription status check in the app
- Feature gating based on plan

**Recommendation:** Start with platform commission (simpler, no payment processor needed for MVP since crypto is the payment rail). Add subscriptions later.

### Priority 2: Onboarding Flow

After signup, users land on an empty dashboard with no guidance. New users will bounce immediately. Need:
- A **setup wizard** for streamers: connect platforms → fill stats → create first listing (step-by-step, not just dumping them on the dashboard)
- A **welcome screen** for casinos: brief intro → browse streamers CTA
- Profile completeness indicator on dashboard

### Priority 3: Streamer Detail Page

Casinos can browse streamers in a grid but cannot click into a **full profile page** to see all their stats, listings, bio, and platform links before contacting. This is critical for conversion. Need:
- `/streamers/:id` route with full streamer profile view
- All listings, stats, platform links, and a prominent "Contact" button

### Priority 4: Email Notifications (Transactional)

Users have no way to know when something happens unless they're staring at the dashboard. Need an edge function that sends emails for:
- New deal inquiry (streamer receives)
- New message in deal thread
- Deal state change (contract ready, deal activated)
- Application status change

### Priority 5: Mobile Responsiveness Pass

The StreamersPage filter bar, MessagesPage chat, and landing page grids need verification and fixes for mobile viewports.

### Priority 6: Notification Indicators (In-App)

Add unread badge on "My Deals" nav item for deals with unread messages. Simple query: deals where latest message sender is not the current user.

### Priority 7: TypeScript Cleanup

Remove all `as any` casts across DealsPage, MessagesPage, DashboardPage, ProfilePage. Define proper types for joined query results.

---

### Implementation Order (4 rounds):

**Round 1:** Platform commission model (migration for `platform_fee_pct`, fee calculation in deal UI, admin revenue tracking) + Streamer detail page (`/streamers/:id`)

**Round 2:** Onboarding wizard for streamers + welcome screen for casinos + profile completeness indicator

**Round 3:** Email notification edge function for key events + in-app notification badges

**Round 4:** Mobile responsiveness fixes + TypeScript cleanup + pricing/subscription page (Stripe or Polar integration)

This gets you to a launch-ready state where the platform can generate income from day one via deal commissions, with a clear upgrade path to subscription revenue.

