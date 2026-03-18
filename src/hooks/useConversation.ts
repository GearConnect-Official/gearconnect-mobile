import { useState, useRef, useCallback, useEffect } from 'react';
import { Alert, AppState } from 'react-native';
import chatService, { Message as ApiMessage } from '@/services/chatService';
import groupService from '@/services/groupService';
import { UserStatus } from '@/types/userStatus';

export type Message = ApiMessage & {
  isOwn?: boolean;
};

export type ConversationType = 'dm' | 'group';

export interface UseConversationProps {
  type: ConversationType;
  conversationId?: string;
  groupId?: string;
  currentUserId: number;
  group?: any; // GroupDetails for groups
}

export interface UseConversationReturn {
  messages: Message[];
  loading: boolean;
  sending: boolean;
  newMessage: string;
  setNewMessage: (message: string) => void;
  replyingTo: Message | null;
  setReplyingTo: (message: Message | null) => void;
  highlightedMessageId: number | null;
  setHighlightedMessageId: (id: number | null) => void;
  selectedMessage: Message | null;
  setSelectedMessage: (message: Message | null) => void;
  audioDurations: { [key: number]: number };
  setAudioDurations: React.Dispatch<React.SetStateAction<{ [key: number]: number }>>;
  audioPositions: { [key: number]: number };
  setAudioPositions: React.Dispatch<React.SetStateAction<{ [key: number]: number }>>;
  isScrolledToBottom: boolean;
  setIsScrolledToBottom: (value: boolean) => void;
  hasScrolledInitially: boolean;
  setHasScrolledInitially: (value: boolean) => void;
  loadMessages: (forceReload?: boolean) => Promise<void>;
  sendMessage: (content: string, messageType?: string, replyToId?: number) => Promise<void>;
  updateMessage: (messageId: number, content: string) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  loadPollVotes: (messages: Message[]) => Promise<Message[]>;
  flatListRef: React.RefObject<any>;
  messageRefs: React.MutableRefObject<{ [key: number]: any }>;
  loadedIdRef: React.MutableRefObject<string | null>;
}

