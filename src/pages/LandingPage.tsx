import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PropertyCard from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight, Shield, Star, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import heroImage from '@/assets/hero-property.jpg';
import { motion } from 'framer-motion';
import SEOHead from '@/components/SEOHead';
import FAQSection from '@/components/FAQSection';
import WhatsAppCTA from '@/components/WhatsAppCTA';
import Footer from '@/components/Footer';
import { PUNE_AREAS } from '@/data/puneAreas';

const LandingPage = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from('properties').select('*').order('created_at', { ascending: false }).limit(8)
      .then(({ data }) => setProperties(data || []));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/properties?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
        <img src={heroImage} alt="Luxury rental" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 mx-auto max-w-2xl px-4 text-center"
        >
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-primary-foreground md:text-6xl">
            Find your next<br />perfect stay
          </h1>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Discover unique homes and experiences across India
          </p>
          <form onSubmit={handleSearch} className="mt-8 flex items-center gap-2 rounded-full bg-background p-2 shadow-elevated">
            <Search className="ml-3 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Where do you want to go?"
              className="flex-1 border-0 bg-transparent focus-visible:ring-0"
            />
            <Button type="submit" className="rounded-full px-6">Search</Button>
          </form>
        </motion.div>
      </section>

      {/* Featured */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold">Featured Properties</h2>
            <p className="mt-1 text-muted-foreground">Handpicked rentals for you</p>
          </div>
          <Link to="/properties" className="group flex items-center gap-1 text-sm font-medium text-primary">
            View all <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </div>

        {properties.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <p className="text-muted-foreground">No properties listed yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">Be the first to list your property!</p>
            <Button className="mt-4" onClick={() => navigate('/auth?mode=signup')}>Get Started</Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.map(p => (
              <PropertyCard
                key={p.id}
                id={p.id}
                title={p.title}
                location={p.location}
                price={p.price}
                images={p.images}
                rating={p.rating || 0}
                reviewCount={p.review_count || 0}
              />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-secondary/50">
        <div className="container mx-auto grid gap-8 px-4 py-16 md:grid-cols-2">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-glow p-8 text-primary-foreground">
            <h3 className="font-heading text-2xl font-bold">Earn from your rentals</h3>
            <p className="mt-3 text-primary-foreground/80">List your property and start earning. Join thousands of hosts on RentMeAbhi.</p>
            <Button variant="secondary" className="mt-6" onClick={() => navigate('/auth?mode=signup')}>
              Become a Host <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="rounded-2xl border bg-card p-8">
            <h3 className="font-heading text-2xl font-bold">Find your perfect stay</h3>
            <p className="mt-3 text-muted-foreground">Browse verified properties with instant booking and secure payments.</p>
            <Button className="mt-6" onClick={() => navigate('/properties')}>
              Browse Properties <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="font-heading font-bold">RentMeAbhi</p>
            <p className="text-sm text-muted-foreground">© 2026 RentMeAbhi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
