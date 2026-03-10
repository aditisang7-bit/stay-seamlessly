import { Link } from 'react-router-dom';
import { PUNE_AREAS } from '@/data/puneAreas';
import SEOHead from '@/components/SEOHead';
import FAQSection from '@/components/FAQSection';
import WhatsAppCTA from '@/components/WhatsAppCTA';
import Footer from '@/components/Footer';
import { MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const puneFaqs = [
  { question: 'How much does it cost to rent an apartment in Pune?', answer: 'Rent in Pune varies by area. Budget areas like Wakad and Hinjewadi offer 1BHK flats from ₹7,000/month, while premium areas like Baner and Viman Nagar range from ₹12,000–₹35,000/month.' },
  { question: 'Which area in Pune is best for IT professionals?', answer: 'Hinjewadi, Kharadi, and Wakad are the top choices for IT professionals due to their proximity to major IT parks like Rajiv Gandhi Infotech Park and EON IT Park.' },
  { question: 'How can I book a rental property in Pune?', answer: 'On RentMeAbhi, simply browse listings, select your preferred dates, and complete the booking with secure Razorpay payment. Your booking is confirmed instantly.' },
  { question: 'Is Pune good for students looking for rentals?', answer: 'Yes, areas like Kothrud, Wakad, and Hinjewadi offer affordable PGs and shared apartments ideal for students and freshers joining IT companies.' },
];

const PunePage = () => {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'RentMeAbhi - Rental Marketplace in Pune',
      description: 'Find affordable apartments, flats, and PGs for rent in Pune. Verified listings near IT parks.',
      address: { '@type': 'PostalAddress', addressLocality: 'Pune', addressRegion: 'Maharashtra', addressCountry: 'IN' },
      url: 'https://stay-seamlessly.lovable.app/rent/pune',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: puneFaqs.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Apartments for Rent in Pune | RentMeAbhi"
        description="Find affordable apartments, flats, and PGs for rent in Pune near IT parks. Verified listings in Hinjewadi, Kharadi, Viman Nagar, Wakad, Baner & more."
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/5 py-20">
        <div className="container mx-auto px-4">
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Pune</span>
          </nav>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-heading text-3xl font-extrabold md:text-5xl">
              Rent Your Perfect Home in Pune
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Pune is home to India's top IT parks and a thriving student community.
              RentMeAbhi connects you with verified rental properties across all major Pune localities.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Area Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-8 font-heading text-2xl font-bold">Popular Areas in Pune</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PUNE_AREAS.map(area => (
            <Link key={area.slug} to={`/rent/pune/${area.slug}`}
              className="group rounded-2xl border bg-card p-6 transition hover:shadow-card-hover">
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="h-5 w-5" />
                <h3 className="font-heading text-lg font-bold">{area.name}</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{area.description}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="font-medium">{area.avgRent}</span>
                <span className="flex items-center gap-1 text-primary opacity-0 transition group-hover:opacity-100">
                  View listings <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Knowledge block for AI search */}
      <section className="container mx-auto px-4 py-8">
        <div className="rounded-2xl bg-secondary/50 p-8">
          <h2 className="font-heading text-xl font-bold">About RentMeAbhi</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            RentMeAbhi is a rental marketplace where users can book apartments, PGs, and short-stay homes in Pune directly from property owners.
            Focused on Pune, Maharashtra, India, the platform serves IT professionals, students, and families looking for verified, affordable accommodation near major tech parks and educational institutions.
          </p>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="bg-secondary/50 py-12">
        <div className="container mx-auto flex flex-col items-center gap-4 px-4 text-center">
          <h2 className="font-heading text-xl font-bold">Get New Pune Listings on WhatsApp</h2>
          <p className="text-muted-foreground">Follow our WhatsApp channel for the latest rental listings in Pune</p>
          <WhatsAppCTA />
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4">
        <FAQSection title="FAQs About Renting in Pune" faqs={puneFaqs} />
      </section>

      <Footer />
    </div>
  );
};

export default PunePage;
