
-- ============================================
-- 1. UTILITY: updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- 2. ENUMS
-- ============================================
CREATE TYPE public.app_role AS ENUM ('casino_manager', 'streamer', 'admin');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.application_status AS ENUM ('pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE public.deal_type AS ENUM ('revshare', 'cpa', 'hybrid', 'flat_fee');
CREATE TYPE public.contract_status AS ENUM ('draft', 'pending_signature', 'signed', 'expired', 'cancelled');
CREATE TYPE public.commission_status AS ENUM ('pending', 'approved', 'paid', 'disputed', 'cancelled');
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.conversion_event_type AS ENUM ('click', 'signup', 'ftd', 'deposit', 'net_revenue', 'chargeback');

-- ============================================
-- 3. PROFILES (linked to auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 4. USER ROLES (separate table per security requirement)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- ============================================
-- 5. ORGANIZATIONS
-- ============================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. STREAMER PROFILES
-- ============================================
CREATE TABLE public.streamer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  follower_count INTEGER NOT NULL DEFAULT 0,
  avg_live_viewers INTEGER NOT NULL DEFAULT 0,
  monthly_impressions BIGINT NOT NULL DEFAULT 0,
  audience_geo TEXT[] NOT NULL DEFAULT '{}',
  engagement_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  niche_type TEXT,
  past_deals INTEGER NOT NULL DEFAULT 0,
  restricted_countries TEXT[] NOT NULL DEFAULT '{}',
  payment_preference TEXT,
  bio TEXT,
  verified verification_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.streamer_profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_streamer_profiles_updated_at BEFORE UPDATE ON public.streamer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 7. CASINO PROGRAMS (per organization)
-- ============================================
CREATE TABLE public.casino_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  license_jurisdiction TEXT,
  accepted_countries TEXT[] NOT NULL DEFAULT '{}',
  affiliate_terms deal_type NOT NULL DEFAULT 'revshare',
  marketing_guidelines TEXT,
  restricted_territories TEXT[] NOT NULL DEFAULT '{}',
  payment_terms TEXT,
  logo_url TEXT,
  website TEXT,
  verified verification_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.casino_programs ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_casino_programs_updated_at BEFORE UPDATE ON public.casino_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 8. DEAL STATES (finite state machine)
-- ============================================
CREATE TABLE public.deal_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_terminal BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.deal_state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_state TEXT NOT NULL REFERENCES public.deal_states(name),
  to_state TEXT NOT NULL REFERENCES public.deal_states(name),
  allowed_roles app_role[] NOT NULL DEFAULT '{}',
  UNIQUE (from_state, to_state)
);

-- ============================================
-- 9. CAMPAIGNS
-- ============================================
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  casino_program_id UUID REFERENCES public.casino_programs(id),
  title TEXT NOT NULL,
  description TEXT,
  budget NUMERIC(12,2),
  deal_type deal_type NOT NULL DEFAULT 'cpa',
  target_geo TEXT[] NOT NULL DEFAULT '{}',
  duration TEXT,
  requirements TEXT,
  min_followers INTEGER DEFAULT 0,
  min_avg_viewers INTEGER DEFAULT 0,
  restricted_countries TEXT[] NOT NULL DEFAULT '{}',
  status campaign_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_org ON public.campaigns(organization_id);

-- ============================================
-- 10. APPLICATIONS
-- ============================================
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  streamer_id UUID NOT NULL,
  message TEXT,
  status application_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, streamer_id)
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_applications_campaign ON public.applications(campaign_id);
CREATE INDEX idx_applications_streamer ON public.applications(streamer_id);

-- ============================================
-- 11. DEALS
-- ============================================
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  streamer_id UUID NOT NULL,
  deal_type deal_type NOT NULL,
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  state TEXT NOT NULL DEFAULT 'negotiation' REFERENCES public.deal_states(name),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_deals_org ON public.deals(organization_id);
CREATE INDEX idx_deals_streamer ON public.deals(streamer_id);
CREATE INDEX idx_deals_state ON public.deals(state);

-- ============================================
-- 12. DEAL MESSAGES
-- ============================================
CREATE TABLE public.deal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deal_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_deal_messages_deal ON public.deal_messages(deal_id);

