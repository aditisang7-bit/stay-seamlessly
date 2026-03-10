import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PUNE_AREAS } from '@/data/puneAreas';
import PropertyCard from '@/components/PropertyCard';
import SEOHead from '@/components/SEOHead';
import FAQSection from '@/components/FAQSection';
import WhatsAppCTA from '@/components/WhatsAppCTA';
import ShareButtons from '@/components/ShareButtons';
import Footer from '@/components/Footer';
import { MapPin, Building2, IndianRupee, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const AreaPage = () => {
  const { area } = useParams<{ area: string }>();
  const [properties, setProperties] = useState<any[]>([]);
  const areaData = PUNE_AREAS.find(a => a.slug === area);

  useEffect(() => {
    if (!areaData) return;
    supabase.from('properties').select('*')
      .ilike('location', `%${areaData.name}%`)
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => setProperties(data || []));
  }, [areaData]);

  if (!areaData) {
    return <div className="py-20 text-center text-muted-foreground">Area not found</div>;
  }

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: `RentMeAbhi - Rentals in ${areaData.name}, Pune`,
      description: areaData.metaDescription,
      address: { '@type': 'PostalAddress', addressLocality: areaData.name, addressRegion: 'Maharashtra', addressCountry: 'IN' },
      url: `https://stay-seamlessly.lovable.app/rent/pune/${areaData.slug}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: areaData.faqs.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://stay-seamlessly.lovable.app/' },
        { '@type': 'ListItem', position: 2, name: 'Rent in Pune', item: 'https://stay-seamlessly.lovable.app/rent/pune' },
        { '@type': 'ListItem', position: 3, name: areaData.name, item: `https://stay-seamlessly.lovable.app/rent/pune/${areaData.slug}` },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={areaData.metaTitle} description={areaData.metaDescription} jsonLd={jsonLd} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/5 py-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/rent/pune" className="hover:text-foreground">Pune</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{areaData.name}</span>
          </nav>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-heading text-3xl font-extrabold md:text-4xl">
              Apartments for Rent in {areaData.name}, Pune
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              {areaData.description}
            </p>
          </motion.div>

          {/* Quick Stats */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
              <IndianRupee className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Average Rent</p>
                <p className="font-heading font-semibold">{areaData.avgRent}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Nearby IT Parks</p>
                <p className="font-heading font-semibold">{areaData.nearbyParks.length} parks</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-heading font-semibold">{areaData.name}, Pune</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IT Parks */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-4 font-heading text-xl font-bold">Nearby IT Parks & Tech Hubs</h2>
        <div className="flex flex-wrap gap-2">
          {areaData.nearbyParks.map(p => (
            <span key={p} className="rounded-full border bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* Listings */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="mb-6 font-heading text-xl font-bold">
          Available Rentals in {areaData.name}
        </h2>
        {properties.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.map(p => (
              <PropertyCard key={p.id} id={p.id} title={p.title} location={p.location}
                price={p.price} images={p.images} rating={p.rating || 0} reviewCount={p.review_count || 0} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <p className="text-muted-foreground">No properties listed in {areaData.name} yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">Be the first to list your property here!</p>
            <Link to="/auth?mode=signup">
              <Button className="mt-4">List Your Property</Button>
            </Link>
          </div>
        )}
      </section>

      {/* WhatsApp CTA */}
      <section className="bg-secondary/50 py-12">
        <div className="container mx-auto flex flex-col items-center gap-4 px-4 text-center">
          <h2 className="font-heading text-xl font-bold">Get New {areaData.name} Listings on WhatsApp</h2>
          <p className="text-muted-foreground">Be the first to know when new properties are listed in {areaData.name}</p>
          <WhatsAppCTA />
        </div>
      </section>

      {/* Share */}
      <section className="container mx-auto px-4 py-8">
        <h3 className="mb-3 font-heading font-semibold">Share this page</h3>
        <ShareButtons title={`Apartments for Rent in ${areaData.name}, Pune | RentMeAbhi`} />
      </section>

      {/* Other areas */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="mb-4 font-heading text-xl font-bold">Explore Other Areas in Pune</h2>
        <div className="flex flex-wrap gap-2">
          {PUNE_AREAS.filter(a => a.slug !== area).map(a => (
            <Link key={a.slug} to={`/rent/pune/${a.slug}`}>
              <Button variant="outline" size="sm" className="gap-1">
                {a.name} <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4">
        <FAQSection title={`FAQs About Renting in ${areaData.name}`} faqs={areaData.faqs} />
      </section>

      <Footer />
    </div>
  );
};

export default AreaPage;
