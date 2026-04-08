import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import styles from "../styles/Profile/profileStyles";
import { useAuth } from "../context/AuthContext";
import favoritesService from "../services/favoritesService";
import postService from "../services/postService";
import { API_URL_USERS } from "../config";
import ProfileMenu from "../components/Profile/ProfileMenu";
import { CloudinaryMedia } from "../components/media";
import EventItem from "../components/items/EventItem";
import { VerifiedAvatar } from "../components/media/VerifiedAvatar";
import { detectMediaType } from "../utils/mediaUtils";
import { defaultImages } from "../config/defaultImages";
import PerformanceService from "../services/performanceService";
import userService from "../services/userService";
import followService from "../services/followService";
import FollowButton from "../components/FollowButton";
import { FollowStats } from "../types/follow.types";
import eventService from "../services/eventService";
import { countEventsWithMissingInfo, checkMissingEventInfo } from "../utils/eventMissingInfo";
import { trackSocial, trackScreenView } from "../utils/mixpanelTracking";
import chatService from "../services/chatService";

// Screen width to calculate grid image dimensions
const NUM_COLUMNS = 3;

// Type for posts
interface Post {
  id: string;
  imageUrl: string;
  likes: number;
  comments: number;
  caption?: string;
  location?: string;
  timeAgo?: string;
  multipleImages?: boolean;
  isVideo: boolean;
  cloudinaryPublicId?: string;
  imageMetadata?: string;
}

// Type for favorites
interface FavoritePost {
  id: number;
  title: string;
  body: string;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  imageMetadata?: string;
  user: {
    id: number;
    name: string;
    username: string;
    email: string;
  };
  createdAt: string;
  favorites?: { userId: number; postId: number }[];
  interactions?: any[];
  comments?: any[];
}

// Type for driver statistics (adapted for API data)
interface DriverStats {
  races: number;
  wins: number;
  podiums: number;
  bestPosition: number;
  averagePosition: number;
}

