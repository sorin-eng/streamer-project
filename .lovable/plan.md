

## Next Steps — Round 2: Onboarding, Notifications, Mobile, and Polish

Based on the current state of the codebase, here's what remains from the plan:

### Step 1: Streamer Onboarding Wizard
New users land on an empty dashboard with zero guidance. Create an `OnboardingWizard` component shown on first login (when streamer has no listings and empty profile). Three steps:
1. **Connect Platforms** — select Twitch/Kick/YouTube, paste URLs
2. **Fill Stats** — follower count, avg viewers, engagement rate
3. **Create First Listing** — title, pricing type, price

Detect "needs onboarding" by checking if `streamer_profiles.bio` is null and `streamer_listings` count is 0. Show wizard overlay on the Dashboard page.

For casinos, show a simpler welcome card with "Browse Streamers" CTA when they have zero campaigns and zero deals.

### Step 2: In-App Notification Badges
Add an unread indicator (red dot) on the "My Deals" sidebar nav item for streamers. Query: deals where `state = 'negotiation'` and the latest `deal_messages` sender is not the current user. Create a `useUnreadDeals` hook in `useSupabaseData.ts` and render the badge in `DashboardLayout.tsx`.

### Step 3: Mobile Responsiveness Pass
- **StreamersPage**: Wrap platform filter buttons in a horizontal scroll container with `overflow-x-auto flex-nowrap`
- **MessagesPage**: Fix chat area height on mobile (use `h-[calc(100dvh-...)]` with dynamic viewport units)
- **Landing page grids**: Ensure stats and feature cards stack properly on `sm:` breakpoints

### Step 4: TypeScript Cleanup
Define proper types for joined query results instead of `as any` casts:
- Create a `types/supabase-joins.ts` with interfaces like `DealWithRelations`, `StreamerWithProfile`
- Update `DealsPage`, `MessagesPage`, `ContractPage`, `ReportsPage`, `DashboardPage`, `StreamersPage` to use these types
- Replace all `(x as any)?.field` patterns

### Step 5: Profile Completeness Indicator
Add a progress bar on the streamer dashboard showing profile completeness (bio filled, platforms connected, stats entered, at least one listing, KYC submitted). This encourages users to complete setup even if they skip the wizard.

---

**Implementation order**: Steps 1 → 2 → 3 → 4 → 5. Steps 1-2 are functional, 3-5 are polish. Can be done in 1-2 rounds.

