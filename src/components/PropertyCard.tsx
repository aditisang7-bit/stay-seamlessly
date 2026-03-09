import { Heart, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PropertyCardProps {
  id: string;
  title: string;
  location: string;
  price: number;
  images: string[];
  rating: number;
  reviewCount: number;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}

const PropertyCard = ({ id, title, location, price, images, rating, reviewCount, isFavorited, onToggleFavorite }: PropertyCardProps) => {
  const { user } = useAuth();
  const imageUrl = images?.[0] || '/placeholder.svg';

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }
    if (isFavorited) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', id);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, property_id: id });
    }
    onToggleFavorite?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group"
    >
      <Link to={`/property/${id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <button
            onClick={handleFavorite}
            className="absolute right-3 top-3 rounded-full bg-background/80 p-2 backdrop-blur-sm transition hover:bg-background"
          >
            <Heart className={`h-4 w-4 ${isFavorited ? 'fill-primary text-primary' : 'text-foreground'}`} />
          </button>
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-foreground truncate">{title}</h3>
            {rating > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
                <span>{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {location}
          </p>
          <p className="text-sm">
            <span className="font-semibold text-foreground">₹{price.toLocaleString()}</span>
            <span className="text-muted-foreground"> / night</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

export default PropertyCard;