-- ============================================
-- 13. CONTRACTS
-- ============================================
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  terms_json JSONB NOT NULL DEFAULT '{}',
  status contract_status NOT NULL DEFAULT 'draft',
  signed_at TIMESTAMPTZ,
  signer_casino_id UUID,
  signer_streamer_id UUID,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 14. TRACKING LINKS
-- ============================================
CREATE TABLE public.tracking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tracking_links ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 15. REPORT UPLOADS
-- ============================================
CREATE TABLE public.report_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  row_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.report_uploads ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 16. CONVERSION EVENTS
-- ============================================
CREATE TABLE public.conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_upload_id UUID REFERENCES public.report_uploads(id),
  deal_id UUID NOT NULL REFERENCES public.deals(id),
  tracking_link_id UUID REFERENCES public.tracking_links(id),
  event_type conversion_event_type NOT NULL,
  event_date DATE NOT NULL,
  player_id TEXT,
  amount NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_conversion_events_deal ON public.conversion_events(deal_id);
CREATE INDEX idx_conversion_events_date ON public.conversion_events(event_date);

-- ============================================
-- 17. COMMISSION RULES
-- ============================================
CREATE TABLE public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  rule_type deal_type NOT NULL,
  cpa_amount NUMERIC(12,2),
  revshare_pct NUMERIC(5,2),
  min_deposit NUMERIC(12,2),
  applies_to conversion_event_type[] NOT NULL DEFAULT '{ftd}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 18. COMMISSIONS
-- ============================================
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id),
  conversion_event_id UUID REFERENCES public.conversion_events(id),
  streamer_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status commission_status NOT NULL DEFAULT 'pending',
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_commissions_deal ON public.commissions(deal_id);
CREATE INDEX idx_commissions_streamer ON public.commissions(streamer_id);

-- ============================================
-- 19. PAYOUT BATCHES + ITEMS
-- ============================================
CREATE TABLE public.payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status payout_status NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.payout_batches(id) ON DELETE CASCADE,
  commission_id UUID NOT NULL REFERENCES public.commissions(id),
  streamer_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status payout_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payout_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 20. VERIFICATION DOCUMENTS
-- ============================================
CREATE TABLE public.verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status verification_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 21. AUDIT LOG (immutable)
-- ============================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at DESC);

-- ============================================
-- 22. DEAL STATE LOG (immutable audit for deal transitions)
-- ============================================
CREATE TABLE public.deal_state_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  from_state TEXT,
  to_state TEXT NOT NULL,
  changed_by UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deal_state_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_deal_state_log_deal ON public.deal_state_log(deal_id);

-- ============================================
-- 23. SEED DEAL STATES + TRANSITIONS
-- ============================================
INSERT INTO public.deal_states (name, description, is_terminal, sort_order) VALUES
  ('negotiation', 'Initial negotiation phase', false, 1),
  ('contract_pending', 'Contract is being drafted/reviewed', false, 2),
  ('active', 'Deal is live and tracking', false, 3),
  ('paused', 'Deal temporarily paused', false, 4),
  ('completed', 'Deal successfully completed', true, 5),
  ('disputed', 'Deal is under dispute', false, 6),
  ('cancelled', 'Deal was cancelled', true, 7);

INSERT INTO public.deal_state_transitions (from_state, to_state, allowed_roles) VALUES
  ('negotiation', 'contract_pending', '{casino_manager, admin}'),
  ('negotiation', 'cancelled', '{casino_manager, streamer, admin}'),
  ('contract_pending', 'active', '{casino_manager, admin}'),
  ('contract_pending', 'negotiation', '{casino_manager, streamer, admin}'),
  ('contract_pending', 'cancelled', '{casino_manager, admin}'),
  ('active', 'paused', '{casino_manager, admin}'),
  ('active', 'completed', '{casino_manager, admin}'),
  ('active', 'disputed', '{casino_manager, streamer, admin}'),
  ('paused', 'active', '{casino_manager, admin}'),
  ('paused', 'cancelled', '{casino_manager, admin}'),
  ('disputed', 'active', '{admin}'),
  ('disputed', 'cancelled', '{admin}');

-- ============================================
-- 24. RLS POLICIES
-- ============================================

