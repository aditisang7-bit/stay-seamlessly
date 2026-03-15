import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PropertyCard from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Home, Heart, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { toast } from 'sonner';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [complaintMsg, setComplaintMsg] = useState('');
  const [complaintPropertyId, setComplaintPropertyId] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [bookingsRes, favsRes] = await Promise.all([
        supabase.from('bookings').select('*, properties(title, location, images, price, monthly_rent, seller_id)').eq('buyer_id', user.id).order('created_at', { ascending: false }),
        supabase.from('favorites').select('*, properties(*)').eq('user_id', user.id),
      ]);
      setBookings(bookingsRes.data || []);
      setFavorites(favsRes.data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const submitComplaint = async () => {
    if (!complaintMsg.trim()) { toast.error('Enter a message'); return; }
    if (!user) return;
    const booking = bookings.find(b => b.property_id === complaintPropertyId);
    await supabase.from('complaints').insert({
      buyer_id: user.id,
      property_id: complaintPropertyId || null,
      seller_id: booking?.properties?.seller_id || null,
      message: complaintMsg,
    });
    toast.success('Complaint submitted');
    setComplaintMsg('');
    setComplaintPropertyId('');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 font-heading text-2xl font-bold">Buyer Dashboard</h1>
        <Tabs defaultValue="bookings">
          <TabsList className="mb-6">
            <TabsTrigger value="bookings" className="gap-2"><Calendar className="h-4 w-4" />My Bookings</TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2"><Heart className="h-4 w-4" />Favorites</TabsTrigger>
            <TabsTrigger value="complaints" className="gap-2"><MessageSquare className="h-4 w-4" />Complaints</TabsTrigger>
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
              <div className="space-y-3">
                <select value={complaintPropertyId} onChange={e => setComplaintPropertyId(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                  <option value="">Select a property (optional)</option>
                  {bookings.map(b => (<option key={b.property_id} value={b.property_id}>{b.properties?.title}</option>))}
                </select>
                <Textarea value={complaintMsg} onChange={e => setComplaintMsg(e.target.value)} placeholder="Describe your issue..." rows={4} />
                <Button onClick={submitComplaint}>Submit Complaint</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BuyerDashboard;
