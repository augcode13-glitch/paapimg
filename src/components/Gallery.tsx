import { useState, useEffect, useRef, useCallback } from 'react';
import { Grid3x3, Columns3, LayoutGrid, Heart, Loader, Menu, X } from 'lucide-react';
import { pexelsClient } from '../lib/pexels';
import { supabase } from '../lib/supabase';
import type { PexelsPhoto } from '../types/pexels';
import type { Favorite } from '../lib/supabase';
import { ImageCard } from './ImageCard';
import { ImageModal } from './ImageModal';
import { SearchBar } from './SearchBar';

type ViewMode = 'masonry' | 'grid' | 'compact';
type TabMode = 'curated' | 'favorites';

export function Gallery() {
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PexelsPhoto | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('masonry');
  const [tabMode, setTabMode] = useState<TabMode>('curated');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setFavorites(data);
  };

  const loadCachedPhotos = useCallback(async (pageNum: number) => {
    try {
      const pageSize = 30;
      const offset = (pageNum - 1) * pageSize;

      const { data, error } = await supabase
        .from('image_cache')
        .select('*')
        .order('cached_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;

      if (!data || data.length === 0) {
        setHasMore(false);
        return null;
      }

      const cachedPhotos = data.map((img) => ({
        id: parseInt(img.pexels_id),
        width: img.width,
        height: img.height,
        url: img.url,
        photographer: img.photographer,
        photographer_url: img.photographer_url,
        photographer_id: 0,
        avg_color: img.avg_color,
        src: {
          original: img.src_original,
          large2x: img.src_large2x,
          large: img.src_large,
          medium: img.src_medium,
          small: img.src_small,
          portrait: img.src_medium,
          landscape: img.src_large,
          tiny: img.src_small,
        },
        liked: false,
        alt: img.alt,
      })) as PexelsPhoto[];

      return cachedPhotos;
    } catch (error) {
      console.error('Error loading cached photos:', error);
      return null;
    }
  }, []);

  const loadPhotos = useCallback(async (pageNum: number, query: string) => {
    setLoading(true);
    try {
      let photos: PexelsPhoto[] = [];

      if (query) {
        if (!pexelsClient) throw new Error('API key required for search');
        const response = await pexelsClient.searchPhotos(query, pageNum, 30);
        photos = response.photos;
        setHasMore(!!response.next_page);
      } else {
        const cached = await loadCachedPhotos(pageNum);
        if (!cached) {
          if (!pexelsClient) throw new Error('No cached photos and API key required');
          const response = await pexelsClient.getCuratedPhotos(pageNum, 30);
          photos = response.photos;
          setHasMore(!!response.next_page);
        } else {
          photos = cached;
          setHasMore(cached.length === 30);
        }
      }

      if (pageNum === 1) {
        setPhotos(photos);
      } else {
        setPhotos(prev => [...prev, ...photos]);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  }, [loadCachedPhotos]);

  useEffect(() => {
    if (tabMode === 'curated') {
      setPage(1);
      loadPhotos(1, searchQuery);
    }
  }, [searchQuery, tabMode]);

  useEffect(() => {
    if (tabMode === 'curated' && page > 1) {
      loadPhotos(page, searchQuery);
    }
  }, [page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && tabMode === 'curated') {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, tabMode]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const isFavorite = (photo: PexelsPhoto) => {
    return favorites.some(fav => fav.pexels_id === photo.id.toString());
  };

  const toggleFavorite = async (photo: PexelsPhoto) => {
    if (!user) {
      alert('Please sign in to save favorites');
      return;
    }

    const existingFavorite = favorites.find(fav => fav.pexels_id === photo.id.toString());

    if (existingFavorite) {
      await supabase.from('favorites').delete().eq('id', existingFavorite.id);
      setFavorites(prev => prev.filter(fav => fav.id !== existingFavorite.id));
    } else {
      const { data } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          pexels_id: photo.id.toString(),
          image_url: photo.src.large,
          photographer: photo.photographer,
          photographer_url: photo.photographer_url,
          avg_color: photo.avg_color,
        })
        .select()
        .single();

      if (data) setFavorites(prev => [data, ...prev]);
    }
  };

  const displayPhotos = tabMode === 'favorites'
    ? photos.filter(photo => isFavorite(photo))
    : photos;

  const getGridClass = () => {
    switch (viewMode) {
      case 'masonry':
        return 'columns-1 xs:columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2 xs:gap-3 sm:gap-4';
      case 'grid':
        return 'grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 xs:gap-4 sm:gap-5 md:gap-6';
      case 'compact':
        return 'grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1 xs:gap-2 sm:gap-2';
      default:
        return 'columns-1 xs:columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2 xs:gap-3 sm:gap-4';
    }
  };

  if (!pexelsClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-rose-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Grid3x3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Pexels API Key Required</h1>
          <p className="text-zinc-400 mb-4">
            To use this gallery app, you need to add your Pexels API key to the environment variables.
          </p>
          <div className="bg-zinc-800/50 backdrop-blur-md border border-zinc-700 rounded-xl p-4 text-left">
            <p className="text-sm text-zinc-300 mb-2">1. Get your free API key from:</p>
            <a
              href="https://www.pexels.com/api/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 text-sm break-all"
            >
              https://www.pexels.com/api/
            </a>
            <p className="text-sm text-zinc-300 mt-3 mb-2">2. Add it to your .env file:</p>
            <code className="text-xs text-lime-400 bg-black/30 px-2 py-1 rounded">
              VITE_PEXELS_API_KEY=your_key_here
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-zinc-900/80 border-b border-zinc-800">
        <div className="max-w-[1800px] mx-auto px-3 xs:px-4 py-3 xs:py-4 md:py-6 space-y-3 xs:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 xs:gap-3 min-w-0">
              <div className="w-10 h-10 xs:w-12 xs:h-12 bg-gradient-to-br from-cyan-500 to-rose-500 rounded-lg xs:rounded-xl flex items-center justify-center flex-shrink-0">
                <Grid3x3 className="w-5 h-5 xs:w-6 xs:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg xs:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-rose-400 bg-clip-text text-transparent truncate">
                  PixelVault
                </h1>
                <p className="text-xs text-zinc-500 hidden xs:block">Discover amazing photography</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setViewMode('masonry')}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  viewMode === 'masonry'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4 xs:w-5 xs:h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <Grid3x3 className="w-4 h-4 xs:w-5 xs:h-5" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  viewMode === 'compact'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <Columns3 className="w-4 h-4 xs:w-5 xs:h-5" />
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-all duration-200 flex-shrink-0"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <SearchBar onSearch={handleSearch} initialValue={searchQuery} />

          <div className={`flex flex-wrap items-center gap-2 transition-all duration-200 ${mobileMenuOpen ? 'flex' : 'hidden md:flex'}`}>
            <button
              onClick={() => {
                setTabMode('curated');
                setMobileMenuOpen(false);
              }}
              className={`px-4 xs:px-6 py-2 xs:py-2.5 rounded-lg xs:rounded-xl text-sm xs:text-base font-medium transition-all duration-200 ${
                tabMode === 'curated'
                  ? 'bg-gradient-to-r from-cyan-500 to-rose-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => {
                setTabMode('favorites');
                setMobileMenuOpen(false);
              }}
              className={`px-4 xs:px-6 py-2 xs:py-2.5 rounded-lg xs:rounded-xl text-sm xs:text-base font-medium transition-all duration-200 flex items-center gap-1 xs:gap-2 ${
                tabMode === 'favorites'
                  ? 'bg-gradient-to-r from-cyan-500 to-rose-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Favorites</span>
              {favorites.length > 0 && <span className="text-xs">({favorites.length})</span>}
            </button>

            <div className="md:hidden flex items-center gap-1 ml-auto">
              <button
                onClick={() => setViewMode('masonry')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'masonry'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'compact'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <Columns3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-2 xs:px-3 sm:px-4 py-4 xs:py-6 md:py-8">
        {displayPhotos.length === 0 && !loading ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-zinc-800 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Heart className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {tabMode === 'favorites' ? 'No favorites yet' : 'No results found'}
            </h3>
            <p className="text-zinc-500">
              {tabMode === 'favorites'
                ? 'Start adding photos to your favorites'
                : 'Try a different search term'}
            </p>
          </div>
        ) : (
          <div className={getGridClass()}>
            {displayPhotos.map((photo) => (
              <div
                key={photo.id}
                className={viewMode === 'masonry' ? 'mb-4 break-inside-avoid' : ''}
              >
                <ImageCard
                  photo={photo}
                  onImageClick={setSelectedPhoto}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite(photo)}
                />
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-cyan-500 animate-spin" />
          </div>
        )}

        <div ref={observerTarget} className="h-10" />
      </div>

      {selectedPhoto && (
        <ImageModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onToggleFavorite={toggleFavorite}
          isFavorite={isFavorite(selectedPhoto)}
        />
      )}
    </div>
  );
}
