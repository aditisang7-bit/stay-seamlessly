import { Link } from 'react-router-dom';
import { Home, MessageCircle, Facebook } from 'lucide-react';
import WhatsAppCTA from './WhatsAppCTA';

const PUNE_AREAS = [
  { name: 'Hinjewadi', slug: 'hinjewadi' },
  { name: 'Kharadi', slug: 'kharadi' },
  { name: 'Viman Nagar', slug: 'viman-nagar' },
  { name: 'Wakad', slug: 'wakad' },
  { name: 'Baner', slug: 'baner' },
  { name: 'Magarpatta', slug: 'magarpatta' },
];

const Footer = () => (
  <footer className="border-t bg-secondary/30">
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 md:grid-cols-4">
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold">RentMeAbhi</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            Pune's trusted rental marketplace. Find apartments, PGs, and short-stay homes across Pune.
          </p>
        </div>

        {/* Pune Areas */}
        <div>
          <h4 className="mb-3 font-heading font-semibold">Rent in Pune</h4>
          <ul className="space-y-2 text-sm">
            {PUNE_AREAS.map(a => (
              <li key={a.slug}>
                <Link to={`/rent/pune/${a.slug}`} className="text-muted-foreground transition hover:text-foreground">
                  Rentals in {a.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="mb-3 font-heading font-semibold">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/properties" className="text-muted-foreground transition hover:text-foreground">Browse Properties</Link></li>
            <li><Link to="/auth?mode=signup" className="text-muted-foreground transition hover:text-foreground">Become a Host</Link></li>
            <li><Link to="/rent/pune" className="text-muted-foreground transition hover:text-foreground">Rent in Pune</Link></li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h4 className="mb-3 font-heading font-semibold">Stay Connected</h4>
          <div className="space-y-3">
            <WhatsAppCTA />
            <a href="https://www.facebook.com/share/1CCE2YcXar/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
              <Facebook className="h-4 w-4" /> Follow on Facebook
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} RentMeAbhi by Abhijeet Construction. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
