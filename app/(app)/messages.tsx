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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import theme from '@/styles/config/theme';
import { messagesScreenStyles as styles } from '@/styles/screens';
import chatService, { Conversation, MessageRequest } from '@/services/chatService';
import { useAuth } from '@/context/AuthContext';
import { UserStatus, UserStatusDisplay } from '@/types/userStatus.types';

// Tab types
type TabType = 'messages' | 'requests' | 'commercial';
type RequestSubTabType = 'pending' | 'sent';

export default function MessagesScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('messages');
  const [activeRequestSubTab, setActiveRequestSubTab] = useState<RequestSubTabType>('pending');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [commercial, setCommercial] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [participantStatuses, setParticipantStatuses] = useState<Record<number, { status: string; lastSeenAt?: string }>>({});
  const router = useRouter();
  const { user } = useAuth() || {};

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const currentUserId = user?.id ? parseInt(user.id.toString()) : null;
      const response = currentUserId 
        ? await chatService.getConversations(currentUserId)
        : await chatService.getConversations();
      if (response) {
        setConversations(response.conversations || []);
        setRequests(response.requests || []);
        setCommercial(response.commercial || []);
        
        // Build status map from conversation data (status is already included in the response)
        const statusMap: Record<number, { status: string; lastSeenAt?: string }> = {};
        
        [...(response.conversations || []), ...(response.commercial || [])].forEach((conv) => {
          if (!conv.isGroup) {
            const otherParticipant = conv.participants.find((p: { user: { id: number } }) => p.user.id !== currentUserId);
            if (otherParticipant && otherParticipant.user.status) {
              statusMap[otherParticipant.user.id] = {
                status: otherParticipant.user.status,
                lastSeenAt: otherParticipant.user.lastSeenAt,
              };
            }
          }
        });
        
        setParticipantStatuses(statusMap);
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load conversations on mount and when screen is focused
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Reload conversations when screen is focused (to update unread counts)
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  // Reset request sub-tab when switching away from requests tab
  useEffect(() => {
    if (activeTab !== 'requests') {
      setActiveRequestSubTab('pending');
    }
  }, [activeTab]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
      setRefreshing(false);
  };

  // Navigate to a conversation
  const openConversation = (conversation: Conversation) => {
    router.push({
      pathname: '/(app)/conversation',
      params: { 
        conversationId: conversation.id.toString(),
        conversationName: conversation.isGroup ? conversation.name : getConversationName(conversation)
      }
    });
  };

  // Get conversation name
  const getConversationName = (conversation: Conversation): string => {
    if (conversation.isGroup) {
      return conversation.name || 'Group';
    }
    // For private conversations, find the other participant
    const otherParticipant = conversation.participants.find(
      p => p.user.id !== Number(user?.id)
    );
    return otherParticipant?.user.name || 'User';
  };

  // Get conversation profile image
  const getConversationImage = (conversation: Conversation): string | undefined => {
    if (conversation.isGroup) {
      return undefined; // No image for groups yet
    }
    // For private conversations, find the other participant
    const otherParticipant = conversation.participants.find(
      p => p.user.id !== Number(user?.id)
    );
    return otherParticipant?.user.profilePicture || otherParticipant?.user.profilePicturePublicId;
  };

  // Fonction pour obtenir l'autre participant
  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(
      p => p.user.id !== Number(user?.id)
    )?.user;
  };

  // Format date for display
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Accept a message request
  const handleAcceptRequest = async (request: MessageRequest) => {
    try {
      const currentUserId = user?.id ? parseInt(user.id.toString()) : undefined;
      const response = await chatService.acceptRequest(request.id, currentUserId);
      await loadConversations();
      
      // Check if this is a group invite (response has groupId)
      if (response && 'groupId' in response && response.groupId) {
        // Navigate to group
        router.push({
          pathname: '/(app)/group-detail',
          params: {
            groupId: response.groupId.toString(),
          },
        });
      } else if (response && 'id' in response) {
        // Regular conversation
        router.push({
          pathname: '/(app)/conversation',
          params: {
            conversationId: response.id.toString(),
            conversationName: request.from.name,
          },
        });
      }
    } catch (error: any) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', error.response?.data?.error || 'Unable to accept request');
    }
  };

  // Reject a message request
  const handleRejectRequest = async (request: MessageRequest) => {
    try {
      const currentUserId = user?.id ? parseInt(user.id.toString()) : undefined;
      await chatService.rejectRequest(request.id, currentUserId);
      await loadConversations();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', error.response?.data?.error || 'Unable to reject request');
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = async (conversation: Conversation) => {
    try {
      const currentUserId = user?.id ? parseInt(user.id.toString()) : undefined;
      if (!currentUserId) return;
      
      await chatService.toggleFavorite(conversation.id, currentUserId);
      await loadConversations();
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', error.response?.data?.error || 'Unable to update favorite status');
    }
  };

  // Handle delete conversation
  const handleDeleteConversation = async (conversation: Conversation) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentUserId = user?.id ? parseInt(user.id.toString()) : undefined;
              if (!currentUserId) return;
              
              await chatService.deleteConversation(conversation.id, currentUserId);
              await loadConversations();
            } catch (error: any) {
              console.error('Error deleting conversation:', error);
              Alert.alert('Error', error.response?.data?.error || 'Unable to delete conversation');
            }
          },
        },
      ]
    );
  };

  // Render right actions for swipeable
  const renderRightActions = (conversation: Conversation, progress: Animated.AnimatedInterpolation<number>) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 0],
    });

    return (
      <View style={styles.swipeActionsContainer}>
        <Animated.View
          style={[
            styles.swipeAction,
            styles.favoriteAction,
            { transform: [{ translateX }] },
          ]}
        >
          <TouchableOpacity
            style={styles.swipeActionButton}
            onPress={() => handleToggleFavorite(conversation)}
          >
            <FontAwesome
              name={conversation.isFavorite ? 'star' : 'star-o'}
              size={24}
              color="white"
            />
            <Text style={styles.swipeActionText}>
              {conversation.isFavorite ? 'Unfavorite' : 'Favorite'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View
          style={[
            styles.swipeAction,
            styles.deleteAction,
            { transform: [{ translateX }] },
          ]}
        >
          <TouchableOpacity
            style={styles.swipeActionButton}
            onPress={() => handleDeleteConversation(conversation)}
          >
            <FontAwesome name="trash" size={24} color="white" />
            <Text style={styles.swipeActionText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  // Calculate unread messages count
  const getUnreadCount = (conversation: Conversation): number => {
    const currentUserId = user?.id ? parseInt(user.id.toString()) : null;
    if (!currentUserId) return 0;
    
    const userParticipant = conversation.participants.find(p => p.user.id === currentUserId);
    if (!userParticipant || !userParticipant.lastReadAt) {
      // If never read, count all messages
      return conversation.messages.length;
    }
    
    const lastReadDate = new Date(userParticipant.lastReadAt);
    return conversation.messages.filter(msg => {
      const msgDate = new Date(msg.createdAt);
      return msgDate > lastReadDate && msg.sender.id !== currentUserId;
    }).length;
  };

  // Get participant status for display
  const getParticipantStatus = (conversation: Conversation): { label: string; color: string } => {
    if (conversation.isGroup) {
      return { label: 'Group', color: theme.colors.text.secondary };
    }
    
    const otherParticipant = getOtherParticipant(conversation);
    if (!otherParticipant) {
      return { label: 'Offline', color: UserStatusDisplay[UserStatus.OFFLINE].color };
    }
    
    const statusData = participantStatuses[otherParticipant.id];
    if (!statusData) {
      return { label: 'Offline', color: UserStatusDisplay[UserStatus.OFFLINE].color };
    }
    
    // Determine if user is actually online (check lastSeenAt if status is ONLINE)
    let actualStatus = statusData.status;
    if (statusData.status === 'ONLINE' && statusData.lastSeenAt) {
      const lastSeen = new Date(statusData.lastSeenAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
      if (diffMinutes > 5) {
        actualStatus = 'OFFLINE';
      }
    }
    
    const statusDisplay = actualStatus === 'ONLINE' 
      ? UserStatusDisplay[UserStatus.ONLINE]
      : UserStatusDisplay[UserStatus.OFFLINE];
    
    return { label: statusDisplay.label, color: statusDisplay.color };
  };

  // Render conversation item
  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const conversationName = getConversationName(item);
    const conversationImage = getConversationImage(item);
    const otherParticipant = getOtherParticipant(item);
    const unreadCount = getUnreadCount(item);
    const statusInfo = getParticipantStatus(item);

    return (
      <Swipeable
        renderRightActions={(progress) => renderRightActions(item, progress)}
        overshootRight={false}
      >
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => openConversation(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {conversationImage ? (
            <Image source={{ uri: conversationImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <FontAwesome 
                name={item.isGroup ? "users" : "user"} 
                size={24} 
                color={theme.colors.text.secondary} 
              />
            </View>
          )}
          {item.isGroup && (
            <View style={styles.groupIndicator}>
              <FontAwesome name="users" size={12} color="white" />
            </View>
          )}
          {item.isCommercial && (
            <View style={styles.commercialIndicator}>
              <FontAwesome name="briefcase" size={12} color="white" />
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

        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName} numberOfLines={1}>
              {conversationName}
              {item.isFavorite && (
                <>
                <Text> </Text>
                  <FontAwesome name="star" size={14} color="#FFA500" />
                </>
              )}
              {!item.isGroup && otherParticipant?.isVerify && (
                <>
                <Text> </Text>
                <FontAwesome name="check-circle" size={14} color="#E10600" />
                </>
              )}
            </Text>
            <Text style={styles.messageTime}>
              {formatTime(item.updatedAt)}
            </Text>
          </View>

          <View style={styles.messagePreview}>
            <Text style={[styles.lastMessage, { color: statusInfo.color }]} numberOfLines={1}>
              {statusInfo.label}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      </Swipeable>
    );
  };

  // Render request item
  const renderRequestItem = ({ item }: { item: MessageRequest }) => {
    const isReceived = item.isReceived ?? true; // Default to received if not specified
    const otherUser = isReceived ? item.from : item.to;
    const status = item.status.toUpperCase() as 'PENDING' | 'ACCEPTED' | 'REJECTED';
    
    return (
      <View style={styles.requestItem}>
        <View style={styles.avatarContainer}>
          {otherUser.profilePicture || otherUser.profilePicturePublicId ? (
            <Image 
              source={{ uri: otherUser.profilePicture || otherUser.profilePicturePublicId }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <FontAwesome name="user" size={24} color={theme.colors.text.secondary} />
            </View>
          )}
        </View>

        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName} numberOfLines={1}>
              {otherUser.name}
              {otherUser.isVerify && (
                <>
                  <Text> </Text>
                  <FontAwesome name="check-circle" size={14} color="#E10600" />
                </>
              )}
              {!isReceived && (
                <>
                  <Text> </Text>
                  <Text style={styles.requestStatusText}>
                    {status === 'PENDING' && '(Pending)'}
                    {status === 'ACCEPTED' && '(Accepted)'}
                    {status === 'REJECTED' && '(Rejected)'}
                  </Text>
                </>
              )}
            </Text>
            <Text style={styles.messageTime}>
              {formatTime(item.createdAt)}
            </Text>
          </View>

          {item.message && (
            <View style={styles.messagePreview}>
              <Text style={styles.lastMessage} numberOfLines={2}>
                {item.message}
              </Text>
            </View>
          )}

          {/* Only show actions for received pending requests */}
          {isReceived && status === 'PENDING' && (
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={[styles.requestButton, styles.acceptButton]}
                onPress={() => handleAcceptRequest(item)}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.requestButton, styles.rejectButton]}
                onPress={() => handleRejectRequest(item)}
              >
                <Text style={styles.rejectButtonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Start a new conversation
  const startNewConversation = () => {
    router.push('/(app)/new-conversation');
  };

  // Navigate to groups
  const navigateToGroups = () => {
    router.push('/(app)/groups');
  };

  // Get data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'messages':
        return conversations;
      case 'requests':
        return requests;
      case 'commercial':
        return commercial;
      default:
        return [];
    }
  };

  // Get pending requests count (only received pending requests)
  const pendingRequestsCount = requests.filter(r => {
    const status = r.status.toUpperCase();
    return r.isReceived && status === 'PENDING';
  }).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chats</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.groupsButton}
            onPress={navigateToGroups}
          >
            <FontAwesome name="users" size={20} color="#E10600" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newMessageButton}
            onPress={startNewConversation}
          >
            <FontAwesome name="edit" size={20} color="#E10600" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Onglets */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
          onPress={() => setActiveTab('messages')}
        >
          <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>
            Messages
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests
          </Text>
          {pendingRequestsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'commercial' && styles.activeTab]}
          onPress={() => setActiveTab('commercial')}
        >
          <Text style={[styles.tabText, activeTab === 'commercial' && styles.activeTabText]}>
            Commercial
          </Text>
        </TouchableOpacity>
      </View>

      {/* List based on active tab */}
      {activeTab === 'requests' ? (
        <>
          {/* Sub-tabs for requests */}
          <View style={styles.subTabsContainer}>
            <TouchableOpacity
              style={[styles.subTab, activeRequestSubTab === 'pending' && styles.activeSubTab]}
              onPress={() => setActiveRequestSubTab('pending')}
            >
              <Text style={[styles.subTabText, activeRequestSubTab === 'pending' && styles.activeSubTabText]}>
                Pending
              </Text>
              {pendingRequestsCount > 0 && (
                <View style={styles.subTabBadge}>
                  <Text style={styles.subTabBadgeText}>
                    {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.subTab, activeRequestSubTab === 'sent' && styles.activeSubTab]}
              onPress={() => setActiveRequestSubTab('sent')}
            >
              <Text style={[styles.subTabText, activeRequestSubTab === 'sent' && styles.activeSubTabText]}>
                Sent
              </Text>
            </TouchableOpacity>
          </View>

          {/* Requests list based on sub-tab */}
          <FlatList
            data={activeRequestSubTab === 'pending' 
              ? requests.filter(r => {
                  const status = r.status.toUpperCase();
                  return r.isReceived && status === 'PENDING';
                })
              : requests.filter(r => !r.isReceived)
            }
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FontAwesome name="inbox" size={40} color={theme.colors.text.secondary} />
                <Text style={styles.emptyText}>
                  {activeRequestSubTab === 'pending' 
                    ? 'No pending requests' 
                    : 'No sent requests'}
                </Text>
              </View>
            }
          />
        </>
      ) : (
      <FlatList
          data={getCurrentData() as Conversation[]}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome 
                name={activeTab === 'commercial' ? "briefcase" : "comments"} 
                size={40} 
                color={theme.colors.text.secondary} 
              />
              <Text style={styles.emptyText}>
                {activeTab === 'commercial' 
                  ? 'No commercial conversations' 
                  : 'No conversations'}
              </Text>
            </View>
          }
      />
      )}

      {/* Loading state */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
        </View>
      )}
    </SafeAreaView>
  );
} 