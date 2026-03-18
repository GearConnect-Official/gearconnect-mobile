import { renderHook, act } from '@testing-library/react-native';
import useFeedback from '@/hooks/useFeedback';
import { FeedbackType } from '@/components/FeedbackMessage';
import { ApiError, ErrorType } from '@/services/axiosConfig';
import * as axiosConfig from '@/services/axiosConfig';

jest.mock('@/services/axiosConfig', () => {
  const original = jest.requireActual('@/services/axiosConfig');
  return {
    ...original,
    handleApiError: jest.fn()
  };
});

describe('useFeedback hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn(); // Mock console.error
  });
  
  it('should initialize with default state', () => {
    // Rendu du hook
    const { result } = renderHook(() => useFeedback());
    
    // Vérifier l'état initial
    expect(result.current.feedbackState).toEqual({
      visible: false,
      message: '',
      type: FeedbackType.INFO,
      duration: 5000,
    });
  });
  
  it('should show error feedback', () => {
    // Rendu du hook
    const { result } = renderHook(() => useFeedback());
    
    // Déclencher l'action showError
    act(() => {
      result.current.showError('Test error message');
    });
    
    // Vérifier que l'état a été mis à jour correctement
    expect(result.current.feedbackState).toEqual({
      visible: true,
      message: 'Test error message',
      type: FeedbackType.ERROR,
      duration: 5000,
    });
  });
  
  it('should show success feedback', () => {
    // Rendu du hook
    const { result } = renderHook(() => useFeedback());
    
    // Déclencher l'action showSuccess
    act(() => {
      result.current.showSuccess('Test success message');
    });
    
    // Vérifier que l'état a été mis à jour correctement
    expect(result.current.feedbackState).toEqual({
      visible: true,
      message: 'Test success message',
      type: FeedbackType.SUCCESS,
      duration: 5000,
    });
  });
  
  it('should allow custom duration', () => {
    // Rendu du hook
    const { result } = renderHook(() => useFeedback());
    
    // Déclencher l'action showInfo avec une durée personnalisée
    act(() => {
      result.current.showInfo('Test info message', 10000);
    });
    
    // Vérifier que l'état a été mis à jour avec la durée personnalisée
    expect(result.current.feedbackState).toEqual({
      visible: true,
      message: 'Test info message',
      type: FeedbackType.INFO,
      duration: 10000,
    });
  });
  
  it('should hide feedback', () => {
    // Rendu du hook
    const { result } = renderHook(() => useFeedback());
    
    // Afficher d'abord un feedback
    act(() => {
      result.current.showInfo('Test info message');
    });
    
    // Vérifier que le feedback est visible
    expect(result.current.feedbackState.visible).toBe(true);
    
    // Cacher le feedback
    act(() => {
      result.current.hideFeedback();
    });
    
    // Vérifier que le feedback est caché
    expect(result.current.feedbackState.visible).toBe(false);
    // Vérifier que les autres propriétés sont préservées
    expect(result.current.feedbackState.message).toBe('Test info message');
  });
  
  it('should handle API errors', () => {
    // Mock de handleApiError pour retourner une ApiError
    const mockApiError: ApiError = {
      type: ErrorType.NETWORK,
      message: 'Network error occurred',
      status: 0
    };
    (axiosConfig.handleApiError as jest.Mock).mockReturnValue(mockApiError);
    
    // Rendu du hook
    const { result } = renderHook(() => useFeedback());
    
    // Simuler une erreur API
    const originalError = new Error('Original error');
    
    // Déclencher l'action showApiError
    act(() => {
      result.current.showApiError(originalError);
    });
    
    // Vérifier que handleApiError a été appelé avec l'erreur originale
    expect(axiosConfig.handleApiError).toHaveBeenCalledWith(originalError);
    
    // Vérifier que l'état a été mis à jour avec l'erreur API
    expect(result.current.feedbackState).toEqual({
      visible: true,
      message: 'Network error occurred',
      type: FeedbackType.ERROR,
      errorType: ErrorType.NETWORK,
      duration: 5000,
    });
    
    // Vérifier que l'erreur a été loguée
    expect(console.error).toHaveBeenCalled();
  });
  
  it('should use custom message instead of API error message if provided', () => {
    // Mock de handleApiError pour retourner une ApiError
    const mockApiError: ApiError = {
      type: ErrorType.SERVER,
      message: 'Server error',
      status: 500
    };
    (axiosConfig.handleApiError as jest.Mock).mockReturnValue(mockApiError);
    
    // Rendu du hook
    const { result } = renderHook(() => useFeedback());
    
    // Déclencher l'action showApiError avec un message personnalisé
    act(() => {
      result.current.showApiError(new Error('Original error'), 'Custom error message');
    });
    
    // Vérifier que l'état a été mis à jour avec le message personnalisé
    expect(result.current.feedbackState).toEqual({
      visible: true,
      message: 'Custom error message',
      type: FeedbackType.ERROR,
      errorType: ErrorType.SERVER,
      duration: 5000,
    });
  });
}); 