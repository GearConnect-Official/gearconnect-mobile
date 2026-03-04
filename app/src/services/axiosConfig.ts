import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { useAuth } from '@clerk/clerk-expo';

const AUTH_TOKEN_KEY = '@auth_token';

// Types d'erreurs identifiables
export enum ErrorType {
  NETWORK = 'NETWORK',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN'
}

export interface ApiError {
  type: ErrorType;
  status?: number;
  message: string;
  originalError?: any;
  data?: any;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  [key: string]: any;
}

// Fonction de refresh injectée par le Provider (appelée uniquement sur 401)
let refreshClerkToken: (() => Promise<string | null>) | null = null;

export const setTokenRefresher = (fn: (() => Promise<string | null>) | null) => {
  refreshClerkToken = fn;
};

// Flag pour éviter les boucles de refresh
let isRefreshing = false;

// REQUEST INTERCEPTOR — lit le token depuis AsyncStorage
axios.interceptors.request.use(
  async (config) => {
    try {
      console.log(`📤 [${config.method?.toUpperCase()}] ${config.url}`);

      const isVerificationRoute = config.url?.includes('/verification/');

      if (!isVerificationRoute) {
        try {
          const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
          if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            console.log('🔑 Bearer token added to request');
          }
        } catch (e) {
          // Silent fail
        }
      }

      try {
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          const user = JSON.parse(userString);
          if (user && user.id) {
            config.headers['user-id'] = user.id;
            console.log('👤 User ID added to headers');
          }
        }
      } catch (storageError) {
        console.warn('⚠️ Could not get user from storage:', storageError);
      }

      config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
      config.headers['Accept'] = 'application/json';

      return config;
    } catch (error) {
      console.error('❌ Error in request interceptor:', error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR — auto-refresh token sur 401
axios.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ [${response.config.method?.toUpperCase()}] ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const url = error.config?.url || 'unknown';
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';

    // Auto-refresh sur 401 : rafraîchir le token et retenter UNE fois
    if (error.response?.status === 401 && !originalRequest?._retry && refreshClerkToken && !isRefreshing) {
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Token expiré, refresh en cours...');
        const newToken = await refreshClerkToken();
        if (newToken) {
          await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          console.log('🔑 Token rafraîchi, retry de la requête');
          isRefreshing = false;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.warn('⚠️ Impossible de rafraîchir le token');
      }
      isRefreshing = false;
    }

    // Construction de l'erreur normalisée
    let apiError: ApiError = {
      type: ErrorType.UNKNOWN,
      message: 'Une erreur inattendue s\'est produite',
      originalError: error
    };

    const isHealthCheck = url.includes('/api/health');
    const isVerificationRoute = url.includes('/verification/');
    const shouldIgnore404 = isVerificationRoute && error.response?.status === 404;

    if (error.code === 'ECONNABORTED') {
      apiError = { type: ErrorType.TIMEOUT, message: 'La requête a expiré. Veuillez réessayer.', originalError: error };
    } else if (error.code === 'ERR_NETWORK') {
      apiError = { type: ErrorType.NETWORK, message: 'Impossible de se connecter au serveur.', originalError: error };
    } else if (error.response) {
      const { status, data } = error.response;
      const errorData = data as ApiErrorResponse;
      apiError.status = status;
      apiError.data = errorData;

      switch (status) {
        case 401:
          apiError.type = ErrorType.UNAUTHORIZED;
          apiError.message = 'Authentication requise. Token invalide ou expiré.';
          console.log('🔒 401 Unauthorized - Token problem detected');
          break;
        case 403:
          apiError.type = ErrorType.UNAUTHORIZED;
          apiError.message = 'Accès refusé. Permissions insuffisantes.';
          break;
        case 404:
          apiError.type = ErrorType.NOT_FOUND;
          apiError.message = 'Ressource non trouvée.';
          break;
        case 422:
          apiError.type = ErrorType.VALIDATION;
          apiError.message = 'Données invalides.';
          break;
        case 500: case 502: case 503: case 504:
          apiError.type = ErrorType.SERVER;
          apiError.message = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        default:
          apiError.message = errorData?.message || errorData?.error || 'Erreur inconnue.';
      }
    }

    if (!isHealthCheck && !shouldIgnore404 && apiError.type !== ErrorType.NETWORK) {
      console.error(`❌ [${method}] ${url} - ${apiError.status || 'Network'}: ${apiError.message}`);
    }

    if (shouldIgnore404) {
      return Promise.reject({ type: ErrorType.NOT_FOUND, message: 'Route not implemented', status: 404, originalError: error });
    }

    return Promise.reject(apiError);
  }
);

export const handleApiError = (error: any): ApiError => {
  if (error && error.type && Object.values(ErrorType).includes(error.type)) {
    return error as ApiError;
  }
  return { type: ErrorType.UNKNOWN, message: 'Une erreur inattendue s\'est produite', originalError: error };
};

// Provider léger : injecte juste la fonction de refresh (pas d'appels Clerk en boucle)
const AxiosConfigProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isLoaded, getToken } = useAuth();

  // Injecter la fonction de refresh une seule fois
  if (isLoaded && getToken) {
    setTokenRefresher(getToken);
  }

  if (!isLoaded) return null;

  return children as React.ReactElement || null;
};

export default AxiosConfigProvider;
