import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { ProfilePicture } from '@/components/ui/ProfilePicture';
import { Story } from '@/types/story';
import { CloudinaryAvatar } from '@/components/media/CloudinaryImage';

interface StoryViewerProps {
  story: Story;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const { width, height } = Dimensions.get("window");

export const StoryViewer: React.FC<StoryViewerProps> = ({
  story,
  onClose,
  onNext,
  onPrevious,
}) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const duration =
      story.media.type === "VIDEO" ? story.media.duration || 5000 : 5000;
    const interval = 50;
    const steps = duration / interval;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          onNext();
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, story.media.type, story.media.duration, onNext]);

  const handlePress = () => {
    setIsPaused(!isPaused);
  };

  const handleLongPress = () => {
    setIsPaused(true);
  };

  const handlePressOut = () => {
    setIsPaused(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: `${progress}%` }]} />
      </View>

      <View style={styles.header}>
        <View style={styles.userInfo}>
          <ProfilePicture
            publicId={story.user.profilePicturePublicId}
            imageUrl={story.user.profilePicture}
            size={32}
          />
          <Text style={styles.username}>{story.user.name}</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <FontAwesome name="times" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.mediaContainer}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {story.media.type === "IMAGE" ? (
          <CloudinaryAvatar
            publicId={story.media.publicId}
            size={height * 0.7}
            style={styles.media}
          />
        ) : (
          <CloudinaryAvatar
            publicId={story.media.publicId}
            size={height * 0.7}
            style={styles.media}
          />
        )}
      </TouchableOpacity>

      <View style={styles.navigation}>
        <TouchableOpacity style={styles.navButton} onPress={onPrevious}>
          <FontAwesome name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={onNext}>
          <FontAwesome name="chevron-right" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  progressBar: {
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  progress: {
    height: "100%",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  mediaContainer: {
    flex: 1,
    justifyContent: "center",
  },
  media: {
    width: width,
    height: height * 0.7,
  },
  navigation: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navButton: {
    width: width * 0.2,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
