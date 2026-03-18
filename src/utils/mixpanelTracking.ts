import mixpanelService from '@/services/mixpanelService';

/**
 * Helper for tracking Mixpanel events in a standardized way
 * All events follow the convention: "Category Action"
 * Examples: "Post Liked", "Event Viewed", "User Followed"
 */

// ============================================
// AUTHENTICATION
// ============================================

export const trackAuth = {
  login: (method: string = 'email') => {
    mixpanelService.track('User Logged In', {
      method,
      timestamp: new Date().toISOString(),
    });
  },

  register: (method: string = 'email') => {
    mixpanelService.track('User Registered', {
      method,
      timestamp: new Date().toISOString(),
    });
  },

  logout: () => {
    mixpanelService.track('User Logged Out', {
      timestamp: new Date().toISOString(),
    });
  },

  forgotPassword: () => {
    mixpanelService.track('Password Reset Requested', {
      timestamp: new Date().toISOString(),
    });
  },
};

// ============================================
// NAVIGATION & SCREENS
// ============================================

export const trackScreenView = (screenName: string, properties?: Record<string, any>) => {
  mixpanelService.track('Screen Viewed', {
    screen_name: screenName,
    ...properties,
  });
};

// ============================================
// POSTS
// ============================================

export const trackPost = {
  viewed: (postId: string, properties?: Record<string, any>) => {
    mixpanelService.track('Post Viewed', {
      post_id: postId,
      ...properties,
    });
  },

  created: (postId: string, hasImage: boolean, hasVideo: boolean, tagCount: number) => {
    mixpanelService.track('Post Created', {
      post_id: postId,
      has_image: hasImage,
      has_video: hasVideo,
      tag_count: tagCount,
      timestamp: new Date().toISOString(),
    });
  },

  liked: (postId: string, isLiked: boolean) => {
    mixpanelService.track(isLiked ? 'Post Liked' : 'Post Unliked', {
      post_id: postId,
      timestamp: new Date().toISOString(),
    });
  },

  commented: (postId: string, commentLength: number) => {
    mixpanelService.track('Post Commented', {
      post_id: postId,
      comment_length: commentLength,
      timestamp: new Date().toISOString(),
    });
  },

  shared: (postId: string, method?: string) => {
    mixpanelService.track('Post Shared', {
      post_id: postId,
      share_method: method || 'native',
      timestamp: new Date().toISOString(),
    });
  },

  saved: (postId: string, isSaved: boolean) => {
    mixpanelService.track(isSaved ? 'Post Saved' : 'Post Unsaved', {
      post_id: postId,
      timestamp: new Date().toISOString(),
    });
  },
};

// ============================================
// EVENTS
// ============================================

export const trackEvent = {
  viewed: (eventId: string, eventName?: string) => {
    mixpanelService.track('Event Viewed', {
      event_id: eventId,
      event_name: eventName,
      timestamp: new Date().toISOString(),
    });
  },

  created: (eventId: string, eventName: string, hasImage: boolean) => {
    mixpanelService.track('Event Created', {
      event_id: eventId,
      event_name: eventName,
      has_image: hasImage,
      timestamp: new Date().toISOString(),
    });
  },

  edited: (eventId: string, eventName: string) => {
    mixpanelService.track('Event Edited', {
      event_id: eventId,
      event_name: eventName,
      timestamp: new Date().toISOString(),
    });
  },

  joined: (eventId: string, eventName: string) => {
    mixpanelService.track('Event Joined', {
      event_id: eventId,
      event_name: eventName,
      timestamp: new Date().toISOString(),
    });
  },

  left: (eventId: string, eventName: string) => {
    mixpanelService.track('Event Left', {
      event_id: eventId,
      event_name: eventName,
      timestamp: new Date().toISOString(),
    });
  },

  reviewed: (eventId: string, rating: number) => {
    mixpanelService.track('Event Reviewed', {
      event_id: eventId,
      rating,
      timestamp: new Date().toISOString(),
    });
  },
};

// ============================================
// SOCIAL (FOLLOW, FRIENDS)
// ============================================

