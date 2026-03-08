

## Round 5: Final Polish and Launch Readiness

### Completed so far
- Round 1: Commission model, streamer detail pages
- Round 2: Onboarding wizard, notification badges, mobile fixes, TypeScript joins
- Round 3: Notify edge function, landing page pricing/SEO
- Round 4: Notification bell, skeleton loaders, ErrorBoundary, admin type cleanup

### What remains

#### Step 1: Clean remaining `as any` casts (~97 across 3 files)
- **`useCompliance.ts`** (80+ casts): The `supabase.rpc()` and `supabase.from()` calls use `as any` because custom RPCs (`check_user_compliance`, `log_compliance_event`) and some tables (`age_verifications`, `disclaimer_acceptances`) aren't in the generated types. Fix by wrapping these calls in typed helper functions that accept the correct parameters and return typed results, isolating the single `as any` to one place per function.
- **`AdminPages.tsx`** (~10 casts): Replace remaining `(d.profiles as any)?.display_name` with properly typed variables using the `VerificationDocWithProfile` and `AuditLogWithProfile` interfaces already defined in `supabase-joins.ts`.
- **`ListingsPage.tsx`** (1 cast): Fix `pricing_type as any` by ensuring the form value matches the expected enum type.

#### Step 2: Dark mode toggle
Add a theme toggle button (sun/moon icon) next to the notification bell in the dashboard header. Use the already-installed `next-themes` package. Wrap the app in `ThemeProvider` and persist preference in localStorage.

#### Step 3: Settings page for streamers
Create a `/settings` page (or extend `/profile`) where streamers can:
- Update wallet address and preferred crypto (fields already exist on `streamer_profiles`)
- Manage notification preferences (opt-in/out of email notifications)
- View and revoke disclaimer acceptances

#### Step 4: Admin dashboard metrics
Enhance the admin dashboard with real aggregate stats:
- Total active deals, total commissions earned, total platform fees collected
- Pending verifications count, active campaigns count
- Use simple `supabase.from().select('count')` queries

#### Step 5: Pre-launch security scan
Run the built-in security scanner to identify any RLS gaps, missing policies, or exposed secrets before publishing.

---

**Implementation order:** Steps 1 → 2 → 3 → 4 → 5. Step 1 is housekeeping, Step 2 is quick UX win, Steps 3-4 add functional value, Step 5 is pre-launch hygiene.

