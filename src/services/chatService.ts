import axios from 'axios';
import { API_URL_MESSAGING } from '@/config';
import { UserStatus } from '@/types/userStatus.types';

// Types for messaging
export interface MessageUser {
  id: number;
  name: string;
  username: string;
  profilePicture?: string;
  profilePicturePublicId?: string;
  isVerify: boolean;
  status?: 'ONLINE' | 'OFFLINE' | 'DO_NOT_DISTURB';
  lastSeenAt?: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: {
    id: number;
    name: string;
    username?: string;
  }[];
  currentUserReacted?: boolean;
}

export interface MessageReadReceipt {
  id: number;
  userId: number;
  user: {
    id: number;
    name: string;
    username: string;
    profilePicture?: string;
    profilePicturePublicId?: string;
  };
  readAt: string;
}

export interface Message {
  id: number;
  content: string;
  sender: MessageUser;
  createdAt: string;
  updatedAt?: string;
  messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';
  isEdited?: boolean;
  reactions?: MessageReaction[];
  readReceipts?: MessageReadReceipt[];
  replyTo?: {
    id: number;
    content: string;
    sender: {
      name: string;
      username: string;
    };
  };
}

export interface ConversationParticipant {
  user: MessageUser;
  joinedAt: string;
  lastReadAt?: string;
  isAdmin?: boolean;
}

export interface Conversation {
  id: number;
  name?: string;
  isGroup: boolean;
  isCommercial?: boolean;
  isFavorite?: boolean;
  participants: ConversationParticipant[];
  messages: Message[];
  updatedAt: string;
  createdAt: string;
  isRequest?: boolean;
  requestStatus?: 'pending' | 'accepted' | 'rejected';
  requesterId?: number;
}

export interface MessageRequest {
  id: number;
  senderId: number;
  recipientId: number;
  from: MessageUser;
  to: MessageUser;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  isReceived?: boolean;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  requests: MessageRequest[];
  commercial: Conversation[];
}

