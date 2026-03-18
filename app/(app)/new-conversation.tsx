import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import theme from '@/styles/config/theme';
import { newConversationScreenStyles as styles } from '@/styles/screens';
import chatService, { MessageUser } from '@/services/chatService';
import groupService from '@/services/groupService';
import { useAuth } from '@/context/AuthContext';

// User types (using MessageUser from service)
type User = MessageUser & {
  description?: string;
  isFollowing?: boolean; // Whether current user follows this user
  followsBack?: boolean; // Whether this user follows current user
};

export default function NewConversationScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [allFriends, setAllFriends] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [pendingRequestUser, setPendingRequestUser] = useState<User | null>(null);
  const router = useRouter();
  const { user } = useAuth() || {};

  // Load all friends (mutual follows) on mount
  useEffect(() => {
    const loadFriends = async () => {
      setLoading(true);
      try {
        const currentUserId = user?.id ? parseInt(user.id.toString()) : null;
        const friends = currentUserId 
          ? await chatService.getFriends(currentUserId)
          : await chatService.getFriends();
        if (Array.isArray(friends)) {
          // All friends already have mutual follow, so mark them accordingly
          const friendsWithStatus = friends.map(friend => ({
            ...friend,
            isFollowing: true,
            followsBack: true,
          }));
          setAllFriends(friendsWithStatus);
          setSearchResults(friendsWithStatus);
        }
      } catch (error) {
        console.error('Error loading friends:', error);
        setAllFriends([]);
      setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, [user?.id]);

  // Filter friends by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(allFriends);
      return;
    }

    const filtered = allFriends.filter(friend => {
      const name = friend.name?.toLowerCase() || '';
      const username = friend.username?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      return name.includes(query) || username.includes(query);
    });

    setSearchResults(filtered);
  }, [searchQuery, allFriends]);

  // Handle user click - start conversation directly or add to group
  const handleUserClick = async (clickedUser: User) => {
    if (isGroupChat) {
      // Group mode: toggle selection
    setSelectedUsers(prev => {
        const isSelected = prev.some(u => u.id === clickedUser.id);
      if (isSelected) {
          return prev.filter(u => u.id !== clickedUser.id);
      } else {
          // Group limit
          if (prev.length >= 9) { // Max 10 participants including current user
            Alert.alert('Limit reached', 'A group can contain a maximum of 10 participants.');
          return prev;
        }
          return [...prev, clickedUser];
      }
    });
    } else {
      // Direct message mode: start conversation immediately
      const isMutualFollow = clickedUser.isFollowing && clickedUser.followsBack;
      const isTargetVerified = clickedUser.isVerify;

      // If account is verified or mutual follow, create conversation directly
      if (isTargetVerified || isMutualFollow) {
        await createDirectConversation(clickedUser);
        return;
      }

      // Otherwise, offer to send a request
      setPendingRequestUser(clickedUser);
      setShowRequestModal(true);
    }
  };

  // Start group conversation
  const startGroupConversation = async () => {
    if (selectedUsers.length < 1) {
      Alert.alert('Error', 'Please select at least one participant for the group.');
      return;
    }
    setShowGroupModal(true);
  };

  // Create direct conversation
  const createDirectConversation = async (targetUser: User) => {
    setLoading(true);
    try {
      const currentUserId = user?.id ? parseInt(user.id.toString()) : undefined;
      const result = await chatService.createConversation([targetUser.id], currentUserId);
      
      // Check if result is a request or a conversation
      if (result.isRequest || result.status === 'PENDING' || result.status === 'pending') {
        // It's a request, show modal to add message
        setPendingRequestUser(targetUser);
        setShowRequestModal(true);
      } else if (result.id) {
        // It's a conversation (or commercial conversation)
      router.push({
        pathname: '/(app)/conversation',
        params: { 
            conversationId: result.id.toString(),
            conversationName: targetUser.name,
          },
      });
      }
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      // If error suggests creating a request, show request modal
      if (error.response?.data?.isRequest || error.response?.data?.error?.includes('Mutual follow')) {
        setPendingRequestUser(targetUser);
        setShowRequestModal(true);
    } else {
        Alert.alert('Error', error.response?.data?.error || 'Unable to create conversation');
      }
    } finally {
      setLoading(false);
    }
  };

  // Send message request
  const sendMessageRequest = async () => {
    if (!pendingRequestUser) return;

    setLoading(true);
    try {
      const currentUserId = user?.id ? parseInt(user.id.toString()) : undefined;
      await chatService.sendMessageRequest(
        pendingRequestUser.id,
        currentUserId,
        requestMessage.trim() || undefined
      );
      Alert.alert(
        'Request sent',
        'Your message request has been sent. You will be notified when the user accepts it.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowRequestModal(false);
              setPendingRequestUser(null);
              setRequestMessage('');
              setSelectedUsers([]);
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error sending request:', error);
      Alert.alert('Error', error.response?.data?.error || 'Unable to send request');
    } finally {
      setLoading(false);
    }
  };

  // Create a group
  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please give the group a name.');
      return;
    }

    if (selectedUsers.length < 2) {
      Alert.alert('Error', 'A group must contain at least 2 participants.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to create a group.');
      return;
    }

    setLoading(true);
    try {
      const userId = parseInt(user.id.toString());
      
      // Extract user IDs from selected users
      const memberIds = selectedUsers.map(u => u.id);
      
      // Create the group via API with selected members
      const newGroup = await groupService.createGroup(
        groupName.trim(),
        userId,
        memberIds
      );

      // Close modal and navigate to group detail page
    setShowGroupModal(false);
      setGroupName('');
      setSelectedUsers([]);
      setIsGroupChat(false);
      
      // Navigate to the group detail page
    router.push({
        pathname: '/(app)/group-detail',
      params: { 
          groupId: newGroup.id.toString(),
          groupName: newGroup.name,
        },
      });
    } catch (error: any) {
      console.error('Error creating group:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to create group. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Render user in search results
  const renderUser = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.some(u => u.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.selectedUserItem]}
        onPress={() => handleUserClick(item)}
        activeOpacity={0.7}
      >
        <View style={styles.userInfo}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.userAvatar} />
          ) : (
            <View style={[styles.userAvatar, styles.defaultAvatar]}>
              <FontAwesome name="user" size={20} color={theme.colors.text.secondary} />
            </View>
          )}

          <View style={styles.userDetails}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{item.name}</Text>
              {item.isVerify && (
                <FontAwesome name="check-circle" size={14} color="#E10600" style={styles.verifyIcon} />
              )}
            </View>
            <Text style={styles.userUsername}>@{item.username}</Text>
            {item.description && (
              <Text style={styles.userDescription} numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>
        </View>

        {isGroupChat ? (
        <View style={styles.selectionIndicator}>
          {isSelected ? (
            <FontAwesome name="check-circle" size={20} color="#E10600" />
          ) : (
            <View style={styles.emptyCircle} />
          )}
        </View>
        ) : (
          <FontAwesome name="chevron-right" size={16} color={theme.colors.text.secondary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>New Conversation</Text>

        {isGroupChat ? (
          <TouchableOpacity
            style={[styles.nextButton, selectedUsers.length > 0 && styles.nextButtonActive]}
            onPress={startGroupConversation}
            disabled={selectedUsers.length === 0}
          >
            <Text style={[styles.nextButtonText, selectedUsers.length > 0 && styles.nextButtonTextActive]}>
              Next
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderRight} />
        )}
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <FontAwesome name="search" size={16} color={theme.colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search friends..."
            placeholderTextColor={theme.colors.text.secondary}
          />
        </View>
      </View>

      {/* Option groupe */}
      <View style={styles.groupOption}>
        <View style={styles.groupOptionLeft}>
          <FontAwesome name="users" size={20} color="#E10600" />
          <Text style={styles.groupOptionText}>Create a group</Text>
        </View>
        <Switch
          value={isGroupChat}
          onValueChange={(value) => {
            setIsGroupChat(value);
            if (!value) {
              // Clear selection when switching back to direct message mode
              setSelectedUsers([]);
            }
          }}
          trackColor={{ false: theme.colors.border.light, true: '#E10600' }}
        />
      </View>

      {/* Liste des résultats de recherche */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      ) : (
      <FlatList
        data={searchResults}
        renderItem={renderUser}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.usersList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          searchQuery.trim() ? (
            <View style={styles.emptyState}>
              <FontAwesome name="search" size={40} color={theme.colors.text.secondary} />
              <Text style={styles.emptyStateText}>
                  No friends found for &quot;{searchQuery}&quot;
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome name="users" size={40} color={theme.colors.text.secondary} />
              <Text style={styles.emptyStateText}>
                  {allFriends.length === 0 
                    ? 'You don\'t have any friends yet. Follow users who follow you back to start conversations.'
                    : searchQuery.trim() 
                      ? `No friends found for "${searchQuery}"`
                      : 'Select a friend to start a conversation'}
              </Text>
            </View>
          )
        }
      />
      )}

      {/* Modal de création de groupe */}
      <Modal
        visible={showGroupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create a group</Text>
            
            <TextInput
              style={styles.groupNameInput}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Group name (e.g., Pro Karting Team)"
              placeholderTextColor={theme.colors.text.secondary}
              maxLength={50}
            />

            <Text style={styles.participantsText}>
              {selectedUsers.length + 1} participants
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowGroupModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createButton}
                onPress={createGroup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.createButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de demande de discussion */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowRequestModal(false);
          setPendingRequestUser(null);
          setRequestMessage('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send message request</Text>
            
            {pendingRequestUser && (
              <View style={styles.requestUserInfo}>
                <Text style={styles.requestUserText}>
                  You want to contact {pendingRequestUser.name}
                  {pendingRequestUser.isVerify && ' (verified account)'}
                </Text>
                <Text style={styles.requestInfoText}>
                  This person doesn&apos;t follow you. You can send a message request with an optional message.
                </Text>
              </View>
            )}

            <TextInput
              style={[styles.groupNameInput, styles.requestMessageInput]}
              value={requestMessage}
              onChangeText={setRequestMessage}
              placeholder="Optional message (e.g., Hello, I would like to discuss with you...)"
              placeholderTextColor={theme.colors.text.secondary}
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowRequestModal(false);
                  setPendingRequestUser(null);
                  setRequestMessage('');
                }}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createButton}
                onPress={sendMessageRequest}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.createButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 