import axios from 'axios';
import { signUp, signIn, getUserInfo } from '@/services/AuthService';
import { API_URL_AUTH } from '@/config';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuthService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    test('successfully signs up a user', async () => {
      // Mock data
      const username = 'testuser';
      const email = 'test@example.com';
      const password = 'password123';
      const mockResponse = { data: { token: 'test-token', userId: 'user123' } };

      // Setup mock
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      // Call the function
      const result = await signUp(username, email, password);

      // Assertions
      expect(mockedAxios.post).toHaveBeenCalledWith(`${API_URL_AUTH}/signup`, {
        username,
        email,
        password
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('handles signup error', async () => {
      // Mock data
      const username = 'testuser';
      const email = 'test@example.com';
      const password = 'password123';
      const mockError = {
        response: {
          data: {
            message: 'Email already exists'
          }
        }
      };

      // Setup mock to throw error
      mockedAxios.post.mockRejectedValueOnce(mockError);

      // Call the function and expect it to throw
      await expect(signUp(username, email, password)).rejects.toEqual(mockError);
      expect(mockedAxios.post).toHaveBeenCalledWith(`${API_URL_AUTH}/signup`, {
        username,
        email,
        password
      });
    });
  });

  describe('signIn', () => {
    test('successfully signs in a user', async () => {
      // Mock data
      const email = 'test@example.com';
      const password = 'password123';
      const mockResponse = { data: { token: 'test-token', userId: 'user123' } };

      // Setup mock
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      // Call the function
      const result = await signIn(email, password);

      // Assertions
      expect(mockedAxios.post).toHaveBeenCalledWith(`${API_URL_AUTH}/login`, {
        email,
        password
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('handles signin error', async () => {
      // Mock data
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const mockError = {
        response: {
          data: {
            message: 'Invalid credentials'
          }
        }
      };

      // Setup mock to throw error
      mockedAxios.post.mockRejectedValueOnce(mockError);

      // Call the function and expect it to throw
      await expect(signIn(email, password)).rejects.toEqual(mockError);
      expect(mockedAxios.post).toHaveBeenCalledWith(`${API_URL_AUTH}/login`, {
        email,
        password
      });
    });
  });

  describe('getUserInfo', () => {
    test('successfully gets user info', async () => {
      // Mock data
      const token = 'test-token';
      const mockResponse = {
        data: {
          id: 'user123',
          username: 'testuser',
          email: 'test@example.com'
        }
      };

      // Setup mock
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      // Call the function
      const result = await getUserInfo(token);

      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL_AUTH}/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('handles getUserInfo error', async () => {
      // Mock data
      const token = 'invalid-token';
      const mockError = {
        response: {
          data: {
            message: 'Unauthorized'
          }
        }
      };

      // Setup mock to throw error
      mockedAxios.get.mockRejectedValueOnce(mockError);

      // Call the function and expect it to throw
      await expect(getUserInfo(token)).rejects.toEqual(mockError);
      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL_AUTH}/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    });
  });
}); 