import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { BarChart3, Users, Home, Calendar, CreditCard, ShieldCheck, MessageSquare, Eye, Settings, ScrollText, Ban, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import SupportBanner from '@/components/SupportBanner';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ properties: 0, users: 0, bookings: 0, revenue: 0, pending: 0 });
  const [properties, setProperties] = useState<any[]>([]);
  const [pendingProps, setPendingProps] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [disqualifications, setDisqualifications] = useState<any[]>([]);
  const [docsByProp, setDocsByProp] = useState<Record<string, any[]>>({});

  // Messaging state
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgTarget, setMsgTarget] = useState<'all' | 'buyer' | 'seller' | 'individual'>('all');
  const [msgRecipientId, setMsgRecipientId] = useState('');

  // Role creation
  const [newRoleEmail, setNewRoleEmail] = useState('');
  const [newRolePassword, setNewRolePassword] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleType, setNewRoleType] = useState<string>('admin');

  // Feature access
  const [featureUserId, setFeatureUserId] = useState('');
  const [featureName, setFeatureName] = useState('');
  const [featureEnabled, setFeatureEnabled] = useState(true);

  const fetchData = async () => {
    const [propsRes, bookingsRes, paymentsRes, usersRes, rolesRes, logsRes, disqRes] = await Promise.all([
      supabase.from('properties').select('*'),
      supabase.from('bookings').select('*, properties(title)'),
      supabase.from('payments').select('*, bookings(reference_id, properties(title))'),
      supabase.from('profiles').select('*'),
      supabase.from('user_roles').select('*'),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('user_disqualifications').select('*').order('created_at', { ascending: false }),
    ]);

    const props = propsRes.data || [];
    const books = bookingsRes.data || [];
    const pays = paymentsRes.data || [];
    const allUsers = usersRes.data || [];
    const allRoles = rolesRes.data || [];
    const pending = props.filter(p => p.verification_status === 'pending');
    const revenue = books.filter(b => b.status === 'confirmed').reduce((s, b) => s + (b.total_price || 0), 0);

    setProperties(props);
    setPendingProps(pending);
    setBookings(books);
    setPayments(pays);
    setUsers(allUsers);
    setRoles(allRoles);
    setAuditLogs(logsRes.data || []);
    setDisqualifications(disqRes.data || []);
    setStats({ properties: props.length, users: allUsers.length, bookings: books.length, revenue, pending: pending.length });

    if (pending.length > 0) {
      const { data: docs } = await supabase.from('property_documents').select('*').in('property_id', pending.map(p => p.id));
      const grouped: Record<string, any[]> = {};
      (docs || []).forEach(d => { if (!grouped[d.property_id]) grouped[d.property_id] = []; grouped[d.property_id].push(d); });
      setDocsByProp(grouped);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getUserRole = (userId: string) => roles.find(r => r.user_id === userId)?.role || 'unknown';
  const getUserName = (userId: string) => users.find(u => u.user_id === userId)?.name || 'Unknown';

  const logAction = async (action: string, targetType: string, targetId?: string, details?: any) => {
    if (!user) return;
    await supabase.from('audit_logs').insert({ user_id: user.id, action, target_type: targetType, target_id: targetId, details });
  };

  const updateVerification = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('properties').update({ verification_status: status }).eq('id', id);
    await logAction(`property_${status}`, 'property', id);
    toast.success(`Property ${status}`);
    fetchData();
  };

  const sendMessage = async () => {
    if (!msgSubject || !msgBody) { toast.error('Fill in subject and message'); return; }
    const payload: any = { sender_id: user!.id, subject: msgSubject, message: msgBody };
    if (msgTarget === 'individual') {
      payload.recipient_id = msgRecipientId;
    } else if (msgTarget !== 'all') {
      payload.recipient_role = msgTarget;
    }
    await supabase.from('admin_messages').insert(payload);
    await logAction('send_message', 'message', undefined, { target: msgTarget });
    toast.success('Message sent');
    setMsgSubject(''); setMsgBody('');
  };

  const createRoleAccount = async () => {
    if (!newRoleEmail || !newRolePassword || !newRoleName) { toast.error('Fill all fields'); return; }
    try {
      const { data, error } = await supabase.auth.signUp({ email: newRoleEmail, password: newRolePassword, options: { data: { name: newRoleName } } });
      if (error) throw error;
      if (data.user) {
        await supabase.from('user_roles').insert({ user_id: data.user.id, role: newRoleType as any });
        await supabase.from('profiles').update({ name: newRoleName }).eq('user_id', data.user.id);
        await logAction('create_account', 'user', data.user.id, { role: newRoleType });
      }
      toast.success(`${newRoleType} account created`);
      setNewRoleEmail(''); setNewRolePassword(''); setNewRoleName('');
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const reactivateUser = async (disqId: string, userId: string) => {
    await supabase.from('user_disqualifications').update({ status: 'revoked' }).eq('id', disqId);
    await logAction('reactivate_user', 'user', userId);
    toast.success('User reactivated');
    fetchData();
  };

  const setFeatureAccess = async () => {
    if (!featureUserId || !featureName) { toast.error('Select user and feature'); return; }
    await supabase.from('host_feature_access').upsert({ user_id: featureUserId, feature_name: featureName, enabled: featureEnabled, updated_by: user!.id }, { onConflict: 'user_id,feature_name' });
    await logAction('set_feature_access', 'feature', featureUserId, { feature: featureName, enabled: featureEnabled });
    toast.success('Feature access updated');
  };

  const sellers = users.filter(u => getUserRole(u.user_id) === 'seller');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 font-heading text-2xl font-bold">Super Admin Dashboard</h1>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: BarChart3 },
            { label: 'Properties', value: stats.properties, icon: Home },
            { label: 'Users', value: stats.users, icon: Users },
            { label: 'Bookings', value: stats.bookings, icon: Calendar },
            { label: 'Pending', value: stats.pending, icon: ShieldCheck },
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
            <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" />Users</TabsTrigger>
            <TabsTrigger value="roles" className="gap-2"><UserPlus className="h-4 w-4" />Roles</TabsTrigger>
            <TabsTrigger value="messages" className="gap-2"><MessageSquare className="h-4 w-4" />Messages</TabsTrigger>
            <TabsTrigger value="features" className="gap-2"><Settings className="h-4 w-4" />Feature Control</TabsTrigger>
            <TabsTrigger value="payments" className="gap-2"><CreditCard className="h-4 w-4" />Payments</TabsTrigger>
            <TabsTrigger value="disqualified" className="gap-2"><Ban className="h-4 w-4" />Disqualified</TabsTrigger>
            <TabsTrigger value="audit" className="gap-2"><ScrollText className="h-4 w-4" />Audit Logs</TabsTrigger>
          </TabsList>

          {/* Verification Tab */}
          <TabsContent value="verification">
            {pendingProps.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No properties pending</div>
            ) : (
              <div className="space-y-4">
                {pendingProps.map(p => (
                  <div key={p.id} className="rounded-xl border p-4">
                    <div className="flex items-center gap-4">
                      <img src={p.images?.[0] || '/placeholder.svg'} alt="" className="h-20 w-20 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="font-heading font-semibold">{p.title}</p>
                        <p className="text-sm text-muted-foreground">{p.location} · ₹{(p.monthly_rent || p.price)?.toLocaleString()}/mo</p>
                        <p className="text-xs text-muted-foreground">Host: {getUserName(p.seller_id)}</p>
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

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="overflow-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell><span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{getUserRole(u.user_id)}</span></TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(u.created_at), 'MMM dd, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Role Creation Tab */}
          <TabsContent value="roles">
            <div className="max-w-md space-y-4 rounded-xl border p-6">
              <h3 className="font-heading font-semibold">Create Role Account</h3>
              <Input placeholder="Name" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} />
              <Input placeholder="Email" value={newRoleEmail} onChange={e => setNewRoleEmail(e.target.value)} />
              <Input type="password" placeholder="Password" value={newRolePassword} onChange={e => setNewRolePassword(e.target.value)} />
              <Select value={newRoleType} onValueChange={setNewRoleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="property_checker">Property Checker</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={createRoleAccount}>Create Account</Button>
            </div>
          </TabsContent>

          {/* Messages Tab */}
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

          {/* Feature Control Tab */}
          <TabsContent value="features">
            <div className="max-w-md space-y-4 rounded-xl border p-6">
              <h3 className="font-heading font-semibold">Host Feature Access</h3>
              <Select value={featureUserId} onValueChange={setFeatureUserId}>
                <SelectTrigger><SelectValue placeholder="Select host" /></SelectTrigger>
                <SelectContent>{sellers.map(u => <SelectItem key={u.user_id} value={u.user_id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={featureName} onValueChange={setFeatureName}>
                <SelectTrigger><SelectValue placeholder="Feature" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="property_upload">Property Upload</SelectItem>
                  <SelectItem value="video_upload">Video Upload</SelectItem>
                  <SelectItem value="pricing_edit">Pricing Edit</SelectItem>
                  <SelectItem value="slot_management">Slot Management</SelectItem>
                </SelectContent>
              </Select>
              <Select value={featureEnabled ? 'enabled' : 'disabled'} onValueChange={v => setFeatureEnabled(v === 'enabled')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={setFeatureAccess}>Update Access</Button>
            </div>
          </TabsContent>

          {/* Payments Tab */}
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
          </TabsContent>

          {/* Disqualified Users Tab */}
          <TabsContent value="disqualified">
            {disqualifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No disqualified users</div>
            ) : (
              <div className="space-y-4">
                {disqualifications.map(d => (
                  <div key={d.id} className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <p className="font-heading font-semibold">{getUserName(d.user_id)}</p>
                      <p className="text-sm text-muted-foreground">Reason: {d.reason}</p>
                      <p className="text-xs text-muted-foreground">By: {getUserName(d.disqualified_by)} · {format(new Date(d.created_at), 'MMM dd, yyyy')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${d.status === 'active' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>{d.status}</span>
                      {d.status === 'active' && <Button size="sm" onClick={() => reactivateUser(d.id, d.user_id)}>Reactivate</Button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            {auditLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No audit logs</div>
            ) : (
              <div className="overflow-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>{getUserName(log.user_id)}</TableCell>
                        <TableCell className="font-mono text-xs">{log.action}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{log.target_type}{log.target_id ? `: ${log.target_id.slice(0, 8)}` : ''}</TableCell>
                        <TableCell className="text-muted-foreground">{format(new Date(log.created_at), 'MMM dd HH:mm')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <SupportBanner />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
