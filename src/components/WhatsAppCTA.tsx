import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

const WHATSAPP_CHANNEL = 'https://whatsapp.com/channel/0029VbCDS5QJf05hJlSOV91c';

const WhatsAppCTA = ({ className }: { className?: string }) => (
  <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer" className={className}>
    <Button className="gap-2 bg-[#25D366] text-white hover:bg-[#1DA851]">
      <MessageCircle className="h-4 w-4" />
      Get Listings on WhatsApp
    </Button>
  </a>
);

export default WhatsAppCTA;
