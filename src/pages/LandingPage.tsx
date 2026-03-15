import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PropertyCard from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight, Shield, Star, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
    supabase.from('properties').select('*')
      .eq('verification_status', 'approved')
      .order('created_at', { ascending: false }).limit(8)
      .then(({ data }) => setProperties(data || []));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/properties?q=${encodeURIComponent(searchQuery)}`);
  };

  const homeFaqs = [
    { question: 'How much does it cost to rent an apartment in Pune?', answer: 'Rent in Pune varies by area. Budget areas like Wakad offer 1BHK from ₹7,000/month. Premium areas like Baner and Viman Nagar range ₹12,000–₹35,000/month.' },
    { question: 'Which area in Pune is best for IT professionals?', answer: 'Hinjewadi, Kharadi, and Wakad are top choices due to proximity to Rajiv Gandhi Infotech Park, EON IT Park, and other tech hubs.' },
    { question: 'How can I book a rental on RentMeAbhi?', answer: 'Browse listings, select your move-in and move-out dates, and pay securely via Razorpay. Your booking is confirmed instantly.' },
  ];

  const jsonLd = [
    {
      '@context': 'https://schema.org', '@type': 'LocalBusiness', name: 'RentMeAbhi',
      description: "Pune's trusted rental marketplace for apartments, PGs, and homes near IT parks.",
      address: { '@type': 'PostalAddress', addressLocality: 'Pune', addressRegion: 'Maharashtra', addressCountry: 'IN' },
      url: 'https://stay-seamlessly.lovable.app',
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: homeFaqs.map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
    },
  ];

  return (
    <div className="min-h-screen">
      <SEOHead title="Apartments for Rent in Pune | RentMeAbhi"
        description="Find affordable apartments and homes for monthly rent in Pune near IT parks. Verified listings with instant booking."
        jsonLd={jsonLd} />

      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
        <img src={heroImage} alt="Luxury rental property in Pune" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="relative z-10 mx-auto max-w-2xl px-4 text-center">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-primary-foreground md:text-6xl">
            Find your next<br />perfect home in Pune
          </h1>
          <p className="mt-4 text-lg text-primary-foreground/80">Monthly rentals near IT parks. Verified properties. Secure payments.</p>
          <form onSubmit={handleSearch} className="mt-8 flex items-center gap-2 rounded-full bg-background p-2 shadow-elevated">
            <Search className="ml-3 h-5 w-5 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search Hinjewadi, Kharadi, Baner..."
              className="flex-1 border-0 bg-transparent focus-visible:ring-0" />
            <Button type="submit" className="rounded-full px-6">Search</Button>
          </form>
        </motion.div>
      </section>

      <section className="border-b bg-secondary/30 py-6">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-8 px-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Verified Properties</span>
          <span className="flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> Trusted by Renters</span>
          <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Secure Razorpay Payments</span>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold">Featured Properties</h2>
            <p className="mt-1 text-muted-foreground">Verified monthly rentals</p>
          </div>
          <Link to="/properties" className="group flex items-center gap-1 text-sm font-medium text-primary">
            View all <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </div>
        {properties.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <p className="text-muted-foreground">No verified properties yet.</p>
            <Button className="mt-4" onClick={() => navigate('/auth?mode=signup')}>Get Started</Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.map(p => (
              <PropertyCard key={p.id} id={p.id} title={p.title} location={p.location} price={p.price}
                monthlyRent={p.monthly_rent} images={p.images} rating={p.rating || 0} reviewCount={p.review_count || 0} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-secondary/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-2 font-heading text-2xl font-bold">Explore Pune Areas</h2>
          <p className="mb-8 text-muted-foreground">Find rentals near your workplace</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PUNE_AREAS.map(area => (
              <Link key={area.slug} to={`/rent/pune/${area.slug}`}
                className="group flex items-center justify-between rounded-xl border bg-card p-4 transition hover:shadow-card-hover">
                <div>
                  <h3 className="font-heading font-semibold">{area.name}</h3>
                  <p className="text-sm text-muted-foreground">{area.avgRent}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-2">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-glow p-8 text-primary-foreground">
            <h3 className="font-heading text-2xl font-bold">Earn Passive Income From Your Property</h3>
            <p className="mt-3 text-primary-foreground/80">List your property and start earning monthly rent.</p>
            <Button variant="secondary" className="mt-6" onClick={() => navigate('/auth?mode=signup')}>
              Become a Host <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="rounded-2xl border bg-card p-8">
            <h3 className="font-heading text-2xl font-bold">Find Affordable Monthly Rentals</h3>
            <p className="mt-3 text-muted-foreground">Verified properties near IT parks with secure payments.</p>
            <Button className="mt-6" onClick={() => navigate('/properties')}>
              Browse Properties <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-secondary/50 py-12">
        <div className="container mx-auto flex flex-col items-center gap-4 px-4 text-center">
          <h2 className="font-heading text-xl font-bold">Get New Rental Listings on WhatsApp</h2>
          <p className="text-muted-foreground">Follow the RentMeAbhi by Abhijeet Construction channel</p>
          <WhatsAppCTA />
        </div>
      </section>

      <section className="container mx-auto px-4"><FAQSection faqs={homeFaqs} /></section>
      <Footer />
    </div>
  );
};

export default LandingPage;
