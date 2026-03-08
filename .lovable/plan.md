

## Next Steps to Launch Readiness

After reviewing every page, hook, edge function, and database schema, here are the remaining gaps grouped into actionable steps:

### Step 1: Fix Deals page for direct-contact deals (no campaign)

The `DealsPage` and `MessagesPage` display `(deal.campaigns as any)?.title` which will be `null` for deals created via "Contact Streamer" (no campaign attached). These pages need fallback display text showing the streamer/org name instead when `campaign_id` is null. Same issue on `ContractPage` and `ReportsPage` deal selectors.

### Step 2: Restyle Login and Signup pages to match premium landing page

Login and Signup still use `bg-gradient-dark` class from the old purple/amber color scheme. The left panel gradients reference old HSL values (`hsl(263, 70%, 58%)`, `hsl(40, 96%, 53%)`). These need to match the current navy/gold theme from the landing page.

### Step 3: Add notification indicators for incoming deals (streamer side)

When a casino contacts a streamer, the streamer has no way to know. Add a simple unread indicator on the "My Deals" nav item — query deals in `negotiation` state that have no messages from the streamer yet.

### Step 4: Add "Pause/Activate" toggle for listings

Streamers can create and delete listings but cannot pause/unpause them. The `status` column supports `active`/`paused`/`closed` but the UI only shows delete. Add a toggle button to pause/reactivate listings.

### Step 5: Update `index.html` OG image and Twitter meta

The OG image still points to the default Lovable placeholder (`lovable.dev/opengraph-image-p98pqg.png`). The Twitter site is `@Lovable`. Both need updating for brand consistency.

### Step 6: Mobile responsiveness pass

The `StreamersPage` filter bar (platform buttons) will overflow on mobile. The `MessagesPage` chat area height calc may not work on all viewports. The landing page stat cards and feature grids need verification on small screens.

### Step 7: Add streamer stats editing on Profile page

Streamers can edit their bio, links, and wallet but cannot update `follower_count`, `avg_live_viewers`, `engagement_rate`, or `monthly_impressions`. These are displayed as read-only stats with no way to populate them. Add editable fields for these metrics.

### Step 8: Clean up TypeScript `as any` casts

Profile page uses `(profile as any)?.twitch_url` etc. because `types.ts` doesn't reflect the new columns. The generated types need regeneration, or we add proper type assertions. Also clean up `(d.campaigns as any)?.title` patterns across DealsPage, MessagesPage, ContractPage, ReportsPage by defining proper joined query types.

---

**Recommended priority order:** Steps 1, 2, 7, 4, 3, 5, 6, 8. Steps 1-4 are functional gaps; 5-8 are polish. All can be done in 2-3 implementation rounds.

