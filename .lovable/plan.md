

## Deployment Readiness Audit

After thoroughly reviewing every page, component, hook, edge function, database schema, and RLS policy, here is what's missing or needs fixing before production deployment:

### Critical Issues

1. **Disable compliance bypass in production build**
   - `complianceBypass.ts` checks for `.lovable.app` hostname, but the published URL will also be on `.lovable.app`. The bypass correctly blocks production, but if you deploy to a custom domain it would re-enable. Need to ensure `.env.development` `VITE_COMPLIANCE_BYPASS_MODE=true` is NOT present in production `.env`. Currently `.env` does not have it — this is fine, but we should remove `.env.development` or ensure the build ignores it.

2. **Email confirmation not enabled**
   - Signup currently redirects straight to `/dashboard` without email verification. Users get auto-logged-in. Need to either enable auto-confirm (if the user wants it) or add a "check your email" flow after signup. Currently there's no handling for unconfirmed users.

3. **"Contact Streamer" flow is missing**
   - The Browse Streamers page shows streamers and their listings but has **no way for a casino to contact a streamer**. There's no "Contact" or "Initiate Deal" button. This is a core marketplace flow that's completely missing.

4. **Streamer → Casino deal initiation from Browse Campaigns also incomplete**
   - The `deals` table requires a `campaign_id` (NOT NULL), so the new listing-first flow (casino contacts streamer without a campaign) won't work with the current schema. Need to make `campaign_id` nullable or create a different flow.

### Functional Gaps

5. **No password reset / forgot password flow**
   - Login page has no "Forgot password?" link. Essential for production.

6. **Profile page uses `as any` casts for new streamer_profile fields**
   - The `types.ts` file hasn't been regenerated to include the new columns (`twitch_url`, `kick_url`, etc.). While it works at runtime, TypeScript safety is lost.

7. **Listing form doesn't populate pricing_type in Select on edit**
   - The `Select` component with `name="pricing_type"` uses `defaultValue` but Radix Select doesn't work with native form `name` attribute. The value won't be submitted with the form via `FormData`. Same issue with `price_currency`.

8. **Console warnings about refs on function components**
   - `PublicRoute` and page components are getting ref warnings from React Router. Minor but should be cleaned up.

9. **No loading/error boundaries**
   - No React error boundary wrapping the app. An unhandled error crashes the entire UI.

10. **Edge functions use `supabase.auth.getClaims()` which may not exist**
    - `getClaims` is not a standard Supabase JS method. Should use `supabase.auth.getUser()` instead.

### UX Polish

11. **No mobile responsiveness testing noted** — sidebar, tables, and grids need verification on small screens.

12. **No favicon or meta tags** — `index.html` likely has default Vite meta; needs proper title, description, OG tags.

13. **No email templates** — signup confirmation, password reset emails use Supabase defaults.

### Implementation Plan (Priority Order)

**Phase 1 — Blockers for deployment:**
- Add "Contact Streamer" button on Browse Streamers page that creates a deal + opens messaging
- Make `campaign_id` nullable on `deals` table (migration) to support direct streamer contact
- Add forgot password page and flow
- Add email confirmation handling (show "check your email" after signup, or enable auto-confirm)
- Fix Select components in ListingsPage to properly submit values
- Add React error boundary
- Fix edge function auth (`getClaims` → `getUser`)

**Phase 2 — Polish:**
- Update `index.html` with proper title, meta description, OG tags
- Fix console ref warnings
- Clean up TypeScript `as any` casts
- Add proper loading skeletons across pages
- Mobile responsiveness pass

This is a significant amount of work — roughly 7-8 implementation steps. I recommend tackling Phase 1 items first across 2-3 messages, then Phase 2 polish.