-- Profiles: everyone can read, users update own
CREATE POLICY "Profiles are viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- User Roles: users see own, admins see all
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only system inserts roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Organizations: members can see/edit their orgs, admins see all
CREATE POLICY "Org members and admins can view orgs" ON public.organizations FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = organizations.id AND user_id = auth.uid())
  );
CREATE POLICY "Authenticated can create orgs" ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Org members can update orgs" ON public.organizations FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = organizations.id AND user_id = auth.uid())
  );

-- Organization Members
CREATE POLICY "Members can view own org members" ON public.organization_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid())
  );
CREATE POLICY "Insert org members" ON public.organization_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Streamer Profiles: own or admin
CREATE POLICY "Streamer profiles viewable by all authenticated" ON public.streamer_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Streamers can insert own" ON public.streamer_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Streamers can update own" ON public.streamer_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Casino Programs: org members or admin
CREATE POLICY "Casino programs viewable by authenticated" ON public.casino_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Org members can create casino programs" ON public.casino_programs FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = casino_programs.organization_id AND user_id = auth.uid())
  );
CREATE POLICY "Org members can update casino programs" ON public.casino_programs FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = casino_programs.organization_id AND user_id = auth.uid())
  );

-- Campaigns: open campaigns visible to all, draft only to org
CREATE POLICY "Campaigns viewable" ON public.campaigns FOR SELECT TO authenticated
  USING (
    status IN ('open', 'in_progress', 'completed') OR
    created_by = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = campaigns.organization_id AND user_id = auth.uid())
  );
CREATE POLICY "Org members can create campaigns" ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND (
      public.has_role(auth.uid(), 'admin') OR
      EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = campaigns.organization_id AND user_id = auth.uid())
    )
  );
CREATE POLICY "Org members can update campaigns" ON public.campaigns FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = campaigns.organization_id AND user_id = auth.uid())
  );

-- Applications: streamer sees own, campaign org sees theirs, admin all
CREATE POLICY "Applications viewable" ON public.applications FOR SELECT TO authenticated
  USING (
    streamer_id = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = applications.campaign_id AND om.user_id = auth.uid()
    )
  );
CREATE POLICY "Streamers can apply" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (streamer_id = auth.uid() AND public.has_role(auth.uid(), 'streamer'));
CREATE POLICY "Org members can update applications" ON public.applications FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = applications.campaign_id AND om.user_id = auth.uid()
    )
  );

-- Deals: participants or admin
CREATE POLICY "Deals viewable by participants" ON public.deals FOR SELECT TO authenticated
  USING (
    streamer_id = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = deals.organization_id AND user_id = auth.uid())
  );
CREATE POLICY "Deals created by org members or admin" ON public.deals FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = deals.organization_id AND user_id = auth.uid())
  );
CREATE POLICY "Deals updated by participants" ON public.deals FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = deals.organization_id AND user_id = auth.uid())
  );

-- Deal Messages: participants
CREATE POLICY "Deal messages viewable by participants" ON public.deal_messages FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_messages.deal_id AND (
        d.streamer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = d.organization_id AND user_id = auth.uid())
      )
    )
  );
CREATE POLICY "Deal participants can send messages" ON public.deal_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_messages.deal_id AND (
        d.streamer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = d.organization_id AND user_id = auth.uid())
      )
    )
  );

-- Contracts: deal participants
CREATE POLICY "Contracts viewable by deal participants" ON public.contracts FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = contracts.deal_id AND (
        d.streamer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = d.organization_id AND user_id = auth.uid())
      )
    )
  );
CREATE POLICY "Org members can create contracts" ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = contracts.deal_id AND
      EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = d.organization_id AND user_id = auth.uid())
    )
  );
CREATE POLICY "Contract participants can update" ON public.contracts FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = contracts.deal_id AND (
        d.streamer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = d.organization_id AND user_id = auth.uid())
      )
    )
  );

-- Tracking Links: deal participants
CREATE POLICY "Tracking links viewable by participants" ON public.tracking_links FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = tracking_links.deal_id AND (
        d.streamer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = d.organization_id AND user_id = auth.uid())
      )
    )
  );
CREATE POLICY "Org members can create tracking links" ON public.tracking_links FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = tracking_links.deal_id AND
      EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = d.organization_id AND user_id = auth.uid())
    )
  );

