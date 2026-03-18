import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import FeedbackMessage, { FeedbackType } from './FeedbackMessage';
import { errorBoundaryStyles } from '@/styles/components/errorBoundaryStyles';
import { AppImages } from '@/assets/images';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showFeedback: boolean;
}

/**
 * Component that intercepts uncaught JavaScript errors
 * and displays a fallback interface.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showFeedback: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state to display fallback UI
    return {
      hasError: true,
      error,
      showFeedback: true
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      showFeedback: false
    });
  };

  render() {
    const { hasError, error, showFeedback } = this.state;
    const { children, fallback } = this.props;

    // If an error was caught and a fallback is provided, display the fallback
    if (hasError && fallback) {
      return fallback;
    }

    // If an error was caught but no fallback is provided, display a default UI
    if (hasError) {
      return (
        <View style={errorBoundaryStyles.container}>
          <Image
            source={AppImages.icon}
            style={errorBoundaryStyles.errorImage}
            resizeMode="contain"
          />
          <Text style={errorBoundaryStyles.title}>Oops! An error occurred</Text>
          <Text style={errorBoundaryStyles.message}>{error?.message || 'An unexpected error occurred'}</Text>
          <TouchableOpacity 
            style={errorBoundaryStyles.button}
            onPress={this.resetError}
          >
            <Text style={errorBoundaryStyles.buttonText}>Try Again</Text>
          </TouchableOpacity>

          <FeedbackMessage
            visible={showFeedback}
            message="An unhandled error occurred."
            type={FeedbackType.ERROR}
            onDismiss={() => this.setState({ showFeedback: false })}
          />
        </View>
      );
    }

    // Otherwise, display children normally
    return children;
  }
}

export default ErrorBoundary; 