

## Deep Analysis: Castreamino vs Airbnb Booking Flow + Anti-Disintermediation + Hero Update

### Part 1: Airbnb Flow Comparison

Airbnb's core loop: **Discover → View → Request → Pay → Confirm → Experience → Review**

```text
AIRBNB                          CASTREAMINO (Current)
──────────────────────────────── ────────────────────────────────
Browse listings (search/filter)  Browse streamers (search/filter) ✅
View listing detail              Streamer detail page             ✅
Request to book                  "Contact Streamer" dialog        ✅
PAYMENT HELD IN ESCROW           ❌ No payment at all
Host accepts / declines          Deal negotiation state           ✅
Contract / Terms shown           Contract builder + signing       ✅
Experience happens               Stream happens (active deal)     ✅
Review & Rating                  ❌ No review system
Payout released after stay       ❌ No escrow/payout release
Dispute / Resolution center      Dispute state exists             ✅ (basic)
```

**Critical Gaps:**
1. No payment escrow — nothing enforces on-platform transactions
2. No review/rating system — no reputation incentive to stay on-platform
3. No "Request to Book" confirmation step — casino contacts streamer and a deal is instantly created without streamer acceptance
4. Streamer social links fully exposed — users can DM directly off-platform

---

### Part 2: Anti-Disintermediation Strategy (Preventing Fee Avoidance)

**Current problem:** Streamer profiles expose Twitch, Kick, YouTube, Twitter, Instagram, TikTok, and Discord URLs directly on the browse page and detail page. A casino rep can simply copy the Discord link and negotiate privately, bypassing the 8% fee entirely.

**Airbnb's approach:** Hide exact address until booking is confirmed and paid. Penalize off-platform communication. Build trust through reviews, insurance, and dispute resolution that only work on-platform.

**Recommended fixes (in priority order):**

| # | Fix | Impact |
|---|-----|--------|
| 1 | **Hide social links until deal is active** — Show platforms as badges ("Twitch", "Kick") but mask the actual URLs. Only reveal full links after a deal reaches `active` state (contract signed). | Blocks the #1 bypass vector |
| 2 | **Add review/rating system** — After deal completion, both parties rate each other (1-5 stars + text). Display average rating on streamer cards. No reviews = no reputation = no reason to use platform. | Creates lock-in via reputation |
| 3 | **Streamer must accept contact requests** — Currently `useInitiateContact` instantly creates a deal. Add an `inquiry` state before `negotiation` where the streamer must accept before a deal thread opens. | Mirrors Airbnb's request flow |
| 4 | **Message content filtering** — Scan messages for email addresses, phone numbers, Discord handles, Telegram links. Flag and warn (not block) when detected. Log to compliance_events. | Deters sharing contact info in chat |
| 5 | **Value proposition beyond escrow** — Contract builder, compliance audit trail, commission tracking, dispute resolution — these only work on-platform. Emphasize this in the UI. | Soft lock-in |

---

### Part 3: Hero Stats Update

Update the three stat values in `src/pages/Index.tsx`:
- `$120M+` → `$5M+` (Streamer Marketing Spend)
- `850+` → `100+` (Active Casino Streamers)  
- `28M+` → `7M+` (Monthly Gambling Stream Views)

---

### Implementation Plan (6 Steps)

**Step 1: Update hero stats** — Change the three values in `Index.tsx`.

**Step 2: Hide social links until deal is active** — In `StreamersPage.tsx` and `StreamerDetailPage.tsx`, remove the direct `<a href>` links to Twitch/Kick/YouTube/Twitter/TikTok/Instagram/Discord. Replace with platform name badges only (no URLs). Create a helper component `LockedLink` that shows a lock icon and tooltip "Available after deal activation". In `StreamerDetailPage`, keep the links section but show masked versions. Only reveal actual URLs on the deal detail or messages page once the deal state is `active` or `completed`.

**Step 3: Add inquiry state before negotiation** — Update `useInitiateContact` to create deals with state `inquiry` instead of `negotiation`. Add a DB migration to insert a new `deal_state_transition` row: `inquiry → negotiation` (allowed by streamer). On the streamer's Deals page, show "Accept Inquiry" / "Decline Inquiry" buttons for deals in `inquiry` state. Only when accepted does the deal move to `negotiation` and the message thread becomes fully active.

**Step 4: Add review/rating system** — Create a `reviews` table with columns: `id`, `deal_id`, `reviewer_id`, `reviewee_id`, `rating` (1-5), `comment`, `created_at`. Add RLS policies. On `DealsPage`, when a deal is `completed`, show a "Leave Review" button that opens a dialog with star rating + text. Display average rating on streamer cards in `StreamersPage` and `StreamerDetailPage`.

**Step 5: Message content filtering** — In the `useSendMessage` mutation, before inserting, run a regex check for patterns like email addresses, phone numbers, discord.gg links, t.me links, and @handles. If detected, still send the message but log a compliance event via `log_compliance_event` with severity `warning`. Show a toast warning to the sender: "Sharing contact information off-platform may violate our terms."

**Step 6: DB migration** — Create the `reviews` table, add the `inquiry` deal state and transition, seed the new state transition row.

### Database Changes Required
1. `INSERT INTO deal_states (name, sort_order) VALUES ('inquiry', -1)`
2. `INSERT INTO deal_state_transitions (from_state, to_state, allowed_roles) VALUES ('inquiry', 'negotiation', '{streamer}'), ('inquiry', 'cancelled', '{casino_manager,streamer,admin}')`
3. New `reviews` table with RLS (deal participants can insert their own review, all authenticated can read)

### Files to Modify
- `src/pages/Index.tsx` — hero stats
- `src/pages/StreamersPage.tsx` — hide social URLs
- `src/pages/StreamerDetailPage.tsx` — hide social URLs
- `src/hooks/useSupabaseData.ts` — update `useInitiateContact` state, add review hooks
- `src/pages/DealsPage.tsx` — inquiry accept/decline, review button
- `src/components/SearchPagination.tsx` or new `StarRating.tsx` component
- Migration SQL for reviews table + inquiry state