const chatService = {
  /**
   * Get all conversations (normal, requests, commercial)
   */
  getConversations: async (userId?: number) => {
    const endpoint = `${API_URL_MESSAGING}/conversations`;
    const params = userId ? { userId } : {};
    const response = await axios.get(endpoint, { params });
    return response.data;
  },

  /**
   * Get messages for a conversation
   */
  getMessages: async (
    conversationId: number,
    userId?: number,
    page: number = 1,
    limit: number = 20
  ) => {
    const endpoint = `${API_URL_MESSAGING}/conversations/${conversationId}/messages`;
    const params: any = { page, limit };
    if (userId) {
      params.userId = userId;
    }
    try {
      const response = await axios.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  },

  /**
   * Send a message in a conversation
   */
  sendMessage: async (
    conversationId: number,
    content: string,
    userId?: number,
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' = 'TEXT',
    replyToId?: number
  ) => {
    const endpoint = `${API_URL_MESSAGING}/conversations/${conversationId}/messages`;
    try {
      const response = await axios.post(endpoint, {
          content,
          messageType,
        userId,
        replyToId,
      });
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  /**
   * Update a message
   */
  updateMessage: async (
    messageId: number,
    content: string,
    userId?: number
  ) => {
    const endpoint = `${API_URL_MESSAGING}/messages/${messageId}`;
    try {
      const response = await axios.put(endpoint, {
        content,
        userId,
      });
      return response.data;
    } catch {
      console.log("Error updating message:");
    }
  },

  /**
   * Add or toggle a reaction on a message
   */
  toggleReaction: async (
    messageId: number,
    emoji: string,
    userId?: number
  ) => {
    const endpoint = `${API_URL_MESSAGING}/messages/${messageId}/reactions`;
    try {
      const response = await axios.post(endpoint, {
        emoji,
        userId,
      });
      return response.data;
    } catch (error) {
      console.error("Error toggling reaction:", error);
      throw error;
    }
  },

  /**
   * Get reactions for a message
   */
  getMessageReactions: async (messageId: number, userId?: number) => {
    const endpoint = `${API_URL_MESSAGING}/messages/${messageId}/reactions`;
    try {
      const params = userId ? { userId } : {};
      const response = await axios.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error("Error getting reactions:", error);
      throw error;
    }
  },

  /**
   * Create a new conversation or send a message request
   */
  createConversation: async (
    participantIds: number[],
    userId?: number
  ) => {
    const endpoint = `${API_URL_MESSAGING}/conversations`;
    try {
      const response = await axios.post(endpoint, {
          participantIds,
          isGroup: participantIds.length > 1,
        userId,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  },

  /**
   * Send a message request to a user who doesn't follow us back
   */
  sendMessageRequest: async (
    recipientId: number,
    userId?: number,
    message?: string
  ) => {
    const endpoint = `${API_URL_MESSAGING}/requests`;
    try {
      const response = await axios.post(endpoint, {
          recipientId,
          message,
        userId,
      });
      return response.data;
    } catch (error) {
      console.error("Error sending message request:", error);
      throw error;
    }
  },

  /**
   * Accept a message request
   */
  acceptRequest: async (
    requestId: number,
    userId?: number
  ) => {
    const endpoint = `${API_URL_MESSAGING}/requests/${requestId}/accept`;
    try {
      const response = await axios.post(endpoint, { userId });
      return response.data;
    } catch (error) {
      console.error("Error accepting request:", error);
      throw error;
    }
  },

  /**
   * Reject a message request
   */
  rejectRequest: async (
    requestId: number,
    userId?: number
  ) => {
    const endpoint = `${API_URL_MESSAGING}/requests/${requestId}/reject`;
    try {
      await axios.post(endpoint, { userId });
    } catch (error) {
      console.error("Error rejecting request:", error);
      throw error;
    }
  },

  /**
   * Search users for messaging
   */
  searchUsers: async (
    query: string,
    userId?: number
  ) => {
    const endpoint = `${API_URL_MESSAGING}/users/search`;
    const params: any = { q: query };
    if (userId) {
      params.userId = userId;
    }
    try {
      const response = await axios.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  },

  /**
   * Get all users with mutual follow (friends)
   */
  getFriends: async (userId?: number) => {
    const endpoint = `${API_URL_MESSAGING}/friends`;
    const params = userId ? { userId } : {};
    try {
      const response = await axios.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching friends:", error);
      throw error;
    }
  },

  /**
   * Check if two users follow each other
   */
  checkMutualFollow: async (
    userId: number,
    targetUserId: number
  ) => {
    const endpoint = `${API_URL_MESSAGING}/check-follow/${targetUserId}`;
    const params = { userId };
    try {
      const response = await axios.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error("Error checking follow status:", error);
      throw error;
    }
  },

  /**
   * Toggle favorite status of a conversation
   */
  toggleFavorite: async (conversationId: number, userId: number) => {
    const endpoint = `${API_URL_MESSAGING}/conversations/${conversationId}/favorite`;
    try {
      const response = await axios.put(endpoint, { userId });
      return response.data;
    } catch (error) {
      console.error("Error toggling favorite:", error);
      throw error;
    }
  },

  /**
   * Delete a conversation (remove participant)
   */
  deleteConversation: async (conversationId: number, userId: number) => {
    const endpoint = `${API_URL_MESSAGING}/conversations/${conversationId}`;
    try {
      const response = await axios.delete(endpoint, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  },

  /**
   * Delete a message
   */
  deleteMessage: async (messageId: number, userId: number) => {
    const endpoint = `${API_URL_MESSAGING}/messages/${messageId}`;
    try {
      const response = await axios.delete(endpoint, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  },

  /**
   * Vote on a poll option
   */
  votePoll: async (messageId: number, optionId: string, userId: number) => {
    const endpoint = `${API_URL_MESSAGING}/polls/${messageId}/vote`;
    try {
      const response = await axios.post(endpoint, {
        optionId,
        userId
      });
      return response.data;
    } catch (error) {
      console.error("Error voting on poll:", error);
      throw error;
    }
  },

  /**
   * Get votes for a poll
   */
  getPollVotes: async (messageId: number, userId?: number) => {
    const endpoint = `${API_URL_MESSAGING}/polls/${messageId}/votes`;
    const params = userId ? { userId } : {};
    try {
      const response = await axios.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error("Error getting poll votes:", error);
      throw error;
    }
  },

  /**
   * Get user status
   */
  getUserStatus: async (userId: number, currentUserId?: number) => {
    const endpoint = `${API_URL_MESSAGING}/users/${userId}/status`;
    const params = currentUserId ? { userId: currentUserId } : {};
    try {
      const response = await axios.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error("Error getting user status:", error);
      throw error;
    }
  },

  /**
   * Update user status
   */
  updateUserStatus: async (userId: number, status: UserStatus) => {
    const endpoint = `${API_URL_MESSAGING}/users/${userId}/status`;
    try {
      const response = await axios.put(endpoint, {
        userId,
        status
      });
      return response.data;
    } catch (error) {
      console.error("Error updating user status:", error);
      throw error;
    }
  },

  /**
   * Get other participant's status in a conversation
   */
  getParticipantStatus: async (conversationId: number, userId: number) => {
    const endpoint = `${API_URL_MESSAGING}/conversations/${conversationId}/participant-status`;
    const params = { userId };
    try {
      const response = await axios.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error("Error getting participant status:", error);
      throw error;
    }
  },

  /**
   * Mute a conversation
   */
  muteConversation: async (conversationId: number, userId: number, duration: '15min' | '1h' | '3h' | '8h' | '24h' | 'forever') => {
    try {
      const response = await axios.put(
        `${API_URL_MESSAGING}/conversations/${conversationId}/mute`,
        { duration },
        { params: { userId } }
      );
      return response.data;
    } catch (error) {
      console.error('Error muting conversation:', error);
      throw error;
    }
  },

  /**
   * Unmute a conversation
   */
  unmuteConversation: async (conversationId: number, userId: number) => {
    try {
      const response = await axios.put(
        `${API_URL_MESSAGING}/conversations/${conversationId}/unmute`,
        {},
        { params: { userId } }
      );
      return response.data;
    } catch (error) {
      console.error('Error unmuting conversation:', error);
      throw error;
    }
  },

  /**
   * Mark conversation as read (update lastReadAt)
   */
  markConversationAsRead: async (conversationId: number, userId: number) => {
    try {
      const response = await axios.put(
        `${API_URL_MESSAGING}/conversations/${conversationId}/read`,
        {},
        { params: { userId } }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  },

  /**
   * Mark a message as read (read receipt)
   */
  markMessageAsRead: async (messageId: number, userId: number) => {
    try {
      const response = await axios.post(
        `${API_URL_MESSAGING}/messages/${messageId}/read`,
        { userId }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },

  /**
   * Mark multiple messages as read (batch read receipts)
   */
  markMessagesAsRead: async (messageIds: number[], userId: number) => {
    try {
      const response = await axios.post(
        `${API_URL_MESSAGING}/messages/batch-read`,
        { messageIds, userId }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  /**
   * Get read receipts for a message
   */
  getMessageReads: async (messageId: number, userId: number) => {
    try {
      const response = await axios.get(
        `${API_URL_MESSAGING}/messages/${messageId}/reads`,
        { params: { userId } }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting message reads:', error);
      throw error;
    }
  },
};

export default chatService;
