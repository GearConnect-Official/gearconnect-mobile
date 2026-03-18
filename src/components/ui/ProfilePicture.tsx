import React from "react";
import { View, Image, StyleSheet, ViewStyle, ImageStyle } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { CloudinaryAvatar } from "@/components/media/CloudinaryImage";

interface ProfilePictureProps {
  size?: number;
  publicId?: string;
  imageUrl?: string;
  style?: ViewStyle | ImageStyle;
}

export const ProfilePicture: React.FC<ProfilePictureProps> = ({
  size = 40,
  publicId,
  imageUrl,
  style,
}) => {
  if (publicId) {
    return (
      <CloudinaryAvatar
        publicId={publicId}
        size={size}
        style={[
          styles.avatar,
          { width: size, height: size },
          style as ImageStyle,
        ]}
      />
    );
  }

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.avatar,
          { width: size, height: size },
          style as ImageStyle,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.defaultAvatar,
        { width: size, height: size },
        style as ViewStyle,
      ]}
    >
      <FontAwesome name="user" size={size * 0.4} color="#6A707C" />
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 9999,
  },
  defaultAvatar: {
    backgroundColor: "#F3F4F6",
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
});
