import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, Home, MessageSquare, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, properties: 0, bookings: 0, revenue: 0 });
  const [complaints, setComplaints] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [propsRes, bookingsRes, complaintsRes] = await Promise.all([
        supabase.from('properties').select('*'),
        supabase.from('bookings').select('*'),
        supabase.from('complaints').select('*, properties(title)'),
      ]);

      const props = propsRes.data || [];
      const books = bookingsRes.data || [];
      const comps = complaintsRes.data || [];
      const revenue = books.filter(b => b.status === 'confirmed').reduce((s, b) => s + (b.total_price || 0), 0);

      setProperties(props);
      setBookings(books);
      setComplaints(comps);
      setStats({ users: 0, properties: props.length, bookings: books.length, revenue });
    };
    fetch();
  }, []);

  const resolveComplaint = async (id: string) => {
    await supabase.from('complaints').update({ status: 'resolved' }).eq('id', id);
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'resolved' } : c));
    toast.success('Complaint resolved');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 font-heading text-2xl font-bold">Admin Dashboard</h1>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: BarChart3 },
            { label: 'Properties', value: stats.properties, icon: Home },
            { label: 'Bookings', value: stats.bookings, icon: Calendar },
            { label: 'Complaints', value: complaints.length, icon: MessageSquare },
          ].map(s => (
            <div key={s.label} className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><s.icon className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="font-heading text-xl font-bold">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="complaints">
          <TabsList className="mb-6">
            <TabsTrigger value="complaints" className="gap-2"><MessageSquare className="h-4 w-4" />Complaints</TabsTrigger>
            <TabsTrigger value="properties" className="gap-2"><Home className="h-4 w-4" />Properties</TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2"><Calendar className="h-4 w-4" />Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="complaints">
            {complaints.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No complaints</div>
            ) : (
              <div className="space-y-4">
                {complaints.map(c => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <p className="font-heading font-semibold">{c.properties?.title || 'General'}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{c.message}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === 'open' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>{c.status}</span>
                      {c.status === 'open' && <Button size="sm" onClick={() => resolveComplaint(c.id)}>Resolve</Button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="properties">
            <div className="space-y-4">
              {properties.map(p => (
                <div key={p.id} className="flex items-center gap-4 rounded-xl border p-4">
                  <img src={p.images?.[0] || '/placeholder.svg'} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  <div>
                    <p className="font-heading font-semibold">{p.title}</p>
                    <p className="text-sm text-muted-foreground">{p.location} · ₹{p.price?.toLocaleString()}/night</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bookings">
            <div className="space-y-4">
              {bookings.map(b => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Booking #{b.id.slice(0, 8)}</p>
                    <p className="font-heading font-semibold">₹{b.total_price?.toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.status === 'confirmed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{b.status}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
