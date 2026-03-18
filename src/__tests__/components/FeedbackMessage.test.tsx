import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import FeedbackMessage, { FeedbackType } from '@/components/FeedbackMessage';
import { ErrorType } from '@/services/axiosConfig';

describe('FeedbackMessage component', () => {
  it('should not render when visible is false', () => {
    // Rendu avec visible = false
    const { queryByText } = render(
      <FeedbackMessage
        message="Test message"
        visible={false}
      />
    );
    
    // Vérifier que le message n'est pas affiché
    expect(queryByText('Test message')).toBeNull();
  });
  
  it('should render the message when visible is true', () => {
    // Rendu avec visible = true
    const { getByText } = render(
      <FeedbackMessage
        message="Test message"
        visible={true}
      />
    );
    
    // Vérifier que le message est affiché
    expect(getByText('Test message')).toBeTruthy();
  });
  
  it('should call onDismiss when close button is pressed', async () => {
    // Mock pour onDismiss
    const onDismiss = jest.fn();
    
    // Rendu avec onDismiss
    const { getByTestId } = render(
      <FeedbackMessage
        message="Test message"
        visible={true}
        onDismiss={onDismiss}
      />
    );
    
    // Trouver et cliquer sur le bouton de fermeture
    const closeButton = getByTestId('feedback-close-button');
    await act(async () => {
      fireEvent.press(closeButton);
      // Delay for animation
      await new Promise(resolve => setTimeout(resolve, 400));
    });
    
    // Vérifier que onDismiss a été appelé
    expect(onDismiss).toHaveBeenCalled();
  });
  
  it('should apply the correct style for error type', () => {
    // Rendu avec type = ERROR
    const { getByTestId } = render(
      <FeedbackMessage
        message="Error message"
        type={FeedbackType.ERROR}
        visible={true}
      />
    );
    
    // Debug the style object structure
    const container = getByTestId('feedback-container');
    
    // Verify that the errorContainer style is applied
    // We'll check for an element with the error background color
    const errorColor = '#FF3B30';
    expect(JSON.stringify(container.props.style)).toContain(errorColor);
  });
  
  it('should apply the correct style for success type', () => {
    // Rendu avec type = SUCCESS
    const { getByTestId } = render(
      <FeedbackMessage
        message="Success message"
        type={FeedbackType.SUCCESS}
        visible={true}
      />
    );
    
    // Vérifier que le style a la bonne couleur de fond
    const container = getByTestId('feedback-container');
    const successColor = '#34C759';
    expect(JSON.stringify(container.props.style)).toContain(successColor);
  });
  
  it('should apply the correct style for warning type', () => {
    // Rendu avec type = WARNING
    const { getByTestId } = render(
      <FeedbackMessage
        message="Warning message"
        type={FeedbackType.WARNING}
        visible={true}
      />
    );
    
    // Vérifier que le style a la bonne couleur de fond
    const container = getByTestId('feedback-container');
    const warningColor = '#FF9500';
    expect(JSON.stringify(container.props.style)).toContain(warningColor);
  });
  
  it('should adapt the message based on error type for network errors', () => {
    // Rendu avec type = ERROR et errorType = NETWORK
    const { getByText } = render(
      <FeedbackMessage
        message="Original message"
        type={FeedbackType.ERROR}
        errorType={ErrorType.NETWORK}
        visible={true}
      />
    );
    
    // Vérifier que le message a été adapté pour les erreurs réseau
    expect(getByText(/connexion/i)).toBeTruthy();
  });
  
  it('should adapt the message based on error type for server errors', () => {
    // Rendu avec type = ERROR et errorType = SERVER
    const { getByText } = render(
      <FeedbackMessage
        message="Original message"
        type={FeedbackType.ERROR}
        errorType={ErrorType.SERVER}
        visible={true}
      />
    );
    
    // Vérifier que le message a été adapté pour les erreurs serveur
    expect(getByText(/serveur/i)).toBeTruthy();
  });
  
  it('should adapt the message based on error type for timeout errors', () => {
    // Rendu avec type = ERROR et errorType = TIMEOUT
    const { getByText } = render(
      <FeedbackMessage
        message="Original message"
        type={FeedbackType.ERROR}
        errorType={ErrorType.TIMEOUT}
        visible={true}
      />
    );
    
    // Vérifier que le message a été adapté pour les erreurs de timeout
    expect(getByText(/trop de temps/i)).toBeTruthy();
  });
  
  it('should not adapt the message for non-error feedback types', () => {
    // Rendu avec type = SUCCESS mais avec un errorType (qui ne devrait pas être utilisé)
    const { getByText } = render(
      <FeedbackMessage
        message="Original success message"
        type={FeedbackType.SUCCESS}
        errorType={ErrorType.NETWORK}
        visible={true}
      />
    );
    
    // Vérifier que le message n'a pas été adapté
    expect(getByText('Original success message')).toBeTruthy();
  });
}); 