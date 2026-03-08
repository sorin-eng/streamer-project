

## Round 4: Notification Bell, Skeleton Loaders, and Final Polish

What's been completed so far:
- Round 1: Platform commission model + streamer detail pages
- Round 2: Onboarding wizard + notification badges + mobile fixes + TypeScript joins
- Round 3: Notify edge function + landing page pricing/SEO

What remains:

### Step 1: Notification Bell Dropdown
Add a bell icon to the dashboard header (in `DashboardLayout.tsx`) that:
- Queries the `notifications` table for unread count
- Shows a red badge with count
- Opens a popover/dropdown listing recent notifications with title, body, and timestamp
- Marks notifications as read on click
- Links to the relevant entity (deal, campaign) when clicked

### Step 2: Skeleton Loaders on Key Pages
A `PageLoader` component already exists in `EmptyState.tsx`. Wire it into:
- **DealsPage** — show skeleton cards while deals load
- **StreamersPage** — show skeleton grid while profiles load
- **MessagesPage** — show skeleton for message list and chat area
- **CampaignsPage** — show skeleton cards while campaigns load

Replace any raw "Loading..." text or missing loading states with the `PageLoader` or page-specific skeletons.

### Step 3: Remaining `as any` Cleanup
~108 `as any` casts remain across 3 files:
- **`useCompliance.ts`** — casts on `supabase.rpc()` and `supabase.from()` calls (these are likely due to missing RPC type definitions; fix by adding proper RPC overloads or accepting them as necessary for custom RPCs)
- **`AdminPages.tsx`** — casts on joined profile data; replace with `VerificationDocWithProfile`, `ProfileWithRole`, `AuditLogWithProfile` types from `supabase-joins.ts`

### Step 4: ErrorBoundary Integration
An `ErrorBoundary` component exists but isn't used in `App.tsx`. Wrap the main routes with it so unhandled errors show a recovery UI instead of a white screen.

### Step 5: Final Mobile & UX Pass
- Verify landing page responsive grids on small screens
- Ensure notification bell works on mobile
- Test onboarding wizard on narrow viewports

---

**Technical details:**

The notification bell will use a Supabase realtime subscription on the `notifications` table (already has realtime-compatible RLS) for live updates. The dropdown will use Radix `Popover` which is already installed.

For skeleton loaders, each page will check `isLoading` from its `useQuery` hook and render `PageLoader` or a custom skeleton layout.

The ErrorBoundary wrap goes around `<Routes>` in `App.tsx`.

