
-- Admin messages table
CREATE TABLE public.admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid,
  recipient_role text,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and super admins can insert messages" ON public.admin_messages FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can view all messages" ON public.admin_messages FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin') OR recipient_id = auth.uid() OR recipient_role IN (SELECT role::text FROM public.user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own messages" ON public.admin_messages FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid());

-- User disqualifications table
CREATE TABLE public.user_disqualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  disqualified_by uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_disqualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Checkers and admins can insert" ON public.user_disqualifications FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'property_checker') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can view all" ON public.user_disqualifications FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'property_checker') OR user_id = auth.uid());
CREATE POLICY "Admins can update" ON public.user_disqualifications FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Audit logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Authenticated can insert logs" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Host feature access table
CREATE TABLE public.host_feature_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature_name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature_name)
);
ALTER TABLE public.host_feature_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage feature access" ON public.host_feature_access FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Hosts can view own features" ON public.host_feature_access FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin can also view payments
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