// Définir l'interface des props
interface ProfileScreenProps {
  userId?: number;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userId: propUserId,
}) => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<string>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [favorites, setFavorites] = useState<FavoritePost[]>([]);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    saved: 0,
  });
  const [driverStats, setDriverStats] = useState<DriverStats>({
    races: 0,
    wins: 0,
    podiums: 0,
    bestPosition: 0,
    averagePosition: 0,
  });
  const [isLoadingDriverStats, setIsLoadingDriverStats] = useState(false);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [isLoadingLikedPosts, setIsLoadingLikedPosts] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [followStats, setFollowStats] = useState<FollowStats>({
    followersCount: 0,
    followingCount: 0,
    isFollowing: false,
    isFollowedBy: false,
  });
  const [isLoadingFollowStats, setIsLoadingFollowStats] = useState(false);
  const [joinedEvents, setJoinedEvents] = useState<any[]>([]);
  const [isLoadingJoinedEvents, setIsLoadingJoinedEvents] = useState(false);
  const [createdEvents, setCreatedEvents] = useState<any[]>([]);
  const [isLoadingCreatedEvents, setIsLoadingCreatedEvents] = useState(false);
  const [missingInfoCount, setMissingInfoCount] = useState(0);
  const [nextEventTag, setNextEventTag] = useState<{ text: string; color: string; isOrganizer?: boolean; eventId?: number; eventName?: string } | null>(null);

  // Get user from auth context and determine which user ID to use
  const { user } = auth || {};
  const effectiveUserId =
    propUserId || (user?.id ? Number(user.id) : undefined);

  // Function to fetch user data
  const fetchUserData = useCallback(async () => {
    if (!effectiveUserId) return;

    setIsLoadingUserData(true);
    try {
      console.log('🔄 ProfileScreen: Fetching user data for user:', effectiveUserId);
      const response = await userService.getProfile(effectiveUserId);
      if (response.success && response.data) {
        console.log('✅ ProfileScreen: User data fetched:', {
          username: response.data.username,
          hasProfilePicture: !!response.data.profilePicture,
          hasProfilePicturePublicId: !!response.data.profilePicturePublicId,
          isDeleted: response.data.isDeleted,
        });
        
        // Vérifier si le compte est supprimé
        if (response.data.isDeleted) {
          console.warn('⚠️ ProfileScreen: This account has been deleted');
        }
        
        setUserData(response.data);
      } else {
        console.error("❌ ProfileScreen: Failed to fetch user data:", response.error);
      }
    } catch (error) {
      console.error("❌ ProfileScreen: Error fetching user data:", error);
    } finally {
      setIsLoadingUserData(false);
    }
  }, [effectiveUserId]);

  // Function to fetch follow statistics
  const fetchFollowStats = useCallback(async () => {
    if (!effectiveUserId) return;

    setIsLoadingFollowStats(true);
    try {
      const currentUserId = user?.id ? Number(user.id) : undefined;
      const response = await followService.getFollowStats(effectiveUserId, currentUserId);
      if (response.success && response.data) {
        setFollowStats(response.data);
        // Update stats state for display consistency
        setStats((prev) => ({
          ...prev,
          followers: response.data?.followersCount || 0,
          following: response.data?.followingCount || 0,
        }));
      } else {
        console.error("❌ ProfileScreen: Failed to fetch follow stats:", response.error);
      }
    } catch (error) {
      console.error("❌ ProfileScreen: Error fetching follow stats:", error);
    } finally {
      setIsLoadingFollowStats(false);
    }
  }, [effectiveUserId, user?.id]);

  // Rafraîchir les données utilisateur quand on revient sur l'écran
  useFocusEffect(
    React.useCallback(() => {
      console.log('👁️ ProfileScreen: Screen focused, refreshing user data...');
      fetchUserData();
      fetchFollowStats();
      
      // Track profile view
      if (effectiveUserId) {
        const isOwnProfile = effectiveUserId === Number(auth?.user?.id);
        trackSocial.profileViewed(String(effectiveUserId), isOwnProfile);
        trackScreenView('Profile', { user_id: effectiveUserId, is_own_profile: isOwnProfile });
      }
    }, [effectiveUserId, auth?.user?.id, fetchFollowStats, fetchUserData])
  );

  // Function to fetch next event tag
  const fetchNextEventTag = async () => {
    if (!effectiveUserId) return;
    
    try {
      const response = await userService.getNextEventTag(effectiveUserId);
      if (response.success && response.data?.tag && response.data?.event) {
        setNextEventTag({
          ...response.data.tag,
          eventId: response.data.event.id,
          eventName: response.data.event.name,
        });
      }
    } catch (error) {
      console.error("Error fetching next event tag:", error);
    }
  };

  // Load all data when component mounts or user changes
  useEffect(() => {
    if (!effectiveUserId) return;

    const loadAllData = async () => {
      try {
        // Load user data, follow stats, and next event tag
        await Promise.all([
          fetchUserData(),
          fetchFollowStats(),
          fetchNextEventTag(),
        ]);

        // Load user posts
        const loadUserPostsAsync = async () => {
          setIsLoadingPosts(true);
          try {
            const userPosts = await postService.getUserPosts(effectiveUserId);

            if (!Array.isArray(userPosts)) {
              console.error("Expected array of posts but got:", userPosts);
              return;
            }

            const formattedPosts = userPosts.map((post: any) => ({
              id: post.id.toString(),
              imageUrl: post.cloudinaryUrl || "https://via.placeholder.com/300",
              likes: post.interactions?.filter((i: any) => i.like).length || 0,
              comments:
                post.interactions?.filter((i: any) => i.comment).length || 0,
              caption: post.title ? `${post.title}\n${post.body}` : post.body,
              location: "",
              timeAgo: new Date(post.createdAt).toLocaleDateString(),
              multipleImages: false,
              isVideo:
                detectMediaType(
                  post.cloudinaryUrl,
                  post.cloudinaryPublicId,
                  post.imageMetadata
                ) === "video",
              cloudinaryPublicId: post.cloudinaryPublicId,
              imageMetadata: post.imageMetadata,
            }));

            setPosts(formattedPosts);
            setStats((prev) => ({ ...prev, posts: formattedPosts.length }));
          } catch (error) {
            console.error("Error loading user posts:", error);
          } finally {
            setIsLoadingPosts(false);
          }
        };

        // Load favorites
        const loadFavoritesAsync = async () => {
          setIsLoadingFavorites(true);
          try {
            const response = await favoritesService.getUserFavorites(
              effectiveUserId,
              1
            );

            if (!response.favorites || !Array.isArray(response.favorites)) {
              console.error("Expected array of favorites but got:", response);
              return;
            }

            const formattedFavorites = response.favorites.map((post: any) => ({
              id: post.id,
              title: post.title,
              body: post.body,
              cloudinaryUrl: post.cloudinaryUrl,
              cloudinaryPublicId: post.cloudinaryPublicId,
              imageMetadata: post.imageMetadata,
              user: post.user,
              createdAt: post.createdAt,
              favorites: post.favorites,
              interactions: post.interactions,
              comments: post.comments,
            }));

            setFavorites(formattedFavorites);
            setStats((prev) => ({ ...prev, saved: response.pagination.total }));
          } catch (error) {
            console.error("Error loading favorites:", error);
          } finally {
            setIsLoadingFavorites(false);
          }
        };

        // Load liked posts
        const loadLikedPostsAsync = async () => {
          setIsLoadingLikedPosts(true);
          try {
            const response = await postService.getLikedPosts(effectiveUserId);

            if (!Array.isArray(response)) {
              console.error("Expected array of posts but got:", response);
              return;
            }

            const formattedLikedPosts = response.map((post: any) => ({
              id: post.id.toString(),
              imageUrl: post.cloudinaryUrl || "https://via.placeholder.com/300",
              likes: post.interactions?.filter((i: any) => i.like).length || 0,
              comments:
                post.interactions?.filter((i: any) => i.comment).length || 0,
              caption: post.title ? `${post.title}\n${post.body}` : post.body,
              location: "",
              timeAgo: new Date(post.createdAt).toLocaleDateString(),
              multipleImages: false,
              isVideo:
                detectMediaType(
                  post.cloudinaryUrl,
                  post.cloudinaryPublicId,
                  post.imageMetadata
                ) === "video",
              cloudinaryPublicId: post.cloudinaryPublicId,
              imageMetadata: post.imageMetadata,
            }));

            setLikedPosts(formattedLikedPosts);
          } catch (error) {
            console.error("Error loading liked posts:", error);
          } finally {
            setIsLoadingLikedPosts(false);
          }
        };

        // Load driver stats
        const loadDriverStatsAsync = async () => {
          setIsLoadingDriverStats(true);
          try {
            const response = await PerformanceService.getUserStats(
              effectiveUserId
            );

            if (response.success && response.data) {
              const apiStats = response.data;

              setDriverStats({
                races: apiStats.totalRaces || 0,
                wins: apiStats.wins || 0,
                podiums: apiStats.podiumFinishes || 0,
                bestPosition: apiStats.bestPosition || 0,
                averagePosition: apiStats.averagePosition || 0,
              });
            }
          } catch (error) {
            console.error("Error loading driver stats:", error);
          } finally {
            setIsLoadingDriverStats(false);
          }
        };

        // Load joined events
        const loadJoinedEventsAsync = async () => {
          setIsLoadingJoinedEvents(true);
          try {
            const response = await userService.getJoinedEvents(
              effectiveUserId,
              1,
              20
            );

            if (response.success && response.data) {
              setJoinedEvents(response.data.events || []);
            } else {
              console.error("Failed to load joined events:", response.error);
            }
          } catch (error) {
            console.error("Error loading joined events:", error);
          } finally {
            setIsLoadingJoinedEvents(false);
          }
        };

        const loadCreatedEventsAsync = async () => {
          // Only load if viewing own profile
          if (!effectiveUserId || !user?.id || effectiveUserId !== Number(user.id)) {
            return;
          }
          setIsLoadingCreatedEvents(true);
          try {
            const response = await eventService.getEventsByUserId(effectiveUserId.toString(), 1, 100);
            if (response && response.events) {
              // Fetch creator names for each event
              const eventsWithCreatorInfo = await Promise.all(
                response.events.map(async (event: any) => {
                  try {
                    const userResponse = await fetch(`${API_URL_USERS}/${event.creatorId}`);
                    if (userResponse.ok) {
                      const userData = await userResponse.json();
                      return {
                        ...event,
                        creators: userData.name || userData.username || 'Unknown',
                      };
                    }
                  } catch (error) {
                    console.error(`Error fetching creator for event ${event.id}:`, error);
                  }
                  return {
                    ...event,
                    creators: 'Unknown',
                  };
                })
              );
              setCreatedEvents(eventsWithCreatorInfo);
              const missingCount = countEventsWithMissingInfo(response.events);
              setMissingInfoCount(missingCount);
            }
          } catch (error) {
            console.error("Error loading created events:", error);
          } finally {
            setIsLoadingCreatedEvents(false);
          }
        };

        // Execute all data loading in parallel
        await Promise.all([
          loadUserPostsAsync(),
          loadFavoritesAsync(),
          loadLikedPostsAsync(),
          loadDriverStatsAsync(),
          loadJoinedEventsAsync(),
          loadCreatedEventsAsync(),
        ]);
      } catch (error) {
        console.error("Error loading profile data:", error);
      }
    };

    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId, params.refresh]);

  const onRefreshProfile = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchUserData(),
        fetchFollowStats(),
      ]);
      
      // Recharger les données selon l'onglet actif
      if (activeTab === "events" && effectiveUserId) {
        setIsLoadingJoinedEvents(true);
        const response = await userService.getJoinedEvents(effectiveUserId, 1, 20);
        if (response.success && response.data) {
          setJoinedEvents(response.data.events || []);
        }
        setIsLoadingJoinedEvents(false);
      }
      if (activeTab === "createdEvents" && effectiveUserId && user?.id && effectiveUserId === Number(user.id)) {
        setIsLoadingCreatedEvents(true);
        try {
          const response = await eventService.getEventsByUserId(effectiveUserId.toString(), 1, 100);
          if (response && response.events) {
            const eventsWithCreatorInfo = await Promise.all(
              response.events.map(async (event: any) => {
                try {
                  const userResponse = await fetch(`${API_URL_USERS}/${event.creatorId}`);
                  if (userResponse.ok) {
                    const userData = await userResponse.json();
                    return {
                      ...event,
                      creators: userData.name || userData.username || 'Unknown',
                    };
                  }
                } catch (error) {
                  console.error(`Error fetching creator for event ${event.id}:`, error);
                }
                return {
                  ...event,
                  creators: 'Unknown',
                };
              })
            );
            setCreatedEvents(eventsWithCreatorInfo);
            const missingCount = countEventsWithMissingInfo(response.events);
            setMissingInfoCount(missingCount);
          }
        } catch (error) {
          console.error("Error loading created events:", error);
        } finally {
          setIsLoadingCreatedEvents(false);
        }
      }
      if (activeTab === "favorites" && effectiveUserId) {
        setIsLoadingFavorites(true);
        const response = await favoritesService.getUserFavorites(
          effectiveUserId,
          1
        );

        if (response.favorites && Array.isArray(response.favorites)) {
          const formattedFavorites = response.favorites.map((post: any) => ({
            id: post.id,
            title: post.title,
            body: post.body,
            cloudinaryUrl: post.cloudinaryUrl,
            cloudinaryPublicId: post.cloudinaryPublicId,
            imageMetadata: post.imageMetadata,
            user: post.user,
            createdAt: post.createdAt,
            favorites: post.favorites,
            interactions: post.interactions,
            comments: post.comments,
          }));

          setFavorites(formattedFavorites);
          setStats((prev) => ({ ...prev, saved: response.pagination.total }));
        }
        setIsLoadingFavorites(false);
      }

      // Recharger les statistiques de performance
      if (effectiveUserId) {
        setIsLoadingDriverStats(true);
        const response = await PerformanceService.getUserStats(effectiveUserId);

        if (response.success && response.data) {
          const apiStats = response.data;

          setDriverStats({
            races: apiStats.totalRaces || 0,
            wins: apiStats.wins || 0,
            podiums: apiStats.podiumFinishes || 0,
            bestPosition: apiStats.bestPosition || 0,
            averagePosition: apiStats.averagePosition || 0,
          });
        }
        setIsLoadingDriverStats(false);
      }
    } catch (error) {
      console.error("Error refreshing profile data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEventPress = (eventId: string) => {
    router.push({
      pathname: "/(app)/eventDetail",
      params: { eventId },
    });
  };

  const handleSettingsPress = () => {
    setMenuVisible(false);
    router.push("/(app)/settings");
  };

  const handleEditProfilePress = () => {
    setMenuVisible(false);
    router.push("/editProfile");
  };

  const handleLogoutPress = async () => {
    setMenuVisible(false);
    try {
      await auth?.logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handlePerformancesPress = () => {
    router.push({ pathname: "/performances", params: { userId: effectiveUserId} });
  };

  const handleSendMessage = async () => {
    if (!effectiveUserId || !user?.id) {
      Alert.alert('Error', 'Unable to send message');
      return;
    }

    const currentUserId = Number(user.id);
    const targetUserId = effectiveUserId;

    if (currentUserId === targetUserId) {
      Alert.alert('Error', 'You cannot send a message to yourself');
      return;
    }

    try {
      // Check if target user is verified or if mutual follow exists
      const isTargetVerified = userData?.isVerify || false;
      const isMutualFollow = followStats.isFollowing && followStats.isFollowedBy;

      // If target is verified or mutual follow, create conversation directly
      if (isTargetVerified || isMutualFollow) {
        const conversation = await chatService.createConversation([targetUserId], currentUserId);
        
        if (conversation && conversation.id) {
          router.push({
            pathname: '/(app)/conversation',
            params: {
              conversationId: conversation.id.toString(),
              conversationName: userData?.name || 'User',
            },
          });
        } else {
          Alert.alert('Error', 'Failed to create conversation');
        }
      } else {
        // Create a message request
        const request = await chatService.sendMessageRequest(targetUserId, currentUserId);
        
        if (request) {
          Alert.alert(
            'Request sent',
            'Your message request has been sent. You will be notified when the user accepts it.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Optionally navigate to requests tab in messages
                  router.push('/(app)/messages');
                },
              },
            ]
          );
        } else {
          Alert.alert('Error', 'Failed to send message request');
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = error.response?.data?.error || 'Unable to send message';
      Alert.alert('Error', errorMessage);
    }
  };

  const renderPostsGrid = () => {
    if (isLoadingPosts) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
        </View>
      );
    }

    if (posts.length === 0) {
      return renderEmptyComponent();
    }

    // Calculate the number of rows needed to display all posts
    const rows = Math.ceil(posts.length / NUM_COLUMNS);
    const postRows = [];

    for (let i = 0; i < rows; i++) {
      const rowItems = posts.slice(i * NUM_COLUMNS, (i + 1) * NUM_COLUMNS);
      const row = (
        <View key={`row-${i}`} style={styles.gridRow}>
          {rowItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.postTile}
              activeOpacity={0.8}
              onPress={() => {
                router.push({
                  pathname: "/(app)/postDetail",
                  params: { postId: item.id },
                });
              }}
            >
              {item.isVideo ? (
                <CloudinaryMedia
                  publicId={item.cloudinaryPublicId || ""}
                  mediaType="video"
                  width={300}
                  height={300}
                  crop="fill"
                  quality="auto:best"
                  format="mp4"
                  style={styles.postTileImage}
                  fallbackUrl={item.imageUrl}
                  shouldPlay={false}
                  isMuted={true}
                  useNativeControls={false}
                  isLooping={false}
                />
              ) : (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.postTileImage}
                />
              )}
              {item.multipleImages && (
                <View style={styles.multipleImagesIcon}>
                  <FontAwesome name="clone" size={14} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
          {/* Fill the row with empty spaces if needed */}
          {Array(NUM_COLUMNS - rowItems.length)
            .fill(0)
            .map((_, index) => (
              <View
                key={`empty-${i}-${index}`}
                style={[styles.postTile, { backgroundColor: "transparent" }]}
              />
            ))}
        </View>
      );
      postRows.push(row);
    }

    return <View style={styles.postsContainer}>{postRows}</View>;
  };

  const renderJoinedEventsGrid = () => {
    if (isLoadingJoinedEvents) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
        </View>
      );
    }

    if (joinedEvents.length === 0) {
      return (
        <View style={[styles.emptyContainer, { flex: 1, minHeight: 300 }]}>
          <FontAwesome name="calendar" size={60} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Joined Events</Text>
          <Text style={styles.emptySubtitle}>
            Events you join will appear here.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 16 }}
      >
        {joinedEvents.map((event: any, index: number) => {
          const eventId = typeof event.id === 'string' ? parseInt(event.id) : event.id;
          return (
            <EventItem
              key={event.id ?? index}
              title={event.name}
              subtitle={`By: ${event.creators || event.creator?.name || event.creator?.username || 'Unknown'}`}
              date={new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              icon={event.logo}
              logoPublicId={event.logoPublicId}
              images={event.images}
              imagePublicIds={event.imagePublicIds}
              location={event.location}
              attendees={event.participantsCount ?? 0}
              onPress={() => handleEventPress(event.id.toString())}
              eventId={eventId}
              creatorId={event.creatorId}
              currentUserId={user?.id != null ? Number(user.id) : undefined}
              isJoined
              eventDate={event.date}
              meteo={event.meteo}
              finished={event.finished}
              participationTagText={event.participationTagText}
              participationTagColor={event.participationTagColor}
              organizers={(event as any).organizers || []}
              onLeaveSuccess={async () => {
                if (!effectiveUserId) return;
                const r = await userService.getJoinedEvents(effectiveUserId, 1, 20);
                if (r.success && r.data) setJoinedEvents(r.data.events || []);
              }}
            />
          );
        })}
      </ScrollView>
    );
  };

  const renderCreatedEventsGrid = () => {
    const isOwnProfile = effectiveUserId && user?.id && effectiveUserId === Number(user.id);
    
    if (!isOwnProfile) {
      return (
        <View style={[styles.emptyContainer, { flex: 1, minHeight: 300 }]}>
          <Text style={styles.emptyTitle}>Access Denied</Text>
          <Text style={styles.emptySubtitle}>
            You can only view your own created events.
          </Text>
        </View>
      );
    }

    if (isLoadingCreatedEvents) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
        </View>
      );
    }

    if (createdEvents.length === 0) {
      return (
        <View style={[styles.emptyContainer, { flex: 1, minHeight: 300 }]}>
          <FontAwesome name="calendar-o" size={60} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Created Events</Text>
          <Text style={styles.emptySubtitle}>
            Events you create will appear here.
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: '#E10600',
              borderRadius: 8,
            }}
            onPress={() => router.push('/(app)/createEvent')}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>
              Create Your First Event
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 16 }}
      >
        {missingInfoCount > 0 && (
          <View style={{
            marginHorizontal: 16,
            marginBottom: 16,
            padding: 12,
            backgroundColor: '#FEF3C7',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#F59E0B',
          }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#92400E' }}>
              ⚠️ {missingInfoCount} event{missingInfoCount > 1 ? 's' : ''} with missing information
            </Text>
            <Text style={{ fontSize: 12, color: '#92400E', marginTop: 4 }}>
              Please fill in track condition and results links for past events
            </Text>
          </View>
        )}
        {createdEvents.map((event: any, index: number) => {
          const eventId = typeof event.id === 'string' ? parseInt(event.id) : event.id;
          const missingInfo = checkMissingEventInfo(event);
          return (
            <EventItem
              key={event.id ?? index}
              title={event.name}
              subtitle={`By: ${event.creators || 'Unknown'}`}
              date={new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              icon={event.logo}
              logoPublicId={event.logoPublicId}
              images={event.images}
              imagePublicIds={event.imagePublicIds}
              location={event.location}
              attendees={event.participantsCount ?? 0}
              onPress={() => {
                if (missingInfo.hasMissingInfo && eventId) {
                  router.push({ pathname: '/(app)/postEventInfo', params: { eventId: eventId.toString() } });
                } else {
                  router.push({ pathname: '/(app)/eventDetail', params: { eventId: event.id } });
                }
              }}
              eventId={eventId}
              creatorId={event.creatorId}
              currentUserId={user?.id != null ? Number(user.id) : undefined}
              eventDate={event.date}
              meteo={event.meteo}
              finished={event.finished}
              participationTagText={event.participationTagText}
              participationTagColor={event.participationTagColor}
              organizers={(event as any).organizers || []}
            />
          );
        })}
      </ScrollView>
    );
  };

  const renderReelsGrid = () => {
    if (isLoadingPosts) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
        </View>
      );
    }

    const videoPosts = posts.filter((post) => post.isVideo);

    if (videoPosts.length === 0) {
      return renderEmptyComponent();
    }

    // Calculate the number of rows needed to display all video posts
    const rows = Math.ceil(videoPosts.length / NUM_COLUMNS);
    const postRows = [];

    for (let i = 0; i < rows; i++) {
      const rowItems = videoPosts.slice(i * NUM_COLUMNS, (i + 1) * NUM_COLUMNS);
      const row = (
        <View key={`row-${i}`} style={styles.gridRow}>
          {rowItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.postTile}
              activeOpacity={0.8}
              onPress={() => {
                router.push({
                  pathname: "/(app)/postDetail",
                  params: { postId: item.id },
                });
              }}
            >
              <CloudinaryMedia
                publicId={item.cloudinaryPublicId || ""}
                mediaType="video"
                width={300}
                height={300}
                crop="fill"
                quality="auto:best"
                format="mp4"
                style={styles.postTileImage}
                fallbackUrl={item.imageUrl}
                shouldPlay={false}
                isMuted={true}
                useNativeControls={false}
                isLooping={false}
              />
            </TouchableOpacity>
          ))}
          {/* Fill the row with empty spaces if needed */}
          {Array(NUM_COLUMNS - rowItems.length)
            .fill(0)
            .map((_, index) => (
              <View
                key={`empty-${i}-${index}`}
                style={[styles.postTile, { backgroundColor: "transparent" }]}
              />
            ))}
        </View>
      );
      postRows.push(row);
    }

    return <View style={styles.postsContainer}>{postRows}</View>;
  };

  const renderFavoritesGrid = () => {
    if (isLoadingFavorites) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
        </View>
      );
    }

    if (favorites.length === 0) {
      return (
        <View style={[styles.emptyContainer, { flex: 1, minHeight: 300 }]}>
          <FontAwesome name="bookmark-o" size={60} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Saved Posts</Text>
          <Text style={styles.emptySubtitle}>
            Posts you save will appear here.
          </Text>
        </View>
      );
    }

    const rows = Math.ceil(favorites.length / NUM_COLUMNS);
    const postRows = [];

    for (let i = 0; i < rows; i++) {
      const rowItems = favorites.slice(i * NUM_COLUMNS, (i + 1) * NUM_COLUMNS);
      const row = (
        <View key={`row-${i}`} style={styles.gridRow}>
          {rowItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.postTile}
              activeOpacity={0.8}
              onPress={() => {
                router.push({
                  pathname: "/(app)/postDetail",
                  params: { postId: item.id.toString() },
                });
              }}
            >
              {detectMediaType(
                item.cloudinaryUrl,
                item.cloudinaryPublicId,
                item.imageMetadata
              ) === "video" ? (
                <CloudinaryMedia
                  publicId={item.cloudinaryPublicId || ""}
                  mediaType="video"
                  width={300}
                  height={300}
                  crop="fill"
                  quality="auto:best"
                  format="mp4"
                  style={styles.postTileImage}
                  fallbackUrl={item.cloudinaryUrl}
                  shouldPlay={false}
                  isMuted={true}
                  useNativeControls={false}
                  isLooping={false}
                />
              ) : (
                <Image
                  source={{
                    uri:
                      item.cloudinaryUrl ||
                      "https://via.placeholder.com/300x300?text=No+Image",
                  }}
                  style={styles.postTileImage}
                />
              )}
            </TouchableOpacity>
          ))}
          {Array(NUM_COLUMNS - rowItems.length)
            .fill(0)
            .map((_, index) => (
              <View
                key={`empty-${i}-${index}`}
                style={[styles.postTile, { backgroundColor: "transparent" }]}
              />
            ))}
        </View>
      );
      postRows.push(row);
    }

    return <View style={styles.postsContainer}>{postRows}</View>;
  };

  const renderLikedPostsGrid = () => {
    if (isLoadingLikedPosts) {
      return (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#E10600" />
        </View>
      );
    }

    if (likedPosts.length === 0) {
      return (
        <View style={[styles.emptyContainer, { flex: 1, minHeight: 300 }]}>
          <FontAwesome name="heart-o" size={60} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Liked Posts</Text>
          <Text style={styles.emptySubtitle}>
            Posts you like will appear here.
          </Text>
        </View>
      );
    }

    // Calculate the number of rows needed to display all posts
    const rows = Math.ceil(likedPosts.length / NUM_COLUMNS);
    const postRows = [];

    for (let i = 0; i < rows; i++) {
      const rowItems = likedPosts.slice(i * NUM_COLUMNS, (i + 1) * NUM_COLUMNS);
      const row = (
        <View key={`row-${i}`} style={styles.gridRow}>
          {rowItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.postTile}
              activeOpacity={0.8}
              onPress={() => {
                router.push({
                  pathname: "/(app)/postDetail",
                  params: { postId: item.id },
                });
              }}
            >
              {item.isVideo ? (
                <CloudinaryMedia
                  publicId={item.cloudinaryPublicId || ""}
                  mediaType="video"
                  width={300}
                  height={300}
                  crop="fill"
                  quality="auto:best"
                  format="mp4"
                  style={styles.postTileImage}
                  fallbackUrl={item.imageUrl}
                  shouldPlay={false}
                  isMuted={true}
                  useNativeControls={false}
                  isLooping={false}
                />
              ) : (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.postTileImage}
                />
              )}
              {item.multipleImages && (
                <View style={styles.multipleImagesIcon}>
                  <FontAwesome name="clone" size={14} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
          {/* Fill the row with empty spaces if needed */}
          {Array(NUM_COLUMNS - rowItems.length)
            .fill(0)
            .map((_, index) => (
              <View
                key={`empty-${i}-${index}`}
                style={[styles.postTile, { backgroundColor: "transparent" }]}
              />
            ))}
        </View>
      );
      postRows.push(row);
    }

    return <View style={styles.postsContainer}>{postRows}</View>;
  };

  const renderEmptyComponent = () => (
    <View style={[styles.emptyContainer, { flex: 1, minHeight: 300 }]}>
      {activeTab === "posts" ? (
        <>
          <FontAwesome name="camera" size={60} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Posts</Text>
          <Text style={styles.emptySubtitle}>
            Photos and videos from your races and training sessions will appear here.
          </Text>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Share a Photo</Text>
          </TouchableOpacity>
        </>
      ) : activeTab === "liked" ? (
        <>
          <FontAwesome name="heart-o" size={60} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Liked Posts</Text>
          <Text style={styles.emptySubtitle}>
            Your liked posts will appear here.
          </Text>
        </>
      ) : activeTab === "reels" ? (
        <>
          <FontAwesome name="film" size={60} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Videos</Text>
          <Text style={styles.emptySubtitle}>
            Share the best moments from your races and circuits.
          </Text>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Add a Video</Text>
          </TouchableOpacity>
        </>
      ) : activeTab === "events" ? (
        <>
          <FontAwesome name="calendar" size={60} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Joined Events</Text>
          <Text style={styles.emptySubtitle}>
            Events you join will appear here.
          </Text>
        </>
      ) : (
        <>
          <FontAwesome name="bookmark-o" size={60} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Saved Items</Text>
          <Text style={styles.emptySubtitle}>
            Save circuits, posts and events to find them easily.
          </Text>
        </>
      )}
    </View>
  );

  if (!auth) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#E10600" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefreshProfile}
            colors={["#E10600"]}
            tintColor="#E10600"
          />
        }
      >
        {/* Header with name and back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome name="arrow-left" size={20} color="#1E1E1E" />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setMenuVisible(true)}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <FontAwesome name="bars" size={24} color="#1E1E1E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Message si le compte est supprimé */}
        {userData?.isDeleted ? (
          <View style={{ paddingTop: 40, paddingHorizontal: 16, backgroundColor: '#FFFFFF' }}>
            <View style={[styles.performanceCard, { 
              backgroundColor: '#FFF3CD', 
              borderWidth: 2, 
              borderColor: '#FFE69C',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }]}>
              <View style={[styles.performanceGradient, { backgroundColor: 'transparent', alignItems: 'center', padding: 30 }]}>
                <FontAwesome name="exclamation-triangle" size={64} color="#856404" />
                <Text style={{ 
                  color: '#856404', 
                  marginTop: 20,
                  fontSize: 22,
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  Compte Supprimé
                </Text>
                <Text style={{ 
                  color: '#856404', 
                  textAlign: 'center',
                  marginTop: 12,
                  fontSize: 16,
                  lineHeight: 24
                }}>
                  {userData.message || "Ce compte a été supprimé par son propriétaire."}
                </Text>
                {userData.deletedAt && (
                  <Text style={{ 
                    color: '#856404', 
                    fontSize: 14, 
                    marginTop: 16,
                    fontStyle: 'italic',
                    textAlign: 'center'
                  }}>
                    Supprimé le {new Date(userData.deletedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ) : (
          <>
            {/* Profile section with avatar and statistics */}
            <View style={styles.profileContainer}>
              <View style={styles.profileSection}>
                <View style={styles.profileHeader}>
              {/* Photo de profil optimisée avec Cloudinary et badge de vérification */}
              <VerifiedAvatar
                publicId={userData?.profilePicturePublicId}
                fallbackUrl={userData?.profilePicture || defaultImages.profile}
                size={80}
                isVerify={userData?.isVerify || false}
                quality="auto"
                format="auto"
                style={styles.profileImage}
              />
              <View style={styles.profileInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  {isLoadingUserData && (
                    <ActivityIndicator size="small" color="#E10600" style={{ marginRight: 4 }} />
                  )}
                  <Text style={styles.username}>
                    {userData?.username || user?.username || "User"}
                  </Text>
                  {nextEventTag && (
                    <TouchableOpacity
                      onPress={() => {
                        if (nextEventTag.eventId) {
                          router.push({
                            pathname: '/(app)/eventDetail',
                            params: { eventId: nextEventTag.eventId.toString() },
                          });
                        }
                      }}
                      activeOpacity={0.7}
                      disabled={!nextEventTag.eventId}
                    >
                      <View
                        style={{
                          backgroundColor: nextEventTag.color,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                        }}
                      >
                        <Text
                          style={{
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: '600',
                          }}
                        >
                          {nextEventTag.isOrganizer ? `Organizer of ${nextEventTag.eventName || nextEventTag.text}` : (nextEventTag.eventName || nextEventTag.text)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.posts}</Text>
                    <Text style={styles.statLabel}>Posts</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.statItem}
                    onPress={() => router.push({
                      pathname: '/followList',
                      params: { userId: effectiveUserId?.toString(), initialTab: 'followers', username: userData?.username || user?.username }
                    })}
                    disabled={isLoadingFollowStats}
                  >
                    {isLoadingFollowStats ? (
                      <ActivityIndicator size="small" color="#E10600" />
                    ) : (
                      <Text style={styles.statNumber}>{stats.followers}</Text>
                    )}
                    <Text style={styles.statLabel}>Followers</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.statItem}
                    onPress={() => router.push({
                      pathname: '/followList',
                      params: { userId: effectiveUserId?.toString(), initialTab: 'following', username: userData?.username || user?.username }
                    })}
                    disabled={isLoadingFollowStats}
                  >
                    {isLoadingFollowStats ? (
                      <ActivityIndicator size="small" color="#E10600" />
                    ) : (
                      <Text style={styles.statNumber}>{stats.following}</Text>
                    )}
                    <Text style={styles.statLabel}>Following</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Bio */}
            <View style={styles.bioSection}>
              <Text style={styles.bioText}>
                {userData?.description || user?.description || "Description"}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              {effectiveUserId && user?.id && effectiveUserId !== Number(user.id) ? (
                // Boutons pour un autre utilisateur
                <>
                  <FollowButton
                    key={`follow-${effectiveUserId}-${followStats.isFollowing}`}
                    targetUserId={effectiveUserId}
                    initialFollowState={followStats.isFollowing}
                    onFollowStateChange={(isFollowing, stats) => {
                      setFollowStats(prev => ({
                        ...prev,
                        isFollowing,
                        followersCount: stats?.followersCount || prev.followersCount,
                        followingCount: stats?.followingCount || prev.followingCount,
                      }));
                      // Update display stats
                      setStats(prevStats => ({
                        ...prevStats,
                        followers: stats?.followersCount || prevStats.followers,
                        following: stats?.followingCount || prevStats.following,
                      }));
                    }}
                    size="large"
                    variant="primary"
                  />
                  <TouchableOpacity
                    style={[styles.actionButton, styles.messageButton]}
                    onPress={handleSendMessage}
                  >
                    <Text style={styles.messageButtonText}>Message</Text>
                  </TouchableOpacity>
                </>
              ) : (
                // Boutons pour son propre profil
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.followButton]}
                    onPress={handleEditProfilePress}
                  >
                    <Text style={styles.followButtonText}>Edit Profile</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Driver statistics - SECTION MISE EN VALEUR */}
            <TouchableOpacity
              style={styles.performanceCard}
              onPress={handlePerformancesPress}
            >
              {/* Gradient Background Effect */}
              <View style={styles.performanceGradient}>
                {/* Header avec badge premium */}
                <View style={styles.performanceHeader}>
                  <View style={styles.performanceBadge}>
                    <Text style={styles.performanceBadgeText}>
                      ⚡ PERFORMANCE
                    </Text>
                  </View>
                  <View style={styles.performanceTitle}>
                    <Text style={styles.performanceTitleText}>
                      Track Your Racing Journey
                    </Text>
                    <Text style={styles.performanceSubtitle}>
                      Unlock detailed analytics & insights
                    </Text>
                  </View>
                </View>

                {isLoadingDriverStats ? (
                  <View style={styles.performanceLoading}>
                    <ActivityIndicator size="large" color="#E10600" />
                    <Text style={styles.performanceLoadingText}>
                      Loading performance data...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.performanceStats}>
                    <View style={styles.performanceStatItem}>
                      <View
                        style={[
                          styles.performanceStatIcon,
                          styles.performanceStatIconRaces,
                        ]}
                      >
                        <FontAwesome
                          name="flag-checkered"
                          size={28}
                          color="#E10600"
                        />
                      </View>
                      <View style={styles.performanceStatContent}>
                        <Text style={styles.performanceStatValue}>
                          {driverStats.races}
                        </Text>
                        <Text style={styles.performanceStatLabel}>Races</Text>
                      </View>
                    </View>

                    <View style={styles.performanceStatDivider} />

                    <View style={styles.performanceStatItem}>
                      <View
                        style={[
                          styles.performanceStatIcon,
                          styles.performanceStatIconWins,
                        ]}
                      >
                        <FontAwesome name="trophy" size={28} color="#FFD700" />
                      </View>
                      <View style={styles.performanceStatContent}>
                        <Text
                          style={[
                            styles.performanceStatValue,
                            styles.performanceStatValueWins,
                          ]}
                        >
                          {driverStats.wins}
                        </Text>
                        <Text style={styles.performanceStatLabel}>
                          Victories
                        </Text>
                      </View>
                    </View>

                    <View style={styles.performanceStatDivider} />

                    <View style={styles.performanceStatItem}>
                      <View
                        style={[
                          styles.performanceStatIcon,
                          styles.performanceStatIconPodiums,
                        ]}
                      >
                        <FontAwesome name="trophy" size={28} color="#C0C0C0" />
                      </View>
                      <View style={styles.performanceStatContent}>
                        <Text
                          style={[
                            styles.performanceStatValue,
                            styles.performanceStatValuePodiums,
                          ]}
                        >
                          {driverStats.podiums}
                        </Text>
                        <Text style={styles.performanceStatLabel}>Podiums</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Call to Action */}
                <View style={styles.performanceCTA}>
                  <View style={styles.performanceCTAContent}>
                    <Text style={styles.performanceCTAText}>
                      View Detailed Analytics
                    </Text>
                    <Text style={styles.performanceCTASubtext}>
                      Race history • Lap times • Progress tracking
                    </Text>
                  </View>
                  <View style={styles.performanceCTAIcon}>
                    <FontAwesome
                      name="chevron-right"
                      size={16}
                      color="#FFFFFF"
                    />
                  </View>
                </View>

                {/* Decorative Elements */}
                <View style={styles.performanceDecorative}>
                  <View style={styles.performanceCircle1} />
                  <View style={styles.performanceCircle2} />
                  <View style={styles.performanceCircle3} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "posts" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("posts")}
          >
            <FontAwesome
              name="th-large"
              size={24}
              color={activeTab === "posts" ? "#E10600" : "#666666"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "liked" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("liked")}
          >
            <FontAwesome
              name="heart"
              size={24}
              color={activeTab === "liked" ? "#E10600" : "#666666"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "favorites" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("favorites")}
          >
            <FontAwesome
              name="bookmark"
              size={24}
              color={activeTab === "favorites" ? "#E10600" : "#666666"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "reels" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("reels")}
          >
            <FontAwesome
              name="film"
              size={24}
              color={activeTab === "reels" ? "#E10600" : "#666666"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "events" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("events")}
          >
            <FontAwesome
              name="calendar"
              size={24}
              color={activeTab === "events" ? "#E10600" : "#666666"}
            />
          </TouchableOpacity>
          {/* Show "Created Events" tab only for own profile */}
          {effectiveUserId && user?.id && effectiveUserId === Number(user.id) && (
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "createdEvents" && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab("createdEvents")}
            >
              <View style={{ position: 'relative' }}>
                <FontAwesome
                  name="calendar-check-o"
                  size={24}
                  color={activeTab === "createdEvents" ? "#E10600" : "#666666"}
                />
                {missingInfoCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: '#EF4444',
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                  }}>
                    <Text style={{
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 'bold',
                    }}>
                      {missingInfoCount > 9 ? '9+' : missingInfoCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>

            <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
              {activeTab === "posts"
                ? renderPostsGrid()
                : activeTab === "liked"
                ? renderLikedPostsGrid()
                : activeTab === "favorites"
                ? renderFavoritesGrid()
                : activeTab === "reels"
                ? renderReelsGrid()
                : activeTab === "events"
                ? renderJoinedEventsGrid()
                : activeTab === "createdEvents"
                ? renderCreatedEventsGrid()
                : renderEmptyComponent()}
            </View>
          </>
        )}
      </ScrollView>

      <ProfileMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSettingsPress={handleSettingsPress}
        onEditProfilePress={handleEditProfilePress}
        onLogoutPress={handleLogoutPress}
        onPerformancesPress={handlePerformancesPress}
        userId={effectiveUserId || 0}
      />
    </SafeAreaView>
  );
};

export default ProfileScreen;
