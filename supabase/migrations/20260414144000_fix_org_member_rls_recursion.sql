-- Fix infinite RLS recursion on organization membership lookups.
-- The original SELECT policy on organization_members queried organization_members again,
-- which breaks direct org-member reads and any downstream policy that checks org membership.

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _organization_id
  )
$$;

DROP POLICY IF EXISTS "Members can view own org members" ON public.organization_members;

CREATE POLICY "Members can view own org members"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.is_org_member(auth.uid(), organization_members.organization_id)
);
