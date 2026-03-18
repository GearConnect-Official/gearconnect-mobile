import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ErrorType } from '@/services/axiosConfig';
import MessageAnimations from '@/styles/animations/messageAnimations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Types de feedback
export enum FeedbackType {
  ERROR = 'error',
  WARNING = 'warning',
  SUCCESS = 'success',
  INFO = 'info'
}

// Interfaces
interface FeedbackMessageProps {
  message: string;
  type?: FeedbackType;
  duration?: number;
  onDismiss?: () => void;
  errorType?: ErrorType;
  visible: boolean;
  testID?: string;
  customBackgroundColor?: string;
}

/**
 * Composant moderne et responsive pour afficher des messages de feedback
 */
const FeedbackMessage: React.FC<FeedbackMessageProps> = ({
  message,
  type = FeedbackType.INFO,
  duration = 5000,
  onDismiss,
  errorType,
  visible,
  testID,
  customBackgroundColor,
}) => {
  // Valeurs d'animation
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-50)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;
  
  const [isVisible, setIsVisible] = useState(false);

  // Configuration responsive
  const isSmallScreen = screenWidth < 375;
  const isTablet = screenWidth > 768;

  // Configuration des couleurs selon le type
  const getTypeConfig = () => {
    switch (type) {
      case FeedbackType.SUCCESS:
        return {
          iconName: 'checkmark-circle' as const,
          backgroundColor: customBackgroundColor || '#10B981',
          textColor: '#FFFFFF',
        };
      case FeedbackType.ERROR:
        return {
          iconName: 'close-circle' as const,
          backgroundColor: '#EF4444',
          textColor: '#FFFFFF',
        };
      case FeedbackType.WARNING:
        return {
          iconName: 'warning' as const,
          backgroundColor: '#F59E0B',
          textColor: '#FFFFFF',
        };
      default: // INFO
        return {
          iconName: 'information-circle' as const,
          backgroundColor: '#3B82F6',
          textColor: '#FFFFFF',
        };
    }
  };

  const typeConfig = getTypeConfig();

  // Styles responsives
  const getResponsiveStyles = () => {
    const horizontalPadding = isSmallScreen ? 16 : 20;
    const messageWidth = screenWidth - (horizontalPadding * 2);
    
    return {
      horizontalPadding,
      messageWidth,
      verticalPadding: isSmallScreen ? 12 : 16,
      iconSize: isSmallScreen ? 20 : 24,
      fontSize: isSmallScreen ? 14 : 15,
      borderRadius: isSmallScreen ? 12 : 16,
      topPosition: isSmallScreen ? 50 : 60,
      iconMargin: isSmallScreen ? 10 : 12,
      closeButtonPadding: isSmallScreen ? 6 : 8,
    };
  };

  const responsive = getResponsiveStyles();

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -30,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) {
          onDismiss();
        }
      }, 0);
    });
  }, [opacity, translateY, scale, onDismiss]);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      
      // Reset values
      opacity.setValue(0);
      translateY.setValue(-50);
      scale.setValue(0.95);
      translateX.setValue(0);
      iconRotation.setValue(0);

      // Entrance animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 120,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Icon rotation animation
      Animated.timing(iconRotation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Shake animation for errors
      if (type === FeedbackType.ERROR) {
        setTimeout(() => {
          MessageAnimations.createShakeAnimation(translateX).start();
        }, 200);
      }

      // Auto dismiss
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      setTimeout(() => {
        opacity.setValue(0);
        translateY.setValue(-50);
        scale.setValue(0.95);
        setIsVisible(false);
      }, 0);
    }
  }, [visible, duration, handleDismiss, opacity, translateY, scale, translateX, iconRotation, type]);

  // Adapter le message en fonction du type d'erreur API
  let displayMessage = message;

  if (type === FeedbackType.ERROR && errorType) {
    switch (errorType) {
      case ErrorType.NETWORK:
        displayMessage = "Connection problem. Please check your internet connection.";
        break;
      case ErrorType.SERVER:
        displayMessage = "The server is experiencing an issue. Please try again later.";
        break;
      case ErrorType.TIMEOUT:
        displayMessage = "The request took too long. Please try again.";
        break;
    }
  }

  if (!isVisible) {
    return null;
  }

  const animatedRotation = iconRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View 
      style={{
        position: 'absolute',
        top: responsive.topPosition,
        left: responsive.horizontalPadding,
        right: responsive.horizontalPadding,
        backgroundColor: typeConfig.backgroundColor,
        borderRadius: responsive.borderRadius,
        paddingVertical: responsive.verticalPadding,
        paddingHorizontal: responsive.verticalPadding,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 16,
        // Contraintes de largeur
        maxWidth: isTablet ? 500 : undefined,
        alignSelf: isTablet ? 'center' : 'stretch',
        opacity,
        transform: [
          { translateY },
          { translateX },
          { scale }
        ]
      }}
      testID={testID || 'feedback-container'}
    >
      {/* Icon */}
      <Animated.View
        style={{
          marginRight: responsive.iconMargin,
          transform: [{ rotate: animatedRotation }]
        }}
      >
        <Ionicons 
          name={typeConfig.iconName} 
          size={responsive.iconSize} 
          color={typeConfig.textColor}
        />
      </Animated.View>

      {/* Message */}
      <Text 
        style={{
          flex: 1,
          fontSize: responsive.fontSize,
          fontWeight: '600',
          color: typeConfig.textColor,
          lineHeight: responsive.fontSize * 1.4,
          letterSpacing: -0.1,
        }}
        numberOfLines={3}
        adjustsFontSizeToFit={isSmallScreen}
      >
        {displayMessage}
      </Text>

      {/* Close button */}
      <TouchableOpacity 
        onPress={handleDismiss}
        style={{
          marginLeft: responsive.iconMargin,
          padding: responsive.closeButtonPadding,
          // Zone de touch plus grande pour les petits écrans
          minWidth: isSmallScreen ? 32 : 36,
          minHeight: isSmallScreen ? 32 : 36,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        testID="feedback-close-button"
        activeOpacity={0.7}
      >
        <Ionicons 
          name="close" 
          size={isSmallScreen ? 18 : 20} 
          color={typeConfig.textColor}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default FeedbackMessage; 