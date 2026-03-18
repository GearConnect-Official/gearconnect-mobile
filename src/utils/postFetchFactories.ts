import * as postService from '@/services/postService';
import { Post as APIPost } from '@/services/postService';

/**
 * Factory to create a fetch function for all posts
 */
export const createAllPostsFetcher = () => {
  return async (page: number, limit: number, userId?: number): Promise<APIPost[]> => {
    if (userId) {
      return await postService.default.getPosts(page, limit, userId);
    } else {
      return await postService.default.getAllPosts();
    }
  };
};

/**
 * Factory to create a fetch function for followed posts
 */
export const createFollowedPostsFetcher = () => {
  return async (page: number, limit: number, userId?: number): Promise<APIPost[]> => {
    if (!userId) {
      throw new Error('User ID is required for followed posts');
    }
    return await postService.default.getFollowedPosts(userId, page, limit);
  };
};

/**
 * Factory to create a fetch function for a user's posts
 */
export const createUserPostsFetcher = (targetUserId: number) => {
  return async (page: number, limit: number, currentUserId?: number): Promise<APIPost[]> => {
    const response = await postService.default.getUserPosts(targetUserId);

    if (Array.isArray(response)) {
      return response;
    } else if (response.posts && Array.isArray(response.posts)) {
      return response.posts;
    }

    throw new Error('Invalid response format for user posts');
  };
};

/**
 * Factory to create a fetch function for liked posts
 */
export const createLikedPostsFetcher = (targetUserId: number) => {
  return async (page: number, limit: number, currentUserId?: number): Promise<APIPost[]> => {
    const response = await postService.default.getLikedPosts(targetUserId);

    if (Array.isArray(response)) {
      return response;
    } else if (response.posts && Array.isArray(response.posts)) {
      return response.posts;
    }

    throw new Error('Invalid response format for liked posts');
  };
};

/**
 * Factory to create a fetch function for favorites
 */
export const createFavoritePostsFetcher = (targetUserId: number) => {
  return async (page: number, limit: number, currentUserId?: number): Promise<APIPost[]> => {
    const response = await postService.default.getFavorites(targetUserId);

    if (Array.isArray(response)) {
      return response;
    } else if (response.posts && Array.isArray(response.posts)) {
      return response.posts;
    }

    throw new Error('Invalid response format for favorite posts');
  };
};

/**
 * Factory to create a fetch function with search
 */
export const createSearchPostsFetcher = (query: string) => {
  return async (page: number, limit: number, userId?: number): Promise<APIPost[]> => {
    const response = await postService.default.searchPosts(query);

    if (Array.isArray(response)) {
      return response;
    }

    throw new Error('Invalid response format for search posts');
  };
};

/**
 * Factory to create a fetch function by tag
 */
export const createTagPostsFetcher = (tagName: string) => {
  return async (page: number, limit: number, userId?: number): Promise<APIPost[]> => {
    const response = await postService.default.getPostsByTag(tagName);

    if (Array.isArray(response)) {
      return response;
    }

    throw new Error('Invalid response format for tag posts');
  };
};

/**
 * Cache configuration per post type
 */
export const CACHE_CONFIGS = {
  home: {
    ttl: 5 * 60 * 1000,
    pageSize: 10
  },
  followed: {
    ttl: 3 * 60 * 1000,
    pageSize: 10
  },
  user: {
    ttl: 10 * 60 * 1000,
    pageSize: 12
  },
  liked: {
    ttl: 15 * 60 * 1000,
    pageSize: 12
  },
  favorites: {
    ttl: 15 * 60 * 1000,
    pageSize: 12
  },
  search: {
    ttl: 2 * 60 * 1000,
    pageSize: 15
  },
  tag: {
    ttl: 5 * 60 * 1000,
    pageSize: 15
  }
} as const;

/**
 * Helper to create a unique cache key
 */
export const createCacheKey = (
  type: keyof typeof CACHE_CONFIGS,
  userId?: number,
  additionalParams?: string
): string => {
  const baseKey = `${type}-posts`;
  const userPart = userId ? `-user-${userId}` : '';
  const paramsPart = additionalParams ? `-${additionalParams}` : '';

  return `${baseKey}${userPart}${paramsPart}`;
};

/**
 * Helper to get cache configuration for a type
 */
export const getCacheConfig = (type: keyof typeof CACHE_CONFIGS) => {
  return CACHE_CONFIGS[type];
};
