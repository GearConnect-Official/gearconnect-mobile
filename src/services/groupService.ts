import axios from 'axios';
import { API_BASE_URL } from '@/config';

// Types for groups
export interface GroupUser {
  id: number;
  name: string;
  username: string;
  profilePicture?: string;
  profilePicturePublicId?: string;
  isVerify: boolean;
  status?: 'ONLINE' | 'OFFLINE' | 'DO_NOT_DISTURB';
  lastSeenAt?: string;
}

export interface GroupMember {
  id: number;
  user: GroupUser;
  nickname?: string;
  joinedAt: string;
  lastActiveAt?: string;
  roles: {
    role: {
      id: number;
      name: string;
      color?: string;
      position: number;
    };
  }[];
}

export interface GroupChannel {
  id: number;
  name: string;
  description?: string;
  type: 'TEXT' | 'VOICE' | 'ANNOUNCEMENT';
  position: number;
  isPrivate: boolean;
  _count: {
    messages: number;
  };
}

export interface GroupCategory {
  id: number;
  name: string;
  position: number;
  channels: GroupChannel[];
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  iconPublicId?: string;
  isPublic: boolean;
  eventId?: number;
  owner: GroupUser;
  members: GroupMember[];
  channels: GroupChannel[];
  categories?: GroupCategory[];
  _count: {
    members: number;
  };
  createdAt: string;
}

export interface GroupDetails extends Group {
  roles: {
    id: number;
    name: string;
    color?: string;
    position: number;
  }[];
}

export interface ChannelMessage {
  id: number;
  content: string;
  sender: GroupUser;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  isEdited: boolean;
  isPinned: boolean;
  replyTo?: {
    id: number;
    content: string;
    sender: {
      name: string;
      username: string;
    };
  };
  reactions: {
    emoji: string;
    count: number;
    users: { id: number; name: string }[];
  }[];
  createdAt: string;
  updatedAt: string;
}

const groupService = {
  getGroups: async (userId?: number): Promise<Group[]> => {
    const endpoint = `${API_BASE_URL}/groups`;
    const params = userId ? { userId } : {};
    try {
      const response = await axios.get(endpoint, { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  },

  getGroupDetails: async (groupId: number, userId?: number): Promise<GroupDetails> => {
    const endpoint = `${API_BASE_URL}/groups/${groupId}`;
    const params = userId ? { userId } : {};
    try {
      const response = await axios.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching group details:', error);
      throw error;
    }
  },

  createGroup: async (
    name: string,
    userId?: number,
    memberIds?: number[]
  ): Promise<Group> => {
    const endpoint = `${API_BASE_URL}/groups`;
    try {
      const response = await axios.post(endpoint, {
        name,
        userId,
        memberIds,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  },

  joinGroup: async (inviteCode: string, userId?: number): Promise<{ group: Group; member: GroupMember }> => {
    const endpoint = `${API_BASE_URL}/groups/join/${inviteCode}`;
    try {
      const response = await axios.post(endpoint, { userId });
      return response.data;
    } catch (error) {
      console.error('Error joining group:', error);
      throw error;
    }
  },

  createChannel: async (
    groupId: number,
    name: string,
    description?: string,
    type: 'TEXT' | 'VOICE' | 'ANNOUNCEMENT' = 'TEXT',
    userId?: number
  ): Promise<GroupChannel> => {
    const endpoint = `${API_BASE_URL}/groups/${groupId}/channels`;
    try {
      const response = await axios.post(endpoint, {
        name,
        description,
        type,
        userId,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  },

  getChannelMessages: async (
    groupId: number,
    channelId: number,
    userId?: number,
    page: number = 1,
    limit: number = 50
  ): Promise<ChannelMessage[]> => {
    const endpoint = `${API_BASE_URL}/groups/${groupId}/channels/${channelId}/messages`;
    const params: any = { page, limit };
    if (userId) {
      params.userId = userId;
    }
    try {
      const response = await axios.get(endpoint, { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching channel messages:', error);
      throw error;
    }
  },

  sendChannelMessage: async (
    groupId: number,
    channelId: number,
    content: string,
    userId?: number,
    replyToId?: number
  ): Promise<ChannelMessage> => {
    const endpoint = `${API_BASE_URL}/groups/${groupId}/channels/${channelId}/messages`;
    try {
      const response = await axios.post(endpoint, {
        content,
        userId,
        replyToId,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  getGroupMessages: async (
    groupId: number,
    userId?: number
  ): Promise<any[]> => {
    const endpoint = `${API_BASE_URL}/groups/${groupId}/messages`;
    const params: any = {};
    if (userId) {
      params.userId = userId;
    }
    try {
      const response = await axios.get(endpoint, { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching group messages:', error);
      throw error;
    }
  },

  sendGroupMessage: async (
    groupId: number,
    content: string,
    userId?: number,
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' = 'TEXT',
    replyToId?: number
  ): Promise<any> => {
    const endpoint = `${API_BASE_URL}/groups/${groupId}/messages`;
    try {
      const response = await axios.post(endpoint, {
        content,
        userId,
        messageType,
        replyToId,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending group message:', error);
      throw error;
    }
  },

  createInvite: async (
    groupId: number,
    userId: number,
    options?: {
      maxUses?: number;
      expiresInDays?: number | null;
      recipientId?: number;
    }
  ): Promise<{ code: string; expiresAt?: string }> => {
    const endpoint = `${API_BASE_URL}/groups/${groupId}/invite`;
    try {
      const response = await axios.post(endpoint, {
        userId,
        maxUses: options?.maxUses,
        expiresInDays: options?.expiresInDays,
        recipientId: options?.recipientId,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating invite:', error);
      throw error;
    }
  },

  deleteGroup: async (
    groupId: number,
    userId?: number
  ): Promise<void> => {
    const endpoint = `${API_BASE_URL}/groups/${groupId}`;
    const params: any = {};
    if (userId) {
      params.userId = userId;
    }
    try {
      await axios.delete(endpoint, { params });
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  },

  addMembers: async (groupId: number, memberIds: number[], userId?: number): Promise<any> => {
    const endpoint = `${API_BASE_URL}/groups/${groupId}/members`;
    try {
      const response = await axios.post(endpoint, {
        memberIds,
        userId,
      });
      return response.data;
    } catch (error) {
      console.error('Error adding members:', error);
      throw error;
    }
  },

  removeMember: async (groupId: number, memberId: number, userId: number): Promise<void> => {
    const endpoint = `${API_BASE_URL}/groups/${groupId}/members/${memberId}`;
    try {
      await axios.delete(endpoint, {
        params: { userId },
      });
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  },

  muteGroup: async (groupId: number, userId: number, duration: '15min' | '1h' | '3h' | '8h' | '24h' | 'forever') => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/groups/${groupId}/mute`,
        { duration },
        { params: { userId } }
      );
      return response.data;
    } catch (error) {
      console.error('Error muting group:', error);
      throw error;
    }
  },

  unmuteGroup: async (groupId: number, userId: number) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/groups/${groupId}/unmute`,
        {},
        { params: { userId } }
      );
      return response.data;
    } catch (error) {
      console.error('Error unmuting group:', error);
      throw error;
    }
  },

  markGroupAsRead: async (groupId: number, userId: number) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/groups/${groupId}/read`,
        {},
        { params: { userId } }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking group as read:', error);
      throw error;
    }
  },
};

export default groupService;