-- Report Uploads: org members
CREATE POLICY "Report uploads viewable by org" ON public.report_uploads FOR SELECT TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = report_uploads.organization_id AND user_id = auth.uid())
  );
CREATE POLICY "Org members can upload reports" ON public.report_uploads FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND (
      public.has_role(auth.uid(), 'admin') OR
      EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = report_uploads.organization_id AND user_id = auth.uid())
    )
  );

-- Conversion Events: deal participants
CREATE POLICY "Conversion events viewable" ON public.conversion_events FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = conversion_events.deal_id AND (
        d.streamer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = d.organization_id AND user_id = auth.uid())
      )
    )
  );
CREATE POLICY "Org members can insert conversion events" ON public.conversion_events FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = conversion_events.deal_id AND
      EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = d.organization_id AND user_id = auth.uid())
    )
  );

-- Commission Rules: deal participants
CREATE POLICY "Commission rules viewable" ON public.commission_rules FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = commission_rules.deal_id AND (
        d.streamer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = d.organization_id AND user_id = auth.uid())
      )
    )
  );
CREATE POLICY "Org members can create commission rules" ON public.commission_rules FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = commission_rules.deal_id AND
      EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = d.organization_id AND user_id = auth.uid())
    )
  );

-- Commissions: streamer sees own, org sees theirs
CREATE POLICY "Commissions viewable" ON public.commissions FOR SELECT TO authenticated
  USING (
    streamer_id = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = commissions.deal_id AND
      EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = d.organization_id AND user_id = auth.uid())
    )
  );
CREATE POLICY "System can insert commissions" ON public.commissions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update commissions" ON public.commissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Payout Batches: admin only
CREATE POLICY "Payout batches viewable by admin" ON public.payout_batches FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR created_by = auth.uid());
CREATE POLICY "Admin can create payout batches" ON public.payout_batches FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Payout Items: admin + own streamer
CREATE POLICY "Payout items viewable" ON public.payout_items FOR SELECT TO authenticated
  USING (streamer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can create payout items" ON public.payout_items FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Verification Documents: own or admin
CREATE POLICY "Users can view own verification docs" ON public.verification_documents FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can upload verification docs" ON public.verification_documents FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin can update verification docs" ON public.verification_documents FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Audit Log: admin only read, system insert
CREATE POLICY "Admin can view audit log" ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can insert audit log" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Deal State Log: deal participants + admin
CREATE POLICY "Deal state log viewable" ON public.deal_state_log FOR SELECT TO authenticated
  USING (
    changed_by = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_state_log.deal_id AND (
        d.streamer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = d.organization_id AND user_id = auth.uid())
      )
    )
  );
CREATE POLICY "Participants can log state changes" ON public.deal_state_log FOR INSERT TO authenticated
  WITH CHECK (changed_by = auth.uid());

-- Deal States + Transitions: readable by all authenticated
CREATE POLICY "Deal states readable" ON public.deal_states FOR SELECT TO authenticated USING (true);
CREATE POLICY "Deal transitions readable" ON public.deal_state_transitions FOR SELECT TO authenticated USING (true);

-- ============================================
-- 25. TRIGGER: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 26. FUNCTION: Log audit entry (security definer)
-- ============================================
CREATE OR REPLACE FUNCTION public.log_audit(
  _action TEXT,
  _entity_type TEXT DEFAULT NULL,
  _entity_id UUID DEFAULT NULL,
  _details JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _id UUID;
BEGIN
  INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), _action, _entity_type, _entity_id, _details)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- ============================================
-- 27. FUNCTION: Validate deal state transition
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_deal_transition(
  _deal_id UUID,
  _to_state TEXT,
  _user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _current_state TEXT;
  _user_role app_role;
  _valid BOOLEAN;
BEGIN
  SELECT state INTO _current_state FROM public.deals WHERE id = _deal_id;
  SELECT role INTO _user_role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
  
  SELECT EXISTS (
    SELECT 1 FROM public.deal_state_transitions
    WHERE from_state = _current_state
      AND to_state = _to_state
      AND _user_role = ANY(allowed_roles)
  ) INTO _valid;
  
  RETURN _valid;
END;
$$;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_messages;
