
-- Create a SECURITY DEFINER function for user signup setup
-- This runs with elevated privileges so regular users can't abuse the tables directly
CREATE OR REPLACE FUNCTION public.setup_new_user(
  _user_id uuid,
  _role app_role,
  _display_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
  _result jsonb := '{}'::jsonb;
BEGIN
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Update profile display name
  UPDATE public.profiles
  SET display_name = _display_name
  WHERE user_id = _user_id;

  -- Role-specific setup
  IF _role = 'casino_manager' THEN
    INSERT INTO public.organizations (name)
    VALUES (_display_name)
    RETURNING id INTO _org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (_org_id, _user_id, 'owner');

    INSERT INTO public.casino_programs (organization_id, brand_name)
    VALUES (_org_id, _display_name);

    _result := jsonb_build_object('organization_id', _org_id);
  ELSIF _role = 'streamer' THEN
    INSERT INTO public.streamer_profiles (user_id)
    VALUES (_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN _result;
END;
$$;
