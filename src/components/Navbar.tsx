import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, User, LogOut, Heart, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const dashboardPath = role === 'super_admin' ? '/super-admin' : role === 'admin' ? '/admin' : role === 'property_checker' ? '/checker' : role === 'seller' ? '/seller' : '/buyer';

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Home className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold">RentMeAbhi</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-4 md:flex">
          <Link to="/properties" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
            Browse
          </Link>
          {user ? (
            <>
              <Link to={dashboardPath} className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
                Dashboard
              </Link>
              <Link to="/favorites" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
                <Heart className="h-4 w-4" />
              </Link>
              <div className="flex items-center gap-2 rounded-full border px-3 py-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{profile?.name || 'User'}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/auth')}>Log in</Button>
              <Button onClick={() => navigate('/auth?mode=signup')}>Sign up</Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/properties" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Browse</Link>
            {user ? (
              <>
                <Link to={dashboardPath} className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                <Link to="/favorites" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Favorites</Link>
                <button className="text-left text-sm font-medium text-destructive" onClick={handleSignOut}>Sign out</button>
              </>
            ) : (
              <>
                <Link to="/auth" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Log in</Link>
                <Link to="/auth?mode=signup" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
