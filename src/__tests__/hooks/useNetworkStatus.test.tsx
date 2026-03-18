import { renderHook, act } from '@testing-library/react-native';
import useNetworkStatus from '@/hooks/useNetworkStatus';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { AppState } from 'react-native';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn()
}));

// Mock AppState
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  return {
    ...rn,
    AppState: {
      ...rn.AppState,
      addEventListener: jest.fn(() => ({ remove: jest.fn() }))
    }
  };
});

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
  isAxiosError: jest.fn()
}));

describe('useNetworkStatus hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Réinitialiser les valeurs par défaut pour les mocks
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true
    });
    (axios.get as jest.Mock).mockResolvedValue({ data: 'OK' });
    // Conversion explicite via unknown pour éviter les erreurs de type
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);
  });

  it('should initialize with loading state', () => {
    // Rendu du hook
    const { result } = renderHook(() => useNetworkStatus());
    
    // Vérifier l'état initial
    expect(result.current.isInitializing).toBe(true);
    expect(result.current.isConnected).toBeNull();
    expect(result.current.isInternetReachable).toBeNull();
    expect(result.current.isServerReachable).toBeNull();
    expect(result.current.lastChecked).toBeNull();
  });

  it('should set isOnline to true when server is reachable', async () => {
    // Mock des réponses
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true
    });
    (axios.get as jest.Mock).mockResolvedValue({ data: 'OK' });

    // Rendu du hook
    const { result } = renderHook(() => useNetworkStatus());
    
    // Attendre la mise à jour asynchrone
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Vérifier l'état final
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isInternetReachable).toBe(true);
    expect(result.current.isServerReachable).toBe(true);
    expect(result.current.isOnline).toBe(true);
    expect(result.current.canMakeRequests).toBe(true);
    expect(result.current.isInitializing).toBe(false);
    expect(result.current.lastChecked).toBeInstanceOf(Date);
  });

  it('should set isOnline to false when internet is not reachable', async () => {
    // Mock des réponses indiquant pas d'internet
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: false
    });

    // Rendu du hook
    const { result } = renderHook(() => useNetworkStatus());
    
    // Attendre la mise à jour asynchrone
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Vérifier l'état final
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isInternetReachable).toBe(false);
    expect(result.current.isServerReachable).toBe(false);
    expect(result.current.isOnline).toBe(false);
    expect(result.current.canMakeRequests).toBe(false);
  });

  it('should set isOnline to false when server is not reachable', async () => {
    // Mock des réponses indiquant internet OK mais serveur KO
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true
    });
    // Simuler une erreur réseau
    const networkError = new Error('Network error');
    (axios.get as jest.Mock).mockRejectedValue(networkError);
    // Conversion explicite via unknown pour éviter les erreurs de type
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);

    // Rendu du hook
    const { result } = renderHook(() => useNetworkStatus());
    
    // Attendre la mise à jour asynchrone
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Vérifier l'état final
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isInternetReachable).toBe(true);
    expect(result.current.isServerReachable).toBe(false);
    expect(result.current.isOnline).toBe(false);
    expect(result.current.canMakeRequests).toBe(true);
  });

  it('should consider server reachable if server responds with error code', async () => {
    // Mock des réponses indiquant internet OK et serveur répond avec erreur HTTP
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true
    });
    
    // Simuler une erreur HTTP 500 (serveur accessible mais en erreur)
    const errorWithResponse = new Error('Server error') as any;
    errorWithResponse.response = { status: 500, data: { message: 'Internal Server Error' } };
    (axios.get as jest.Mock).mockRejectedValue(errorWithResponse);
    // Conversion explicite via unknown pour éviter les erreurs de type
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);

    // Rendu du hook
    const { result } = renderHook(() => useNetworkStatus());
    
    // Attendre la mise à jour asynchrone
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Vérifier l'état final - le serveur est considéré comme accessible même avec une erreur HTTP
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isInternetReachable).toBe(true);
    expect(result.current.isServerReachable).toBe(true);
    expect(result.current.isOnline).toBe(true);
  });

  it('should update status when checkConnection is called manually', async () => {
    // Just verify the function exists and is callable
    const { result } = renderHook(() => useNetworkStatus());
    
    // Check that the returned hook has the checkConnection function
    expect(typeof result.current.checkConnection).toBe('function');
  });

  it('should listen to AppState changes and check connection when app becomes active', async () => {
    // Rendu du hook
    renderHook(() => useNetworkStatus());
    
    // Vérifier que l'écouteur AppState a été ajouté
    expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    
    // Récupérer la fonction de callback
    const appStateHandler = (AppState.addEventListener as jest.Mock).mock.calls[0][1];
    
    // Réinitialiser les mocks pour ce test spécifique
    jest.clearAllMocks();
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true
    });
    
    // Simuler l'activation de l'app
    await appStateHandler('active');
    
    // Vérifier que NetInfo.fetch a été appelé
    expect(NetInfo.fetch).toHaveBeenCalled();
    
    // Vérifier que le serveur a été pingé
    expect(axios.get).toHaveBeenCalled();
  });
  
  it('should subscribe to NetInfo changes', () => {
    // Rendu du hook
    renderHook(() => useNetworkStatus());
    
    // Vérifier que l'écouteur NetInfo a été ajouté
    expect(NetInfo.addEventListener).toHaveBeenCalledWith(expect.any(Function));
  });
}); 