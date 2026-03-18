import { ApiConfig, ApiRoutes, ApiEndpoints } from '@/types/api.types';
import Constants from 'expo-constants';

if (!Constants.expoConfig?.extra?.apiHost) {
  throw new Error('API_HOST is not defined in .env file');
}

/**
 * API Configuration
 */
const apiConfig: ApiConfig = {
  protocol: Constants.expoConfig?.extra?.apiProtocol || 'http',
  host: Constants.expoConfig?.extra?.apiHost,
  port: Constants.expoConfig?.extra?.apiPort,
  get baseUrl() {
    return `${this.protocol}://${this.host}:${this.port}/api`;
  }
};

/**
 * Cloudinary Configuration
 */
export const cloudinaryConfig = {
  cloudName: Constants.expoConfig?.extra?.cloudinaryCloudName,
  apiKey: Constants.expoConfig?.extra?.cloudinaryApiKey,
  apiSecret: Constants.expoConfig?.extra?.cloudinaryApiSecret,
  uploadPreset: Constants.expoConfig?.extra?.cloudinaryUploadPreset,
};

// Validate Cloudinary configuration
if (!cloudinaryConfig.cloudName) {
  console.warn('CLOUDINARY_CLOUD_NAME is not defined - image upload will not work');
}

/**
 * Generate URLs for all API endpoints
 */
const generateApiEndpoints = (): ApiEndpoints => {
  return Object.values(ApiRoutes).reduce((endpoints, route) => ({
    ...endpoints,
    [route]: `${apiConfig.baseUrl}/${route}`
  }), {} as ApiEndpoints);
};

/**
 * API endpoint URLs
 */
export const API_ENDPOINTS = generateApiEndpoints();

/**
 * Specific URLs for each service
 */
export const {
  [ApiRoutes.AUTH]: API_URL_AUTH,
  [ApiRoutes.EVENTS]: API_URL_EVENTS,
  [ApiRoutes.POSTS]: API_URL_POSTS,
  [ApiRoutes.EVENTTAGS]: API_URL_EVENTTAGS,
  [ApiRoutes.EVENTREVIEWS]: API_URL_EVENTREVIEWS,
  [ApiRoutes.RELATEDPRODUCTS]: API_URL_RELATEDPRODUCTS,
  [ApiRoutes.SPONSOR]: API_URL_SPONSOR,
  [ApiRoutes.INTERACTIONS]: API_URL_INTERACTIONS,
  [ApiRoutes.COMMENTS]: API_URL_COMMENTS,
  [ApiRoutes.TAGS]: API_URL_TAGS,
  [ApiRoutes.USERS]: API_URL_USERS,
  [ApiRoutes.HEALTH]: API_URL_HEALTH,
  [ApiRoutes.PERFORMANCES]: API_URL_PERFORMANCES,
  [ApiRoutes.PRIVACYSETTINGS]: API_URL_PRIVACYSETTINGS,
  [ApiRoutes.MESSAGING]: API_URL_MESSAGING,
} = API_ENDPOINTS;

/**
 * Base URL for the API (used by some services)
 */
export const API_BASE_URL = apiConfig.baseUrl;

export default apiConfig;
