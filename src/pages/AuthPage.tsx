import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Home } from 'lucide-react';

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const [isSignup, setIsSignup] = useState(searchParams.get('mode') === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        await signUp(email, password, name, role);
        toast.success('Account created! You can now sign in.');
        setIsSignup(false);
      } else {
        await signIn(email, password);
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Home className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup ? 'Join RentMeAbhi today' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border bg-card p-6 shadow-card">
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>

          {isSignup && (
            <div className="space-y-3">
              <Label>I want to</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`rounded-xl border-2 p-4 text-center transition ${role === 'buyer' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}
                >
                  <p className="font-heading font-semibold">Rent</p>
                  <p className="mt-1 text-xs text-muted-foreground">Find places to stay</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`rounded-xl border-2 p-4 text-center transition ${role === 'seller' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}
                >
                  <p className="font-heading font-semibold">Host</p>
                  <p className="mt-1 text-xs text-muted-foreground">List your property</p>
                </button>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => setIsSignup(!isSignup)}>
              {isSignup ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
