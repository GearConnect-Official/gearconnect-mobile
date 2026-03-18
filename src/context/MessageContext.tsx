import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FeedbackType } from '@/components/ui/FeedbackMessage';
import { MessageConfig, ConfirmationConfig, MessageType } from '@/types/message.types';
import { ApiError, ErrorType, handleApiError } from '@/services/axiosConfig';

interface FeedbackState {
  visible: boolean;
  message: string;
  type: FeedbackType;
  errorType?: ErrorType;
  duration?: number;
  customBackgroundColor?: string;
}

interface ConfirmationState extends ConfirmationConfig {
  visible: boolean;
}

interface MessageContextType {
  // Feedback
  feedbackState: FeedbackState;
  showFeedback: (message: string, type: FeedbackType, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showApiError: (error: any, customMessage?: string, duration?: number) => void;
  showMessage: (messageConfig: MessageConfig) => void;
  hideFeedback: () => void;

  // Confirmations
  confirmationState: ConfirmationState;
  showConfirmation: (confirmationConfig: ConfirmationConfig) => void;
  hideConfirmation: () => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

interface MessageProviderProps {
  children: ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
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

  // === MÉTHODES DE FEEDBACK ===
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
    const apiError: ApiError = handleApiError(error);
    const errorMessage = customMessage || apiError.message;

    setFeedbackState({
      visible: true,
      message: errorMessage,
      type: FeedbackType.ERROR,
      errorType: apiError.type,
      duration,
    });

    console.error('API Error handled by MessageContext:', {
      type: apiError.type,
      status: apiError.status,
      message: apiError.message,
      data: apiError.data,
    });
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
      customBackgroundColor: messageConfig.customBackgroundColor,
    });
  }, []);

  const hideFeedback = useCallback(() => {
    setFeedbackState(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  // === MÉTHODES DE CONFIRMATION ===
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

  const value: MessageContextType = {
    feedbackState,
    showFeedback,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    showApiError,
    showMessage,
    hideFeedback,
    confirmationState,
    showConfirmation,
    hideConfirmation,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = (): MessageContextType => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};
