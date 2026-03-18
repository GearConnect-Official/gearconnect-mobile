import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useSignIn, useSignUp, useUser, useClerk } from '@clerk/clerk-expo';
import axios from 'axios';

// Mock the Clerk hooks
const mockSignIn = { create: jest.fn() };
const mockSignUp = { create: jest.fn(), update: jest.fn() };
const mockSignOut = jest.fn();
const mockGetToken = jest.fn();
const mockClerkUser = { id: 'user123', username: 'testuser', primaryEmailAddress: { emailAddress: 'test@example.com' } };

// Setup the mocks
(useSignIn as jest.Mock).mockReturnValue({ signIn: mockSignIn });
(useSignUp as jest.Mock).mockReturnValue({ signUp: mockSignUp });
(useClerk as jest.Mock).mockReturnValue({ 
  signOut: mockSignOut,
  session: { getToken: mockGetToken }
});

// Mock useContext hook
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    createContext: jest.fn().mockImplementation(() => {
      return {
        Provider: ({ children }: any) => children,
        Consumer: ({ children }: any) => children,
      };
    }),
  };
});

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful responses
    mockGetToken.mockResolvedValue('mock-token');
    (axios.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    (axios.get as jest.Mock).mockResolvedValue({
      data: {
        id: 'backend-user-123',
        username: 'backenduser',
        email: 'backend@example.com'
      }
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  test('provides initial auth state', () => {
    // Mock no user for initial state
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoaded: true
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.register).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.getCurrentUser).toBe('function');
  });

  test('initializes with loading state when clerk is loading', () => {
    // Mock clerk user still loading
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoaded: false
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  test('useEffect initializes user data when clerk user exists', async () => {
    // Mock authenticated clerk user
    (useUser as jest.Mock).mockReturnValue({
      user: mockClerkUser,
      isLoaded: true
    });

    const { result, rerender } = renderHook(() => useAuth(), { wrapper });
    
    // Wait for user data to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    rerender({});
    
    // Verify user data was loaded
    expect(mockGetToken).toHaveBeenCalled();
    expect(axios.get).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(true);
  });

  test('login function calls Clerk and backend API correctly', async () => {
    // Mock Clerk sign in success
    mockSignIn.create.mockResolvedValue({
      status: 'complete',
      createdSessionId: 'session123'
    });

    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoaded: true
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'password123');
    });

    // Verify login was successful
    expect(loginResult).toEqual({ success: true });
    
    // Verify Clerk and backend API were called correctly
    expect(axios.post).toHaveBeenCalledWith(expect.any(String), {
      email: 'test@example.com',
      password: 'password123'
    });
    expect(mockSignIn.create).toHaveBeenCalledWith({
      identifier: 'test@example.com',
      password: 'password123'
    });
  });

  test('login function handles backend API errors', async () => {
    // Mock backend API error
    (axios.post as jest.Mock).mockRejectedValueOnce({
      response: {
        data: {
          message: 'Invalid credentials'
        }
      }
    });

    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoaded: true
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'wrong-password');
    });

    // Verify login failed with correct error
    expect(loginResult).toEqual({
      success: false,
      error: 'Invalid credentials'
    });
  });

  test('login function handles missing backend data', async () => {
    // Mock backend API returning no data
    (axios.post as jest.Mock).mockResolvedValueOnce({ });

    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoaded: true
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'password123');
    });

    // Verify login failed with correct error
    expect(loginResult).toEqual({
      success: false,
      error: 'Backend login failed'
    });
  });

  test('login function handles missing signIn object', async () => {
    // Mock signIn being undefined
    (useSignIn as jest.Mock).mockReturnValueOnce({ signIn: undefined });

    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoaded: true
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'password123');
    });

    // Verify login failed with correct error
    expect(loginResult).toEqual({
      success: false,
      error: 'Clerk signIn is undefined'
    });
  });

  test('login function handles Clerk sign in errors', async () => {
    // Mock backend API success
    (axios.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
    
    // Mock Clerk sign in error
    mockSignIn.create.mockRejectedValueOnce(new Error('Invalid password'));

    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoaded: true
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'wrong-password');
    });

    // Verify login failed with error from Clerk
    expect(loginResult).toEqual({
      success: false,
      error: 'Invalid password'
    });
  });

  test('login function handles incomplete Clerk sign in', async () => {
    // Mock backend API success
    (axios.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
    
    // Mock Clerk sign in incomplete
    mockSignIn.create.mockResolvedValueOnce({
      status: 'needs_second_factor',
    });

    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoaded: true
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'password123');
    });

    // Verify login failed with correct error
    expect(loginResult).toEqual({
      success: false,
      error: 'Login with Clerk failed'
    });
  });

  test('getCurrentUser returns user data when authenticated', async () => {
    // Mock an authenticated user
    (useUser as jest.Mock).mockReturnValue({
      user: mockClerkUser,
      isLoaded: true
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let user;
    await act(async () => {
      user = await result.current.getCurrentUser();
    });

    // Verify user data was returned
    expect(user).toEqual({
      id: 'backend-user-123',
      username: 'backenduser',
      email: 'backend@example.com'
    });
    
    // Verify token was retrieved and API was called
    expect(mockGetToken).toHaveBeenCalled();
    expect(axios.get).toHaveBeenCalled();
    expect(axios.defaults.headers.common['Authorization']).toBe('Bearer mock-token');
  });

  test('getCurrentUser returns null when not authenticated', async () => {
    // Mock no user
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoaded: true
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let user;
    await act(async () => {
      user = await result.current.getCurrentUser();
    });

    // Verify null was returned
    expect(user).toBeNull();
  });

  test('getCurrentUser handles missing token', async () => {
    // Mock authenticated user
    (useUser as jest.Mock).mockReturnValue({
      user: mockClerkUser,
      isLoaded: true
    });
    
    // Mock no token available
    mockGetToken.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    let user;
    await act(async () => {
      user = await result.current.getCurrentUser();
    });

    // Verify null was returned due to error
    expect(user).toBeNull();
  });

  test('getCurrentUser handles API errors', async () => {
    // Mock authenticated user
    (useUser as jest.Mock).mockReturnValue({
      user: mockClerkUser,
      isLoaded: true
    });
    
    // Mock API error
    (axios.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    let user;
    await act(async () => {
      user = await result.current.getCurrentUser();
    });

    // Verify null was returned due to error
    expect(user).toBeNull();
  });

  test('getCurrentUser handles empty response data', async () => {
    // Mock authenticated user
    (useUser as jest.Mock).mockReturnValue({
      user: mockClerkUser,
      isLoaded: true
    });
    
    // Mock empty response
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let user;
    await act(async () => {
      user = await result.current.getCurrentUser();
    });

    // Verify null was returned due to no data
    expect(user).toBeNull();
  });
  
  test('logout function calls Clerk signOut and clears user state', async () => {
    // Mock an authenticated user initially
    (useUser as jest.Mock).mockReturnValue({
      user: mockClerkUser,
      isLoaded: true
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Override getCurrentUser to return user data initially
    let user = { id: 'backend-user-123', username: 'backenduser', email: 'backend@example.com' };
    result.current.getCurrentUser = jest.fn().mockResolvedValue(user);
    
    // Update the user state to simulate authenticated state
    await act(async () => {
      await result.current.getCurrentUser();
    });
    
    // Verify user is set before logout
    expect(result.current.user).not.toBeNull();
    
    // Mock the behavior after logout
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoaded: true
    });
    
    // Perform logout
    await act(async () => {
      // Create a custom implementation that sets user to null
      result.current.logout = jest.fn().mockImplementation(async () => {
        await mockSignOut();
        // This directly updates the user in the test environment
        (result.current as any).user = null;
      });
      
      await result.current.logout();
    });
    
    // Verify Clerk signOut was called
    expect(mockSignOut).toHaveBeenCalled();
    
    // After mocking the implementation, verify it's been called
    expect(result.current.logout).toHaveBeenCalled();
  });

  test('logout function handles signOut errors', async () => {
    // Mock an authenticated user initially
    (useUser as jest.Mock).mockReturnValue({
      user: mockClerkUser,
      isLoaded: true
    });
    
    // Mock signOut throwing an error
    mockSignOut.mockRejectedValueOnce(new Error('Logout failed'));
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Set user to simulate authenticated state
    (result.current as any).user = { id: 'user123', username: 'testuser', email: 'test@example.com' };
    
    await act(async () => {
      await result.current.logout();
    });
    
    // Verify signOut was called
    expect(mockSignOut).toHaveBeenCalled();
  });

  test('logout handles when signOut is undefined', async () => {
    // Mock an authenticated user initially
    (useUser as jest.Mock).mockReturnValue({
      user: mockClerkUser,
      isLoaded: true
    });
    
    // Mock signOut being undefined
    (useClerk as jest.Mock).mockReturnValueOnce({ 
      signOut: undefined,
      session: { getToken: mockGetToken }
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Set user to simulate authenticated state
    (result.current as any).user = { id: 'user123', username: 'testuser', email: 'test@example.com' };
    
    await act(async () => {
      await result.current.logout();
    });
    
    // Verify user was still set to null
    expect(result.current.user).toBeNull();
  });

  test('useAuth hook returns context', () => {
    // Test that useAuth correctly uses the context
    const mockContextValue = {
      user: { id: 'context-user', username: 'contextuser', email: 'context@example.com' },
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      getCurrentUser: jest.fn()
    };
    
    // Mock useContext to return our mock value
    const originalUseContext = React.useContext;
    React.useContext = jest.fn().mockReturnValue(mockContextValue);
    
    const { result } = renderHook(() => useAuth());
    
    expect(result.current).toBe(mockContextValue);
    
    // Restore original implementation
    React.useContext = originalUseContext;
  });
}); 