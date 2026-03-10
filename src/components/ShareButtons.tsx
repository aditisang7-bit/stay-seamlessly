import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

interface ShareButtonsProps {
  url?: string;
  title?: string;
  compact?: boolean;
}

const ShareButtons = ({ url, title = 'Check out this property on RentMeAbhi', compact }: ShareButtonsProps) => {
  const shareUrl = url || window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, color: 'bg-[#25D366]' },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, color: 'bg-[#1877F2]' },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, color: 'bg-[#0A66C2]' },
    { name: 'X', href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`, color: 'bg-foreground' },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-muted-foreground" />
        {links.map(l => (
          <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer"
            className={`${l.color} inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white transition hover:opacity-80`}>
            {l.name[0]}
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(l => (
        <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <span className={`${l.color} inline-block h-3 w-3 rounded-full`} />
            {l.name}
          </Button>
        </a>
      ))}
    </div>
  );
};

export default ShareButtons;
