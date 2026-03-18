import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { getClerkInstance } from '@clerk/clerk-expo';

// Identifiable error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN'
}

// Interface for normalized API errors
export interface ApiError {
  type: ErrorType;
  status?: number;
  message: string;
  originalError?: any;
  data?: any;
}

// Interface for API error responses
interface ApiErrorResponse {
  message?: string;
  error?: string;
  [key: string]: any;
}

let interceptorsConfigured = false;

export const configureAxios = async () => {
  if (interceptorsConfigured) {
    console.log('✅ Axios interceptors already configured');
    return;
  }

  console.log('🚀 Configuring Axios interceptors with Clerk...');

  // REQUEST INTERCEPTOR - Automatically add Bearer token
  axios.interceptors.request.use(
    async (config) => {
      try {
        console.log(`📤 [${config.method?.toUpperCase()}] ${config.url}`);

        // Skip token for verification routes and messaging routes that don't use Clerk
        const isVerificationRoute = config.url?.includes('/verification/');
        const isMessagingRoute = config.url?.includes('/messaging/');

        if (!isVerificationRoute && !isMessagingRoute) {
        try {
          const clerkInstance = getClerkInstance();
          const token = await clerkInstance.session?.getToken();

          if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            console.log('🔑 Bearer token added to request');
            }
        } catch (clerkError) {
            // Silent fail for routes that don't need Clerk
          }
        }

        // Add user ID from AsyncStorage
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

        // Add default headers
        config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
        config.headers['Accept'] = 'application/json';

        return config;
      } catch (error) {
        console.error('❌ Error in request interceptor:', error);
        return config;
      }
    },
    (error) => {
      console.error('❌ Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // RESPONSE INTERCEPTOR - Error handling and logs
  axios.interceptors.response.use(
    (response: AxiosResponse) => {
      console.log(`✅ [${response.config.method?.toUpperCase()}] ${response.config.url} - ${response.status}`);
      return response;
    },
    (error: AxiosError) => {
      const url = error.config?.url || 'unknown';
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';

      let apiError: ApiError = {
        type: ErrorType.UNKNOWN,
        message: 'Une erreur inattendue s\'est produite',
        originalError: error
      };

      const isHealthCheck = url.includes('/api/health');
      const isVerificationRoute = url.includes('/verification/');
      const shouldIgnore404 = isVerificationRoute && error.response?.status === 404;

      // Network error handling
      if (error.code === 'ECONNABORTED') {
        apiError = {
          type: ErrorType.TIMEOUT,
          message: 'La requête a expiré. Veuillez réessayer.',
          originalError: error
        };
      } else if (error.code === 'ERR_NETWORK') {
        apiError = {
          type: ErrorType.NETWORK,
          message: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
          originalError: error
        };
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
          case 500:
          case 502:
          case 503:
          case 504:
            apiError.type = ErrorType.SERVER;
            apiError.message = 'Erreur serveur. Veuillez réessayer plus tard.';
            break;
          default:
            apiError.type = ErrorType.UNKNOWN;
            apiError.message = errorData?.message || errorData?.error || 'Erreur inconnue.';
        }
      }

      // Conditional logs
      if (!isHealthCheck && !shouldIgnore404 && apiError.type !== ErrorType.NETWORK) {
        console.error(`❌ [${method}] ${url} - ${apiError.status || 'Network'}: ${apiError.message}`);
      }

      if (shouldIgnore404) {
        const silentError: ApiError = {
          type: ErrorType.NOT_FOUND,
          message: 'Route not implemented',
          status: 404,
          originalError: error
        };
        return Promise.reject(silentError);
      }

      return Promise.reject(apiError);
    }
  );

  interceptorsConfigured = true;
  console.log('✅ Axios interceptors configured successfully!');
};

// Global error handler for components
export const handleApiError = (error: any): ApiError => {
  if (error && error.type && Object.values(ErrorType).includes(error.type)) {
    return error as ApiError;
  }

  return {
    type: ErrorType.UNKNOWN,
    message: 'Une erreur inattendue s\'est produite',
    originalError: error
  };
};

// Modern Provider for Expo Router with automatic configuration
const AxiosConfigProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      console.log('🎯 Clerk loaded, configuring axios...');
      configureAxios();
    }
  }, [isLoaded]);

  return children as React.ReactElement || null;
};

export default AxiosConfigProvider;
