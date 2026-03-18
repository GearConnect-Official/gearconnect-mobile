/**
 * Interface for a follower/following user
 */
export interface FollowUser {
  id: number;
  username: string;
  name?: string;
  profilePicture?: string;
  profilePicturePublicId?: string;
  isFollowing?: boolean;
  followedAt?: string;
}

/**
 * Interface for followers list response
 */
export interface FollowersResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    followers: FollowUser[];
    totalCount: number;
  };
}

/**
 * Interface for following list response
 */
export interface FollowingResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    following: FollowUser[];
    totalCount: number;
  };
}

/**
 * Interface for follow/unfollow action response
 */
export interface FollowActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    isFollowing: boolean;
    followersCount: number;
    followingCount: number;
  };
}

/**
 * Interface for user suggestions
 */
export interface SuggestedUser extends FollowUser {
  mutualFollowersCount?: number;
  reason?: 'mutual_friends' | 'interests' | 'location' | 'new_user';
}

/**
 * Interface for suggestions response
 */
export interface SuggestionsResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    suggestions: SuggestedUser[];
    totalCount: number;
  };
}

/**
 * Interface for follow statistics
 */
export interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
}
