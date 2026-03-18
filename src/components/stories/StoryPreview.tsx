import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { ProfilePicture } from '@/components/ui/ProfilePicture';
import { StoryGroup } from '@/types/story';

interface StoryPreviewProps {
  storyGroup: StoryGroup;
  onPress: () => void;
}

export const StoryPreview: React.FC<StoryPreviewProps> = ({
  storyGroup,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <ProfilePicture
          publicId={storyGroup.user.profilePicturePublicId}
          imageUrl={storyGroup.user.profilePicture}
          size={64}
        />
        {storyGroup.hasUnviewedStories && (
          <View style={styles.unviewedIndicator} />
        )}
      </View>
      <Text style={styles.username} numberOfLines={1}>
        {storyGroup.user.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginRight: 16,
    width: 72,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 4,
  },
  unviewedIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E10600",
    borderWidth: 2,
    borderColor: "#fff",
  },
  username: {
    fontSize: 12,
    color: "#1A1A1A",
    textAlign: "center",
  },
});
