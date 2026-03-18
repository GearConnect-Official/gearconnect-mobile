import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  Text,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import MessageAnimations from '@/styles/animations/messageAnimations';

interface AnimatedButtonProps {
  onPress: (event: GestureResponderEvent) => void;
  title: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  children?: React.ReactNode;
  testID?: string;
}

/**
 * Bouton animé réutilisable avec animations fluides
 */
const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  title,
  style,
  textStyle,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  children,
  testID,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    MessageAnimations.createButtonPressAnimation(scaleValue).start();
    
    Animated.timing(opacityValue, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = (event: GestureResponderEvent) => {
    if (disabled) return;
    onPress(event);
  };

  // Styles par défaut basés sur la variante
  const getVariantStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: '#007AFF',
          borderWidth: 1,
          borderColor: 'rgba(0, 122, 255, 0.3)',
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.1)',
        };
      case 'destructive':
        return {
          ...baseStyle,
          backgroundColor: '#FF3B30',
          borderWidth: 1,
          borderColor: 'rgba(255, 59, 48, 0.3)',
        };
      default:
        return baseStyle;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 12,
          paddingVertical: 8,
          minHeight: 36,
        };
      case 'medium':
        return {
          paddingHorizontal: 16,
          paddingVertical: 12,
          minHeight: 44,
        };
      case 'large':
        return {
          paddingHorizontal: 24,
          paddingVertical: 16,
          minHeight: 52,
        };
      default:
        return {};
    }
  };

  const getTextVariantStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600',
      letterSpacing: 0.3,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseTextStyle,
          color: '#FFFFFF',
        };
      case 'secondary':
        return {
          ...baseTextStyle,
          color: '#333333',
        };
      case 'destructive':
        return {
          ...baseTextStyle,
          color: '#FFFFFF',
        };
      default:
        return baseTextStyle;
    }
  };

  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'small':
        return { fontSize: 14 };
      case 'medium':
        return { fontSize: 16 };
      case 'large':
        return { fontSize: 18 };
      default:
        return {};
    }
  };

  const disabledStyle: ViewStyle = disabled
    ? {
        opacity: 0.5,
        shadowOpacity: 0,
        elevation: 0,
      }
    : {};

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleValue }],
        opacity: opacityValue,
      }}
    >
      <TouchableOpacity
        style={[
          getVariantStyle(),
          getSizeStyle(),
          disabledStyle,
          style,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1} // Nous gérons l'opacité manuellement
        testID={testID}
      >
        {children || (
          <Text
            style={[
              getTextVariantStyle(),
              getTextSizeStyle(),
              textStyle,
            ]}
          >
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default AnimatedButton; 