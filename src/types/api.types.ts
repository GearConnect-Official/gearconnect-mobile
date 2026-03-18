/**
 * Enumeration of API routes
 */
export enum ApiRoutes {
  AUTH = 'auth',
  EVENTS = 'events',
  POSTS = 'posts',
  EVENTTAGS = 'event-tags',
  EVENTREVIEWS = 'reviews',
  RELATEDPRODUCTS = 'related-products',
  INTERACTIONS = 'interactions',
  COMMENTS = 'comments',
  SPONSOR = 'sponsor',
  TAGS = 'tags',
  USERS = 'users',
  HEALTH = 'health',
  PERFORMANCES = 'performances',
  PRIVACYSETTINGS = 'privacy-settings',
  MESSAGING = 'messaging',
}

/**
 * Interface for API configuration
 */
export interface ApiConfig {
  protocol: string;
  host: string;
  port: number;
  baseUrl: string;
}

/**
 * Type for API endpoints
 */
export type ApiEndpoints = {
  [key in ApiRoutes]: string;
};
