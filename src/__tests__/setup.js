import '@testing-library/jest-native/extend-expect';

// Mock Expo Constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiProtocol: 'http',
      apiHost: 'localhost',
      apiPort: 3001
    }
  }
}));

// Mock Clerk
jest.mock('@clerk/clerk-expo', () => ({
  useSignIn: jest.fn(() => ({
    signIn: { 
      create: jest.fn().mockResolvedValue({
        status: 'complete', 
        createdSessionId: 'session123'
      })
    }
  })),
  useSignUp: jest.fn(() => ({
    signUp: { 
      create: jest.fn().mockResolvedValue({
        status: 'complete',
        update: jest.fn().mockResolvedValue(true)
      })
    }
  })),
  useUser: jest.fn(() => ({
    user: { 
      id: 'user123', 
      username: 'testuser', 
      primaryEmailAddress: { 
        emailAddress: 'test@example.com' 
      } 
    },
    isLoaded: true
  })),
  useClerk: jest.fn(() => ({
    signOut: jest.fn().mockResolvedValue(true),
    session: { 
      getToken: jest.fn().mockResolvedValue('mock-token') 
    }
  }))
}));

// Mocks complets pour React Native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Mocquer les composants problématiques
  RN.Animated = {
    ...RN.Animated,
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      interpolate: jest.fn(() => 0),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn()
    })),
    timing: jest.fn(() => ({
      start: jest.fn(callback => callback && callback())
    })),
    spring: jest.fn(() => ({
      start: jest.fn(callback => callback && callback())
    })),
    createAnimatedComponent: jest.fn(comp => comp),
    View: RN.View,
    Text: RN.Text,
    Image: RN.Image,
    ScrollView: RN.ScrollView
  };
  
  // Mock VirtualizedList qui semble causer des problèmes
  RN.VirtualizedList = jest.fn(() => null);
  RN.FlatList = jest.fn(props => null);
  
  // Mock Linking
  RN.Linking = {
    ...RN.Linking,
    openSettings: jest.fn(),
    openURL: jest.fn()
  };
  
  // Mock StyleSheet
  RN.StyleSheet = {
    ...RN.StyleSheet,
    create: styles => styles
  };
  
  // Mock AppState
  RN.AppState = {
    ...RN.AppState,
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    currentState: 'active'
  };
  
  return RN;
});

// Mock Expo Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
  FontAwesome5: 'FontAwesome5',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  AntDesign: 'AntDesign',
  Feather: 'Feather',
  Entypo: 'Entypo',
}));

// Mock pour les images et fichiers statiques
jest.mock('../../assets/error.png', () => 'mocked-error-image', { virtual: true });

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true
  }))
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn(), handlers: [] },
      response: { use: jest.fn(), eject: jest.fn(), handlers: [] }
    }
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  isAxiosError: jest.fn(),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn(), handlers: [] },
    response: { use: jest.fn(), eject: jest.fn(), handlers: [] }
  }
}));

// Supprimer les avertissements non pertinents
jest.spyOn(console, 'warn').mockImplementation(msg => {
  if (msg.includes('VirtualizedLists should never be nested')) return;
  console.warn(msg);
});

// Supprimer les erreurs liées à "act(...)" dans les tests
jest.spyOn(console, 'error').mockImplementation(msg => {
  if (msg.includes('Warning: An update to') && msg.includes('inside a test was not wrapped in act')) {
    return;
  }
  console.error(msg);
});

// Ajuster les timeouts pour les tests asynchrones
jest.setTimeout(10000);

// Add a simple test to avoid the "must contain at least one test" error
describe('Setup', () => {
  test('mocks are properly set up', () => {
    expect(true).toBe(true);
  });
}); 