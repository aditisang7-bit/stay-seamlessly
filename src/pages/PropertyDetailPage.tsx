import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, Star, Users, CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import SEOHead from '@/components/SEOHead';
import ShareButtons from '@/components/ShareButtons';
import Footer from '@/components/Footer';

const PropertyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [imageIndex, setImageIndex] = useState(0);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('properties').select('*').eq('id', id).single();
      if (data) {
        setProperty(data);
        const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', data.seller_id).single();
        setSeller(profile);
      }
      setLoading(false);
    };
    if (id) fetch();
  }, [id]);

  const nights = startDate && endDate ? differenceInDays(endDate, startDate) : 0;
  const totalPrice = nights > 0 ? nights * (property?.price || 0) : 0;

  const handleBooking = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!startDate || !endDate || nights <= 0) { toast.error('Select valid dates'); return; }

    setBookingLoading(true);
    try {
      // Create booking
      const { data: booking, error: bookingErr } = await supabase.from('bookings').insert({
        property_id: id!,
        buyer_id: user.id,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        total_price: totalPrice,
        status: 'pending',
      }).select().single();

      if (bookingErr) throw bookingErr;

      // Create payment record
      await supabase.from('payments').insert({
        booking_id: booking.id,
        amount: totalPrice,
        status: 'pending',
      });

      // Initialize Razorpay
      const options = {
        key: 'rzp_test_S7ebAg6FFxGhPb',
        amount: totalPrice * 100,
        currency: 'INR',
        name: 'RentMeAbhi',
        description: `Booking: ${property.title}`,
        handler: async (response: any) => {
          await supabase.from('payments').update({
            razorpay_payment_id: response.razorpay_payment_id,
            status: 'completed',
          }).eq('booking_id', booking.id);

          await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', booking.id);
          toast.success('Booking confirmed! Payment successful.');
          navigate('/buyer');
        },
        prefill: { email: user.email },
        theme: { color: '#E11D48' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-4 h-8 w-1/2" />
        <Skeleton className="aspect-[16/9] rounded-2xl" />
      </div>
    );
  }

  if (!property) return <div className="py-20 text-center text-muted-foreground">Property not found</div>;

  const images = property.images?.length > 0 ? property.images : ['/placeholder.svg'];

  const mapQuery = encodeURIComponent(`${property.location}, Pune, India`);
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=73.7%2C18.4%2C74.0%2C18.7&layer=mapnik&marker=18.55%2C73.85`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: property.title,
    description: property.description || `Rental property in ${property.location}`,
    image: images[0],
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${property.title} | Rent in ${property.location} | RentMeAbhi`}
        description={`Rent ${property.title} in ${property.location} for ₹${property.price}/night. ${property.amenities?.slice(0, 3).join(', ')}. Book instantly on RentMeAbhi.`}
        jsonLd={jsonLd}
      />
      <div className="container mx-auto px-4 py-8">
        {/* Title */}
        <h1 className="mb-2 font-heading text-2xl font-bold md:text-3xl">{property.title}</h1>
        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-foreground text-foreground" /> {property.rating?.toFixed(1) || '0.0'}</span>
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {property.location}</span>
          <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Up to {property.max_guests} guests</span>
        </div>

        {/* Image gallery */}
        <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-2xl md:aspect-[2/1]">
          <img src={images[imageIndex]} alt={property.title} className="h-full w-full object-cover" />
          {images.length > 1 && (
            <>
              <button onClick={() => setImageIndex(i => (i - 1 + images.length) % images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur-sm">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => setImageIndex(i => (i + 1) % images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur-sm">
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                {images.map((_: string, i: number) => (
                  <button key={i} onClick={() => setImageIndex(i)} className={`h-2 w-2 rounded-full transition ${i === imageIndex ? 'bg-primary-foreground' : 'bg-primary-foreground/40'}`} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Details */}
          <div className="space-y-6 lg:col-span-2">
            {seller && (
              <div className="flex items-center gap-3 border-b pb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary font-heading font-bold text-secondary-foreground">
                  {seller.name?.[0]?.toUpperCase() || 'H'}
                </div>
                <div>
                  <p className="font-heading font-semibold">Hosted by {seller.name || 'Host'}</p>
                  <p className="text-sm text-muted-foreground">Joined {format(new Date(seller.created_at), 'MMM yyyy')}</p>
                </div>
              </div>
            )}

            <div>
              <h2 className="mb-3 font-heading text-lg font-semibold">About this place</h2>
              <p className="text-muted-foreground leading-relaxed">{property.description || 'No description provided.'}</p>
            </div>

            {property.amenities?.length > 0 && (
              <div>
                <h2 className="mb-3 font-heading text-lg font-semibold">Amenities</h2>
                <div className="grid grid-cols-2 gap-3">
                  {property.amenities.map((a: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            <div>
              <h2 className="mb-3 font-heading text-lg font-semibold">Location</h2>
              <div className="overflow-hidden rounded-xl border">
                <iframe
                  title={`Map of ${property.location}`}
                  width="100%"
                  height="300"
                  src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
                  className="border-0"
                  loading="lazy"
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{property.location}</p>
            </div>

            {/* Share */}
            <div>
              <h3 className="mb-3 font-heading font-semibold">Share this property</h3>
              <ShareButtons title={`${property.title} - Rent in ${property.location} | RentMeAbhi`} />
            </div>
          </div>

          {/* Booking card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4 rounded-2xl border p-6 shadow-card">
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-2xl font-bold">₹{property.price?.toLocaleString()}</span>
                <span className="text-muted-foreground">/ night</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">CHECK-IN</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'MMM dd') : 'Select'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} disabled={d => d < new Date()} className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">CHECK-OUT</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'MMM dd') : 'Select'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={d => d <= (startDate || new Date())} className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {nights > 0 && (
                <div className="space-y-2 border-t pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">₹{property.price?.toLocaleString()} × {nights} nights</span>
                    <span>₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-heading font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>₹{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <Button className="w-full" size="lg" onClick={handleBooking} disabled={bookingLoading || nights <= 0}>
                {bookingLoading ? 'Processing...' : nights > 0 ? `Book · ₹${totalPrice.toLocaleString()}` : 'Select dates to book'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PropertyDetailPage;
