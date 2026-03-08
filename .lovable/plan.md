

## Plan: Pivot to Streamer-First Listing Model + Crypto Payments

### Core Flow Change

**Current:** Casino posts campaign → Streamer applies → Deal
**New:** Streamer posts listing with pricing → Casino browses streamers → Casino reaches out → Deal

### Database Migration

**Add columns to `streamer_profiles`:**
- `twitch_url`, `kick_url`, `youtube_url` (platform links)
- `twitter_url`, `instagram_url`, `tiktok_url`, `discord_url` (social media)
- `wallet_address`, `preferred_crypto` (crypto payments: USDT, BTC, ETH)

**Create `streamer_listings` table:**
- id, user_id, title, description
- pricing_type: `fixed_per_stream` | `fixed_package` | `hourly` | `negotiable`
- price_amount (numeric), price_currency (text, default 'USDT')
- min_streams (integer), package_details (text)
- platforms (text array — which platforms they'll stream on for this listing)
- status: `active` | `paused` | `closed`
- created_at, updated_at
- RLS: anyone authenticated can SELECT active listings; streamer can CRUD own

### UI Changes

1. **Streamer Profile Page** — add platform link fields (Twitch, Kick, YouTube URLs), social media fields, crypto wallet address input
2. **New "My Listings" page** (`/listings`) — streamer creates/manages listings with title, description, pricing type, price in crypto, which platforms they'll stream on
3. **New "Browse Streamers" page** (`/streamers`) — casino-facing page to browse streamer profiles + their active listings, with filters (platform, viewers, geo, price range). Each card shows stats + active listing pricing. "Contact" button initiates a deal/message thread
4. **Dashboard updates** — Streamer dashboard shows "My Listings" stats + incoming inquiries. Casino dashboard shows "Browse Streamers" CTA instead of campaigns focus
5. **Navigation updates** — Streamer sidebar: add "My Listings". Casino sidebar: add "Browse Streamers" (prominent). Keep Campaigns as secondary feature
6. **Landing page** — update hero copy and "How It Works" steps to reflect: (1) Create Profile & List → (2) Get Discovered → (3) Get Paid in Crypto

### Hooks (useSupabaseData.ts)

- `useStreamerListings(userId?)` — fetch listings
- `useCreateListing()`, `useUpdateListing()` — CRUD
- `useBrowseStreamers(filters)` — paginated streamer browse with joined listing data
- `useInitiateContact()` — casino creates a deal + message thread from a streamer's listing

### Routes (App.tsx)

- `/listings` — streamer role, manage listings
- `/streamers` — casino_manager role, browse streamers

### Files Changed

- Migration SQL (new table + columns)
- `src/hooks/useSupabaseData.ts` — new hooks
- `src/pages/ProfilePage.tsx` — platform & social link fields, wallet address
- `src/pages/ListingsPage.tsx` — new file, streamer listing CRUD
- `src/pages/StreamersPage.tsx` — new file, casino browse page
- `src/pages/DashboardPage.tsx` — updated cards for new flow
- `src/pages/Index.tsx` — updated landing copy
- `src/components/DashboardLayout.tsx` — new nav items
- `src/App.tsx` — new routes

