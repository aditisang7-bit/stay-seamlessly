import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Home, MessageSquare, Calendar, ShieldCheck, CreditCard, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import RazorpayDebugPanel from '@/components/RazorpayDebugPanel';
import SupportBanner from '@/components/SupportBanner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ properties: 0, bookings: 0, revenue: 0, pendingVerification: 0 });
  const [complaints, setComplaints] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [pendingProps, setPendingProps] = useState<any[]>([]);
  const [docsByProp, setDocsByProp] = useState<Record<string, any[]>>({});
  const [users, setUsers] = useState<any[]>([]);

  // Messaging state
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgTarget, setMsgTarget] = useState<'all' | 'buyer' | 'seller' | 'individual'>('all');
  const [msgRecipientId, setMsgRecipientId] = useState('');

  const fetchData = async () => {
    const [propsRes, bookingsRes, complaintsRes, paymentsRes, usersRes] = await Promise.all([
      supabase.from('properties').select('*'),
      supabase.from('bookings').select('*, properties(title)'),
      supabase.from('complaints').select('*, properties(title)'),
      supabase.from('payments').select('*, bookings(reference_id, properties(title))'),
      supabase.from('profiles').select('*'),
    ]);

    const props = propsRes.data || [];
    const books = bookingsRes.data || [];
    const comps = complaintsRes.data || [];
    const pays = paymentsRes.data || [];

    const pending = props.filter(p => p.verification_status === 'pending');
    const revenue = books.filter(b => b.status === 'confirmed').reduce((s, b) => s + (b.total_price || 0), 0);

    setProperties(props);
    setBookings(books);
    setComplaints(comps);
    setPayments(pays);
    setPendingProps(pending);
    setUsers(usersRes.data || []);
    setStats({ properties: props.length, bookings: books.length, revenue, pendingVerification: pending.length });

    if (pending.length > 0) {
      const { data: docs } = await supabase.from('property_documents').select('*').in('property_id', pending.map(p => p.id));
      const grouped: Record<string, any[]> = {};
      (docs || []).forEach(d => { if (!grouped[d.property_id]) grouped[d.property_id] = []; grouped[d.property_id].push(d); });
      setDocsByProp(grouped);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const updateVerification = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('properties').update({ verification_status: status }).eq('id', id);
    if (user) await supabase.from('audit_logs').insert({ user_id: user.id, action: `property_${status}`, target_type: 'property', target_id: id });
    toast.success(`Property ${status}`);
    fetchData();
  };

  const resolveComplaint = async (id: string) => {
    await supabase.from('complaints').update({ status: 'resolved' }).eq('id', id);
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'resolved' } : c));
    toast.success('Complaint resolved');
  };

  const sendMessage = async () => {
    if (!msgSubject || !msgBody) { toast.error('Fill in subject and message'); return; }
    const payload: any = { sender_id: user!.id, subject: msgSubject, message: msgBody };
    if (msgTarget === 'individual') payload.recipient_id = msgRecipientId;
    else if (msgTarget !== 'all') payload.recipient_role = msgTarget;
    await supabase.from('admin_messages').insert(payload);
    toast.success('Message sent');
    setMsgSubject(''); setMsgBody('');
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
            { label: 'Pending Verification', value: stats.pendingVerification, icon: ShieldCheck },
          ].map(s => (
            <div key={s.label} className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><s.icon className="h-5 w-5 text-primary" /></div>
                <div><p className="text-sm text-muted-foreground">{s.label}</p><p className="font-heading text-xl font-bold">{s.value}</p></div>
              </div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="verification">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="verification" className="gap-2"><ShieldCheck className="h-4 w-4" />Verification</TabsTrigger>
            <TabsTrigger value="complaints" className="gap-2"><MessageSquare className="h-4 w-4" />Complaints</TabsTrigger>
            <TabsTrigger value="payments" className="gap-2"><CreditCard className="h-4 w-4" />Payments</TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2"><Calendar className="h-4 w-4" />Bookings</TabsTrigger>
            <TabsTrigger value="messages" className="gap-2"><MessageSquare className="h-4 w-4" />Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="verification">
            {pendingProps.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No properties pending verification</div>
            ) : (
              <div className="space-y-4">
                {pendingProps.map(p => (
                  <div key={p.id} className="rounded-xl border p-4">
                    <div className="flex items-center gap-4">
                      <img src={p.images?.[0] || '/placeholder.svg'} alt="" className="h-20 w-20 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="font-heading font-semibold">{p.title}</p>
                        <p className="text-sm text-muted-foreground">{p.location} · ₹{(p.monthly_rent || p.price)?.toLocaleString()}/month</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateVerification(p.id, 'approved')}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => updateVerification(p.id, 'rejected')}>Reject</Button>
                      </div>
                    </div>
                    {docsByProp[p.id]?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {docsByProp[p.id].map(d => (
                          <a key={d.id} href={d.document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-secondary">
                            <Eye className="h-3 w-3" /> {d.document_type}
                          </a>
                        ))}
                      </div>
                    )}
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

          <TabsContent value="payments">
            {payments.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No payment records</div>
            ) : (
              <div className="overflow-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-heading font-semibold">₹{p.amount?.toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs">{p.razorpay_order_id || 'N/A'}</TableCell>
                        <TableCell className="font-mono text-xs">{p.razorpay_payment_id || 'N/A'}</TableCell>
                        <TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{p.status}</span></TableCell>
                        <TableCell className="text-muted-foreground">{format(new Date(p.created_at), 'MMM dd, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <RazorpayDebugPanel />
          </TabsContent>

          <TabsContent value="bookings">
            <div className="space-y-4">
              {bookings.map(b => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="font-heading font-semibold">{b.properties?.title || 'Property'}</p>
                    <p className="text-xs text-muted-foreground">Ref: {b.reference_id || b.id.slice(0, 8)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-semibold">₹{b.total_price?.toLocaleString()}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.status === 'confirmed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <div className="max-w-lg space-y-4 rounded-xl border p-6">
              <h3 className="font-heading font-semibold">Send Message</h3>
              <Select value={msgTarget} onValueChange={v => setMsgTarget(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="buyer">All Buyers</SelectItem>
                  <SelectItem value="seller">All Sellers</SelectItem>
                  <SelectItem value="individual">Individual User</SelectItem>
                </SelectContent>
              </Select>
              {msgTarget === 'individual' && (
                <Select value={msgRecipientId} onValueChange={setMsgRecipientId}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>{users.map(u => <SelectItem key={u.user_id} value={u.user_id}>{u.name} ({u.email})</SelectItem>)}</SelectContent>
                </Select>
              )}
              <Input placeholder="Subject" value={msgSubject} onChange={e => setMsgSubject(e.target.value)} />
              <Textarea placeholder="Message" value={msgBody} onChange={e => setMsgBody(e.target.value)} rows={4} />
              <Button onClick={sendMessage}>Send Message</Button>
            </div>
          </TabsContent>
        </Tabs>

        <SupportBanner />
      </div>
    </div>
  );
};

export default AdminDashboard;
