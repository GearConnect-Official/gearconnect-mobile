import React from 'react';
import FeedbackMessage from './FeedbackMessage';
import ConfirmationModal from './ConfirmationModal';
import { useMessage } from '@/context/MessageContext';

interface MessageDisplayProps {
  children: React.ReactNode;
}

/**
 * Composant qui affiche les messages et confirmations
 * À utiliser au niveau racine de l'application, APRÈS le MessageProvider du contexte
 */
const MessageDisplay: React.FC<MessageDisplayProps> = ({ children }) => {
  const {
    feedbackState,
    hideFeedback,
    confirmationState,
    hideConfirmation,
  } = useMessage();

  return (
    <>
      {children}
      
      {/* Message de feedback */}
      <FeedbackMessage
          message={feedbackState.message}
          type={feedbackState.type}
          duration={feedbackState.duration}
          visible={feedbackState.visible}
          onDismiss={hideFeedback}
          errorType={feedbackState.errorType}
          customBackgroundColor={feedbackState.customBackgroundColor}
         />
      
      {/* Modal de confirmation */}
      <ConfirmationModal
        visible={confirmationState.visible}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        destructive={confirmationState.destructive}
        onConfirm={confirmationState.onConfirm}
        onCancel={confirmationState.onCancel}
        onDismiss={hideConfirmation}
      />
    </>
  );
};

export default MessageDisplay; 