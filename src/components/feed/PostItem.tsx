import React from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { CloudinaryMedia } from '@/components/media';
import PostHeader from "./PostHeader";
import PostActions from "./PostActions";
import PostFooter from "./PostFooter";
import styles from '@/styles/feed/postItemStyles';
const SCREEN_WIDTH = Dimensions.get("window").width;

export interface Comment {
  id: string;
  username: string;
  avatar: string;
  profilePicturePublicId?: string;
  text: string;
  timeAgo: string;
  likes: number;
}

export interface PostTag {
  id?: string;
  name: string;
}

export interface Post {
  id: string;
  username: string;
  avatar: string;
  profilePicturePublicId?: string;
  isVerify?: boolean;
  userId?: number;
  images: string[];
  imagePublicIds?: string[]; // Public IDs Cloudinary pour l'optimisation
  mediaTypes?: ('image' | 'video')[]; // Types de médias pour chaque élément
  title: string;
  description: string;
  tags: PostTag[];
  likes: number;
  liked: boolean;
  saved: boolean;
  comments: Comment[];
  timeAgo: string;
  createdAt?: Date;
}

interface PostItemProps {
  post: Post;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onProfilePress: (username: string, userId?: number) => void;
  currentUsername?: string;
  isVisible?: boolean;
  isCurrentlyVisible?: boolean;
}

const PostItem: React.FC<PostItemProps> = ({
  post,
  onLike,
  onSave,
  onComment,
  onShare,
  onProfilePress,
  currentUsername = "john_doe",
  isVisible = true,
  isCurrentlyVisible = false,
}) => {
  const renderPostImages = () => {
    console.log('🎬 PostItem - Rendering post images for post:', post.id, {
      mediaTypes: post.mediaTypes,
      imagePublicIds: post.imagePublicIds,
      images: post.images,
      isVisible,
      isCurrentlyVisible,
    });

    if (post.images.length === 1) {
      const publicId = post.imagePublicIds?.[0];
      const mediaType = post.mediaTypes?.[0] || 'auto';
      const isVideo = mediaType === 'video';
      
      const shouldPlayVideo = isVideo && isVisible && isCurrentlyVisible;
      
      console.log('🎬 Single media item:', {
        publicId,
        mediaType,
        isVideo,
        imageUrl: post.images[0],
        shouldPlayVideo,
        visibilityReason: !isVideo ? 'not-video' : !isVisible ? 'not-visible' : !isCurrentlyVisible ? 'not-currently-visible' : 'should-play'
      });
      
      return publicId ? (
        <CloudinaryMedia
          publicId={publicId}
          mediaType={mediaType}
          width={SCREEN_WIDTH}
          height={SCREEN_WIDTH}
          crop="fill"
          quality="auto:best"
          format={isVideo ? "mp4" : "auto"}
          style={styles.postSingleImage}
          fallbackUrl={post.images[0]}
          shouldPlay={shouldPlayVideo}
          isMuted={true}
          useNativeControls={isVideo}
          isLooping={isVideo}
        />
      ) : (
        <CloudinaryMedia
          publicId=""
          mediaType={mediaType}
          fallbackUrl={post.images[0]}
          width={SCREEN_WIDTH}
          height={SCREEN_WIDTH}
          style={styles.postSingleImage}
          shouldPlay={shouldPlayVideo}
          isMuted={true}
          useNativeControls={isVideo}
          isLooping={isVideo}
        />
      );
    } else {
      console.log('🎬 Multiple media items:', post.images.length);
      
      return (
        <FlatList
          data={post.images}
          renderItem={({ item, index }) => {
            const publicId = post.imagePublicIds?.[index];
            const mediaType = post.mediaTypes?.[index] || 'auto';
            const isVideo = mediaType === 'video';
            
            const shouldPlayVideo = isVideo && isVisible && isCurrentlyVisible && index === 0;
            
            console.log(`🎬 Media item ${index}:`, {
              publicId,
              mediaType,
              isVideo,
              imageUrl: item,
              shouldPlayVideo,
              isFirstItem: index === 0,
            });
            
            return publicId ? (
              <CloudinaryMedia
                publicId={publicId}
                mediaType={mediaType}
                width={SCREEN_WIDTH}
                height={SCREEN_WIDTH}
                crop="fill"
                quality="auto:best"
                format={isVideo ? "mp4" : "auto"}
                style={styles.postMultipleImage}
                fallbackUrl={item}
                shouldPlay={shouldPlayVideo}
                isMuted={true}
                useNativeControls={isVideo}
                isLooping={isVideo}
              />
            ) : (
              <CloudinaryMedia
                publicId=""
                mediaType={mediaType}
                fallbackUrl={item}
                width={SCREEN_WIDTH}
                height={SCREEN_WIDTH}
                style={styles.postMultipleImage}
                shouldPlay={shouldPlayVideo}
                isMuted={true}
                useNativeControls={isVideo}
                isLooping={isVideo}
              />
            );
          }}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={SCREEN_WIDTH}
          decelerationRate="fast"
        />
      );
    }
  };

  const handleDoubleTapLike = () => {
    if (!post.liked) {
      onLike(post.id);
    }
  };

  return (
    <View style={styles.container}>
      <PostHeader
        postId={post.id}
        username={post.username}
        avatar={post.avatar}
        profilePicturePublicId={post.profilePicturePublicId}
        isVerify={post.isVerify}
        onProfilePress={() => onProfilePress(post.username, post.userId)}
        currentUsername={currentUsername}
        userId={post.userId}
      />

      <TouchableOpacity
        activeOpacity={1}
        onPress={handleDoubleTapLike}
        delayLongPress={180}
      >
        <View style={{ position: 'relative' }}>
          {renderPostImages()}
        </View>
      </TouchableOpacity>

      <PostActions
        postId={post.id}
        liked={post.liked}
        saved={post.saved}
        onLike={() => onLike(post.id)}
        onComment={() => onComment(post.id)}
        onShare={() => onShare(post.id)}
        onSave={() => onSave(post.id)}
      />

      <PostFooter
        username={post.username}
        title={post.title}
        description={post.description}
        tags={post.tags}
        likes={post.likes}
        commentsCount={post.comments.length}
        timeAgo={post.timeAgo}
        onViewComments={() => onComment(post.id)}
        onProfilePress={() => onProfilePress(post.username, post.userId)}
      />
    </View>
  );
};

export default PostItem;