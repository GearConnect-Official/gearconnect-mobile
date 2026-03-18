import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import SharedConversationScreen from '@/components/messaging/SharedConversationScreen';
import groupService, { GroupDetails } from '@/services/groupService';
import { CloudinaryAvatar } from '@/components/media/CloudinaryImage';
import { UserStatus, UserStatusDisplay } from '@/types/userStatus.types';
import theme from '@/styles/config/theme';
import { conversationScreenStyles as styles } from '@/styles/screens';
import GroupInviteModal from '@/components/messaging/GroupInviteModal';

export default function GroupDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth() || {};
  
  const groupId = params.groupId as string;
  const currentUserId = user?.id ? parseInt(user.id.toString()) : undefined;
  
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [removingMember, setRemovingMember] = useState<number | null>(null);

  // Load group details
  const loadGroupDetails = useCallback(async () => {
    if (!groupId || !currentUserId) return;
    
    try {
      const groupIdNum = parseInt(groupId);
      if (isNaN(groupIdNum)) {
        Alert.alert('Error', 'Invalid group ID');
        return;
      }
      const groupData = await groupService.getGroupDetails(groupIdNum, currentUserId);
      setGroup(groupData);
    } catch (error: any) {
      console.error('Error loading group details:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to load group details');
    }
  }, [groupId, currentUserId]);

  useEffect(() => {
    if (groupId && currentUserId) {
      loadGroupDetails();
    }
  }, [groupId, currentUserId, loadGroupDetails]);

  // Create invite handler for the modal
  const handleCreateInvite = async (inviteData: {
    maxUses?: number;
    expiresInDays?: number | null;
    recipientId?: number;
  }) => {
    if (!groupId || !currentUserId) {
      throw new Error('Group ID or User ID missing');
    }

    const groupIdNum = parseInt(groupId);
    const invite = await groupService.createInvite(groupIdNum, currentUserId, inviteData);
    return invite;
  };

  // Handle delete group
  const handleDeleteGroup = () => {
    if (!group) return;
    
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${group.name}"? This action cannot be undone and all messages will be permanently deleted.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const groupIdNum = parseInt(groupId);
              if (isNaN(groupIdNum)) {
                Alert.alert('Error', 'Invalid group ID');
                return;
    }
              await groupService.deleteGroup(groupIdNum, currentUserId);
              Alert.alert('Success', 'Group deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error: any) {
              console.error('Error deleting group:', error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete group');
    }
          },
        },
      ]
    );
  };

  // Check if user can manage members (owner or admin)
  const canManageMembers = group && currentUserId && (
    group.owner?.id === currentUserId ||
    group.members?.some(m => 
      m.user.id === currentUserId && 
      m.roles?.some(mr => {
        try {
          const role = mr.role as any;
          if (role.permissions) {
            const permissions = JSON.parse(role.permissions);
            return permissions.manageMembers;
          }
          return false;
        } catch {
          return false;
        }
      })
    )
  );



  // Remove member from group
  const handleRemoveMember = async (memberId: number, memberName: string) => {
    if (!group || !currentUserId) return;

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemovingMember(memberId);
            try {
              await groupService.removeMember(parseInt(groupId), memberId, currentUserId);
              await loadGroupDetails();
              Alert.alert('Success', 'Member removed successfully');
            } catch (error: any) {
              console.error('Error removing member:', error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to remove member');
            } finally {
              setRemovingMember(null);
            }
          },
        },
      ]
    );
  };

  if (!currentUserId || !groupId || !group) {
                          return null;
                    }
                    
                    return (
                      <>
      <SharedConversationScreen
        type="group"
        groupId={groupId}
        conversationName={group.name}
                      currentUserId={currentUserId}
        headerSubtitle={`${group._count?.members || group.members?.length || 0} members`}
        onHeaderInfoPress={() => setShowMembersModal(true)}
        renderHeaderActions={() => (
          <>
        <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => setShowInviteModal(true)}
                activeOpacity={0.7}
              >
              <FontAwesome name="user-plus" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
          {group.owner?.id === currentUserId && (
        <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleDeleteGroup}
              activeOpacity={0.7}
        >
                <FontAwesome name="trash" size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              )}
            </>
        )}
        renderAdditionalModals={() => (
          <>
      {/* Members Modal */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowMembersModal(false);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            <TouchableOpacity
              onPress={() => setShowMembersModal(false)}
              >
              <FontAwesome name="times" size={24} color="#6A707C" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 16, flex: 1 }}>
              Members
                    </Text>
            </View>

          {/* Members List */}
            <FlatList
              data={group?.members || []}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const isOwner = item.user.id === group?.owner?.id;
                const canRemove = canManageMembers && !isOwner && item.user.id !== currentUserId;
                      
                      // Get user status
                      const userStatus = item.user.status || 'OFFLINE';
                      
                      // Determine if user is actually online (check lastSeenAt if status is ONLINE)
                      let actualStatus = userStatus;
                      if (userStatus === 'ONLINE' && item.user.lastSeenAt) {
                        const lastSeen = new Date(item.user.lastSeenAt);
                        const now = new Date();
                        const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
                        if (diffMinutes > 5) {
                          actualStatus = 'OFFLINE';
                        }
                      }
                      const finalStatusDisplay = actualStatus === 'ONLINE' 
                        ? UserStatusDisplay[UserStatus.ONLINE]
                        : UserStatusDisplay[UserStatus.OFFLINE];
                      
                      const handleNavigateToProfile = () => {
                        if (item.user.id) {
                          setShowMembersModal(false);
                          // Small delay to ensure modal closes before navigation
                          setTimeout(() => {
                            router.push({
                              pathname: '/user-profile',
                              params: { userId: item.user.id.toString() },
                            });
                          }, 100);
                        }
                      };
                
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                          <TouchableOpacity
                            onPress={handleNavigateToProfile}
                            activeOpacity={0.7}
                            style={{ position: 'relative' }}
                          >
                    {item.user.profilePicturePublicId ? (
                      <CloudinaryAvatar publicId={item.user.profilePicturePublicId} size={40} />
                    ) : (
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#D9D9D9', justifyContent: 'center', alignItems: 'center' }}>
                        <FontAwesome name="user" size={16} color="#6A707C" />
                      </View>
                    )}
                            {/* Status indicator */}
                            <View style={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: finalStatusDisplay.color,
                              borderWidth: 2,
                              borderColor: '#FFFFFF',
                            }} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={handleNavigateToProfile}
                            activeOpacity={0.7}
                            style={{ marginLeft: 12, flex: 1 }}
                          >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.user.name}</Text>
                        {isOwner && (
                          <View style={{ backgroundColor: '#E10600', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '600' }}>Owner</Text>
                          </View>
                        )}
                      </View>
                            <Text style={{ fontSize: 12, color: finalStatusDisplay.color }}>
                              {finalStatusDisplay.label}
                            </Text>
                          </TouchableOpacity>
                    {canRemove && (
                      <TouchableOpacity
                        onPress={() => handleRemoveMember(item.user.id, item.user.name)}
                        disabled={removingMember === item.user.id}
                        style={{ padding: 8 }}
                      >
                        {removingMember === item.user.id ? (
                          <ActivityIndicator size="small" color="#E10600" />
                        ) : (
                          <FontAwesome name="times-circle" size={24} color="#E10600" />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <FontAwesome name="users" size={40} color="#D1D5DB" />
                  <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>No members</Text>
                </View>
              }
            />
        </SafeAreaView>
      </Modal>

      {/* Invite Modal */}
      {group && currentUserId && (
        <GroupInviteModal
        visible={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          groupId={parseInt(groupId)}
          groupName={group.name}
          currentUserId={currentUserId}
          onCreateInvite={handleCreateInvite}
          existingMemberIds={group.members?.map(m => m.user.id) || []}
        />
      )}
              </>
            )}
        onBack={() => router.back()}
      />
    </>
  );
}
