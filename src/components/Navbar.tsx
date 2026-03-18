import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, User, LogOut, Heart, Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  seller: 'Seller',
  buyer: 'Buyer',
  property_checker: 'Checker',
};

const ROLE_DASHBOARD: Record<string, string> = {
  super_admin: '/super-admin',
  admin: '/admin',
  property_checker: '/checker',
  seller: '/seller',
  buyer: '/buyer',
};

const Navbar = () => {
  const { user, profile, role, allRoles, activeMode, setActiveMode, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const canSwitchRoles = allRoles.some(r => r === 'super_admin' || r === 'admin');

  const switchableRoles = (() => {
    if (allRoles.includes('super_admin')) return ['super_admin', 'admin', 'seller'];
    if (allRoles.includes('admin')) return ['admin', 'seller'];
    return [];
  })();

  const currentMode = activeMode || role || 'buyer';
  const dashboardPath = ROLE_DASHBOARD[currentMode] || '/buyer';

  const handleModeChange = (mode: string) => {
    setActiveMode(mode);
    navigate(ROLE_DASHBOARD[mode] || '/buyer');
  };

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
              {canSwitchRoles && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <Select value={currentMode} onValueChange={handleModeChange}>
                    <SelectTrigger className="h-8 w-[140px] border-primary/30 bg-primary/5 text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {switchableRoles.map(r => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
                {canSwitchRoles && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <Select value={currentMode} onValueChange={(v) => { handleModeChange(v); setMobileOpen(false); }}>
                      <SelectTrigger className="h-8 flex-1 border-primary/30 bg-primary/5 text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {switchableRoles.map(r => (
                          <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
