import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import styles from '@/styles/feed/postFooterStyles';

export interface PostTag {
  id?: string;
  name: string;
}

interface PostFooterProps {
  username: string;
  title: string;
  description: string;
  tags: PostTag[];
  likes: number;
  commentsCount: number;
  timeAgo: string;
  onViewComments: () => void;
  onProfilePress: () => void;
}

const PostFooter: React.FC<PostFooterProps> = ({
  username,
  title,
  description,
  tags,
  likes,
  commentsCount,
  timeAgo,
  onViewComments,
  onProfilePress,
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // Limit description to 100 characters if not expanded
  const shouldTruncate = description.length > 100;
  const displayDescription = showFullDescription || !shouldTruncate 
    ? description 
    : `${description.substring(0, 100)}...`;

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  return (
    <View style={styles.container}>
      {/* Likes Count */}
      <Text style={styles.likesCount}>
        {likes.toLocaleString()} {likes === 1 ? 'like' : 'likes'}
      </Text>

      {/* Post Title */}
      {title && title.trim() && (
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
      )}

      {/* Post Description */}
      {description && description.trim() && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            {displayDescription}
            {shouldTruncate && (
              <Text 
                style={styles.seeMoreText} 
                onPress={toggleDescription}
              >
                {showFullDescription ? ' Show less' : ' See more'}
              </Text>
            )}
          </Text>
        </View>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {tags.slice(0, 5).map((tag, index) => (
            <TouchableOpacity 
              key={tag.id || index} 
              style={styles.tagPill}
              activeOpacity={0.7}
            >
              <Text style={styles.tagText}>#{tag.name}</Text>
            </TouchableOpacity>
          ))}
          {tags.length > 5 && (
            <Text style={styles.moreTagsText}>
              +{tags.length - 5} more
            </Text>
          )}
        </View>
      )}

      {/* Comments Section */}
      {commentsCount > 0 && (
        <TouchableOpacity
          style={styles.commentsLink}
          onPress={onViewComments}
          activeOpacity={0.7}
        >
          <Text style={styles.commentsLinkText}>
            View {commentsCount > 1 ? `all ${commentsCount} comments` : '1 comment'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Publication Date */}
      <View style={styles.timeContainer}>
        <FontAwesome name="clock-o" size={11} color="#8E8E8E" />
        <Text style={styles.timeAgo}>{timeAgo}</Text>
      </View>
    </View>
  );
};

export default PostFooter;

