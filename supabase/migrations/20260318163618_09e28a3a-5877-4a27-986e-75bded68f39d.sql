
-- Allow admins, super_admins to update any property (for approval/rejection)
CREATE POLICY "Admins can update any property"
ON public.properties FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'property_checker'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'property_checker'::app_role));

-- Allow super_admins to view all roles
CREATE POLICY "Super admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admins to manage roles
CREATE POLICY "Super admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow property_checkers and super_admins to view documents
CREATE POLICY "Property checkers can view documents"
ON public.property_documents FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'property_checker'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admins to view all bookings
CREATE POLICY "Super admins can view all bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admins to view all complaints
CREATE POLICY "Super admins can view all complaints"
ON public.complaints FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admins to view all payments
CREATE POLICY "Super admins can view all payments"
ON public.payments FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));
