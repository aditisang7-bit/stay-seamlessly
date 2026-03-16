import { Phone, HelpCircle } from 'lucide-react';

const SupportBanner = () => (
  <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center sm:flex-row sm:text-left">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
      <HelpCircle className="h-6 w-6 text-primary" />
    </div>
    <div className="flex-1">
      <p className="font-heading font-semibold">Have any queries?</p>
      <p className="text-sm text-muted-foreground">Contact RentMeAbhi.com or call us for any assistance</p>
    </div>
    <a href="tel:+919356357789" className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
      <Phone className="h-4 w-4" /> +91 9356357789
    </a>
  </div>
);

export default SupportBanner;
