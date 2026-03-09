import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PropertyCard from '@/components/PropertyCard';
import { Heart } from 'lucide-react';

const FavoritesPage = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!user) return;
    const { data } = await supabase.from('favorites').select('*, properties(*)').eq('user_id', user.id);
    setFavorites(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 font-heading text-2xl font-bold">My Favorites</h1>
        {favorites.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
            <Heart className="mx-auto mb-3 h-8 w-8" />
            No favorites yet. Browse properties and save your favorites!
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map(f => f.properties && (
              <PropertyCard
                key={f.id}
                id={f.properties.id}
                title={f.properties.title}
                location={f.properties.location}
                price={f.properties.price}
                images={f.properties.images}
                rating={f.properties.rating || 0}
                reviewCount={f.properties.review_count || 0}
                isFavorited
                onToggleFavorite={fetch}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
