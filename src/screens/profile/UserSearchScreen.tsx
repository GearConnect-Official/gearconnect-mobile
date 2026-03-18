import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FollowButton from '@/components/FollowButton';
import followService from '@/services/followService';
import { CloudinaryAvatar } from '@/components/media/CloudinaryImage';
import { useAuth } from '@/context/AuthContext';
import theme from '@/styles/config/theme';
import { trackSearch, trackScreenView } from '@/utils/mixpanelTracking';

// Type pour les résultats de recherche (adapté à la réponse API)
interface SearchUser {
  id: number;
  username: string;
  name?: string;
  profilePicture?: string;
  profilePicturePublicId?: string;
  isVerify: boolean;
  isFollowing?: boolean;
}

const UserSearchScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth() || {}; // Récupérer l'utilisateur connecté
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    currentPage: 1,
    totalPages: 0,
    hasMore: false,
  });

  // Track screen view
  React.useEffect(() => {
    trackScreenView('User Search');
  }, []);

  const searchUsers = async (query: string, page: number = 1) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      setPagination({ totalCount: 0, currentPage: 1, totalPages: 0, hasMore: false });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await followService.searchUsers(query.trim(), 20, page);
      
      if (response.success && response.data) {
        // Filtrer l'utilisateur connecté des résultats
        const filteredUsers = user && user.id 
          ? response.data.users.filter(searchUser => searchUser.id !== Number(user.id))
          : response.data.users;

        let usersWithFollowState = filteredUsers.map(user => ({
          ...user,
          isFollowing: false, // Valeur par défaut
        }));

        // Vérifier l'état de follow réel si l'utilisateur est connecté
        if (user && user.id && filteredUsers.length > 0) {
          const currentUserId = Number(user.id);
          const userIds = filteredUsers.map(u => u.id);
          
          try {
            const followStatusResponse = await followService.checkFollowingStatus(userIds, currentUserId);
            if (followStatusResponse.success && followStatusResponse.data) {
              const followedUserIds = followStatusResponse.data;
              
              // Mettre à jour l'état de follow pour chaque utilisateur
              usersWithFollowState = usersWithFollowState.map(user => ({
                ...user,
                isFollowing: followedUserIds.includes(user.id),
              }));
            }
          } catch (error) {
            console.warn('Could not check follow status:', error);
          }
        }
        
        if (page === 1) {
          setSearchResults(usersWithFollowState);
        } else {
          setSearchResults(prev => [...prev, ...usersWithFollowState]);
        }
        
        setPagination(response.data.pagination);
        
        // Track search
        trackSearch.performed(query.trim(), response.data.pagination.totalCount, 'users');
      } else {
        if (page === 1) {
          setSearchResults([]);
          setPagination({ totalCount: 0, currentPage: 1, totalPages: 0, hasMore: false });
        }
        console.error('Search failed:', response.error);
      }
      
    } catch (error) {
      console.error('Error searching users:', error);
      if (page === 1) {
        setSearchResults([]);
        setPagination({ totalCount: 0, currentPage: 1, totalPages: 0, hasMore: false });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debouncing
    const timeout = setTimeout(() => {
      searchUsers(text, 1);
    }, 500);
    
    setSearchTimeout(timeout);
  };

  const loadMoreResults = () => {
    if (!isLoading && pagination.hasMore) {
      searchUsers(searchQuery, pagination.currentPage + 1);
    }
  };

  const navigateToProfile = (user: SearchUser) => {
    router.push({
      pathname: '/userProfile',
      params: { userId: user.id.toString() },
    });
  };

  const handleFollowStateChange = (userId: number, isFollowing: boolean) => {
    setSearchResults(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, isFollowing }
          : user
      )
    );
  };

  const renderUserItem = ({ item }: { item: SearchUser }) => (
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
                {(item.username || item.name || 'U')[0].toUpperCase()}
              </Text>
            </View>
          )}
          {item.isVerify && (
            <View style={styles.verifyBadge}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
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

  const renderEmptyState = () => {
    if (!hasSearched) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Search users</Text>
          <Text style={styles.emptyDescription}>
            Type a username or name to start searching
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="person-outline" size={64} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No results</Text>
        <Text style={styles.emptyDescription}>
          No users found for "{searchQuery}"
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!pagination.hasMore) return null;
    
    return (
      <View style={styles.footerContainer}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#3B82F6" />
        ) : (
          <TouchableOpacity style={styles.loadMoreButton} onPress={loadMoreResults}>
            <Text style={styles.loadMoreText}>Charger plus</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearchInputChange}
            autoCapitalize="none"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setSearchResults([]);
              setHasSearched(false);
              setPagination({ totalCount: 0, currentPage: 1, totalPages: 0, hasMore: false });
              if (searchTimeout) {
                clearTimeout(searchTimeout);
              }
            }}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results Info */}
      {hasSearched && !isLoading && (
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {pagination.totalCount} result{pagination.totalCount > 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {/* Loading State */}
      {isLoading && searchResults.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        /* Results List */
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onEndReached={loadMoreResults}
          onEndReachedThreshold={0.5}
          contentContainerStyle={
            searchResults.length === 0 ? styles.emptyListContainer : styles.listContainer
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...theme.common.container,
    backgroundColor: theme.colors.background.default,
  },
  header: {
    ...theme.common.spaceBetween,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 0,
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
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.paper,
  },
  searchBar: {
    ...theme.common.row,
    backgroundColor: theme.colors.background.default,
    borderRadius: theme.borders.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.apply({}, 'xs'),
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
  resultsInfo: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background.paper,
  },
  resultsText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  loadingContainer: {
    ...theme.common.centerContent,
    flex: 1,
    paddingHorizontal: theme.spacing.xxl,
  },
  loadingText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
    fontWeight: theme.typography.weights.medium,
  },
  list: {
    flex: 1,
  },
  listContainer: {
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xl,
  },
  userItem: {
    ...theme.common.spaceBetween,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: 6,
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borders.radius.md,
    ...theme.shadows.apply({}, 'sm'),
  },
  userInfo: {
    ...theme.common.row,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.grey[100],
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.background.default,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    ...theme.common.centerContent,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.secondary,
  },
  verifyBadge: {
    position: 'absolute',
    top: -2,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.status.success,
    borderRadius: 10,
    width: 20,
    height: 20,
    ...theme.common.centerContent,
    borderWidth: 2,
    borderColor: theme.colors.common.white,
  },
  userDetails: {
    flex: 1,
    ...theme.common.centerContent,
    alignItems: 'flex-start',
  },
  username: {
    fontSize: 17,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  name: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  followButtonContainer: {
    ...theme.common.centerContent,
  },
  footerContainer: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    ...theme.common.centerContent,
  },
  loadMoreButton: {
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.apply({}, 'xs'),
  },
  loadMoreText: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.semiBold,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyState: {
    ...theme.common.centerContent,
    flex: 1,
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.xl,
    justifyContent: 'flex-start',
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: theme.typography.weights.medium,
  },
});

export default UserSearchScreen; 