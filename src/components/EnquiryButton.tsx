import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MessageSquare, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EnquiryButtonProps {
  propertyId: string;
  sellerId: string;
  propertyTitle: string;
}

const EnquiryButton = ({ propertyId, sellerId, propertyTitle }: EnquiryButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!message.trim()) { toast.error('Please enter a message'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.from('enquiries').insert({
        buyer_id: user.id,
        property_id: propertyId,
        seller_id: sellerId,
        message: message.trim(),
      });
      if (error) throw error;
      toast.success('Enquiry sent! The owner will respond soon.');
      setMessage('');
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send enquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" className="w-full gap-2" onClick={() => user ? setShowForm(true) : navigate('/auth')}>
        <MessageSquare className="h-4 w-4" /> Send Enquiry
      </Button>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-elevated">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading font-semibold">Enquiry for {propertyTitle}</h3>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Hi, I'm interested in this property. When can I visit?"
              rows={4}
              className="mb-4"
            />
            <div className="flex gap-3">
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? 'Sending...' : 'Send Enquiry'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnquiryButton;
