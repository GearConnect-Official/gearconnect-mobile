import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConfirmationConfig } from '@/types/messages';
import MessageAnimations from '@/styles/animations/messageAnimations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ConfirmationModalProps extends ConfirmationConfig {
  visible: boolean;
  onDismiss: () => void;
  type?: 'success' | 'warning' | 'danger' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  destructive = false,
  onConfirm,
  onCancel,
  onDismiss,
  type = destructive ? 'danger' : 'info',
}) => {
  // Valeurs d'animation
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const confirmButtonScale = useRef(new Animated.Value(1)).current;
  const cancelButtonScale = useRef(new Animated.Value(1)).current;

  const [isVisible, setIsVisible] = useState(false);

  // Configuration responsive
  const isSmallScreen = screenWidth < 375;
  const isTablet = screenWidth > 768;
  
  // Configuration des couleurs selon le type
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          iconName: 'checkmark-circle' as const,
          iconColor: '#10B981',
          buttonColor: '#10B981',
        };
      case 'warning':
        return {
          iconName: 'warning' as const,
          iconColor: '#F59E0B',
          buttonColor: '#F59E0B',
        };
      case 'danger':
        return {
          iconName: 'close-circle' as const,
          iconColor: '#EF4444',
          buttonColor: '#EF4444',
        };
      default: // info
        return {
          iconName: 'information-circle' as const,
          iconColor: "#E10600",
          buttonColor: "#E10600",
        };
    }
  };

  const typeConfig = getTypeConfig();

  // Styles responsives
  const getResponsiveStyles = () => {
    const baseWidth = screenWidth - 48; // 24px padding de chaque côté
    const maxWidth = isTablet ? 400 : 340;
    const modalWidth = Math.min(baseWidth, maxWidth);
    
    return {
      modalWidth,
      padding: isSmallScreen ? 20 : 24,
      iconSize: isSmallScreen ? 56 : 64,
      titleSize: isSmallScreen ? 18 : 20,
      messageSize: isSmallScreen ? 14 : 15,
      buttonTextSize: isSmallScreen ? 14 : 16,
      buttonPadding: isSmallScreen ? 12 : 16,
    };
  };

  const responsive = getResponsiveStyles();

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      
      // Reset values
      backdropOpacity.setValue(0);
      modalOpacity.setValue(0);
      modalScale.setValue(0.9);
      iconScale.setValue(0);

      // Entrance animation
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Icon animation with delay
      setTimeout(() => {
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 150,
          friction: 6,
          useNativeDriver: true,
        }).start();
      }, 200);
    }
  }, [visible]);

  const handleConfirm = () => {
    MessageAnimations.createButtonPressAnimation(confirmButtonScale).start(() => {
      onConfirm();
      handleClose();
    });
  };

  const handleCancel = () => {
    MessageAnimations.createButtonPressAnimation(cancelButtonScale).start(() => {
      if (onCancel) {
        onCancel();
      }
      handleClose();
    });
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.9,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        setIsVisible(false);
        onDismiss();
      }, 0);
    });
  };

  if (!isVisible) {
    return null;
  }

  // Déterminer si on doit empiler les boutons verticalement
  const shouldStackButtons = () => {
    const confirmLength = confirmText.length;
    const cancelLength = cancelText.length;
    const totalLength = confirmLength + cancelLength;
    
    // Si les textes sont longs ou écran petit, empiler verticalement
    return totalLength > 20 || isSmallScreen || confirmLength > 12 || cancelLength > 12;
  };

  const stackButtons = shouldStackButtons();

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlayTouchable} />
        </TouchableWithoutFeedback>
        
        <Animated.View
          style={[
            styles.container,
            {
              width: responsive.modalWidth,
              paddingVertical: responsive.padding + 8,
              paddingHorizontal: responsive.padding,
              opacity: modalOpacity,
              transform: [{ scale: modalScale }]
            }
          ]}
        >
          {/* Icon section */}
          <View style={[styles.iconSection, { marginBottom: responsive.padding }]}>
            <Animated.View 
              style={[
                styles.iconContainer,
                {
                  width: responsive.iconSize,
                  height: responsive.iconSize,
                  borderRadius: responsive.iconSize / 2,
                  backgroundColor: typeConfig.iconColor,
                  transform: [{ scale: iconScale }]
                }
              ]}
            >
              <Ionicons 
                name={typeConfig.iconName} 
                size={responsive.iconSize * 0.45} 
                color="white" 
              />
            </Animated.View>
          </View>

          {/* Content */}
          <View style={[styles.content, { marginBottom: responsive.padding + 8 }]}>
            <Text style={[
              styles.title,
              {
                fontSize: responsive.titleSize,
                marginBottom: isSmallScreen ? 6 : 8,
              }
            ]}>
              {title}
            </Text>
            <Text style={[
              styles.message,
              {
                fontSize: responsive.messageSize,
                paddingHorizontal: isSmallScreen ? 0 : 8,
              }
            ]}>
              {message}
            </Text>
          </View>

          {/* Actions */}
          <View style={[
            styles.actions,
            stackButtons ? styles.actionsVertical : styles.actionsHorizontal,
            { gap: isSmallScreen ? 8 : 12 }
          ]}>
            <Animated.View style={[
              stackButtons ? styles.buttonFullWidth : styles.buttonFlex,
              { transform: [{ scale: cancelButtonScale }] }
            ]}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  {
                    paddingVertical: responsive.buttonPadding,
                    paddingHorizontal: isSmallScreen ? 16 : 20,
                  }
                ]}
                onPress={handleCancel}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.cancelButtonText,
                  { fontSize: responsive.buttonTextSize }
                ]} numberOfLines={1} adjustsFontSizeToFit>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[
              stackButtons ? styles.buttonFullWidth : styles.buttonFlex,
              { transform: [{ scale: confirmButtonScale }] }
            ]}>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor: typeConfig.buttonColor,
                    paddingVertical: responsive.buttonPadding,
                    paddingHorizontal: isSmallScreen ? 16 : 20,
                  }
                ]}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.confirmButtonText,
                  { fontSize: responsive.buttonTextSize }
                ]} numberOfLines={1} adjustsFontSizeToFit>
                  {confirmText}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 25,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  iconSection: {
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  message: {
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  actions: {},
  actionsHorizontal: {
    flexDirection: 'row',
  },
  actionsVertical: {
    flexDirection: 'column',
  },
  buttonFlex: {
    flex: 1,
  },
  buttonFullWidth: {
    width: '100%',
  },
  cancelButton: {
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 44,
  },
  confirmButton: {
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 44,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
});

export default ConfirmationModal; 