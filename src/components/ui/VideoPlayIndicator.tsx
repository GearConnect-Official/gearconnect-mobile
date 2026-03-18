import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface VideoPlayIndicatorProps {
  isPlaying: boolean;
  isPaused?: boolean;
  isLoading?: boolean;
  style?: any;
  showInProduction?: boolean;
}

const VideoPlayIndicator: React.FC<VideoPlayIndicatorProps> = ({
  isPlaying,
  isPaused = false,
  isLoading = false,
  style,
  showInProduction = false,
}) => {
  // Ne pas afficher en production sauf si explicitement demandÃ©
  if (!__DEV__ && !showInProduction) {
    return null;
  }

  if (!isPlaying && !isPaused && !isLoading) {
    return null;
  }

  const getIndicatorConfig = () => {
    if (isLoading) {
      return {
        color: '#FF9500',
        text: 'LOADING',
        icon: 'refresh' as const,
      };
    }
    
    if (isPaused) {
      return {
        color: '#FF5864',
        text: 'PAUSED',
        icon: 'pause' as const,
      };
    }
    
    if (isPlaying) {
      return {
        color: '#4CD964',
        text: 'PLAYING',
        icon: 'play' as const,
      };
    }

    return {
      color: '#8E8E93',
      text: 'STOPPED',
      icon: 'stop' as const,
    };
  };

  const config = getIndicatorConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.color }, style]}>
      <FontAwesome name={config.icon} size={8} color="white" />
      <Text style={styles.text}>{config.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 1000,
  },
  text: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default VideoPlayIndicator; 
