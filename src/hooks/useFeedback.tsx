import { useState, useCallback } from 'react';
import { FeedbackType } from '@/components/ui/FeedbackMessage';
import { ApiError, ErrorType, handleApiError } from '@/services/axiosConfig';
import { MessageConfig, ConfirmationConfig, MessageType } from '@/types/message.types';
import MessageService from '@/services/messageService';

interface FeedbackState {
  visible: boolean;
  message: string;
  type: FeedbackType;
  errorType?: ErrorType;
  duration?: number;
}

interface ConfirmationState extends ConfirmationConfig {
  visible: boolean;
}

interface UseFeedbackResult {
  feedbackState: FeedbackState;
  showFeedback: (message: string, type: FeedbackType, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showApiError: (error: any, customMessage?: string, duration?: number) => void;
  hideFeedback: () => void;
  showMessage: (messageConfig: MessageConfig) => void;
  confirmationState: ConfirmationState;
  showConfirmation: (confirmationConfig: ConfirmationConfig) => void;
  hideConfirmation: () => void;
}

/**
 * Hook personnalisé pour gérer les messages de feedback et confirmations
 */
const useFeedback = (): UseFeedbackResult => {
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    visible: false,
    message: '',
    type: FeedbackType.INFO,
    duration: 5000,
  });

  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showFeedback = useCallback((message: string, type: FeedbackType, duration = 5000) => {
    setFeedbackState({
      visible: true,
      message,
      type,
      duration,
    });
  }, []);

  const showError = useCallback((message: string, duration = 5000) => {
    showFeedback(message, FeedbackType.ERROR, duration);
  }, [showFeedback]);

  const showSuccess = useCallback((message: string, duration = 5000) => {
    showFeedback(message, FeedbackType.SUCCESS, duration);
  }, [showFeedback]);

  const showWarning = useCallback((message: string, duration = 5000) => {
    showFeedback(message, FeedbackType.WARNING, duration);
  }, [showFeedback]);

  const showInfo = useCallback((message: string, duration = 5000) => {
    showFeedback(message, FeedbackType.INFO, duration);
  }, [showFeedback]);

  const showApiError = useCallback((error: any, customMessage?: string, duration = 5000) => {
    // Normaliser l'erreur API
    const apiError: ApiError = handleApiError(error);

    // Utiliser le message personnalisé ou celui de l'erreur API
    const errorMessage = customMessage || apiError.message;

    setFeedbackState({
      visible: true,
      message: errorMessage,
      type: FeedbackType.ERROR,
      errorType: apiError.type,
      duration,
    });

    // Log détaillé de l'erreur pour le débogage
    console.error('API Error handled by useFeedback:', {
      type: apiError.type,
      status: apiError.status,
      message: apiError.message,
      data: apiError.data,
    });
  }, []);

  const hideFeedback = useCallback(() => {
    setFeedbackState(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const showMessage = useCallback((messageConfig: MessageConfig) => {
    // Convertir MessageType vers FeedbackType
    const feedbackType = messageConfig.type === MessageType.SUCCESS ? FeedbackType.SUCCESS :
                         messageConfig.type === MessageType.ERROR ? FeedbackType.ERROR :
                         messageConfig.type === MessageType.WARNING ? FeedbackType.WARNING :
                         FeedbackType.INFO;

    setFeedbackState({
      visible: true,
      message: messageConfig.message,
      type: feedbackType,
      duration: messageConfig.duration || 5000,
    });
  }, []);

  const showConfirmation = useCallback((confirmationConfig: ConfirmationConfig) => {
    setConfirmationState({
      ...confirmationConfig,
      visible: true,
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmationState(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  return {
    feedbackState,
    showFeedback,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    showApiError,
    hideFeedback,
    showMessage,
    confirmationState,
    showConfirmation,
    hideConfirmation,
  };
};

export default useFeedback;
