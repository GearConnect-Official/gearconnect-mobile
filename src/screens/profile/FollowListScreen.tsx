import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import followService from '@/services/followService';
import FollowButton from '@/components/FollowButton';
import { FollowUser } from '@/types/follow.types';
import { CloudinaryAvatar } from '@/components/media/CloudinaryImage';
import { useAuth } from '@/context/AuthContext';
import theme from '@/styles/config/theme';

type TabType = 'followers' | 'following';

const FollowListScreen: React.FC = () => {
  const { userId, initialTab = 'followers' } = useLocalSearchParams<{
    userId: string;
    initialTab?: string;
  }>();
  const router = useRouter();
  const { user } = useAuth() || {};

  const [activeTab, setActiveTab] = useState<TabType>(initialTab as TabType);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [filteredFollowers, setFilteredFollowers] = useState<FollowUser[]>([]);
  const [filteredFollowing, setFilteredFollowing] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const targetUserId = parseInt(userId as string);

  useEffect(() => {
    loadData();
  }, [targetUserId]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, followers, following]);

  const loadData = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [followersResponse, followingResponse] = await Promise.all([
        followService.getFollowers(targetUserId),
        followService.getFollowing(targetUserId),
      ]);

      // Récupérer les données de base
      let followersData: FollowUser[] = [];
      let followingData: FollowUser[] = [];

      if (followersResponse.success && followersResponse.data) {
        followersData = followersResponse.data.followers;
        setFollowersCount(followersResponse.data.totalCount);
      }

      if (followingResponse.success && followingResponse.data) {
        followingData = followingResponse.data.following;
        setFollowingCount(followingResponse.data.totalCount);
      }

      // Vérifier l'état de follow pour l'utilisateur connecté
      if (user && user.id) {
        const currentUserId = Number(user.id);
        const allUserIds = [
          ...followersData.map(f => f.id),
          ...followingData.map(f => f.id)
        ].filter(id => id !== currentUserId); // Exclure l'utilisateur connecté

        if (allUserIds.length > 0) {
          try {
            const followStatusResponse = await followService.checkFollowingStatus(allUserIds, currentUserId);
            if (followStatusResponse.success && followStatusResponse.data) {
              const followedUserIds = followStatusResponse.data;
              
              // Mettre à jour l'état de follow pour les followers
              followersData = followersData.map(user => ({
                ...user,
                isFollowing: followedUserIds.includes(user.id),
              }));
              
              // Mettre à jour l'état de follow pour les following
              followingData = followingData.map(user => ({
                ...user,
                isFollowing: followedUserIds.includes(user.id),
              }));
            }
          } catch (error) {
            console.warn('Could not check follow status for list users:', error);
          }
        }
      }

      setFollowers(followersData);
      setFollowing(followingData);
    } catch (error) {
      console.error('Error loading follow data:', error);
      Alert.alert('Error', 'Unable to load data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterUsers = () => {
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) {
      setFilteredFollowers(followers);
      setFilteredFollowing(following);
      return;
    }

    const filterFn = (user: FollowUser) => 
      user.username.toLowerCase().includes(query) ||
      (user.name && user.name.toLowerCase().includes(query));

    setFilteredFollowers(followers.filter(filterFn));
    setFilteredFollowing(following.filter(filterFn));
  };

  const onRefresh = useCallback(() => {
    loadData(true);
  }, [targetUserId]);

  const navigateToProfile = (user: FollowUser) => {
    router.push({
      pathname: '/userProfile',
      params: { userId: user.id.toString() },
    });
  };

  const handleFollowStateChange = (userId: number, isFollowing: boolean) => {
    // Mettre à jour l'état dans les deux listes
    setFollowers(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, isFollowing }
          : user
      )
    );
    
    setFollowing(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, isFollowing }
          : user
      )
    );
  };

  const renderUserItem = ({ item }: { item: FollowUser }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigateToProfile(item)}
      activeOpacity={0.95}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.profilePicturePublicId ? (
            <CloudinaryAvatar
              publicId={item.profilePicturePublicId}
              size={54}
              quality="auto"
              format="auto"
              style={styles.avatar}
              fallbackUrl={item.profilePicture}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(item.username || 'U')[0].toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.userDetails}>
          <Text style={styles.username} numberOfLines={1}>
            {item.username}
          </Text>
          {item.name && (
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.followButtonContainer}>
        <FollowButton
          targetUserId={item.id}
          initialFollowState={item.isFollowing}
          onFollowStateChange={(isFollowing) => 
            handleFollowStateChange(item.id, isFollowing)
          }
          size="small"
          variant="primary"
          iconOnly={true}
        />
      </View>
    </TouchableOpacity>
  );

  const renderTabButton = (tab: TabType, title: string, count: number) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {title}
      </Text>
      <Text style={[styles.tabCount, activeTab === tab && styles.activeTabCount]}>
        {count}
      </Text>
    </TouchableOpacity>
  );

  const getCurrentData = () => {
    return activeTab === 'followers' ? filteredFollowers : filteredFollowing;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name={activeTab === 'followers' ? 'people-outline' : 'person-add-outline'}
        size={64}
        color="#9CA3AF"
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'followers' ? 'No followers' : 'No following'}
      </Text>
      <Text style={styles.emptyDescription}>
        {searchQuery
          ? 'No results found for your search'
          : activeTab === 'followers'
          ? 'This user doesn\'t have any followers yet'
          : 'This user is not following anyone yet'}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Following</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {renderTabButton('followers', 'Followers', followersCount)}
        {renderTabButton('following', 'Following', followingCount)}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={getCurrentData()}
        renderItem={renderUserItem}
        keyExtractor={(item) => `${activeTab}-${item.id}`}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          getCurrentData().length === 0 ? styles.emptyListContainer : undefined
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...theme.common.container,
  },
  loadingContainer: {
    ...theme.common.centerContent,
    flex: 1,
  },
  loadingText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  header: {
    ...theme.common.spaceBetween,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 0,
    backgroundColor: '#fff',
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.h5,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  tabContainer: {
    ...theme.common.row,
    backgroundColor: theme.colors.background.default,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borders.radius.xs,
    padding: theme.spacing.xxs,
  },
  tabButton: {
    flex: 1,
    ...theme.common.row,
    ...theme.common.centerContent,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: theme.colors.background.paper,
    ...theme.shadows.apply({}, 'xs'),
  },
  tabText: {
    ...theme.typography.body2,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    marginRight: 6,
  },
  activeTabText: {
    color: theme.colors.text.primary,
  },
  tabCount: {
    ...theme.typography.caption,
    fontWeight: theme.typography.weights.semiBold,
    color: theme.colors.grey[400],
    backgroundColor: theme.colors.grey[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  activeTabCount: {
    color: theme.colors.primary.main,
    backgroundColor: theme.colors.primary.main + '20', // 20% opacity
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  searchBar: {
    ...theme.common.row,
    backgroundColor: theme.colors.background.default,
    borderRadius: theme.borders.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  searchIcon: {
    marginRight: theme.spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.xxs,
  },
  list: {
    flex: 1,
  },
  userItem: {
    ...theme.common.spaceBetween,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.light,
  },
  userInfo: {
    ...theme.common.row,
    flex: 1,
  },
  avatarContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: theme.spacing.sm,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.grey[100],
    ...theme.common.centerContent,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: theme.typography.weights.semiBold,
    color: theme.colors.text.primary,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: theme.spacing.sm,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    ...theme.typography.body1,
    fontWeight: theme.typography.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  name: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  followButtonContainer: {
    padding: theme.spacing.xs,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyState: {
    ...theme.common.centerContent,
    flex: 1,
    paddingHorizontal: theme.spacing.xxl,
  },
  emptyTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptyDescription: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default FollowListScreen; 