import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PropertyCard from '@/components/PropertyCard';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  images: string[];
  rating: number;
  review_count: number;
}

const PropertiesPage = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('properties').select('*').order('created_at', { ascending: false });
    if (search) {
      query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%`);
    }
    query = query.gte('price', priceRange[0]).lte('price', priceRange[1]);
    const { data } = await query;
    setProperties((data as Property[]) || []);
    setLoading(false);
  }, [search, priceRange]);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('favorites').select('property_id').eq('user_id', user.id);
    setFavorites(new Set((data || []).map(f => f.property_id)));
  }, [user]);

  useEffect(() => {
    fetchProperties();
    fetchFavorites();
  }, [fetchProperties, fetchFavorites]);

  return (
    <div className="min-h-screen bg-background">
      {/* Search bar */}
      <div className="sticky top-16 z-40 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by location or property name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <button className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:bg-secondary">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 font-heading text-2xl font-bold">Available Properties</h1>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">No properties found</p>
            <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filters</p>
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
                isFavorited={favorites.has(p.id)}
                onToggleFavorite={() => {
                  const newFavs = new Set(favorites);
                  if (newFavs.has(p.id)) newFavs.delete(p.id); else newFavs.add(p.id);
                  setFavorites(newFavs);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPage;
