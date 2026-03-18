import axios from 'axios';
import { API_URL_PERFORMANCES } from '@/config';
import {
  CreatePerformanceData,
  Performance,
  UserPerformanceStats,
  PerformanceFilters
} from '@/types/performance.types';

// API configuration for performance tracking
const api = axios.create({
  baseURL: API_URL_PERFORMANCES,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 60000, // 60 seconds timeout
});

// API response wrapper interface
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  count?: number;
  message?: string;
}

/**
 * Modern Performance Tracking Service
 * Handles all racing performance data operations
 */
class PerformanceService {

  static async createPerformance(
    data: CreatePerformanceData,
    userId: string | number
  ): Promise<ApiResponse<Performance>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required',
          details: 'No user ID provided'
        };
      }

      const payload = {
        userId: typeof userId === 'string' ? parseInt(userId) : userId,
        circuitName: data.circuitName,
        lapTime: data.lapTime,
        racePosition: data.racePosition,
        totalParticipants: data.totalParticipants,
        category: data.category,
        date: data.date,
        notes: data.notes,
        trackCondition: data.trackCondition,
        eventId: data.eventId,
      };

      const response = await api.post<ApiResponse<Performance>>('/', payload);

      return response.data;
    } catch (error: any) {
      console.error('Error creating performance:', error);

      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        if (status === 401) {
          return {
            success: false,
            error: 'Authentication failed',
            details: errorData?.details || 'User authentication required.'
          };
        } else if (status === 403) {
          return {
            success: false,
            error: 'Access denied',
            details: errorData?.details || 'You do not have permission to perform this action.'
          };
        } else if (status === 400) {
          return {
            success: false,
            error: 'Invalid data',
            details: errorData?.details || errorData?.error || 'Please check your input data.'
          };
        } else if (status === 500) {
          return {
            success: false,
            error: 'Server error',
            details: 'An internal server error occurred. Please try again later.'
          };
        } else {
          return {
            success: false,
            error: errorData?.error || `Server error (${status})`,
            details: errorData?.details || error.response.statusText
          };
        }
      } else if (error.request) {
        return {
          success: false,
          error: 'Network error',
          details: 'Could not connect to server. Please check your internet connection and try again.'
        };
      } else {
        return {
          success: false,
          error: 'Request error',
          details: 'An error occurred while preparing the request. Please try again.'
        };
      }
    }
  }

  static async getUserPerformances(
    userId: string | number,
    filters?: Omit<PerformanceFilters, 'userId'>
  ): Promise<ApiResponse<Performance[]>> {
    try {
      const params = new URLSearchParams();

      if (filters?.category && filters.category !== 'all') {
        params.append('category', filters.category);
      }
      if (filters?.circuitName) {
        params.append('circuitName', filters.circuitName);
      }
      if (filters?.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }
      if (filters?.dateTo) {
        params.append('dateTo', filters.dateTo);
      }
      if (filters?.eventId) {
        params.append('eventId', filters.eventId.toString());
      }
      if (filters?.limit) {
        params.append('limit', filters.limit.toString());
      }
      if (filters?.offset) {
        params.append('offset', filters.offset.toString());
      }

      const response = await api.get<ApiResponse<Performance[]>>(
        `/user/${userId}?${params.toString()}`
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching user performances:', error);

      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch performances'
      };
    }
  }

  static async getUserStats(
    userId: string | number
  ): Promise<ApiResponse<UserPerformanceStats>> {
    try {
      const response = await api.get<ApiResponse<UserPerformanceStats>>(
        `/user/${userId}/stats`
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching user stats:', error);

      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch statistics'
      };
    }
  }

  static async getEventPerformances(
    eventId: number
  ): Promise<ApiResponse<Performance[]>> {
    try {
      const params = new URLSearchParams();
      params.append('eventId', eventId.toString());
      params.append('limit', '100');

      const response = await api.get<ApiResponse<Performance[]>>(
        `?${params.toString()}`
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching event performances:', error);

      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch event performances'
      };
    }
  }

  static async getPerformanceById(
    id: number
  ): Promise<ApiResponse<Performance>> {
    try {
      const response = await api.get<ApiResponse<Performance>>(`/${id}`);

      return response.data;
    } catch (error: any) {
      console.error('Error fetching performance:', error);

      return {
        success: false,
        error: error.response?.data?.error || 'Performance not found'
      };
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_URL_PERFORMANCES.replace('/performances', '')}/health`);
      return response.status === 200;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

export default PerformanceService;
