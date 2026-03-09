

## Round 6: SaaS Completion (Skipping Stripe)

This round addresses all remaining gaps except payment integration. Eight concrete steps.

---

### Step 1: Contract Auto-Generation
When a deal transitions to `contract_pending` in `DealsPage.tsx`, automatically create a contract record in the `contracts` table. Add a "Create Contract" dialog for casino managers with fields: title, deal type, commission terms, duration, and special clauses. The dialog writes `terms_json` and sets status to `draft`. Casino can then move it to `pending_signature`.

**Files:** `DealsPage.tsx`, `useSupabaseData.ts` (add `useCreateContract` mutation)

### Step 2: Avatar Upload on Profile Page
Create an `avatars` storage bucket (public, with RLS so users can only upload/update their own). Add an avatar upload button on the profile page that uploads to `avatars/{user_id}`, gets the public URL, and updates `profiles.avatar_url`. Display the avatar in the profile header and dashboard sidebar.

**Files:** Migration SQL (create bucket + RLS policies), `ProfilePage.tsx`, `DashboardLayout.tsx`

### Step 3: CSV File Upload for Reports
Add drag-and-drop file upload to the Reports upload dialog. Upload the CSV to the existing `documents` bucket under `reports/{org_id}/{filename}`, store the URL in `report_uploads.file_url`, then parse and process the CSV client-side before sending to the `report-upload` edge function.

**Files:** `ReportsPage.tsx`, migration for `documents` bucket RLS if needed

### Step 4: Realtime Chat (Replace Polling)
In `useDealMessages`, remove `refetchInterval: 5000`. In `MessagesPage.tsx`, subscribe to `postgres_changes` on `deal_messages` filtered by `deal_id` and call `qc.invalidateQueries` on INSERT events. The channel subscription already exists but doesn't trigger a refetch — wire it up properly.

**Files:** `useSupabaseData.ts`, `MessagesPage.tsx`

### Step 5: Password Change + Notification Preferences
Add a "Change Password" section to `SettingsPage.tsx` using `supabase.auth.updateUser({ password })`. Add a `notification_preferences` column to `profiles` (jsonb, default `{}`), and persist the email notification toggle there.

**Files:** `SettingsPage.tsx`, migration SQL (add column)

### Step 6: Admin Role Management
Extend `AdminUsersPage` with actions: change role (via a security definer RPC `admin_change_role`), and suspend/unsuspend (add `suspended` boolean to `profiles`). Update `RouteGuard` to check suspended status and block access with a message.

**Files:** `AdminPages.tsx`, `RouteGuard.tsx`, migration SQL (RPC + column), `useSupabaseData.ts`

### Step 7: Search & Pagination on Key Pages
Add search input to `DealsPage`, `StreamersPage`, `CampaignsPage`, and `AdminUsersPage`. Add offset-based pagination (page size 20) with Previous/Next controls using the existing `Pagination` components. Update query hooks to accept `page` and `search` parameters and use `.range()`.

**Files:** `DealsPage.tsx`, `StreamersPage.tsx`, `CampaignsPage.tsx`, `AdminPages.tsx`, `useSupabaseData.ts`

### Step 8: Webhook Configuration UI
Add a "Webhooks" section to the casino Settings page (or a new `/settings/webhooks` view). Casino managers can register endpoint URLs, select events to subscribe to, view delivery history, and toggle endpoints active/inactive.

**Files:** `SettingsPage.tsx` or new component, `useSupabaseData.ts` (add webhook CRUD hooks)

---

### Database Migrations Required
1. **Avatars bucket** — `INSERT INTO storage.buckets` + RLS policies on `storage.objects`
2. **Profile column** — `ALTER TABLE profiles ADD COLUMN notification_preferences jsonb DEFAULT '{}', ADD COLUMN suspended boolean DEFAULT false`
3. **Admin role change RPC** — Security definer function `admin_change_role(_user_id uuid, _new_role app_role)`
4. **Documents bucket RLS** — Add upload policy for org members on existing `documents` bucket

### Implementation Order
Steps 1-4 first (core functionality), then 5-8 (admin/polish). Each step is independently deployable.

