import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PropertyCard from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Home, Heart, MessageSquare, Bell, Send } from 'lucide-react';
import SupportBanner from '@/components/SupportBanner';
import ProfileCompletionModal from '@/components/ProfileCompletionModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { toast } from 'sonner';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [complaintMsg, setComplaintMsg] = useState('');
  const [complaintPropertyId, setComplaintPropertyId] = useState('');
  const [disqualified, setDisqualified] = useState(false);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [bookingsRes, favsRes, msgsRes, disqRes, enquiriesRes, profileRes] = await Promise.all([
        supabase.from('bookings').select('*, properties(title, location, images, price, monthly_rent, seller_id)').eq('buyer_id', user.id).order('created_at', { ascending: false }),
        supabase.from('favorites').select('*, properties(*)').eq('user_id', user.id),
        supabase.from('admin_messages').select('*').or(`recipient_id.eq.${user.id},recipient_role.eq.buyer,recipient_role.is.null`).order('created_at', { ascending: false }),
        supabase.from('user_disqualifications').select('*').eq('user_id', user.id).eq('status', 'active'),
        supabase.from('enquiries').select('*, properties(title, location)').eq('buyer_id', user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('profile_completed').eq('user_id', user.id).single(),
      ]);
      setBookings(bookingsRes.data || []);
      setFavorites(favsRes.data || []);
      setMessages(msgsRes.data || []);
      setDisqualified((disqRes.data || []).length > 0);
      setEnquiries(enquiriesRes.data || []);
      setProfileComplete((profileRes.data as any)?.profile_completed ?? false);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const submitComplaint = async () => {
    if (!complaintMsg.trim()) { toast.error('Enter a message'); return; }
    if (!user) return;
    const booking = bookings.find(b => b.property_id === complaintPropertyId);
    await supabase.from('complaints').insert({
      buyer_id: user.id, property_id: complaintPropertyId || null,
      seller_id: booking?.properties?.seller_id || null, message: complaintMsg,
    });
    toast.success('Complaint submitted');
    setComplaintMsg(''); setComplaintPropertyId('');
  };

  if (profileComplete === null) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="min-h-screen bg-background">
      {profileComplete === false && <ProfileCompletionModal userRole="buyer" onComplete={() => setProfileComplete(true)} />}

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 font-heading text-2xl font-bold">Buyer Dashboard</h1>

        {disqualified && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
            <p className="font-semibold text-destructive">Your account has been temporarily restricted.</p>
            <p className="mt-1 text-sm text-muted-foreground">Contact <a href="tel:+919356357789" className="font-semibold text-primary">+91 9356357789</a></p>
          </div>
        )}

        {messages.length > 0 && (
          <div className="mb-6 space-y-2">
            {messages.slice(0, 3).map(m => (
              <div key={m.id} className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                <Bell className="mt-0.5 h-4 w-4 text-primary" />
                <div><p className="text-sm font-semibold">{m.subject}</p><p className="text-xs text-muted-foreground">{m.message}</p></div>
              </div>
            ))}
          </div>
        )}

        <Tabs defaultValue="bookings">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="bookings" className="gap-2"><Calendar className="h-4 w-4" />My Bookings</TabsTrigger>
            <TabsTrigger value="enquiries" className="gap-2"><Send className="h-4 w-4" />My Enquiries ({enquiries.length})</TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2"><Heart className="h-4 w-4" />Favorites</TabsTrigger>
            <TabsTrigger value="complaints" className="gap-2"><MessageSquare className="h-4 w-4" />Complaints</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" />Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            {bookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
                <Home className="mx-auto mb-3 h-8 w-8" />No bookings yet. Start exploring!
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map(b => (
                  <div key={b.id} className="flex items-center gap-4 rounded-xl border p-4">
                    <img src={b.properties?.images?.[0] || '/placeholder.svg'} alt="" className="h-20 w-20 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="font-heading font-semibold">{b.properties?.title}</p>
                      <p className="text-sm text-muted-foreground">{b.properties?.location}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(b.start_date), 'MMM dd')} – {format(new Date(b.end_date), 'MMM dd, yyyy')}</p>
                      {b.reference_id && <p className="text-xs font-medium text-primary">Ref: {b.reference_id}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-heading font-semibold">₹{b.total_price?.toLocaleString()}</p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${b.status === 'confirmed' ? 'bg-success/10 text-success' : b.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="enquiries">
            {enquiries.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground"><Send className="mx-auto mb-3 h-8 w-8" />No enquiries yet. Browse properties and send enquiries!</div>
            ) : (
              <div className="space-y-4">
                {enquiries.map(e => (
                  <div key={e.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-heading font-semibold">{e.properties?.title || 'Property'}</p>
                        <p className="text-sm text-muted-foreground">{e.properties?.location}</p>
                        <p className="mt-2 text-sm">{e.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{format(new Date(e.created_at), 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.status === 'accepted' ? 'bg-success/10 text-success' : e.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                        {e.status === 'accepted' ? '✅ Accepted' : e.status === 'rejected' ? '❌ Rejected' : '🟡 Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites">
            {favorites.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground"><Heart className="mx-auto mb-3 h-8 w-8" />No favorites yet</div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {favorites.map(f => f.properties && (
                  <PropertyCard key={f.id} id={f.properties.id} title={f.properties.title} location={f.properties.location}
                    price={f.properties.price} monthlyRent={f.properties.monthly_rent} images={f.properties.images}
                    rating={f.properties.rating || 0} reviewCount={f.properties.review_count || 0} isFavorited />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="complaints">
            <div className="max-w-lg space-y-4">
              <select value={complaintPropertyId} onChange={e => setComplaintPropertyId(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="">Select a property (optional)</option>
                {bookings.map(b => (<option key={b.property_id} value={b.property_id}>{b.properties?.title}</option>))}
              </select>
              <Textarea value={complaintMsg} onChange={e => setComplaintMsg(e.target.value)} placeholder="Describe your issue..." rows={4} />
              <Button onClick={submitComplaint}>Submit Complaint</Button>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground"><Bell className="mx-auto mb-3 h-8 w-8" />No notifications</div>
            ) : (
              <div className="space-y-3">
                {messages.map(m => (
                  <div key={m.id} className="rounded-xl border p-4">
                    <p className="font-heading font-semibold">{m.subject}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{m.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{format(new Date(m.created_at), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <SupportBanner />
      </div>
    </div>
  );
};

export default BuyerDashboard;
