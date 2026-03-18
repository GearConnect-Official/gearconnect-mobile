import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { Text, View } from 'react-native';

// Composant qui va déclencher une erreur
function BuggyCounter() {
  const [counter, setCounter] = React.useState(0);
  
  const handleClick = () => {
    setCounter(prevCounter => prevCounter + 1);
  };
  
  if (counter === 3) {
    throw new Error('Test error: Counter reached 3!');
  }
  
  return (
    <View>
      <Text testID="counter-value">{counter}</Text>
      <Text testID="increment-button" onPress={handleClick}>
        Increment
      </Text>
    </View>
  );
}

// Composant fallback personnalisé
function CustomFallback() {
  return <Text>Custom fallback UI</Text>;
}

describe('ErrorBoundary component', () => {
  // Ignorer les avertissements liés aux erreurs dans les tests
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('should render children normally when there is no error', () => {
    // Rendu du composant avec un contenu normal
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Normal content</Text>
      </ErrorBoundary>
    );
    
    // Vérifier que le contenu est affiché normalement
    expect(getByText('Normal content')).toBeTruthy();
  });
  
  it('should catch errors and display error UI', () => {
    // Rendu du composant avec un composant buggy
    const { getByText, getByTestId } = render(
      <ErrorBoundary>
        <BuggyCounter />
      </ErrorBoundary>
    );
    
    // Déclencher l'erreur
    const incrementButton = getByTestId('increment-button');
    fireEvent.press(incrementButton); // 0 -> 1
    fireEvent.press(incrementButton); // 1 -> 2
    fireEvent.press(incrementButton); // 2 -> 3 (erreur)
    
    // Vérifier que l'interface d'erreur est affichée
    expect(getByText(/Oops! An error occurred/i)).toBeTruthy();
    expect(getByText(/Test error: Counter reached 3!/i)).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });
  
  it('should render custom fallback if provided', () => {
    // Rendu du composant avec un composant buggy et un fallback personnalisé
    const { getByText, getByTestId } = render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <BuggyCounter />
      </ErrorBoundary>
    );
    
    // Déclencher l'erreur
    const incrementButton = getByTestId('increment-button');
    fireEvent.press(incrementButton);
    fireEvent.press(incrementButton);
    fireEvent.press(incrementButton);
    
    // Vérifier que le fallback personnalisé est affiché
    expect(getByText('Custom fallback UI')).toBeTruthy();
  });
  
  it('should reset error state when retry button is clicked', () => {
    // Rendu du composant avec un composant buggy
    const { getByText, getByTestId, queryByText } = render(
      <ErrorBoundary>
        <BuggyCounter />
      </ErrorBoundary>
    );
    
    // Déclencher l'erreur
    const incrementButton = getByTestId('increment-button');
    fireEvent.press(incrementButton);
    fireEvent.press(incrementButton);
    fireEvent.press(incrementButton);
    
    // Vérifier que l'interface d'erreur est affichée
    expect(getByText(/Oops! An error occurred/i)).toBeTruthy();
    
    // Cliquer sur le bouton Réessayer
    const retryButton = getByText('Try Again');
    fireEvent.press(retryButton);
    
    // Vérifier que nous sommes revenus à l'état normal
    expect(queryByText(/Oops! An error occurred/i)).toBeNull();
    
    // Vérifier que le compteur est affiché de nouveau
    // Mais réinitialisé à 0 car le composant a été remonté
    expect(getByTestId('counter-value').props.children).toBe(0);
  });
}); 