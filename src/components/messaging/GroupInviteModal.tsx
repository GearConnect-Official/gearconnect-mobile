import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CloudinaryAvatar } from '@/components/media/CloudinaryImage';
import chatService from '@/services/chatService';

export interface GroupInviteModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: number;
  groupName: string;
  currentUserId: number;
  existingMemberIds?: number[];
  onCreateInvite: (inviteData: {
    maxUses?: number;
    expiresInDays?: number | null;
    recipientId?: number;
  }) => Promise<{ code: string; expiresAt?: string }>;
}

type InviteMode = 'link' | 'direct';

const EXPIRATION_OPTIONS = [
  { label: 'Never expires', value: null },
  { label: '1 day', value: 1 },
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
];

export default function GroupInviteModal({
  visible,
  onClose,
  groupId,
  groupName,
  currentUserId,
  existingMemberIds = [],
  onCreateInvite,
}: GroupInviteModalProps) {
  const [mode, setMode] = useState<InviteMode>('link');
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const loadFriendsList = useCallback(async () => {
    setLoading(true);
    try {
      const friends = await chatService.getFriends(currentUserId);
      // Filter out friends who are already members of the group
      const availableFriends = friends.filter((friend: any) => 
        !existingMemberIds.includes(friend.id)
      );
      setSearchResults(availableFriends);
    } catch (error) {
      console.error('Error loading friends:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, existingMemberIds]);

  useEffect(() => {
    if (!visible) {
      // Reset state when modal closes
      setMode('link');
      setExpiresInDays(null);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setInviteLink(null);
    } else if (visible && mode === 'direct') {
      // Load friends list when modal opens in direct mode
      loadFriendsList();
    }
  }, [visible, mode, loadFriendsList]);

  const searchUsers = async (query: string) => {
    setLoading(true);
    try {
      const friends = await chatService.getFriends(currentUserId);
      // Filter out friends who are already members of the group
      const availableFriends = friends.filter((friend: any) => 
        !existingMemberIds.includes(friend.id)
      );
      
      if (!query.trim() || query.length === 0) {
        // If no query, show all available friends
        setSearchResults(availableFriends);
      } else {
        // Filter available friends based on search query
        const filtered = availableFriends.filter((friend: any) => {
          const name = friend.name?.toLowerCase() || '';
          const username = friend.username?.toLowerCase() || '';
          const search = query.toLowerCase();
          return name.includes(search) || username.includes(search);
        });
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    if (mode === 'direct' && !selectedUser) {
      Alert.alert('Error', 'Please select a user to invite');
      return;
    }

    setCreating(true);
    try {
      const inviteData: any = {
        expiresInDays: expiresInDays,
      };

      if (mode === 'direct') {
        inviteData.recipientId = selectedUser.id;
      }

      const invite = await onCreateInvite(inviteData);
      
      if (mode === 'direct') {
        Alert.alert('Success', `Invitation sent to ${selectedUser.name}`);
        onClose();
      } else {
        // For link mode, generate the invite link and share it immediately
        // Use a universal link format that works both in app and browser
        const inviteUrl = `https://gearconnect.app/join/${invite.code}`;
        setInviteLink(inviteUrl);
        // Auto-share the link
        await handleShareLink(inviteUrl);
      }
    } catch (error: any) {
      console.error('Error creating invite:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to create invite');
    } finally {
      setCreating(false);
    }
  };

  const handleShareLink = async (link?: string) => {
    const urlToShare = link || inviteLink;
    if (!urlToShare) return;

    const shareMessage = `Join ${groupName} on GearConnect!\n\n${urlToShare}`;

    try {
      await Share.share({
        message: shareMessage,
        title: `Invite to ${groupName}`,
        url: urlToShare, // For iOS to recognize it as a URL
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyLink = () => {
    if (!inviteLink) return;
    Clipboard.setString(inviteLink);
    Alert.alert('Copied!', 'Invite link copied to clipboard');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
          <TouchableOpacity onPress={onClose}>
            <FontAwesome name="times" size={24} color="#6A707C" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 16, flex: 1 }}>Invite Members</Text>
        </View>

        {!inviteLink ? (
          <View style={{ flex: 1, padding: 16 }}>
            {/* Mode Selection */}
            <View style={{ flexDirection: 'row', marginBottom: 24, backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 6,
                  backgroundColor: mode === 'link' ? '#FFFFFF' : 'transparent',
                  alignItems: 'center',
                }}
                onPress={() => setMode('link')}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: mode === 'link' ? '#1F2937' : '#6A707C' }}>
                  Share Link
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 6,
                  backgroundColor: mode === 'direct' ? '#FFFFFF' : 'transparent',
                  alignItems: 'center',
                }}
                onPress={() => {
                  setMode('direct');
                  // Load friends when switching to direct mode
                  loadFriendsList();
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: mode === 'direct' ? '#1F2937' : '#6A707C' }}>
                  Send Direct
                </Text>
              </TouchableOpacity>
            </View>

            {/* Link Mode */}
            {mode === 'link' && (
              <>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#1F2937' }}>
                  Expiration
                </Text>
                <View style={{ marginBottom: 24 }}>
                  {EXPIRATION_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value === null ? 'never' : option.value}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 16,
                        backgroundColor: '#F9FAFB',
                        borderRadius: 8,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: expiresInDays === option.value ? '#E10600' : '#E5E7EB',
                      }}
                      onPress={() => setExpiresInDays(option.value)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '500', color: '#1F2937' }}>
                          {option.label}
                        </Text>
                      </View>
                      {expiresInDays === option.value && (
                        <FontAwesome name="check" size={20} color="#E10600" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#E10600',
                    paddingVertical: 16,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginTop: 'auto',
                  }}
                  onPress={handleCreateInvite}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                      Create & Share Link
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Direct Mode */}
            {mode === 'direct' && (
              <>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#1F2937' }}>
                  Search Friends
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16 }}>
                  <FontAwesome name="search" size={16} color="#6A707C" />
                  <TextInput
                    style={{ flex: 1, marginLeft: 8, fontSize: 16, color: '#1F2937' }}
                    placeholder="Search friends..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      // Search immediately, even with empty query (will show all friends)
                      searchUsers(text);
                    }}
                  />
                </View>

                {selectedUser && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F0FDF4', borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#86EFAC' }}>
                    {selectedUser.profilePicturePublicId ? (
                      <CloudinaryAvatar publicId={selectedUser.profilePicturePublicId} size={40} />
                    ) : (
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#D9D9D9', justifyContent: 'center', alignItems: 'center' }}>
                        <FontAwesome name="user" size={16} color="#6A707C" />
                      </View>
                    )}
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600' }}>{selectedUser.name}</Text>
                      <Text style={{ fontSize: 12, color: '#6A707C' }}>@{selectedUser.username}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedUser(null)}>
                      <FontAwesome name="times" size={20} color="#6A707C" />
                    </TouchableOpacity>
                  </View>
                )}

                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                      onPress={() => setSelectedUser(item)}
                    >
                      {item.profilePicturePublicId ? (
                        <CloudinaryAvatar publicId={item.profilePicturePublicId} size={40} />
                      ) : (
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#D9D9D9', justifyContent: 'center', alignItems: 'center' }}>
                          <FontAwesome name="user" size={16} color="#6A707C" />
                        </View>
                      )}
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
                        <Text style={{ fontSize: 12, color: '#6A707C' }}>@{item.username}</Text>
                      </View>
                      {selectedUser?.id === item.id && (
                        <FontAwesome name="check-circle" size={24} color="#E10600" />
                      )}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={{ padding: 40, alignItems: 'center' }}>
                      {loading ? (
                        <ActivityIndicator size="large" color="#E10600" />
                      ) : (
                        <>
                          <FontAwesome name="search" size={40} color="#D1D5DB" />
                          <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>
                            {searchQuery ? 'No friends found' : 'No friends available'}
                          </Text>
                        </>
                      )}
                    </View>
                  }
                />

                <TouchableOpacity
                  style={{
                    backgroundColor: selectedUser ? '#E10600' : '#D1D5DB',
                    paddingVertical: 16,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginTop: 16,
                  }}
                  onPress={handleCreateInvite}
                  disabled={!selectedUser || creating}
                >
                  {creating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                      Send Invitation
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          /* Invite Link Created View */
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <FontAwesome name="check-circle" size={64} color="#10B981" style={{ marginBottom: 24 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#1F2937' }}>
              Invite Link Created!
            </Text>
            <Text style={{ fontSize: 14, color: '#6A707C', textAlign: 'center', marginBottom: 24 }}>
              The link has been shared. You can share it again or copy it below.
            </Text>

            <View style={{ width: '100%', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 16, borderRadius: 8, marginBottom: 12 }}>
                <Text style={{ flex: 1, fontSize: 14, color: '#1F2937' }} numberOfLines={2}>{inviteLink}</Text>
                <TouchableOpacity onPress={handleCopyLink} style={{ marginLeft: 12 }}>
                  <FontAwesome name="copy" size={20} color="#E10600" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#E10600',
                  paddingVertical: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
                onPress={() => handleShareLink()}
              >
                <FontAwesome name="share" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  Share Link Again
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{
                paddingVertical: 12,
                paddingHorizontal: 24,
              }}
              onPress={() => {
                setInviteLink(null);
                onClose();
              }}
            >
              <Text style={{ color: '#E10600', fontSize: 16, fontWeight: '600' }}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
