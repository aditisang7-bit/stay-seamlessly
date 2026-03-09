import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Home, BarChart3, Calendar, MessageSquare, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const SellerDashboard = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', location: '', price: '', max_guests: '1', amenities: '' });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [propsRes, bookingsRes, complaintsRes] = await Promise.all([
      supabase.from('properties').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
      supabase.from('bookings').select('*, properties(title)').order('created_at', { ascending: false }),
      supabase.from('complaints').select('*, properties(title), profiles!complaints_buyer_id_fkey(name)').eq('seller_id', user.id),
    ]);
    setProperties(propsRes.data || []);
    setBookings(bookingsRes.data || []);
    setComplaints(complaintsRes.data || []);
  };

  useEffect(() => { fetchData(); }, [user]);

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const path = `${user!.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('property-images').upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from('property-images').getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadImages(imageFiles);
      }

      const amenitiesList = form.amenities.split(',').map(a => a.trim()).filter(Boolean);
      const propertyData = {
        seller_id: user.id,
        title: form.title,
        description: form.description,
        location: form.location,
        price: parseFloat(form.price),
        max_guests: parseInt(form.max_guests),
        amenities: amenitiesList,
        ...(imageUrls.length > 0 ? { images: imageUrls } : {}),
      };

      if (editingId) {
        await supabase.from('properties').update(propertyData).eq('id', editingId);
        toast.success('Property updated!');
      } else {
        await supabase.from('properties').insert(propertyData);
        toast.success('Property listed!');
      }

      setForm({ title: '', description: '', location: '', price: '', max_guests: '1', amenities: '' });
      setImageFiles([]);
      setShowForm(false);
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (id: string) => {
    await supabase.from('properties').delete().eq('id', id);
    toast.success('Property deleted');
    fetchData();
  };

  const editProperty = (p: any) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description || '',
      location: p.location,
      price: String(p.price),
      max_guests: String(p.max_guests),
      amenities: (p.amenities || []).join(', '),
    });
    setShowForm(true);
  };

  // Analytics
  const totalRevenue = bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.total_price || 0), 0);
  const activeListings = properties.length;
  const totalBookings = bookings.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">Seller Dashboard</h1>
          <Button onClick={() => { setShowForm(true); setEditingId(null); setForm({ title: '', description: '', location: '', price: '', max_guests: '1', amenities: '' }); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Property
          </Button>
        </div>

        {/* Analytics cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: BarChart3 },
            { label: 'Active Listings', value: activeListings, icon: Home },
            { label: 'Total Bookings', value: totalBookings, icon: Calendar },
            { label: 'Complaints', value: complaints.length, icon: MessageSquare },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-heading text-xl font-bold">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-lg rounded-2xl bg-card p-6 shadow-elevated">
              <h2 className="mb-4 font-heading text-lg font-bold">{editingId ? 'Edit Property' : 'Add New Property'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required /></div>
                  <div><Label>Price / night (₹)</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Max Guests</Label><Input type="number" value={form.max_guests} onChange={e => setForm({ ...form, max_guests: e.target.value })} /></div>
                  <div><Label>Amenities (comma-separated)</Label><Input value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} placeholder="WiFi, Pool, AC" /></div>
                </div>
                <div>
                  <Label>Images</Label>
                  <Input type="file" multiple accept="image/*" onChange={e => setImageFiles(Array.from(e.target.files || []))} />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={loading}>{loading ? 'Saving...' : editingId ? 'Update' : 'List Property'}</Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Tabs defaultValue="properties">
          <TabsList className="mb-6">
            <TabsTrigger value="properties" className="gap-2"><Home className="h-4 w-4" />Properties</TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2"><Calendar className="h-4 w-4" />Bookings</TabsTrigger>
            <TabsTrigger value="complaints" className="gap-2"><MessageSquare className="h-4 w-4" />Complaints</TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
            {properties.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
                No properties yet. Add your first listing!
              </div>
            ) : (
              <div className="space-y-4">
                {properties.map(p => (
                  <div key={p.id} className="flex items-center gap-4 rounded-xl border p-4">
                    <img src={p.images?.[0] || '/placeholder.svg'} alt="" className="h-20 w-20 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="font-heading font-semibold">{p.title}</p>
                      <p className="text-sm text-muted-foreground">{p.location}</p>
                      <p className="text-sm font-medium">₹{p.price?.toLocaleString()} / night</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => editProperty(p)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" onClick={() => deleteProperty(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings">
            {bookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No bookings yet</div>
            ) : (
              <div className="space-y-4">
                {bookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <p className="font-heading font-semibold">{b.properties?.title || 'Property'}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(b.start_date), 'MMM dd')} – {format(new Date(b.end_date), 'MMM dd, yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-heading font-semibold">₹{b.total_price?.toLocaleString()}</p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${b.status === 'confirmed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="complaints">
            {complaints.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No complaints</div>
            ) : (
              <div className="space-y-4">
                {complaints.map(c => (
                  <div key={c.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-heading font-semibold">{c.properties?.title || 'General'}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === 'open' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>{c.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{c.message}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SellerDashboard;
