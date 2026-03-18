import React from "react";
import { View, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import styles from '@/styles/feed/postActionsStyles';

interface PostActionsProps {
  postId: string;
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
}

const PostActions: React.FC<PostActionsProps> = ({
  postId,
  liked,
  saved,
  onLike,
  onComment,
  onShare,
  onSave,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onLike}
          activeOpacity={0.7}
        >
          <FontAwesome
            name={liked ? "heart" : "heart-o"}
            size={24}
            color={liked ? "#E1306C" : "#262626"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onComment}
          activeOpacity={0.7}
        >
          <FontAwesome name="comment-o" size={22} color="#262626" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onShare}
          activeOpacity={0.7}
        >
          <FontAwesome name="paper-plane-o" size={22} color="#262626" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onSave} activeOpacity={0.7}>
        <FontAwesome
          name={saved ? "bookmark" : "bookmark-o"}
          size={22}
          color="#262626"
        />
      </TouchableOpacity>
    </View>
  );
};

export default PostActions;

