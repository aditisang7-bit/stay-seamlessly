import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Home, BarChart3, Calendar, MessageSquare, Trash2, Edit, Upload, ShieldCheck, Clock, XCircle, Bell, FileText, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import SupportBanner from '@/components/SupportBanner';
import ProfileCompletionModal from '@/components/ProfileCompletionModal';

const SellerDashboard = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [sellerDocs, setSellerDocs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', location: '', monthly_rent: '', security_deposit: '',
    maintenance_fee: '', min_rental_months: '1', max_guests: '1', amenities: '', video_url: '',
    unit_type: '1BHK', property_type: 'Family', society_name: '', brokerage: '',
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [disqualified, setDisqualified] = useState(false);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  // Seller document upload
  const [sellerDocType, setSellerDocType] = useState('id_proof');
  const [sellerDocFile, setSellerDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [propsRes, bookingsRes, complaintsRes, msgsRes, disqRes, enquiriesRes, docsRes, profileRes] = await Promise.all([
      supabase.from('properties').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
      supabase.from('bookings').select('*, properties(title)').order('created_at', { ascending: false }),
      supabase.from('complaints').select('*, properties(title)').eq('seller_id', user.id),
      supabase.from('admin_messages').select('*').or(`recipient_id.eq.${user.id},recipient_role.eq.seller,recipient_role.is.null`).order('created_at', { ascending: false }),
      supabase.from('user_disqualifications').select('*').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('enquiries').select('*, properties(title, location)').eq('seller_id', user.id).order('created_at', { ascending: false }),
      supabase.from('seller_documents').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('profile_completed').eq('user_id', user.id).single(),
    ]);
    setProperties(propsRes.data || []);
    setBookings(bookingsRes.data || []);
    setComplaints(complaintsRes.data || []);
    setMessages(msgsRes.data || []);
    setDisqualified((disqRes.data || []).length > 0);
    setEnquiries(enquiriesRes.data || []);
    setSellerDocs(docsRes.data || []);
    setProfileComplete((profileRes.data as any)?.profile_completed ?? false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const uploadFiles = async (files: File[], bucket: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const path = `${user!.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
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
      if (imageFiles.length > 0) imageUrls = await uploadFiles(imageFiles, 'property-images');

      const amenitiesList = form.amenities.split(',').map(a => a.trim()).filter(Boolean);
      const rent = parseFloat(form.monthly_rent) || 0;
      const autoDeposit = form.security_deposit ? parseFloat(form.security_deposit) : rent * 2;

      const propertyData: any = {
        seller_id: user.id,
        title: form.title,
        description: form.description,
        location: form.location,
        price: rent,
        monthly_rent: rent,
        security_deposit: autoDeposit,
        maintenance_fee: parseFloat(form.maintenance_fee) || 0,
        min_rental_months: parseInt(form.min_rental_months) || 1,
        max_guests: parseInt(form.max_guests) || 1,
        amenities: amenitiesList,
        video_url: form.video_url || null,
        unit_type: form.unit_type,
        property_type: form.property_type,
        society_name: form.society_name || null,
        brokerage: parseFloat(form.brokerage) || 0,
        ...(imageUrls.length > 0 ? { images: imageUrls } : {}),
        ...(!editingId ? { verification_status: 'pending' } : {}),
      };

      let propertyId = editingId;

      if (editingId) {
        await supabase.from('properties').update(propertyData).eq('id', editingId);
        toast.success('Property updated!');
      } else {
        const { data } = await supabase.from('properties').insert(propertyData).select().single();
        propertyId = data?.id;
        toast.success('Property submitted for verification!');
      }

      if (docFiles.length > 0 && propertyId) {
        const docUrls = await uploadFiles(docFiles, 'verification-docs');
        for (const url of docUrls) {
          await supabase.from('property_documents').insert({
            property_id: propertyId, seller_id: user.id, document_type: 'verification', document_url: url,
          });
        }
      }

      setForm({ title: '', description: '', location: '', monthly_rent: '', security_deposit: '', maintenance_fee: '', min_rental_months: '1', max_guests: '1', amenities: '', video_url: '', unit_type: '1BHK', property_type: 'Family', society_name: '', brokerage: '' });
      setImageFiles([]); setDocFiles([]); setShowForm(false); setEditingId(null);
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
      title: p.title, description: p.description || '', location: p.location,
      monthly_rent: String(p.monthly_rent || p.price || ''),
      security_deposit: String(p.security_deposit || ''),
      maintenance_fee: String(p.maintenance_fee || ''),
      min_rental_months: String(p.min_rental_months || '1'),
      max_guests: String(p.max_guests), amenities: (p.amenities || []).join(', '),
      video_url: p.video_url || '',
      unit_type: p.unit_type || '1BHK', property_type: p.property_type || 'Family',
      society_name: p.society_name || '', brokerage: String(p.brokerage || ''),
    });
    setShowForm(true);
  };

  const updateEnquiryStatus = async (id: string, status: 'accepted' | 'rejected') => {
    await supabase.from('enquiries').update({ status }).eq('id', id);
    toast.success(`Enquiry ${status}`);
    fetchData();
  };

  const uploadSellerDoc = async () => {
    if (!sellerDocFile || !user) return;
    setUploadingDoc(true);
    try {
      const urls = await uploadFiles([sellerDocFile], 'verification-docs');
      if (urls.length > 0) {
        await supabase.from('seller_documents').insert({
          seller_id: user.id, document_type: sellerDocType, document_url: urls[0],
        });
        toast.success('Document uploaded');
        setSellerDocFile(null);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const totalRevenue = bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.total_price || 0), 0);
  const statusIcon = (s: string) => s === 'approved' ? <ShieldCheck className="h-4 w-4 text-success" /> : s === 'rejected' ? <XCircle className="h-4 w-4 text-destructive" /> : <Clock className="h-4 w-4 text-warning" />;
  const availBadge = (s: string) => s === 'available' ? <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">🟢 Available</span> : <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">🔴 Not Available</span>;

  const docVerificationStatus = () => {
    if (sellerDocs.length === 0) return 'none';
    if (sellerDocs.every(d => d.verification_status === 'verified')) return 'verified';
    if (sellerDocs.some(d => d.verification_status === 'rejected')) return 'rejected';
    return 'pending';
  };

  if (profileComplete === null) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="min-h-screen bg-background">
      {profileComplete === false && <ProfileCompletionModal userRole="seller" onComplete={() => { setProfileComplete(true); fetchData(); }} />}

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">Host Dashboard</h1>
          {!disqualified && (
            <Button onClick={() => { setShowForm(true); setEditingId(null); setForm({ title: '', description: '', location: '', monthly_rent: '', security_deposit: '', maintenance_fee: '', min_rental_months: '1', max_guests: '1', amenities: '', video_url: '', unit_type: '1BHK', property_type: 'Family', society_name: '', brokerage: '' }); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Property
            </Button>
          )}
        </div>

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

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: BarChart3 },
            { label: 'Active Listings', value: properties.filter(p => p.verification_status === 'approved').length, icon: Home },
            { label: 'Bookings', value: bookings.length, icon: Calendar },
            { label: 'Pending', value: properties.filter(p => p.verification_status === 'pending').length, icon: Clock },
            { label: 'Enquiries', value: enquiries.filter(e => e.status === 'pending').length, icon: MessageSquare },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><stat.icon className="h-5 w-5 text-primary" /></div>
                <div><p className="text-sm text-muted-foreground">{stat.label}</p><p className="font-heading text-xl font-bold">{stat.value}</p></div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Property Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/20 backdrop-blur-sm">
            <div className="mx-4 my-8 w-full max-w-lg rounded-2xl bg-card p-6 shadow-elevated max-h-[90vh] overflow-y-auto">
              <h2 className="mb-4 font-heading text-lg font-bold">{editingId ? 'Edit Property' : 'Add New Property'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Unit Type</Label>
                    <Select value={form.unit_type} onValueChange={v => setForm({ ...form, unit_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1RK">1RK</SelectItem>
                        <SelectItem value="1BHK">1BHK</SelectItem>
                        <SelectItem value="2BHK">2BHK</SelectItem>
                        <SelectItem value="3BHK">3BHK</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Property Type</Label>
                    <Select value={form.property_type} onValueChange={v => setForm({ ...form, property_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Family">Family</SelectItem>
                        <SelectItem value="Bachelor">Bachelor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Society / Apartment Name</Label><Input value={form.society_name} onChange={e => setForm({ ...form, society_name: e.target.value })} placeholder="e.g. Blue Ridge" /></div>
                  <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Monthly Rent (₹)</Label><Input type="number" value={form.monthly_rent} onChange={e => { const rent = e.target.value; setForm({ ...form, monthly_rent: rent, security_deposit: form.security_deposit || String((parseFloat(rent) || 0) * 2) }); }} required /></div>
                  <div><Label>Security Deposit (₹)</Label><Input type="number" value={form.security_deposit} onChange={e => setForm({ ...form, security_deposit: e.target.value })} placeholder="Auto: 2x rent" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Brokerage (₹)</Label><Input type="number" value={form.brokerage} onChange={e => setForm({ ...form, brokerage: e.target.value })} placeholder="0" /></div>
                  <div><Label>Maintenance Fee (₹/mo)</Label><Input type="number" value={form.maintenance_fee} onChange={e => setForm({ ...form, maintenance_fee: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Min Rental (months)</Label><Input type="number" value={form.min_rental_months} onChange={e => setForm({ ...form, min_rental_months: e.target.value })} /></div>
                  <div><Label>Max Guests</Label><Input type="number" value={form.max_guests} onChange={e => setForm({ ...form, max_guests: e.target.value })} /></div>
                </div>
                <div><Label>Amenities (comma-separated)</Label><Input value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} placeholder="WiFi, AC, Parking" /></div>
                <div><Label>Video URL (optional)</Label><Input value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} /></div>
                <div><Label>Property Images</Label><Input type="file" multiple accept="image/*" onChange={e => setImageFiles(Array.from(e.target.files || []))} /></div>
                {!editingId && (
                  <div className="rounded-lg border border-dashed border-warning/50 bg-warning/5 p-3">
                    <Label className="flex items-center gap-2"><Upload className="h-4 w-4 text-warning" /> Verification Documents</Label>
                    <p className="mb-2 text-xs text-muted-foreground">Upload ownership proof, ID proof</p>
                    <Input type="file" multiple accept="image/*,.pdf" onChange={e => setDocFiles(Array.from(e.target.files || []))} />
                  </div>
                )}
                <div className="flex gap-3">
                  <Button type="submit" disabled={loading}>{loading ? 'Saving...' : editingId ? 'Update' : 'Submit for Verification'}</Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Tabs defaultValue="properties">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="properties" className="gap-2"><Home className="h-4 w-4" />Properties</TabsTrigger>
            <TabsTrigger value="enquiries" className="gap-2"><MessageSquare className="h-4 w-4" />Enquiries ({enquiries.filter(e => e.status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2"><Calendar className="h-4 w-4" />Bookings</TabsTrigger>
            <TabsTrigger value="documents" className="gap-2"><FileText className="h-4 w-4" />Documents</TabsTrigger>
            <TabsTrigger value="complaints" className="gap-2"><MessageSquare className="h-4 w-4" />Complaints</TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
            {properties.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No properties yet. Add your first listing!</div>
            ) : (
              <div className="space-y-4">
                {properties.map(p => (
                  <div key={p.id} className="flex items-center gap-4 rounded-xl border p-4">
                    <img src={p.images?.[0] || '/placeholder.svg'} alt="" className="h-20 w-20 rounded-lg object-cover" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-heading font-semibold">{p.title}</p>
                        {statusIcon(p.verification_status)}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.verification_status === 'approved' ? 'bg-success/10 text-success' : p.verification_status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                          {p.verification_status}
                        </span>
                        {availBadge(p.availability_status || 'available')}
                      </div>
                      <p className="text-sm text-muted-foreground">{p.location} · {p.unit_type} · {p.property_type}</p>
                      <p className="text-sm font-medium">₹{(p.monthly_rent || p.price)?.toLocaleString()} / month</p>
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

          <TabsContent value="enquiries">
            {enquiries.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground"><MessageSquare className="mx-auto mb-3 h-8 w-8" />No enquiries yet</div>
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
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.status === 'accepted' ? 'bg-success/10 text-success' : e.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                          {e.status}
                        </span>
                        {e.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => updateEnquiryStatus(e.id, 'accepted')}><CheckCircle className="mr-1 h-3 w-3" /> Accept</Button>
                            <Button size="sm" variant="destructive" onClick={() => updateEnquiryStatus(e.id, 'rejected')}><X className="mr-1 h-3 w-3" /> Reject</Button>
                          </>
                        )}
                      </div>
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
                      {b.reference_id && <p className="text-xs text-muted-foreground">Ref: {b.reference_id}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-heading font-semibold">₹{b.total_price?.toLocaleString()}</p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${b.status === 'confirmed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents">
            <div className="space-y-6">
              {/* Document status banner */}
              <div className={`rounded-xl border p-4 ${docVerificationStatus() === 'verified' ? 'border-success/30 bg-success/5' : docVerificationStatus() === 'rejected' ? 'border-destructive/30 bg-destructive/5' : 'border-warning/30 bg-warning/5'}`}>
                <div className="flex items-center gap-2">
                  {docVerificationStatus() === 'verified' ? <ShieldCheck className="h-5 w-5 text-success" /> : docVerificationStatus() === 'rejected' ? <XCircle className="h-5 w-5 text-destructive" /> : <Clock className="h-5 w-5 text-warning" />}
                  <p className="font-semibold">
                    {docVerificationStatus() === 'verified' ? 'Documents Verified ✅' : docVerificationStatus() === 'rejected' ? 'Documents Rejected ❌' : docVerificationStatus() === 'none' ? 'No Documents Uploaded' : 'Documents Pending Review 🟡'}
                  </p>
                </div>
              </div>

              {/* Upload new doc */}
              <div className="max-w-md space-y-3 rounded-xl border p-4">
                <h3 className="font-heading font-semibold">Upload Document</h3>
                <Select value={sellerDocType} onValueChange={setSellerDocType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id_proof">ID Proof (Aadhaar/PAN)</SelectItem>
                    <SelectItem value="bank_details">Bank Details</SelectItem>
                    <SelectItem value="property_proof">Property Ownership Proof</SelectItem>
                    <SelectItem value="photo">Photo</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="file" accept="image/*,.pdf" onChange={e => setSellerDocFile(e.target.files?.[0] || null)} />
                <Button onClick={uploadSellerDoc} disabled={!sellerDocFile || uploadingDoc}>
                  {uploadingDoc ? 'Uploading...' : 'Upload'}
                </Button>
              </div>

              {/* Existing docs */}
              {sellerDocs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-heading font-semibold">Your Documents</h3>
                  {sellerDocs.map(d => (
                    <div key={d.id} className="flex items-center justify-between rounded-xl border p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium capitalize">{d.document_type.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(d.created_at), 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${d.verification_status === 'verified' ? 'bg-success/10 text-success' : d.verification_status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                          {d.verification_status}
                        </span>
                        {d.rejection_reason && <p className="text-xs text-destructive">{d.rejection_reason}</p>}
                        <a href={d.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">View</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

        <SupportBanner />
      </div>
    </div>
  );
};

export default SellerDashboard;
