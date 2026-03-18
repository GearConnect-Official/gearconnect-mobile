import chatService, { Conversation } from '@/services/chatService';

export interface NotificationCounts {
  unreadMessages: number;
  pendingRequests: number;
  commercialMessages: number;
  total: number;
}

/**
 * Get total notification count for messaging
 * Includes: unread messages (DM + groups), pending requests, commercial conversations
 */
export const getMessagingNotificationCount = async (userId: number): Promise<NotificationCounts> => {
  try {
    const response = await chatService.getConversations(userId);

    if (!response) {
      return { unreadMessages: 0, pendingRequests: 0, commercialMessages: 0, total: 0 };
    }

    // Count unread messages in conversations (DM + groups)
    // Exclude muted conversations
    let unreadMessages = 0;
    [...(response.conversations || []), ...(response.commercial || [])].forEach((conv: Conversation) => {
      const userParticipant = conv.participants.find(p => p.user.id === userId);
      if (!userParticipant) return;

      // Check if conversation is muted
      const mutedUntil = (userParticipant as any).mutedUntil;
      if (mutedUntil) {
        const mutedUntilDate = new Date(mutedUntil);
        const now = new Date();
        if (mutedUntilDate > now) {
          return;
        }
      }

      if (!userParticipant.lastReadAt) {
        unreadMessages += conv.messages.length;
      } else {
        const lastReadDate = new Date(userParticipant.lastReadAt);
        unreadMessages += conv.messages.filter(msg => {
          const msgDate = new Date(msg.createdAt);
          return msgDate > lastReadDate && msg.sender.id !== userId;
        }).length;
      }
    });

    // Count pending requests (only received pending requests)
    const pendingRequests = response.requests?.filter((r: any) => {
      const status = (r.status || '').toString().toUpperCase();
      return r.isReceived && status === 'PENDING';
    }).length || 0;

    // Count unread commercial messages
    let commercialMessages = 0;
    (response.commercial || []).forEach((conv: Conversation) => {
      const userParticipant = conv.participants.find(p => p.user.id === userId);
      if (!userParticipant) return;

      const mutedUntil = (userParticipant as any).mutedUntil;
      if (mutedUntil) {
        const mutedUntilDate = new Date(mutedUntil);
        const now = new Date();
        if (mutedUntilDate > now) {
          return;
        }
      }

      if (!userParticipant.lastReadAt) {
        commercialMessages += conv.messages.length;
      } else {
        const lastReadDate = new Date(userParticipant.lastReadAt);
        commercialMessages += conv.messages.filter(msg => {
          const msgDate = new Date(msg.createdAt);
          return msgDate > lastReadDate && msg.sender.id !== userId;
        }).length;
      }
    });

    const total = unreadMessages + pendingRequests + commercialMessages;

    return {
      unreadMessages,
      pendingRequests,
      commercialMessages,
      total,
    };
  } catch {

    return { unreadMessages: 0, pendingRequests: 0, commercialMessages: 0, total: 0 };
  }
};
