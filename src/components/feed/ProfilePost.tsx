import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// Types
interface ProfilePostProps {
  post: {
    id: string;
    imageUrl: string;
    likes: number;
    comments: number;
    caption?: string;
    location?: string;
    timeAgo?: string;
    username: string;
    userAvatar: string;
    multipleImages?: boolean;
  };
  onClose: () => void;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onShare: (id: string) => void;
  onProfilePress: (username: string) => void;
}

const { width } = Dimensions.get('window');

const ProfilePost: React.FC<ProfilePostProps> = ({
  post,
  onClose,
  onLike,
  onComment,
  onShare,
  onProfilePress,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <TouchableOpacity onPress={() => onProfilePress(post.username)}>
            <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <TouchableOpacity onPress={() => onProfilePress(post.username)}>
              <Text style={styles.username}>{post.username}</Text>
            </TouchableOpacity>
            {post.location && (
              <Text style={styles.location}>{post.location}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={onClose}>
          <FontAwesome name="times" size={20} color="#262626" />
        </TouchableOpacity>
      </View>

      {/* Post Image */}
      <Image 
        source={{ uri: post.imageUrl }} 
        style={styles.postImage}
        resizeMode="cover"
      />

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onLike(post.id)}>
            <FontAwesome name="heart-o" size={24} color="#262626" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onComment(post.id)}>
            <FontAwesome name="comment-o" size={24} color="#262626" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onShare(post.id)}>
            <FontAwesome name="paper-plane-o" size={24} color="#262626" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <FontAwesome name="bookmark-o" size={24} color="#262626" />
        </TouchableOpacity>
      </View>

      {/* Likes */}
      <Text style={styles.likes}>{post.likes} likes</Text>

      {/* Caption */}
      {post.caption && (
        <View style={styles.captionContainer}>
          <TouchableOpacity onPress={() => onProfilePress(post.username)}>
            <Text style={styles.captionUsername}>{post.username}</Text>
          </TouchableOpacity>
          <Text style={styles.caption}>{post.caption}</Text>
        </View>
      )}

      {/* Comments Count */}
      {post.comments > 0 && (
        <TouchableOpacity style={styles.commentsButton} onPress={() => onComment(post.id)}>
          <Text style={styles.commentsText}>
            View {post.comments} comments
          </Text>
        </TouchableOpacity>
      )}

      {/* Time */}
      {post.timeAgo && (
        <Text style={styles.timeAgo}>{post.timeAgo}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#262626',
  },
  location: {
    fontSize: 12,
    color: '#262626',
  },
  postImage: {
    width: width,
    height: width,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 15,
  },
  likes: {
    fontWeight: 'bold',
    paddingHorizontal: 15,
    marginBottom: 5,
    color: '#262626',
  },
  captionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 5,
  },
  captionUsername: {
    fontWeight: 'bold',
    marginRight: 5,
    color: '#262626',
  },
  caption: {
    flex: 1,
    color: '#262626',
  },
  commentsButton: {
    paddingHorizontal: 15,
    marginBottom: 5,
  },
  commentsText: {
    color: '#8E8E8E',
    fontSize: 14,
  },
  timeAgo: {
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 10,
    color: '#8E8E8E',
  },
});

export default ProfilePost; 
