import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, Star, Users, CalendarIcon, ChevronLeft, ChevronRight, Play, ShieldCheck, AlertTriangle } from 'lucide-react';
import { format, differenceInCalendarMonths, differenceInDays, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import SEOHead from '@/components/SEOHead';
import ShareButtons from '@/components/ShareButtons';
import Footer from '@/components/Footer';
import EnquiryButton from '@/components/EnquiryButton';
import type { DateRange } from 'react-day-picker';

const PropertyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [mediaIndex, setMediaIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookedRanges, setBookedRanges] = useState<{ from: Date; to: Date }[]>([]);
  const [bookingResult, setBookingResult] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('properties').select('*').eq('id', id).single();
      if (data) {
        setProperty(data);
        const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', data.seller_id).single();
        setSeller(profile);

        // Fetch booked ranges
        const { data: bookings } = await supabase
          .from('bookings')
          .select('start_date, end_date')
          .eq('property_id', id!)
          .in('status', ['confirmed', 'pending']);
        if (bookings) {
          setBookedRanges(bookings.map(b => ({ from: new Date(b.start_date), to: new Date(b.end_date) })));
        }
      }
      setLoading(false);
    };
    if (id) fetchData();
  }, [id]);

  // Calculate monthly rent
  const calculateRent = () => {
    if (!startDate || !endDate || !property) return { months: 0, rent: 0, deposit: 0, maintenance: 0, total: 0 };
    const totalDays = differenceInDays(endDate, startDate);
    const months = totalDays / 30; // proportional
    const monthlyRent = property.monthly_rent || property.price || 0;
    const rent = Math.round(months * monthlyRent);
    const deposit = property.security_deposit || 0;
    const maintenance = Math.round(months * (property.maintenance_fee || 0));
    return { months: Math.round(months * 10) / 10, rent, deposit, maintenance, total: rent + deposit + maintenance };
  };

  const pricing = calculateRent();

  const isDateBooked = (date: Date) => {
    return bookedRanges.some(range => date >= range.from && date <= range.to);
  };

  const handleBooking = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!startDate || !endDate || pricing.total <= 0) { toast.error('Select valid dates'); return; }

    setBookingLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          property_id: id!,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          rent_amount: pricing.rent,
          security_deposit: pricing.deposit,
          total_amount: pricing.total,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (data.is_test_mode) {
        toast.warning('⚠ Razorpay is in TEST MODE. Payments are not real.');
      }

      // Open Razorpay checkout
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'RentMeAbhi',
        description: `Booking: ${property.title}`,
        order_id: data.order_id,
        handler: async (response: any) => {
          try {
            const { data: verifyData, error: verifyErr } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                booking_id: data.booking_id,
              },
            });
            if (verifyErr) throw verifyErr;
            if (verifyData.error) throw new Error(verifyData.error);

            setBookingResult({
              reference_id: data.reference_id,
              payment_id: response.razorpay_payment_id,
              booking_id: data.booking_id,
              is_test_mode: verifyData.is_test_mode,
            });

            toast.success('Booking confirmed! Payment verified.');
          } catch (e: any) {
            toast.error('Payment verification failed: ' + e.message);
          }
        },
        prefill: { email: user.email },
        theme: { color: '#E11D48' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        toast.error('Payment failed: ' + resp.error.description);
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

  // Booking confirmation screen
  if (bookingResult) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-lg px-4 py-16 text-center">
          <div className="rounded-2xl border bg-card p-8 shadow-card">
            <ShieldCheck className="mx-auto mb-4 h-16 w-16 text-success" />
            <h1 className="font-heading text-2xl font-bold">Booking Confirmed!</h1>
            {bookingResult.is_test_mode && (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
                <AlertTriangle className="h-4 w-4" /> Payment processed in TEST MODE
              </div>
            )}
            <div className="mt-6 space-y-3 text-left text-sm">
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Reference</span><span className="font-semibold">{bookingResult.reference_id}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Payment ID</span><span className="font-mono text-xs">{bookingResult.payment_id}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Property</span><span className="font-semibold">{property.title}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Move-in</span><span>{startDate && format(startDate, 'MMM dd, yyyy')}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Move-out</span><span>{endDate && format(endDate, 'MMM dd, yyyy')}</span></div>
              <div className="flex justify-between pt-2 font-heading text-lg font-bold"><span>Total Paid</span><span>₹{pricing.total.toLocaleString()}</span></div>
            </div>
            <Button className="mt-6 w-full" onClick={() => navigate('/buyer')}>Go to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  const images = property.images?.length > 0 ? property.images : ['/placeholder.svg'];
  const monthlyRent = property.monthly_rent || property.price || 0;

  const mapQuery = encodeURIComponent(`${property.location}, Pune, India`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: property.title,
    description: property.description || `Rental property in ${property.location}`,
    image: images[0],
    offers: {
      '@type': 'Offer',
      price: monthlyRent,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${property.title} | Rent in ${property.location} | RentMeAbhi`}
        description={`Rent ${property.title} in ${property.location} for ₹${monthlyRent.toLocaleString()}/month. Book instantly on RentMeAbhi.`}
        jsonLd={jsonLd}
      />
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 font-heading text-2xl font-bold md:text-3xl">{property.title}</h1>
        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-foreground text-foreground" /> {property.rating?.toFixed(1) || '0.0'}</span>
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {property.location}</span>
          <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Up to {property.max_guests} guests</span>
          {property.verification_status === 'approved' && (
            <span className="flex items-center gap-1 text-success"><ShieldCheck className="h-4 w-4" /> Verified</span>
          )}
        </div>

        {/* Media gallery */}
        <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-2xl md:aspect-[2/1]">
          {showVideo && property.video_url ? (
            <video src={property.video_url} controls className="h-full w-full object-cover" />
          ) : (
            <img src={images[mediaIndex]} alt={property.title} className="h-full w-full object-cover" />
          )}
          {images.length > 1 && !showVideo && (
            <>
              <button onClick={() => setMediaIndex(i => (i - 1 + images.length) % images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur-sm">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => setMediaIndex(i => (i + 1) % images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur-sm">
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          {property.video_url && (
            <button onClick={() => setShowVideo(!showVideo)} className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              <Play className="h-4 w-4" /> {showVideo ? 'Photos' : 'Video'}
            </button>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
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

            {/* Support contact - no seller contact exposed */}
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex-1">
                <p className="text-sm font-medium">Have questions about this property?</p>
                <p className="text-xs text-muted-foreground">Contact RentMeAbhi support for assistance</p>
              </div>
              <a href="tel:+919356357789" className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">📞 Call Support</a>
            </div>

            {/* Rent details */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border p-4 text-center">
                <p className="text-xs text-muted-foreground">Monthly Rent</p>
                <p className="font-heading text-lg font-bold">₹{monthlyRent.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border p-4 text-center">
                <p className="text-xs text-muted-foreground">Deposit</p>
                <p className="font-heading text-lg font-bold">₹{(property.security_deposit || 0).toLocaleString()}</p>
              </div>
              {(property.maintenance_fee || 0) > 0 && (
                <div className="rounded-xl border p-4 text-center">
                  <p className="text-xs text-muted-foreground">Maintenance</p>
                  <p className="font-heading text-lg font-bold">₹{property.maintenance_fee.toLocaleString()}/mo</p>
                </div>
              )}
              {(property.min_rental_months || 0) > 1 && (
                <div className="rounded-xl border p-4 text-center">
                  <p className="text-xs text-muted-foreground">Min Period</p>
                  <p className="font-heading text-lg font-bold">{property.min_rental_months} months</p>
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-3 font-heading text-lg font-semibold">About this place</h2>
              <p className="leading-relaxed text-muted-foreground">{property.description || 'No description provided.'}</p>
            </div>

            {property.amenities?.length > 0 && (
              <div>
                <h2 className="mb-3 font-heading text-lg font-semibold">Amenities</h2>
                <div className="grid grid-cols-2 gap-3">
                  {property.amenities.map((a: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" /> {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="mb-3 font-heading text-lg font-semibold">Location</h2>
              <div className="overflow-hidden rounded-xl border">
                <iframe title={`Map of ${property.location}`} width="100%" height="300"
                  src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
                  className="border-0" loading="lazy" />
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-heading font-semibold">Share this property</h3>
              <ShareButtons title={`${property.title} - Rent in ${property.location} | RentMeAbhi`} />
            </div>
          </div>

          {/* Booking card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4 rounded-2xl border p-6 shadow-card">
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-2xl font-bold">₹{monthlyRent.toLocaleString()}</span>
                <span className="text-muted-foreground">/ month</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">MOVE-IN DATE</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'MMM dd') : 'Select'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate}
                        disabled={(d) => d < new Date() || isDateBooked(d)}
                        className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">MOVE-OUT DATE</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'MMM dd') : 'Select'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate}
                        disabled={(d) => d <= (startDate || new Date()) || isDateBooked(d)}
                        className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {pricing.total > 0 && (
                <div className="space-y-2 border-t pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rent ({pricing.months} months)</span>
                    <span>₹{pricing.rent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Security Deposit</span>
                    <span>₹{pricing.deposit.toLocaleString()}</span>
                  </div>
                  {pricing.maintenance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Maintenance</span>
                      <span>₹{pricing.maintenance.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 font-heading text-lg font-semibold">
                    <span>Total</span>
                    <span>₹{pricing.total.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <Button className="w-full" size="lg" onClick={handleBooking} disabled={bookingLoading || pricing.total <= 0}>
                {bookingLoading ? 'Processing...' : pricing.total > 0 ? `Book · ₹${pricing.total.toLocaleString()}` : 'Select dates to book'}
              </Button>

              <EnquiryButton propertyId={id!} sellerId={property.seller_id} propertyTitle={property.title} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PropertyDetailPage;
