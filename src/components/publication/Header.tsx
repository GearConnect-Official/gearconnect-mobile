import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { publicationStyles as styles } from '@/styles/screens';

// Racing color palette
const THEME_COLORS = {
  primary: '#E10600', // Racing Red
  secondary: '#1E1E1E', // Racing Black
  background: '#FFFFFF',
};

interface HeaderProps {
  isCropping: boolean;
  isLastStep?: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onNext: () => void;
  onGoBack: () => void;
  isLoading?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  isCropping,
  isLastStep = false,
  onBack,
  onConfirm,
  onNext,
  onGoBack,
  isLoading = false
}) => {
  const handleNext = () => {
    if (onNext && !isLoading) {
      onNext();
    }
  };

  return (
    <View style={styles.header}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME_COLORS.background} />
      {isCropping ? (
        <>
          <TouchableOpacity 
            onPress={onBack}
            style={styles.backButton}
            disabled={isLoading}
          >
            <FontAwesome name="arrow-left" size={20} color={THEME_COLORS.secondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={onConfirm}
            style={styles.headerButton}
            disabled={isLoading}
          >
            <Text style={styles.cropConfirmText}>Done</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity 
            onPress={onGoBack} 
            style={styles.backButton}
            disabled={isLoading}
          >
            <FontAwesome name="arrow-left" size={20} color={THEME_COLORS.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          {isLastStep ? (
            <TouchableOpacity 
              style={[
                styles.nextButtonShare,
                isLoading && styles.buttonDisabled
              ]}
              onPress={handleNext}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={THEME_COLORS.background} style={styles.buttonLoader} />
              ) : (
                <Text style={styles.nextButtonShareText}>Share</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholderRight} />
          )}
        </>
      )}
    </View>
  );
};

export default Header; 