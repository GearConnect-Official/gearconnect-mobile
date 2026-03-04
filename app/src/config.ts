import { ApiConfig, ApiRoutes, ApiEndpoints } from './types/api.types';
import Constants from 'expo-constants';

if (!Constants.expoConfig?.extra?.apiHost) {
  throw new Error('API_HOST is not defined in .env file');
}

/**
 * Configuration de l'API
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
 * Configuration Cloudinary
 */
export const cloudinaryConfig = {
  cloudName: Constants.expoConfig?.extra?.cloudinaryCloudName,
  apiKey: Constants.expoConfig?.extra?.cloudinaryApiKey,
  uploadPreset: Constants.expoConfig?.extra?.cloudinaryUploadPreset,
};

// Validation de la configuration Cloudinary
if (!cloudinaryConfig.cloudName) {
  console.warn('CLOUDINARY_CLOUD_NAME is not defined - image upload will not work');
}

/**
 * Génère les URLs pour tous les endpoints de l'API
 */
const generateApiEndpoints = (): ApiEndpoints => {
  return Object.values(ApiRoutes).reduce((endpoints, route) => ({
    ...endpoints,
    [route]: `${apiConfig.baseUrl}/${route}`
  }), {} as ApiEndpoints);
};

/**
 * URLs des endpoints de l'API
 */
export const API_ENDPOINTS = generateApiEndpoints();

/**
 * URLs spécifiques pour chaque service
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
 * URL de base pour l'API (utilisée par certains services)
 */
export const API_BASE_URL = apiConfig.baseUrl;

export default apiConfig;