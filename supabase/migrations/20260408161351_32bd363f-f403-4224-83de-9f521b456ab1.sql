
-- 1. Add buyer preference fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location_preferred text,
  ADD COLUMN IF NOT EXISTS budget_min numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS budget_max numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS move_in_date date,
  ADD COLUMN IF NOT EXISTS toilet_type text,
  ADD COLUMN IF NOT EXISTS kitchen_type text,
  ADD COLUMN IF NOT EXISTS parking_type text,
  ADD COLUMN IF NOT EXISTS has_corridor boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_backup boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS furnishing_preference text,
  ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- 2. Add property fields
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS unit_type text DEFAULT '1BHK',
  ADD COLUMN IF NOT EXISTS property_type text DEFAULT 'Family',
  ADD COLUMN IF NOT EXISTS society_name text,
  ADD COLUMN IF NOT EXISTS brokerage numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available';

-- 3. Create enquiries table
CREATE TABLE public.enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own enquiries" ON public.enquiries
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can create enquiries" ON public.enquiries
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can cancel own enquiries" ON public.enquiries
  FOR UPDATE USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view enquiries on their properties" ON public.enquiries
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can update enquiry status" ON public.enquiries
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Admins can view all enquiries" ON public.enquiries
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_enquiries_updated_at
  BEFORE UPDATE ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create seller_documents table
CREATE TABLE public.seller_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  document_type text NOT NULL,
  document_url text NOT NULL,
  verification_status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  verified_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own documents" ON public.seller_documents
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can upload documents" ON public.seller_documents
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Admins can view all documents" ON public.seller_documents
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'property_checker'::app_role));

CREATE POLICY "Admins can update document status" ON public.seller_documents
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'property_checker'::app_role));

CREATE TRIGGER update_seller_documents_updated_at
  BEFORE UPDATE ON public.seller_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for enquiries
ALTER PUBLICATION supabase_realtime ADD TABLE public.enquiries;
