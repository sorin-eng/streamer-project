

## Final SaaS Completion Plan

After a full audit, here is everything remaining to make this a 100% production-ready product that a real user can sign up for, use end-to-end, and pay for. Organized by priority.

---

### BLOCKER: Avatars Bucket Missing

The `avatars` storage bucket does not exist (only `documents` is listed). The `AvatarUpload` component will fail silently. Must create the bucket with public access and RLS policies.

**Migration:** Create `avatars` bucket + storage RLS policies for user-specific uploads.

---

### BLOCKER: Email Verification Not Enforced

The signup shows a "check your email" screen, but `RouteGuard` does not check if the user's email is actually confirmed. An unverified user who refreshes or opens a new tab can access the dashboard. `LoginPage` also does not check confirmation status.

**Fix:** In `AuthContext.buildAppUser`, check `supabaseUser.email_confirmed_at`. If null, don't build an AppUser. Show a "please verify your email" screen instead of the dashboard. Also handle it in `login` — if `email_confirmed_at` is null after login, return an error.

---

### BLOCKER: Suspended Users Can Still Access Platform

Admin can toggle `suspended` on users, but `RouteGuard` never checks it. A suspended user can continue using the platform normally.

**Fix:** In `buildAppUser`, fetch the `suspended` column from `profiles`. Add `suspended` to `AppUser`. In `RouteGuard`, if `user.suspended`, show a "Your account has been suspended" screen instead of rendering children.

---

### BLOCKER: `notification_preferences` and `suspended` Columns May Not Exist

The migration that adds these columns to `profiles` may have failed or not been applied. The Settings page uses `notification_preferences` and Admin uses `suspended` via RPCs, but the columns are not visible in the provided schema.

**Fix:** Create a migration to add both columns if they don't exist (using `IF NOT EXISTS` pattern), plus create the `admin_change_role` and `admin_toggle_suspend` RPCs if missing.

---

### HIGH: Contract Signing Is One-Sided

Currently, when either party signs, the contract status jumps to `signed`. It should require both signatures. Casino signs → `status` stays `pending_signature`. Streamer signs → if both `signer_casino_id` and `signer_streamer_id` are set, then move to `signed`.

**Fix:** Update `ContractPage.handleSign` to only set `status: 'signed'` when both signers are present. Add a check: if one already signed, update only the current signer field without changing status, then check if both are now filled.

---

### HIGH: No Deal Cancellation

Users cannot cancel or dispute a deal. There's no way to terminate a partnership that goes wrong.

**Fix:** Add a "Cancel Deal" button with a reason field. Validate via `validate_deal_transition`. Log to `deal_state_log`.

---

### MEDIUM: Login Does Not Handle Unconfirmed Email Gracefully

If email confirmation is required but a user tries to log in before confirming, the error message from the auth system may be cryptic.

**Fix:** Catch the specific error and show "Please check your email and verify your account before signing in."

---

### MEDIUM: Campaign Search/Filter Missing on Campaigns Page

`CampaignsPage` likely has no search or pagination (it was listed as a gap and the hooks show `useCampaigns(search)` supports it, but need to verify the page wires it up).

**Fix:** Add `SearchBar` and `PaginationControls` to `CampaignsPage` matching the pattern used in `DealsPage`.

---

### MEDIUM: Streamer Cannot Edit/Delete Listings Inline

The `ListingsPage` should have edit and delete functionality wired up properly.

---

### POLISH: `as any` Casts Remain

Several `as any` casts remain in `SettingsPage.tsx` (lines 57-58, 93-94), `AdminPages.tsx` (lines 138, 154, 193), and `DealsPage.tsx` (line 80). These should use typed helpers.

---

### Implementation Order (7 Steps)

| Step | What | Files |
|------|------|-------|
| 1 | **DB migration**: Create `avatars` bucket, ensure `notification_preferences` + `suspended` columns, ensure RPCs exist | Migration SQL |
| 2 | **Enforce email verification**: Check `email_confirmed_at` in `buildAppUser` and `login`. Show verification screen for unconfirmed users | `AuthContext.tsx`, `RouteGuard.tsx`, `LoginPage.tsx` |
| 3 | **Enforce suspended check**: Add `suspended` to `AppUser`, check in `RouteGuard` | `AuthContext.tsx`, `RouteGuard.tsx` |
| 4 | **Fix contract dual-signature logic**: Require both parties to sign before status becomes `signed` | `ContractPage.tsx` |
| 5 | **Add deal cancellation**: Cancel button + reason dialog on `DealsPage` | `DealsPage.tsx` |
| 6 | **Add search/pagination to CampaignsPage**: Wire up existing components | `CampaignsPage.tsx` |
| 7 | **Clean remaining `as any` casts** | `SettingsPage.tsx`, `AdminPages.tsx`, `DealsPage.tsx` |

This addresses every gap preventing a real user from signing up and using the platform end-to-end as a complete product (excluding Stripe payments which were deferred).

