import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import favoritesService from "@/services/favoritesService";
import PostItem, {
  Comment as PostItemComment,
  Post,
  PostTag,
} from "@/components/feed/PostItem";
import { Post as APIPost } from "@/services/postService";
import { formatPostDate, isPostFromToday } from "@/utils/dateUtils";
import { detectMediaType } from "@/utils/mediaUtils";
import styles from "@/styles/screens/social/favoritesStyles";
import { useMessage } from '@/context/MessageContext';
import MessageService from '@/services/messageService';
import { QuickMessages } from '@/utils/messageUtils';

const SCREEN_WIDTH = Dimensions.get("window").width;

interface UIPost {
  id: string;
  username: string;
  avatar: string;
  images: string[];
  imagePublicIds?: string[];
  mediaTypes?: ("image" | "video")[];
  title: string;
  description: string;
  tags: PostTag[];
  likes: number;
  liked: boolean;
  saved: boolean;
  comments: PostItemComment[];
  timeAgo: string;
  isFromToday: boolean;
}

// Helper function to convert API post to UI post
const convertApiPostToUiPost = (
  apiPost: APIPost,
  currentUserId: number
): UIPost => {
  const liked =
    apiPost.interactions?.some(
      (interaction) => interaction.userId === currentUserId && interaction.like
    ) || false;

  const likes =
    apiPost.interactions?.filter((interaction) => interaction.like).length || 0;

  const comments =
    apiPost.interactions
      ?.filter((interaction) => interaction.comment)
      .map((interaction) => ({
        id: `${interaction.userId}`,
        username: `user_${interaction.userId}`,
        avatar: `https://randomuser.me/api/portraits/men/${
          interaction.userId % 50
        }.jpg`,
        text: interaction.comment || "",
        timeAgo: "1h",
        likes: 0,
      })) || [];

  const images: string[] = [
    String(apiPost.image || apiPost.cloudinaryUrl || "https://via.placeholder.com/300"),
  ];
  const imagePublicIds = apiPost.cloudinaryPublicId
    ? [apiPost.cloudinaryPublicId]
    : undefined;

  const detectedType = detectMediaType(
    apiPost.cloudinaryUrl,
    apiPost.cloudinaryPublicId,
    apiPost.imageMetadata
  );
  const mediaTypes: ("image" | "video")[] = [detectedType];

  const timeAgo = formatPostDate(apiPost.createdAt || new Date());

  const fullContent = `${apiPost.title || ""} ${apiPost.body || ""}`.trim();
  const title =
    apiPost.title || fullContent.substring(0, 60) || "Untitled Post";
  const description = apiPost.body || fullContent || "";

  const tags: PostTag[] =
    apiPost.tags?.map((tagRelation) => ({
      id: tagRelation.tag.id?.toString(),
      name: tagRelation.tag.name,
    })) || [];

  return {
    id: apiPost.id?.toString() || "",
    username: apiPost.user?.username || `user_${apiPost.userId}`,
    avatar:
      apiPost.user?.imageUrl ||
      `https://randomuser.me/api/portraits/men/${apiPost.userId % 50}.jpg`,
    images,
    imagePublicIds,
    mediaTypes,
    title,
    description,
    tags,
    likes,
    liked,
    saved: true, // Always true in favorites screen
    comments,
    timeAgo: timeAgo,
    isFromToday: isPostFromToday(apiPost.createdAt || new Date()),
  };
};

const FavoritesScreen: React.FC = () => {
  const router = useRouter();
  const authContext = useAuth();
  const user = authContext?.user;
  const [favorites, setFavorites] = useState<UIPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { showMessage, showError, showConfirmation } = useMessage();

  // Load user's favorite posts
  const loadFavorites = useCallback(
    async (page = 1, limit = 10) => {
      if (!user?.id) {
        setLoadingError("You must be logged in to view your favorites");
        setIsLoading(false);
        return;
      }

      try {
        setLoadingError(null);
        const currentUserId = Number(user.id);

        const response = await favoritesService.getUserFavorites(
          currentUserId,
          page,
          limit
        );

        if (response.favorites && Array.isArray(response.favorites)) {
          const uiPosts = response.favorites.map((apiPost) =>
            convertApiPostToUiPost(apiPost, currentUserId)
          );

          if (page === 1) {
            setFavorites(uiPosts);
          } else {
            setFavorites((prev) => [...prev, ...uiPosts]);
          }

          setHasMorePosts(
            response.pagination.page < response.pagination.totalPages
          );
        } else {
          setLoadingError("Format de réponse API inattendu");
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
        setLoadingError(
          "Unable to load your favorites. Please try again later."
        );
      } finally {
        setIsLoading(false);
        setRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    loadFavorites(1);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMorePosts) {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadFavorites(nextPage);
    }
  };

  const handleRemoveFavorite = async (postId: number) => {
    if (!user?.id) return;

    try {
      await favoritesService.toggleFavorite(postId, Number(user.id));
      
      // Update UI optimistically
      setFavorites(prevFavorites => 
        prevFavorites.filter(fav => fav.id !== postId.toString())
      );
      
      showMessage(QuickMessages.success("Post removed from favorites"));
    } catch (error) {
      console.error('Error removing favorite:', error);
      showError("Unable to remove this post from favorites");
    }
  };

  const confirmRemoveFavorite = (postId: number, postTitle: string) => {
    showConfirmation({
      title: "Remove Favorite",
      message: `Remove "${postTitle}" from your favorites?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      destructive: true,
      type: 'warning',
      onConfirm: () => handleRemoveFavorite(postId)
    });
  };

  const handleLike = () => {
    // Placeholder - could implement like functionality
    Alert.alert(
      "Info",
      "Fonctionnalité de like disponible sur l'écran principal"
    );
  };

  const handleComment = () => {
    // Placeholder - could implement comment functionality
    Alert.alert(
      "Info",
      "Fonctionnalité de commentaire disponible sur l'écran principal"
    );
  };

  const handleShare = () => {
    // Placeholder - could implement share functionality
    Alert.alert(
      "Info",
      "Fonctionnalité de partage disponible sur l'écran principal"
    );
  };

  const renderFavoritePost = ({ item }: { item: UIPost }) => (
    <PostItem
      post={item}
      onLike={() => handleLike()}
      onComment={() => handleComment()}
      onShare={() => handleShare()}
      onSave={() => confirmRemoveFavorite(parseInt(item.id), item.title)}
      onProfilePress={() => {}}
      isVisible={true}
      isCurrentlyVisible={true}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <FontAwesome name="bookmark-o" size={60} color="#CCCCCC" />
      <Text style={styles.emptyStateTitle}>No favorites yet</Text>
      <Text style={styles.emptyStateDescription}>
        The posts you save will appear here
      </Text>
      <TouchableOpacity
        style={styles.goHomeButton}
        onPress={() => router.push("/(app)/(tabs)")}
      >
        <FontAwesome
          name="home"
          size={16}
          color="#FFFFFF"
          style={styles.goHomeIcon}
        />
        <Text style={styles.goHomeText}>Return to feed</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <FontAwesome name="arrow-left" size={20} color="#000" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>My Favorites</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
          <Text style={styles.loadingText}>Loading your favorites...</Text>
        </View>
      </View>
    );
  }

  if (loadingError) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{loadingError}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={favorites}
        renderItem={renderFavoritePost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#FF5864" />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default FavoritesScreen;

