import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { configureAxios, handleApiError, ErrorType } from '@/services/axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('axiosConfig', () => {
  let mockAxios: MockAdapter;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAxios = new MockAdapter(axios);
    
    // On supprime complètement les intercepteurs avant de configurer
    // @ts-ignore - La propriété handlers n'est pas exposée dans le type mais existe en interne
    axios.interceptors.request.handlers = [];
    // @ts-ignore - La propriété handlers n'est pas exposée dans le type mais existe en interne
    axios.interceptors.response.handlers = [];
    
    await configureAxios();
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('Request Interceptor', () => {
    it('should add user-id to request headers when user is available in AsyncStorage', async () => {
      // Mock AsyncStorage pour retourner un utilisateur
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify({ id: 'user123' }));
      
      // Configurer une requête mock
      mockAxios.onGet('/test-endpoint').reply(200, {});
      
      // Faire la requête
      await axios.get('/test-endpoint');
      
      // Vérifier que le header user-id a été ajouté
      const request = mockAxios.history.get[0];
      expect(request?.headers && request.headers['user-id']).toBe('user123');
    });

    it('should not add user-id to request headers when user is not available', async () => {
      // Mock AsyncStorage pour retourner null
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      
      // Configurer une requête mock
      mockAxios.onGet('/test-endpoint').reply(200, {});
      
      // Faire la requête
      await axios.get('/test-endpoint');
      
      // Vérifier que le header user-id n'est pas présent
      const request = mockAxios.history.get[0];
      expect(request?.headers && request.headers['user-id']).toBeUndefined();
    });
  });

  describe('Response Interceptor', () => {
    it('should transform network errors to ApiError with NETWORK type', async () => {
      // Simuler une erreur réseau
      mockAxios.onGet('/test-network-error').networkError();
      
      // Faire la requête et capturer l'erreur
      try {
        await axios.get('/test-network-error');
        fail('Should have thrown an error');
      } catch (error: any) {
        // Vérifier que l'erreur a été transformée
        expect(error.type).toBe(ErrorType.NETWORK);
        expect(error.message).toContain('Impossible de se connecter');
      }
    });

    it('should transform timeout errors to ApiError with TIMEOUT type', async () => {
      // Simuler un timeout
      mockAxios.onGet('/test-timeout').timeout();
      
      // Faire la requête et capturer l'erreur
      try {
        await axios.get('/test-timeout');
        fail('Should have thrown an error');
      } catch (error: any) {
        // Vérifier que l'erreur a été transformée
        expect(error.type).toBe(ErrorType.TIMEOUT);
        expect(error.message).toContain('expiré');
      }
    });

    it('should transform 401 responses to ApiError with UNAUTHORIZED type', async () => {
      // Simuler une erreur 401
      mockAxios.onGet('/test-unauthorized').reply(401, { message: 'Unauthorized' });
      
      // Faire la requête et capturer l'erreur
      try {
        await axios.get('/test-unauthorized');
        fail('Should have thrown an error');
      } catch (error: any) {
        // Vérifier que l'erreur a été transformée
        expect(error.type).toBe(ErrorType.UNAUTHORIZED);
        expect(error.status).toBe(401);
        expect(error.message).toContain('session');
      }
    });

    it('should transform 404 responses to ApiError with NOT_FOUND type', async () => {
      // Simuler une erreur 404
      mockAxios.onGet('/test-not-found').reply(404, { message: 'Not Found' });
      
      // Faire la requête et capturer l'erreur
      try {
        await axios.get('/test-not-found');
        fail('Should have thrown an error');
      } catch (error: any) {
        // Vérifier que l'erreur a été transformée
        expect(error.type).toBe(ErrorType.NOT_FOUND);
        expect(error.status).toBe(404);
        expect(error.message).toContain('n\'existe pas');
      }
    });

    it('should transform 500 responses to ApiError with SERVER type', async () => {
      // Simuler une erreur 500
      mockAxios.onGet('/test-server-error').reply(500, { message: 'Server Error' });
      
      // Faire la requête et capturer l'erreur
      try {
        await axios.get('/test-server-error');
        fail('Should have thrown an error');
      } catch (error: any) {
        // Vérifier que l'erreur a été transformée
        expect(error.type).toBe(ErrorType.SERVER);
        expect(error.status).toBe(500);
        expect(error.message).toContain('serveur');
      }
    });
  });

  describe('handleApiError', () => {
    it('should pass through ApiError objects unchanged', () => {
      // Créer une ApiError
      const apiError = {
        type: ErrorType.VALIDATION,
        message: 'Test validation error',
        status: 422
      };
      
      // Passer l'erreur au handler
      const result = handleApiError(apiError);
      
      // Vérifier que l'erreur est retournée inchangée
      expect(result).toEqual(apiError);
    });

    it('should convert unknown errors to ApiError with UNKNOWN type', () => {
      // Créer une erreur standard
      const error = new Error('Some random error');
      
      // Passer l'erreur au handler
      const result = handleApiError(error);
      
      // Vérifier que l'erreur a été transformée
      expect(result.type).toBe(ErrorType.UNKNOWN);
      expect(result.message).toContain('inattendue');
      expect(result.originalError).toBe(error);
    });
  });
}); 