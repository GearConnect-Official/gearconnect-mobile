import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import SharedConversationScreen from '@/components/messaging/SharedConversationScreen';
import chatService from '@/services/chatService';
import { UserStatus, UserStatusDisplay } from '@/types/userStatus';
import MuteModal, { MuteDuration } from '@/components/messaging/MuteModal';
import { TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import theme from '@/styles/config/theme';
import { conversationScreenStyles as styles } from '@/styles/screens';

// UI display type for status
type UserStatusDisplayType = 'Online' | 'Offline' | 'Do not disturb';

const mapApiStatusToDisplay = (apiStatus: UserStatus): UserStatusDisplayType => {
  return UserStatusDisplay[apiStatus].label as UserStatusDisplayType;
};

const getStatusColor = (status: UserStatusDisplayType): string => {
  for (const value of Object.values(UserStatusDisplay)) {
    if (value.label === status) {
      return value.color;
    }
  }
  return '#E10600';
};

const getStatusText = (status: UserStatusDisplayType): string => {
  return status;
};

export default function ConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth() || {};

  const conversationId = params.conversationId as string;
  const conversationName = params.conversationName as string || 'Conversation';
  const currentUserId = user?.id ? parseInt(user.id.toString()) : undefined;

  const [userStatus, setUserStatus] = useState<UserStatusDisplayType>('Offline');
  const [showMuteModal, setShowMuteModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Load participant status
  const loadParticipantStatus = useCallback(async () => {
    if (!conversationId || !currentUserId) return;

    try {
      const conversationIdNum = parseInt(conversationId);
      if (isNaN(conversationIdNum)) return;

      const statusData = await chatService.getParticipantStatus(conversationIdNum, currentUserId);
      const mappedStatus = mapApiStatusToDisplay(statusData.status as UserStatus);
      setUserStatus(mappedStatus);
    } catch (error) {
      console.error('Error loading participant status:', error);
      setUserStatus('Offline');
    }
  }, [conversationId, currentUserId]);

  // Refresh participant status periodically
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    loadParticipantStatus();

    const interval = setInterval(() => {
      loadParticipantStatus();
    }, 30 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [conversationId, currentUserId, loadParticipantStatus]);

  if (!currentUserId || !conversationId) {
    return null;
  }

  return (
    <SharedConversationScreen
      type="dm"
      conversationId={conversationId}
      conversationName={conversationName}
      currentUserId={currentUserId}
      headerSubtitle={getStatusText(userStatus)}
      headerSubtitleColor={getStatusColor(userStatus)}
      renderHeaderActions={() => (
        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={() => setShowMuteModal(true)}
          activeOpacity={0.7}
        >
          <FontAwesome name={isMuted ? "volume-off" : "volume-up"} size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      )}
      renderAdditionalModals={() => (
        <MuteModal
          visible={showMuteModal}
          onClose={() => setShowMuteModal(false)}
          onSelectDuration={async (duration: MuteDuration) => {
            if (!conversationId || !currentUserId) return;
            try {
              const conversationIdNum = parseInt(conversationId);
              await chatService.muteConversation(conversationIdNum, currentUserId, duration);
              setIsMuted(true);
            } catch (error) {
              console.error('Error muting conversation:', error);
            }
          }}
          isMuted={isMuted}
          onUnmute={async () => {
            if (!conversationId || !currentUserId) return;
            try {
              const conversationIdNum = parseInt(conversationId);
              await chatService.unmuteConversation(conversationIdNum, currentUserId);
              setIsMuted(false);
            } catch (error) {
              console.error('Error unmuting conversation:', error);
            }
          }}
        />
      )}
      onBack={() => router.back()}
    />
  );
}
