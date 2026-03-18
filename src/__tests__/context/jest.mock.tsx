import React from 'react';

// Mock function creators
const createMockSignIn = () => ({
  signIn: { 
    create: jest.fn().mockResolvedValue({
      status: 'complete',
      createdSessionId: 'session123'
    }) 
  }
});

const createMockSignUp = () => ({
  signUp: { 
    create: jest.fn().mockResolvedValue({
      status: 'complete',
      createdSessionId: 'session456',
      update: jest.fn().mockResolvedValue(true)
    })
  }
});

const createMockClerk = () => ({
  signOut: jest.fn().mockResolvedValue(true),
  session: { 
    getToken: jest.fn().mockResolvedValue('mock-token') 
  }
});

const createMockUser = () => ({
  user: { 
    id: 'user123', 
    username: 'testuser', 
    primaryEmailAddress: { 
      emailAddress: 'test@example.com' 
    } 
  },
  isLoaded: true
});

// Create the mock for @clerk/clerk-expo
export const mockClerk = () => {
  jest.mock('@clerk/clerk-expo', () => ({
    useSignIn: jest.fn().mockImplementation(createMockSignIn),
    useSignUp: jest.fn().mockImplementation(createMockSignUp),
    useClerk: jest.fn().mockImplementation(createMockClerk),
    useUser: jest.fn().mockImplementation(createMockUser)
  }));
};

// Create the mock for axios
export const mockAxios = () => {
  jest.mock('axios', () => ({
    defaults: {
      headers: {
        common: {}
      }
    },
    post: jest.fn().mockResolvedValue({ data: { success: true } }),
    get: jest.fn().mockResolvedValue({
      data: {
        id: 'backend-user-123',
        username: 'backenduser',
        email: 'backend@example.com'
      }
    })
  }));
};

// Create the mock for React's useContext
export const mockReactContext = () => {
  const originalReact = jest.requireActual('react');
  jest.mock('react', () => ({
    ...originalReact,
    createContext: jest.fn().mockImplementation(() => ({
      Provider: ({ children }: any) => children,
      Consumer: ({ children }: any) => children
    })),
  }));
};

// Create a mock AuthContext value
export const createMockAuthContextValue = () => ({
  user: { id: 'context-user', username: 'contextuser', email: 'context@example.com' },
  isLoading: false,
  isAuthenticated: true,
  login: jest.fn().mockResolvedValue({ success: true }),
  register: jest.fn().mockResolvedValue({ success: true }),
  logout: jest.fn().mockResolvedValue(undefined),
  getCurrentUser: jest.fn().mockResolvedValue({ id: 'user123', username: 'testuser', email: 'test@example.com' })
}); 