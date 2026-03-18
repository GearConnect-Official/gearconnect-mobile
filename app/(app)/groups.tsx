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

const GroupsScreen: React.FC = () => {
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
      setGroups(fetchedGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
      Alert.alert('Error', 'Failed to load groups');
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
      pathname: "/(app)/group-detail",
      params: {
        groupId: group.id.toString(),
        groupName: group.name,
      },
    });
  };



  const formatMemberCount = (count: number): string => {
    if (count === 1) return '1 member';
    return `${count} members`;
  };

  // Calculate unread messages count for a group
  const getUnreadCount = (group: Group): number => {
    const currentUserId = user?.id ? parseInt(user.id.toString()) : null;
    if (!currentUserId || !(group as any).conversation) return 0;
    
    const conversation = (group as any).conversation;
    if (!conversation.lastReadAt) {
      // If never read, count all messages (we need to get total message count)
      // For now, if there's a lastMessage, assume there's at least 1 unread
      return conversation.lastMessage ? 1 : 0;
    }
    
    const lastReadDate = new Date(conversation.lastReadAt);
    if (conversation.lastMessage) {
      const msgDate = new Date(conversation.lastMessage.createdAt);
      // If last message is after lastReadAt and not from current user, it's unread
      if (msgDate > lastReadDate && conversation.lastMessage.senderId !== currentUserId) {
        return 1; // At least 1 unread (we'd need full message list for exact count)
      }
    }
    
    return 0;
  };

  const renderGroupItem = ({ item }: { item: Group }) => {
    const unreadCount = getUnreadCount(item);
    
    return (
    <TouchableOpacity
      style={styles.groupItem as StyleProp<ViewStyle>}
      onPress={() => openGroup(item)}
      activeOpacity={0.7}
    >
      <View style={styles.groupHeader as StyleProp<ViewStyle>}>
        <View style={[styles.groupIconContainer as StyleProp<ViewStyle>, { position: 'relative' }]}>
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
          {/* Unread badge */}
          {unreadCount > 0 && (
            <View style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: '#E10600',
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 6,
              borderWidth: 2,
              borderColor: '#FFFFFF',
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: '700',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount.toString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.groupInfo as StyleProp<ViewStyle>}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.groupName as StyleProp<TextStyle>} numberOfLines={1}>
            {item.name}
          </Text>
            {item.eventId && (
              <FontAwesome name="trophy" size={14} color="#FFD700" />
            )}
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
  };

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
        <Text style={styles.headerTitle as StyleProp<TextStyle>}>Groups</Text>
        {/* <View style={styles.headerActions as StyleProp<ViewStyle>}>
          <TouchableOpacity
            style={styles.headerButton as StyleProp<ViewStyle>}
            onPress={() => router.push('/(app)/event-groups')}
            activeOpacity={0.7}
          >
            <FontAwesome name="trophy" size={20} color="#E10600" />
          </TouchableOpacity>
        </View> */}
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
            <FontAwesome name="users" size={60} color="#CCCCCC" />
            <Text style={styles.emptyTitle as StyleProp<TextStyle>}>No groups</Text>
            <Text style={styles.emptyDescription as StyleProp<TextStyle>}>
              Create your first group or join an existing one
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default GroupsScreen;