export const useConversation = ({
  type,
  conversationId,
  groupId,
  currentUserId,
  group,
}: UseConversationProps): UseConversationReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [audioDurations, setAudioDurations] = useState<{ [key: number]: number }>({});
  const [audioPositions, setAudioPositions] = useState<{ [key: number]: number }>({});
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [hasScrolledInitially, setHasScrolledInitially] = useState(false);
  const flatListRef = useRef<any>(null);
  const messageRefs = useRef<{ [key: number]: any }>({});
  const loadedIdRef = useRef<string | null>(null);

  // Load poll votes for all poll messages
  const loadPollVotes = useCallback(async (messages: Message[]): Promise<Message[]> => {
    if (!currentUserId) return messages;

    const pollMessages = messages.filter(msg => msg.content?.startsWith('POLL:'));
    if (pollMessages.length === 0) return messages;

    try {
      const votesPromises = pollMessages.map(async (msg) => {
        try {
          const votesData = await chatService.getPollVotes(msg.id, currentUserId);
          return { messageId: msg.id, votesData };
        } catch (error) {
          console.error(`Error loading votes for poll ${msg.id}:`, error);
          return { messageId: msg.id, votesData: null };
        }
      });

      const votesResults = await Promise.all(votesPromises);
      const votesMap = new Map(votesResults.map(r => [r.messageId, r.votesData]));

      // Update messages with votes
      return messages.map(msg => {
        if (msg.content?.startsWith('POLL:')) {
          const votesData = votesMap.get(msg.id);
          if (votesData) {
            return {
              ...msg,
              pollVotes: votesData.votes || [],
              pollUserVotes: votesData.userVotes || [],
            };
          }
        }
        return msg;
      });
    } catch (error) {
      console.error('Error loading poll votes:', error);
      return messages;
    }
  }, [currentUserId]);

  const loadMessages = useCallback(async (forceReload = false) => {
    if (!currentUserId) return;
    if (type === 'dm' && !conversationId) return;
    if (type === 'group' && (!groupId || !group)) return;

    const id = type === 'dm' ? conversationId! : groupId!;

    // Reset loaded ref if id changed
    if (loadedIdRef.current !== id) {
      loadedIdRef.current = null;
    }

    // Skip reload if already loaded and we're not forcing a reload
    if (!forceReload && loadedIdRef.current === id) {
      return; // Already loaded, skip
    }

    try {
      setLoading(true);
      const idNum = parseInt(id);
      if (isNaN(idNum)) {
        Alert.alert('Error', `Invalid ${type === 'dm' ? 'conversation' : 'group'} ID`);
        return;
      }

      let response: ApiMessage[];
      if (type === 'dm') {
        response = await chatService.getMessages(idNum, currentUserId);
      } else {
        response = await groupService.getGroupMessages(idNum, currentUserId);
      }

      let formattedMessages: Message[] = [];
      if (response && Array.isArray(response)) {
        formattedMessages = response.map((msg: ApiMessage) => {
          const isOwnMessage = msg.sender.id === currentUserId;
          return {
            ...msg,
            isOwn: isOwnMessage,
          };
        });
      }

      // Read receipts are already included in backend response, just ensure they're set
      formattedMessages = formattedMessages.map(msg => {
        if (msg.sender.id === currentUserId && !msg.readReceipts) {
          return {
            ...msg,
            readReceipts: [],
          };
        }
        return msg;
      });

      // Load poll votes
      const messagesWithVotes = await loadPollVotes(formattedMessages);
      setMessages(messagesWithVotes);
      loadedIdRef.current = id; // Mark as loaded
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [type, conversationId, groupId, currentUserId, group, loadPollVotes]);

  const sendMessage = useCallback(async (
    content: string,
    messageType: string = 'TEXT',
    replyToId?: number
  ) => {
    if (!content.trim() || !currentUserId) return;
    if (type === 'dm' && !conversationId) return;
    if (type === 'group' && (!groupId || !group)) return;

    const id = type === 'dm' ? conversationId! : groupId!;
    const idNum = parseInt(id);

    if (isNaN(idNum)) {
      Alert.alert('Error', `Invalid ${type === 'dm' ? 'conversation' : 'group'} ID`);
      return;
    }

    setSending(true);
    try {
      let sentMessage: ApiMessage;
      if (type === 'dm') {
        sentMessage = await chatService.sendMessage(idNum, content, currentUserId, messageType as any, replyToId);
      } else {
        sentMessage = await groupService.sendGroupMessage(idNum, content, currentUserId, messageType as any, replyToId);
      }

      if (sentMessage) {
        const newMsg: Message = {
          ...sentMessage,
          isOwn: sentMessage.sender.id === currentUserId,
        };
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        setReplyingTo(null);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [type, conversationId, groupId, currentUserId, group]);

  const updateMessage = useCallback(async (messageId: number, content: string) => {
    if (!currentUserId) return;

    try {
      const updatedMessage = await chatService.updateMessage(messageId, content, currentUserId);
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...updatedMessage, isOwn: updatedMessage.sender.id === currentUserId }
          : msg
      ));
    } catch (error: any) {
      console.error('Error updating message:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update message');
    }
  }, [currentUserId]);

  const deleteMessage = useCallback(async (messageId: number) => {
    if (!currentUserId) return;

    try {
      const deletedMessage = await chatService.deleteMessage(messageId, currentUserId);
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...deletedMessage, isOwn: deletedMessage.sender.id === currentUserId }
          : msg
      ));
    } catch (error: any) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to delete message');
    }
  }, [currentUserId]);

  // Update user's own status to ONLINE when component mounts and on activity
  useEffect(() => {
    if (!currentUserId) return;

    const updateOwnStatus = async (status: UserStatus = UserStatus.ONLINE) => {
      try {
        await chatService.updateUserStatus(currentUserId, status);
      } catch (error) {
        console.error('Error updating own status:', error);
      }
    };

    // Update status to ONLINE on mount
    updateOwnStatus(UserStatus.ONLINE);

    // Update status periodically (every 2 minutes) to keep user online
    const interval = setInterval(() => updateOwnStatus(UserStatus.ONLINE), 2 * 60 * 1000);

    // Update status when app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        updateOwnStatus(UserStatus.ONLINE);
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [currentUserId]);

  // Mark conversation/group as read when opening
  useEffect(() => {
    if (!currentUserId) return;
    const id = type === 'dm' ? conversationId : groupId;
    if (!id) return;

    const shouldReload = loadedIdRef.current !== id;
    if (!shouldReload) return;

    const markAsRead = async () => {
      try {
        const idNum = parseInt(id);
        if (type === 'dm') {
          await chatService.markConversationAsRead(idNum, currentUserId);
        } else {
          await groupService.markGroupAsRead(idNum, currentUserId);
        }
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    };
    markAsRead();
  }, [type, conversationId, groupId, currentUserId]);

  return {
    messages,
    loading,
    sending,
    newMessage,
    setNewMessage,
    replyingTo,
    setReplyingTo,
    highlightedMessageId,
    setHighlightedMessageId,
    selectedMessage,
    setSelectedMessage,
    audioDurations,
    setAudioDurations,
    audioPositions,
    setAudioPositions,
    isScrolledToBottom,
    setIsScrolledToBottom,
    hasScrolledInitially,
    setHasScrolledInitially,
    loadMessages,
    sendMessage,
    updateMessage,
    deleteMessage,
    loadPollVotes,
    flatListRef,
    messageRefs,
    loadedIdRef,
  };
};
