import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import theme from '@/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CAROUSEL_WIDTH = screenWidth * 0.75; // Fullscreen paging width baseline

export interface MediaItem {
  uri: string;
  type: 'image' | 'video';
  publicId?: string;
  secureUrl?: string;
}

interface MediaCarouselProps {
  media: MediaItem[];
  isOwn: boolean;
}

const MediaCarousel: React.FC<MediaCarouselProps> = ({ media, isOwn }) => {
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);

  if (media.length === 0) return null;

  const openFullScreen = (index: number) => {
    setFullScreenIndex(index);
    setFullScreenVisible(true);
  };

  const closeFullScreen = () => {
    setFullScreenVisible(false);
  };

  // Filter out videos - not supported in messaging
  const imageMedia = media.filter(item => item.type !== 'video');
  
  if (imageMedia.length === 0) {
    // If only videos, show placeholder
    return (
      <View style={[styles.singleMediaContainer, styles.placeholder]}>
        <FontAwesome name="image" size={32} color={theme.colors.text.secondary} />
        <Text style={{ marginTop: 8, color: theme.colors.text.secondary }}>
          Videos not supported
        </Text>
      </View>
    );
  }

  const handleFullScreenPrevious = () => {
    setFullScreenIndex((prev) => (prev > 0 ? prev - 1 : imageMedia.length - 1));
  };

  const handleFullScreenNext = () => {
    setFullScreenIndex((prev) => (prev < imageMedia.length - 1 ? prev + 1 : 0));
  };

  // Helper function to validate URI
  const isValidUri = (uri: string | undefined | null): boolean => {
    if (!uri || uri === 'null' || uri.trim() === '') {
      return false;
    }
    // Only allow URIs that React Native Image can handle
    const supportedSchemes = /^(https?|file|content):\/\//i;
    const unsupportedSchemes = /^(ph|photos|assets-library):\/\//i;

    if (unsupportedSchemes.test(uri)) {
      return false;
    }

    return supportedSchemes.test(uri);
  };

  // Single media
  if (imageMedia.length === 1) {
    const item = imageMedia[0];
    const imageUri = item.secureUrl || item.uri;
    const hasValidUri = isValidUri(imageUri);
    
    return (
      <>
        <TouchableOpacity
          style={styles.singleMediaContainer}
          onPress={() => openFullScreen(0)}
          activeOpacity={0.9}
        >
          {hasValidUri ? (
            <Image
              source={{ uri: imageUri! }}
              style={styles.singleMediaImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.singleMediaImage, styles.placeholder]}>
              <FontAwesome name="image" size={32} color={theme.colors.text.secondary} />
            </View>
          )}
        </TouchableOpacity>

        {/* Full Screen Modal */}
        <Modal
          visible={fullScreenVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeFullScreen}
        >
          <View style={styles.fullScreenContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeFullScreen}
              activeOpacity={0.7}
            >
              <FontAwesome name="times" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            {isValidUri(imageMedia[fullScreenIndex]?.secureUrl || imageMedia[fullScreenIndex]?.uri) ? (
              <Image
                source={{ uri: imageMedia[fullScreenIndex].secureUrl || imageMedia[fullScreenIndex].uri! }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.fullScreenImage, styles.placeholder]}>
                <FontAwesome name="image" size={64} color="#FFFFFF" />
              </View>
            )}
          </View>
        </Modal>
      </>
    );
  }

  // Multiple media - preview like single image with carousel icon
  // Use filtered imageMedia
  return (
    <>
                <TouchableOpacity
        style={styles.singleMediaContainer}
        onPress={() => openFullScreen(0)}
                  activeOpacity={0.9}
                >
          {(() => {
          const firstItem = imageMedia[0];
          const imageUri = firstItem?.secureUrl || firstItem?.uri;
          const hasValidUri = isValidUri(imageUri);

          if (!hasValidUri) {
            return (
              <View style={[styles.singleMediaImage, styles.placeholder]}>
                      <FontAwesome name="image" size={32} color={theme.colors.text.secondary} />
                    </View>
            );
          }

          return (
            <Image
              source={{ uri: imageUri! }}
              style={styles.singleMediaImage}
              resizeMode="cover"
            />
              );
        })()}
        {/* Carousel icon indicator (Instagram style) */}
        <View style={styles.carouselIcon}>
          <FontAwesome name="clone" size={14} color="#FFFFFF" />
          </View>
            </TouchableOpacity>

      {/* Full Screen Modal */}
      <Modal
        visible={fullScreenVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullScreen}
      >
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeFullScreen}
            activeOpacity={0.7}
          >
            <FontAwesome name="times" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              setFullScreenIndex(index);
            }}
            style={styles.fullScreenScroll}
            contentOffset={{ x: fullScreenIndex * screenWidth, y: 0 }}
          >
            {imageMedia.map((item, index) => {
              const imageUri = item.secureUrl || item.uri;
              const hasValidUri = isValidUri(imageUri);
              return (
                <View key={index} style={styles.fullScreenItem}>
                  {hasValidUri ? (
                    <Image
                      source={{ uri: imageUri! }}
                      style={styles.fullScreenImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.fullScreenImage, styles.placeholder]}>
                      <FontAwesome name="image" size={64} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Full screen navigation */}
          {imageMedia.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.fullScreenNavButton, styles.fullScreenPrevButton]}
                onPress={handleFullScreenPrevious}
                activeOpacity={0.7}
              >
                <FontAwesome name="chevron-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.fullScreenNavButton, styles.fullScreenNextButton]}
                onPress={handleFullScreenNext}
                activeOpacity={0.7}
              >
                <FontAwesome name="chevron-right" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={styles.fullScreenDotsContainer}>
                {imageMedia.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.fullScreenDot,
                      index === fullScreenIndex && styles.fullScreenActiveDot,
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  singleMediaContainer: {
    width: '100%',
    maxWidth: screenWidth * 0.5,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  singleMediaImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: theme.colors.grey[200],
  },
  carouselContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
    position: 'relative',
  },
  carouselScroll: {
    width: '100%',
  },
  carouselItem: {
    width: CAROUSEL_WIDTH,
    aspectRatio: 1,
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.grey[200],
  },
  carouselIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenScroll: {
    flex: 1,
    width: screenWidth,
  },
  fullScreenItem: {
    width: screenWidth,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight,
  },
  fullScreenVideoOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenNavButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -25 }],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenPrevButton: {
    left: 20,
  },
  fullScreenNextButton: {
    right: 20,
  },
  fullScreenDotsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  fullScreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  fullScreenActiveDot: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.grey[200],
  },
});

export default MediaCarousel;
