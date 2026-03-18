import { useState, useCallback, useRef, useEffect } from 'react';
import { Post as APIPost } from '@/services/postService';
import * as postService from '@/services/postService';

interface CacheEntry {
  data: APIPost[];
  timestamp: number;
  page: number;
  hasMore: boolean;
}

interface UsePostsCacheConfig {
  cacheKey: string;
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  pageSize?: number;
  enableRefresh?: boolean;
}

interface UsePostsCacheReturn {
  posts: APIPost[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  currentPage: number;
  loadInitialPosts: () => Promise<void>;
  loadMorePosts: () => Promise<void>;
  refreshPosts: () => Promise<void>;
  invalidateCache: () => void;
  isCacheValid: boolean;
}

// Global cache store - persiste entre les remounts du composant
const globalCache = new Map<string, CacheEntry>();

export const usePostsCache = (
  config: UsePostsCacheConfig,
  fetchFunction: (page: number, limit: number, userId?: number) => Promise<APIPost[]>,
  userId?: number
): UsePostsCacheReturn => {
  const {
    cacheKey,
    ttl = 5 * 60 * 1000, // 5 minutes par défaut
    pageSize = 10,
    enableRefresh = true
  } = config;

  const [posts, setPosts] = useState<APIPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Refs pour éviter les appels multiples
  const loadingRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const lastLoadTime = useRef<number>(0);

  // Vérifier si le cache est valide
  const isCacheValid = useCallback(() => {
    const cached = globalCache.get(cacheKey);
    if (!cached) return false;
    const isExpired = Date.now() - cached.timestamp > ttl;
    return !isExpired;
  }, [cacheKey, ttl]);

  // Déduplication des posts par ID
  const deduplicatePosts = useCallback((postsList: APIPost[]) => {
    const seen = new Set<number>();
    return postsList.filter(post => {
      if (seen.has(post.id!)) return false;
      seen.add(post.id!);
      return true;
    });
  }, []);

  // Charger les posts depuis le cache ou l'API
  const loadFromCacheOrAPI = useCallback(async (page: number, append = false) => {
    try {
      // Si c'est la première page et qu'on a un cache valide, l'utiliser
      if (page === 1 && !append && isCacheValid()) {
        const cached = globalCache.get(cacheKey);
        if (cached) {
          console.log('📦 Using cached posts for:', cacheKey);
          setPosts(cached.data);
          setCurrentPage(cached.page);
          setHasMore(cached.hasMore);
          return;
        }
      }

      console.log('🌐 Fetching posts from API - Page:', page, 'Cache key:', cacheKey);

      const newPosts = await fetchFunction(page, pageSize, userId);

      if (page === 1 || !append) {
        // Première page ou rafraîchissement complet
        const dedupedPosts = deduplicatePosts(newPosts);
        setPosts(dedupedPosts);
        setCurrentPage(1);

        // Mettre à jour le cache
        globalCache.set(cacheKey, {
          data: dedupedPosts,
          timestamp: Date.now(),
          page: 1,
          hasMore: newPosts.length === pageSize
        });
      } else {
        // Pages suivantes - ajouter à la liste existante
        setPosts(currentPosts => {
          const allPosts = [...currentPosts, ...newPosts];
          const dedupedPosts = deduplicatePosts(allPosts);

          // Mettre à jour le cache avec toutes les données
          globalCache.set(cacheKey, {
            data: dedupedPosts,
            timestamp: Date.now(),
            page,
            hasMore: newPosts.length === pageSize
          });

          return dedupedPosts;
        });
        setCurrentPage(page);
      }

      setHasMore(newPosts.length === pageSize);
      setError(null);

    } catch (err) {
      console.error('❌ Error loading posts:', err);
      setError('Failed to load posts');
      setHasMore(false);
    }
  }, [cacheKey, isCacheValid, fetchFunction, userId, pageSize, deduplicatePosts]);

  // Charger les posts initiaux
  const loadInitialPosts = useCallback(async () => {
    // Éviter les appels multiples
    if (loadingRef.current) {
      console.log('🚫 Already loading initial posts, skipping...');
      return;
    }

    // Debouncing - éviter les appels trop rapprochés
    const now = Date.now();
    if (now - lastLoadTime.current < 1000) { // 1 seconde minimum entre les appels
      console.log('🚫 Too soon since last load, skipping...');
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    lastLoadTime.current = now;

    try {
      await loadFromCacheOrAPI(1, false);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [loadFromCacheOrAPI]);

  // Charger plus de posts (pagination)
  const loadMorePosts = useCallback(async () => {
    if (!hasMore || loadingMoreRef.current || isLoadingMore) {
      console.log('🚫 Cannot load more:', { hasMore, isLoadingMore: loadingMoreRef.current });
      return;
    }

    loadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      await loadFromCacheOrAPI(currentPage + 1, true);
    } finally {
      setIsLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [hasMore, currentPage, loadFromCacheOrAPI, isLoadingMore]);

  // Rafraîchir les posts (pull to refresh)
  const refreshPosts = useCallback(async () => {
    if (!enableRefresh) return;

    console.log('🔄 Refreshing posts for:', cacheKey);

    // Invalider le cache
    globalCache.delete(cacheKey);

    // Réinitialiser l'état
    setCurrentPage(0);
    setHasMore(true);

    // Recharger depuis l'API
    await loadInitialPosts();
  }, [cacheKey, enableRefresh, loadInitialPosts]);

  // Invalider le cache manuellement
  const invalidateCache = useCallback(() => {
    console.log('🗑️ Invalidating cache for:', cacheKey);
    globalCache.delete(cacheKey);
  }, [cacheKey]);

  // Initialisation au montage du composant
  useEffect(() => {
    // Charger les posts seulement si on n'en a pas déjà
    if (posts.length === 0) {
      loadInitialPosts();
    }
  }, []); // Dépendances vides volontairement pour éviter les rechargements

  return {
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    currentPage,
    loadInitialPosts,
    loadMorePosts,
    refreshPosts,
    invalidateCache,
    isCacheValid: isCacheValid()
  };
};
