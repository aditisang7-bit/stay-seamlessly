-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('buyer', 'seller', 'admin');

-- Create user_roles table (security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own roles" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  max_guests INT DEFAULT 1,
  rating NUMERIC DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Properties are viewable by everyone" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Sellers can insert own properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own properties" ON public.properties FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete own properties" ON public.properties FOR DELETE USING (auth.uid() = seller_id);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers can view bookings for their properties" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND seller_id = auth.uid())
);
CREATE POLICY "Buyers can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = buyer_id);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND buyer_id = auth.uid())
);
CREATE POLICY "Users can insert payments" ON public.payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND buyer_id = auth.uid())
);
CREATE POLICY "Users can update own payments" ON public.payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND buyer_id = auth.uid())
);

-- Complaints table
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers can view own complaints" ON public.complaints FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers can view complaints about their properties" ON public.complaints FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Buyers can create complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Buyers can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for property images
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);
CREATE POLICY "Anyone can view property images" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');
CREATE POLICY "Authenticated users can upload property images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own property images" ON storage.objects FOR UPDATE USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own property images" ON storage.objects FOR DELETE USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admin policies
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all complaints" ON public.complaints FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update complaints" ON public.complaints FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all bookings" ON public.bookings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));