export const trackSocial = {
  followed: (targetUserId: string, targetUsername?: string) => {
    mixpanelService.track('User Followed', {
      target_user_id: targetUserId,
      target_username: targetUsername,
      timestamp: new Date().toISOString(),
    });
  },

  unfollowed: (targetUserId: string, targetUsername?: string) => {
    mixpanelService.track('User Unfollowed', {
      target_user_id: targetUserId,
      target_username: targetUsername,
      timestamp: new Date().toISOString(),
    });
  },

  friendRequestSent: (targetUserId: string) => {
    mixpanelService.track('Friend Request Sent', {
      target_user_id: targetUserId,
      timestamp: new Date().toISOString(),
    });
  },

  friendRequestAccepted: (targetUserId: string) => {
    mixpanelService.track('Friend Request Accepted', {
      target_user_id: targetUserId,
      timestamp: new Date().toISOString(),
    });
  },

  friendRequestRejected: (targetUserId: string) => {
    mixpanelService.track('Friend Request Rejected', {
      target_user_id: targetUserId,
      timestamp: new Date().toISOString(),
    });
  },

  profileViewed: (targetUserId: string, isOwnProfile: boolean) => {
    mixpanelService.track('Profile Viewed', {
      target_user_id: targetUserId,
      is_own_profile: isOwnProfile,
      timestamp: new Date().toISOString(),
    });
  },
};

// ============================================
// JOBS
// ============================================

export const trackJob = {
  viewed: (jobId: string, jobTitle?: string) => {
    mixpanelService.track('Job Viewed', {
      job_id: jobId,
      job_title: jobTitle,
      timestamp: new Date().toISOString(),
    });
  },

  created: (jobId: string, jobTitle: string) => {
    mixpanelService.track('Job Created', {
      job_id: jobId,
      job_title: jobTitle,
      timestamp: new Date().toISOString(),
    });
  },

  applied: (jobId: string, jobTitle?: string) => {
    mixpanelService.track('Job Applied', {
      job_id: jobId,
      job_title: jobTitle,
      timestamp: new Date().toISOString(),
    });
  },
};

// ============================================
// PERFORMANCES
// ============================================

export const trackPerformance = {
  viewed: (performanceId: string) => {
    mixpanelService.track('Performance Viewed', {
      performance_id: performanceId,
      timestamp: new Date().toISOString(),
    });
  },

  added: (performanceId: string) => {
    mixpanelService.track('Performance Added', {
      performance_id: performanceId,
      timestamp: new Date().toISOString(),
    });
  },
};

// ============================================
// PRODUCTS
// ============================================

export const trackProduct = {
  viewed: (productId: string, productName?: string) => {
    mixpanelService.track('Product Viewed', {
      product_id: productId,
      product_name: productName,
      timestamp: new Date().toISOString(),
    });
  },

  created: (productId: string, productName: string) => {
    mixpanelService.track('Product Created', {
      product_id: productId,
      product_name: productName,
      timestamp: new Date().toISOString(),
    });
  },
};

// ============================================
// PROFILE
// ============================================

export const trackProfile = {
  edited: (changes: string[]) => {
    mixpanelService.track('Profile Edited', {
      fields_changed: changes,
      timestamp: new Date().toISOString(),
    });
  },

  pictureUpdated: () => {
    mixpanelService.track('Profile Picture Updated', {
      timestamp: new Date().toISOString(),
    });
  },
};

// ============================================
// SEARCH
// ============================================

export const trackSearch = {
  performed: (query: string, resultCount: number, searchType: 'users' | 'events' | 'posts' | 'all') => {
    mixpanelService.track('Search Performed', {
      query,
      result_count: resultCount,
      search_type: searchType,
      timestamp: new Date().toISOString(),
    });
  },

  resultClicked: (query: string, resultType: string, resultId: string) => {
    mixpanelService.track('Search Result Clicked', {
      query,
      result_type: resultType,
      result_id: resultId,
      timestamp: new Date().toISOString(),
    });
  },
};

// ============================================
// SETTINGS
// ============================================

export const trackSettings = {
  privacyUpdated: (setting: string, value: any) => {
    mixpanelService.track('Privacy Setting Updated', {
      setting,
      value,
      timestamp: new Date().toISOString(),
    });
  },

  notificationUpdated: (setting: string, enabled: boolean) => {
    mixpanelService.track('Notification Setting Updated', {
      setting,
      enabled,
      timestamp: new Date().toISOString(),
    });
  },
};

// ============================================
// ERRORS
// ============================================

export const trackError = (errorType: string, errorMessage: string, context?: Record<string, any>) => {
  mixpanelService.track('Error Occurred', {
    error_type: errorType,
    error_message: errorMessage,
    ...context,
    timestamp: new Date().toISOString(),
  });
};

// ============================================
// EXPORT ALL
// ============================================

export default {
  auth: trackAuth,
  screen: trackScreenView,
  post: trackPost,
  event: trackEvent,
  social: trackSocial,
  job: trackJob,
  performance: trackPerformance,
  product: trackProduct,
  profile: trackProfile,
  search: trackSearch,
  settings: trackSettings,
  error: trackError,
};
