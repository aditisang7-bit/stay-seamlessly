import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ShieldCheck, XCircle, Clock, Eye, Ban, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import SupportBanner from '@/components/SupportBanner';

const PropertyCheckerDashboard = () => {
  const { user } = useAuth();
  const [pendingProps, setPendingProps] = useState<any[]>([]);
  const [approvedProps, setApprovedProps] = useState<any[]>([]);
  const [rejectedProps, setRejectedProps] = useState<any[]>([]);
  const [docsByProp, setDocsByProp] = useState<Record<string, any[]>>({});
  const [sellers, setSellers] = useState<any[]>([]);
  const [disqualifications, setDisqualifications] = useState<any[]>([]);

  // Disqualify state
  const [disqUserId, setDisqUserId] = useState('');
  const [disqReason, setDisqReason] = useState('');

  const fetchData = async () => {
    const [propsRes, sellersRes, disqRes] = await Promise.all([
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
      supabase.from('user_disqualifications').select('*').order('created_at', { ascending: false }),
    ]);

    const props = propsRes.data || [];
    setPendingProps(props.filter(p => p.verification_status === 'pending'));
    setApprovedProps(props.filter(p => p.verification_status === 'approved'));
    setRejectedProps(props.filter(p => p.verification_status === 'rejected'));
    setSellers(sellersRes.data || []);
    setDisqualifications(disqRes.data || []);

    const pendingIds = props.filter(p => p.verification_status === 'pending').map(p => p.id);
    if (pendingIds.length > 0) {
      const { data: docs } = await supabase.from('property_documents').select('*').in('property_id', pendingIds);
      const grouped: Record<string, any[]> = {};
      (docs || []).forEach(d => { if (!grouped[d.property_id]) grouped[d.property_id] = []; grouped[d.property_id].push(d); });
      setDocsByProp(grouped);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getSellerName = (sellerId: string) => sellers.find(s => s.user_id === sellerId)?.name || 'Unknown';

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

  const disqualifyUser = async () => {
    if (!disqUserId || !disqReason) { toast.error('Select user and enter reason'); return; }
    await supabase.from('user_disqualifications').insert({ user_id: disqUserId, disqualified_by: user!.id, reason: disqReason });
    await logAction('disqualify_user', 'user', disqUserId, { reason: disqReason });
    toast.success('User disqualified');
    setDisqUserId(''); setDisqReason('');
    fetchData();
  };

  const renderPropertyCard = (p: any, showActions: boolean) => (
    <div key={p.id} className="rounded-xl border p-4">
      <div className="flex items-center gap-4">
        <img src={p.images?.[0] || '/placeholder.svg'} alt="" className="h-20 w-20 rounded-lg object-cover" />
        <div className="flex-1">
          <p className="font-heading font-semibold">{p.title}</p>
          <p className="text-sm text-muted-foreground">{p.location} · ₹{(p.monthly_rent || p.price)?.toLocaleString()}/mo</p>
          <p className="text-xs text-muted-foreground">Seller: {getSellerName(p.seller_id)} · Deposit: ₹{(p.security_deposit || 0).toLocaleString()}</p>
        </div>
        {showActions && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => updateVerification(p.id, 'approved')}><CheckCircle className="mr-1 h-3 w-3" />Approve</Button>
            <Button size="sm" variant="destructive" onClick={() => updateVerification(p.id, 'rejected')}><XCircle className="mr-1 h-3 w-3" />Reject</Button>
          </div>
        )}
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
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 font-heading text-2xl font-bold">Property Checker Dashboard</h1>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Pending', value: pendingProps.length, icon: Clock, color: 'text-warning' },
            { label: 'Approved', value: approvedProps.length, icon: ShieldCheck, color: 'text-success' },
            { label: 'Rejected', value: rejectedProps.length, icon: XCircle, color: 'text-destructive' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                <div><p className="text-sm text-muted-foreground">{s.label}</p><p className="font-heading text-xl font-bold">{s.value}</p></div>
              </div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="gap-2"><Clock className="h-4 w-4" />Pending ({pendingProps.length})</TabsTrigger>
            <TabsTrigger value="approved" className="gap-2"><ShieldCheck className="h-4 w-4" />Approved</TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2"><XCircle className="h-4 w-4" />Rejected</TabsTrigger>
            <TabsTrigger value="disqualify" className="gap-2"><Ban className="h-4 w-4" />Disqualify User</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingProps.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No properties pending verification</div>
            ) : (
              <div className="space-y-4">{pendingProps.map(p => renderPropertyCard(p, true))}</div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {approvedProps.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No approved properties</div>
            ) : (
              <div className="space-y-4">{approvedProps.map(p => renderPropertyCard(p, false))}</div>
            )}
          </TabsContent>

          <TabsContent value="rejected">
            {rejectedProps.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No rejected properties</div>
            ) : (
              <div className="space-y-4">{rejectedProps.map(p => renderPropertyCard(p, false))}</div>
            )}
          </TabsContent>

          <TabsContent value="disqualify">
            <div className="max-w-md space-y-4 rounded-xl border p-6">
              <h3 className="font-heading font-semibold">Disqualify User</h3>
              <Select value={disqUserId} onValueChange={setDisqUserId}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>{sellers.map(u => <SelectItem key={u.user_id} value={u.user_id}>{u.name} ({u.email})</SelectItem>)}</SelectContent>
              </Select>
              <Select value={disqReason} onValueChange={setDisqReason}>
                <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fraud activity">Fraud activity</SelectItem>
                  <SelectItem value="Fake listing">Fake listing</SelectItem>
                  <SelectItem value="Invalid documents">Invalid documents</SelectItem>
                  <SelectItem value="Misuse of platform">Misuse of platform</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="destructive" onClick={disqualifyUser}><Ban className="mr-2 h-4 w-4" />Disqualify User</Button>

              {disqualifications.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-heading text-sm font-semibold">Flagged Users</h4>
                  {disqualifications.map(d => (
                    <div key={d.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{sellers.find(s => s.user_id === d.user_id)?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{d.reason}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${d.status === 'active' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>{d.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <SupportBanner />
      </div>
    </div>
  );
};

export default PropertyCheckerDashboard;
