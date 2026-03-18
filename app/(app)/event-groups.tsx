import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleProp,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CloudinaryAvatar } from '@/components/media/CloudinaryImage';
import { groupsScreenStyles as styles } from '@/styles/screens/groups';
import groupService, { Group } from '@/services/groupService';
import { useAuth } from '@/context/AuthContext';

const EventGroupsScreen: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth() || {};

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      const currentUserId = user?.id ? parseInt(user.id.toString()) : undefined;
      const fetchedGroups = await groupService.getGroups(currentUserId);
      // Filter only groups that have an eventId
      const eventGroups = fetchedGroups.filter(group => group.eventId);
      setGroups(eventGroups);
    } catch (error) {
      console.error('Error loading event groups:', error);
      Alert.alert('Error', 'Failed to load event groups');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const openGroup = (group: Group) => {
    router.push({
      pathname: '/(app)/group-detail',
      params: {
        groupId: group.id.toString(),
        groupName: group.name
      }
    });
  };

  const formatMemberCount = (count: number): string => {
    if (count === 1) return '1 member';
    return `${count} members`;
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupItem as StyleProp<ViewStyle>}
      onPress={() => openGroup(item)}
      activeOpacity={0.7}
    >
      <View style={styles.groupHeader as StyleProp<ViewStyle>}>
        <View style={styles.groupIconContainer as StyleProp<ViewStyle>}>
          {item.iconPublicId ? (
            <CloudinaryAvatar
              publicId={item.iconPublicId}
              size={50}
              style={styles.groupIcon as StyleProp<ImageStyle>}
            />
          ) : item.icon ? (
            <Image source={{ uri: item.icon }} style={styles.groupIcon as StyleProp<ImageStyle>} />
          ) : (
            <View style={[styles.groupIcon as StyleProp<ViewStyle>, styles.defaultGroupIcon as StyleProp<ViewStyle>]}>
              <FontAwesome name="users" size={24} color="#6A707C" />
            </View>
          )}
        </View>

        <View style={styles.groupInfo as StyleProp<ViewStyle>}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.groupName as StyleProp<TextStyle>} numberOfLines={1}>
              {item.name}
            </Text>
            <FontAwesome name="trophy" size={14} color="#FFD700" />
          </View>
          <View style={styles.groupMeta as StyleProp<ViewStyle>}>
            <View style={styles.metaItem as StyleProp<ViewStyle>}>
              <FontAwesome name="users" size={12} color="#6A707C" />
              <Text style={styles.metaText as StyleProp<TextStyle>}>
                {formatMemberCount(item._count.members)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.groupActions as StyleProp<ViewStyle>}>
          <FontAwesome name="chevron-right" size={16} color="#6A707C" />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container as StyleProp<ViewStyle>}>
        <View style={styles.loadingContainer as StyleProp<ViewStyle>}>
          <ActivityIndicator size="large" color="#E10600" />
          <Text style={styles.loadingText as StyleProp<TextStyle>}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container as StyleProp<ViewStyle>}>
      {/* Header */}
      <View style={styles.header as StyleProp<ViewStyle>}>
        <TouchableOpacity
          style={styles.backButton as StyleProp<ViewStyle>}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={20} color="#6A707C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle as StyleProp<TextStyle>}>Event Groups</Text>
        <View style={styles.headerActions as StyleProp<ViewStyle>}>
          {/* Empty space to balance the header */}
        </View>
      </View>

      {/* Groups list */}
      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer as StyleProp<ViewStyle>}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer as StyleProp<ViewStyle>}>
            <FontAwesome name="trophy" size={60} color="#CCCCCC" />
            <Text style={styles.emptyTitle as StyleProp<TextStyle>}>No event groups</Text>
            <Text style={styles.emptyDescription as StyleProp<TextStyle>}>
              Groups created when joining events will appear here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default EventGroupsScreen;
