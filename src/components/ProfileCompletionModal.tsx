import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { UserCircle } from 'lucide-react';

interface ProfileCompletionModalProps {
  userRole: string;
  onComplete: () => void;
}

const ProfileCompletionModal = ({ userRole, onComplete }: ProfileCompletionModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    location_preferred: '',
    budget_min: '',
    budget_max: '',
    move_in_date: '',
    toilet_type: 'western',
    kitchen_type: 'trolley',
    parking_type: 'none',
    has_corridor: false,
    has_backup: false,
    furnishing_preference: 'semi-furnished',
  });

  useEffect(() => {
    const loadExisting = async () => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      if (data) {
        setForm(prev => ({
          ...prev,
          name: data.name || '',
          location_preferred: (data as any).location_preferred || '',
          budget_min: String((data as any).budget_min || ''),
          budget_max: String((data as any).budget_max || ''),
          move_in_date: (data as any).move_in_date || '',
          toilet_type: (data as any).toilet_type || 'western',
          kitchen_type: (data as any).kitchen_type || 'trolley',
          parking_type: (data as any).parking_type || 'none',
          has_corridor: (data as any).has_corridor || false,
          has_backup: (data as any).has_backup || false,
          furnishing_preference: (data as any).furnishing_preference || 'semi-furnished',
        }));
      }
    };
    loadExisting();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim()) { toast.error('Name is required'); return; }

    setLoading(true);
    try {
      const updateData: any = {
        name: form.name,
        profile_completed: true,
      };

      if (userRole === 'buyer') {
        if (!form.location_preferred || !form.budget_min) {
          toast.error('Please fill all required fields');
          setLoading(false);
          return;
        }
        updateData.location_preferred = form.location_preferred;
        updateData.budget_min = parseFloat(form.budget_min) || 0;
        updateData.budget_max = parseFloat(form.budget_max) || 0;
        updateData.move_in_date = form.move_in_date || null;
        updateData.toilet_type = form.toilet_type;
        updateData.kitchen_type = form.kitchen_type;
        updateData.parking_type = form.parking_type;
        updateData.has_corridor = form.has_corridor;
        updateData.has_backup = form.has_backup;
        updateData.furnishing_preference = form.furnishing_preference;
      }

      const { error } = await supabase.from('profiles').update(updateData).eq('user_id', user.id);
      if (error) throw error;
      toast.success('Profile completed!');
      onComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-foreground/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-elevated max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center gap-3">
          <UserCircle className="h-8 w-8 text-primary" />
          <div>
            <h2 className="font-heading text-lg font-bold">Complete Your Profile</h2>
            <p className="text-sm text-muted-foreground">Please fill in the required details to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Full Name *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>

          {userRole === 'buyer' && (
            <>
              <div>
                <Label>Preferred Location *</Label>
                <Input value={form.location_preferred} onChange={e => setForm({ ...form, location_preferred: e.target.value })} placeholder="e.g. Hinjewadi, Kharadi, Baner" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Budget (₹) *</Label>
                  <Input type="number" value={form.budget_min} onChange={e => setForm({ ...form, budget_min: e.target.value })} placeholder="5000" required />
                </div>
                <div>
                  <Label>Max Budget (₹)</Label>
                  <Input type="number" value={form.budget_max} onChange={e => setForm({ ...form, budget_max: e.target.value })} placeholder="25000" />
                </div>
              </div>
              <div>
                <Label>Move-in Date</Label>
                <Input type="date" value={form.move_in_date} onChange={e => setForm({ ...form, move_in_date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Toilet Type</Label>
                  <Select value={form.toilet_type} onValueChange={v => setForm({ ...form, toilet_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="western">Western</SelectItem>
                      <SelectItem value="indian">Indian</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kitchen Type</Label>
                  <Select value={form.kitchen_type} onValueChange={v => setForm({ ...form, kitchen_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trolley">Trolley</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Parking</Label>
                  <Select value={form.parking_type} onValueChange={v => setForm({ ...form, parking_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="2w">2-Wheeler</SelectItem>
                      <SelectItem value="4w">4-Wheeler</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Furnishing</Label>
                  <Select value={form.furnishing_preference} onValueChange={v => setForm({ ...form, furnishing_preference: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="furnished">Furnished</SelectItem>
                      <SelectItem value="semi-furnished">Semi-Furnished</SelectItem>
                      <SelectItem value="unfurnished">Unfurnished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox checked={form.has_corridor} onCheckedChange={v => setForm({ ...form, has_corridor: !!v })} />
                  <Label className="cursor-pointer">Corridor</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={form.has_backup} onCheckedChange={v => setForm({ ...form, has_backup: !!v })} />
                  <Label className="cursor-pointer">Power Backup</Label>
                </div>
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Complete Profile'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProfileCompletionModal;
