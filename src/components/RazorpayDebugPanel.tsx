import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, Bug } from 'lucide-react';
import { format } from 'date-fns';

const RAZORPAY_KEY = 'rzp_live_SP7mhMxAuk9Izg';

const RazorpayDebugPanel = () => {
  const [lastPayment, setLastPayment] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const isLive = RAZORPAY_KEY.startsWith('rzp_live_');
  const isTest = RAZORPAY_KEY.startsWith('rzp_test_');

  useEffect(() => {
    supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => { if (data?.[0]) setLastPayment(data[0]); });
  }, []);

  return (
    <div className="mt-6 rounded-xl border p-4">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-muted-foreground" />
          <span className="font-heading text-sm font-semibold">Razorpay Debug Panel</span>
        </div>
        <span className="text-xs text-muted-foreground">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            {isLive ? (
              <><CheckCircle className="h-4 w-4 text-success" /><span className="font-medium text-success">LIVE Mode</span></>
            ) : isTest ? (
              <><AlertTriangle className="h-4 w-4 text-warning" /><span className="font-medium text-warning">TEST Mode — Payments are NOT real</span></>
            ) : (
              <><AlertTriangle className="h-4 w-4 text-destructive" /><span className="font-medium text-destructive">Unknown key format</span></>
            )}
          </div>
          <div className="rounded-lg bg-secondary p-3">
            <p className="text-xs text-muted-foreground">Key ID</p>
            <p className="font-mono text-xs">{RAZORPAY_KEY.slice(0, 12)}...{RAZORPAY_KEY.slice(-4)}</p>
          </div>
          {lastPayment && (
            <>
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground">Last Order</p>
                <p className="font-mono text-xs">{lastPayment.razorpay_order_id || 'N/A'}</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground">Last Payment</p>
                <p className="font-mono text-xs">{lastPayment.razorpay_payment_id || 'N/A'}</p>
                <p className="text-xs text-muted-foreground mt-1">Status: {lastPayment.status} · ₹{lastPayment.amount?.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(lastPayment.created_at), 'MMM dd, yyyy HH:mm')}</p>
              </div>
              {(lastPayment.razorpay_payment_id?.includes('test') || lastPayment.razorpay_order_id?.includes('test')) && (
                <div className="flex items-center gap-2 rounded-lg bg-warning/10 p-3 text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-medium">⚠ Last payment was in TEST MODE. Switch to LIVE Razorpay keys.</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RazorpayDebugPanel;
