import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Modal,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { FontAwesome } from "@expo/vector-icons";

interface Story {
  id: string;
  username: string;
  avatar: string;
  viewed: boolean;
  content?: string;
}

interface StoryModalProps {
  isVisible: boolean;
  stories: Story[];
  currentStoryId: string;
  onClose: () => void;
  onStoryComplete: (storyId: string) => void;
}

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds

const StoryModal: React.FC<StoryModalProps> = ({
  isVisible,
  stories,
  currentStoryId,
  onClose,
  onStoryComplete,
}) => {
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Trouver l'index de l'histoire actuelle
    const storyIndex = stories.findIndex(story => story.id === currentStoryId);
    if (storyIndex !== -1) {
      setActiveStoryIndex(storyIndex);
    }
  }, [currentStoryId, stories]);

  useEffect(() => {
    if (isVisible) {
      startProgress();
    } else {
      resetProgress();
    }
    
    return () => {
      if (progressAnimation.current) {
        progressAnimation.current.stop();
      }
    };
  }, [isVisible, activeStoryIndex, paused]);

  const startProgress = () => {
    progressAnim.setValue(0);
    progressAnimation.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    if (!paused) {
      progressAnimation.current.start(({ finished }) => {
        if (finished) {
          nextStory();
        }
      });
    }
  };

  const resetProgress = () => {
    if (progressAnimation.current) {
      progressAnimation.current.stop();
    }
    progressAnim.setValue(0);
  };

  const nextStory = () => {
    if (activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(prev => prev + 1);
      resetProgress();
    } else {
      // Dernier story complété
      onClose();
    }

    // Marquer cette story comme vue
    if (stories[activeStoryIndex]) {
      onStoryComplete(stories[activeStoryIndex].id);
    }
  };

  const prevStory = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
      resetProgress();
    }
  };

  const handlePress = (e: any) => {
    const screenWidth = Dimensions.get('window').width;
    const x = e.nativeEvent.locationX;

    if (x < screenWidth / 3) {
      prevStory();
    } else if (x > (screenWidth * 2) / 3) {
      nextStory();
    } else {
      // Middle press - toggles pause
      setPaused(!paused);
      if (paused) {
        startProgress();
      } else if (progressAnimation.current) {
        progressAnimation.current.stop();
      }
    }
  };

  if (!isVisible || stories.length === 0) {
    return null;
  }

  const activeStory = stories[activeStoryIndex];

  return (
    <Modal
      visible={isVisible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            {stories.map((story, index) => (
              <View key={story.id} style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progress,
                    {
                      width: index < activeStoryIndex
                        ? '100%'
                        : index === activeStoryIndex
                          ? progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', '100%'],
                            })
                          : '0%',
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          <View style={styles.userInfo}>
            <Image source={{ uri: activeStory.avatar }} style={styles.avatar} />
            <Text style={styles.username}>{activeStory.username}</Text>
            <Text style={styles.timestamp}>il y a 3h</Text>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome name="times" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={1}
          style={styles.storyContent}
          onPress={handlePress}
        >
          <Image
            source={{ uri: activeStory.content || 'https://via.placeholder.com/400/300' }}
            style={styles.storyImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        <View style={styles.footer}>
          <View style={styles.replyContainer}>
            <Text style={styles.replyText}>Envoyer un message</Text>
            <TouchableOpacity style={styles.sendButton}>
              <FontAwesome name="paper-plane" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 10,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: 8,
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 2,
    borderRadius: 1,
  },
  progress: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  username: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  timestamp: {
    color: '#DDDDDD',
    fontSize: 12,
    marginLeft: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
  },
  storyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width,
    height: height - 150,
    marginTop: 20,
  },
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  replyText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0095F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StoryModal; 
