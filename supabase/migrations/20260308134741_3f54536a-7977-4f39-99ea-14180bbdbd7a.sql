
CREATE TABLE IF NOT EXISTS public.age_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  date_of_birth DATE NOT NULL,
  min_age_required INTEGER NOT NULL DEFAULT 18,
  jurisdiction TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.age_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can upsert own age verification" ON public.age_verifications FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.disclaimer_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  disclaimer_type TEXT NOT NULL,
  disclaimer_version TEXT NOT NULL DEFAULT '1.0',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.disclaimer_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own disclaimers" ON public.disclaimer_acceptances FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.compliance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  user_id UUID DEFAULT auth.uid(),
  details JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view compliance events" ON public.compliance_events FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can insert compliance events" ON public.compliance_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.geo_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  blocked_country TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.geo_restrictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Geo restrictions readable by authenticated" ON public.geo_restrictions FOR SELECT USING (true);
CREATE POLICY "Admin can insert geo restrictions" ON public.geo_restrictions FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update geo restrictions" ON public.geo_restrictions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete geo restrictions" ON public.geo_restrictions FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  events TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can select webhook endpoints" ON public.webhook_endpoints FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = webhook_endpoints.organization_id AND user_id = auth.uid()));
CREATE POLICY "Org members can insert webhook endpoints" ON public.webhook_endpoints FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = webhook_endpoints.organization_id AND user_id = auth.uid()));
CREATE POLICY "Org members can update webhook endpoints" ON public.webhook_endpoints FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = webhook_endpoints.organization_id AND user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  response_status INTEGER,
  response_body TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  delivered_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view webhook deliveries" ON public.webhook_deliveries FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.webhook_endpoints we JOIN public.organization_members om ON om.organization_id = we.organization_id WHERE we.id = webhook_deliveries.endpoint_id AND om.user_id = auth.uid()));
CREATE POLICY "System can insert webhook deliveries via service role" ON public.webhook_deliveries FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR current_setting('role') = 'service_role');
CREATE POLICY "System can update webhook deliveries via service role" ON public.webhook_deliveries FOR UPDATE USING (auth.uid() IS NOT NULL OR current_setting('role') = 'service_role');

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT NOT NULL DEFAULT 'unverified';

CREATE POLICY "Service role can update report uploads" ON public.report_uploads FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin') OR 
  (uploaded_by = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = report_uploads.organization_id AND user_id = auth.uid())
);

CREATE OR REPLACE FUNCTION public.check_user_compliance(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _age_verified BOOLEAN;
  _kyc_status TEXT;
  _terms_accepted BOOLEAN;
  _privacy_accepted BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.age_verifications WHERE user_id = _user_id) INTO _age_verified;
  SELECT COALESCE(p.kyc_status, 'unverified') INTO _kyc_status FROM public.profiles p WHERE p.user_id = _user_id;
  SELECT EXISTS (SELECT 1 FROM public.disclaimer_acceptances WHERE user_id = _user_id AND disclaimer_type = 'terms') INTO _terms_accepted;
  SELECT EXISTS (SELECT 1 FROM public.disclaimer_acceptances WHERE user_id = _user_id AND disclaimer_type = 'privacy') INTO _privacy_accepted;

  RETURN jsonb_build_object(
    'age_verified', _age_verified,
    'kyc_status', _kyc_status,
    'terms_accepted', _terms_accepted,
    'privacy_accepted', _privacy_accepted,
    'fully_compliant', (_age_verified AND _terms_accepted AND _privacy_accepted AND _kyc_status = 'verified')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.log_compliance_event(
  _event_type TEXT,
  _entity_type TEXT DEFAULT NULL,
  _entity_id UUID DEFAULT NULL,
  _details JSONB DEFAULT '{}',
  _severity TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _id UUID;
BEGIN
  INSERT INTO public.compliance_events (event_type, entity_type, entity_id, user_id, details, severity)
  VALUES (_event_type, _entity_type, _entity_id, auth.uid(), _details, _severity)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;
