
-- Fix CRITICAL: Prevent privilege escalation on user_roles
-- Remove the permissive INSERT policy and replace with service-role-only
DROP POLICY IF EXISTS "Only system inserts roles" ON public.user_roles;

CREATE POLICY "Only service role inserts roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Fix CRITICAL: Prevent unauthorized org membership
DROP POLICY IF EXISTS "Insert org members" ON public.organization_members;

CREATE POLICY "Admin or service role inserts org members"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix: Restrict notification inserts to service role / own user
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Service role or self insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Fix: Restrict deal_state_log inserts to deal participants
DROP POLICY IF EXISTS "Participants can log state changes" ON public.deal_state_log;

CREATE POLICY "Deal participants can log state changes"
ON public.deal_state_log
FOR INSERT
TO authenticated
WITH CHECK (
  changed_by = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM deals d
      WHERE d.id = deal_state_log.deal_id
      AND (
        d.streamer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM organization_members om
          WHERE om.organization_id = d.organization_id
          AND om.user_id = auth.uid()
        )
      )
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Fix: Restrict organizations INSERT to prevent unauthenticated creation
DROP POLICY IF EXISTS "Authenticated can create orgs" ON public.organizations;

CREATE POLICY "Admin can create orgs"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
