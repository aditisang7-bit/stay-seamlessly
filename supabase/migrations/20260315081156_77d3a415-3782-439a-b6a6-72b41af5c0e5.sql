
-- Add monthly rental fields to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS monthly_rent numeric DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS security_deposit numeric DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS maintenance_fee numeric DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS min_rental_months integer DEFAULT 1;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending';

-- Create property_documents table for verification
CREATE TABLE public.property_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid NOT NULL,
  document_type text NOT NULL,
  document_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;

-- Sellers can upload docs for their properties
CREATE POLICY "Sellers can insert own documents" ON public.property_documents
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can view own docs
CREATE POLICY "Sellers can view own documents" ON public.property_documents
  FOR SELECT TO authenticated
  USING (auth.uid() = seller_id);

-- Admins can view all docs
CREATE POLICY "Admins can view all documents" ON public.property_documents
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for verification documents (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Only authenticated users can upload to verification-docs
CREATE POLICY "Sellers upload verification docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-docs');

-- Only the uploader and admins can view
CREATE POLICY "Owners and admins view verification docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'verification-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));

-- Add reference_id to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reference_id text;

-- Update bookings to store deposit info
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS security_deposit numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS rent_amount numeric DEFAULT 0;
