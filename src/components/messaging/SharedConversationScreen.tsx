import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Pressable,
  Keyboard,
  Modal,
  Animated,
  ScrollView,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import theme from '@/theme';
import { conversationScreenStyles as styles } from '@/styles/screens';
import chatService, { Message as ApiMessage } from '@/services/chatService';
import groupService from '@/services/groupService';
// Polling version - WebSocket import removed
import { VerifiedAvatar } from '@/components/media/VerifiedAvatar';
import AttachmentMenu from './AttachmentMenu';
import VoiceRecorder from './VoiceRecorder';
import AudioMessagePlayer from './AudioMessagePlayer';
import MediaCarousel from './MediaCarousel';
import ContactCard, { ContactData } from './ContactCard';
import PollCard, { PollWithVotes, PollVote } from './PollCard';
import PollCreator, { PollData } from './PollCreator';
import DocumentCard, { DocumentData } from './DocumentCard';
import LocationCard, { LocationData } from './LocationCard';
import AppointmentCard, { AppointmentData } from './AppointmentCard';
import AppointmentCreator from './AppointmentCreator';
import GroupInviteCard, { GroupInviteData } from './GroupInviteCard';
import * as DocumentPicker from 'expo-document-picker';
import { UserStatus, UserStatusDisplay } from '@/types/userStatus.types';
import MuteModal, { MuteDuration } from './MuteModal';
import { useAuth } from '@/context/AuthContext';
import { cloudinaryService } from '@/services/cloudinary.service';

// Polling interval in milliseconds (3 seconds for near real-time feel)
const POLLING_INTERVAL = 3000;

// Extended Message type with isOwn property for UI
type Message = ApiMessage & {
  isOwn?: boolean;
};

// UI display type for status
type UserStatusDisplayType = 'Online' | 'Offline' | 'Do not disturb';

const mapApiStatusToDisplay = (apiStatus: UserStatus): UserStatusDisplayType => {
  return UserStatusDisplay[apiStatus].label as UserStatusDisplayType;
};

export interface SharedConversationScreenProps {
  type: 'dm' | 'group';
  conversationId?: string;
  groupId?: string;
  conversationName: string;
  currentUserId: number;
  headerSubtitle?: string;
  headerSubtitleColor?: string;
  renderHeaderActions?: () => React.ReactNode;
  renderAdditionalModals?: () => React.ReactNode;
  onBack?: () => void;
  onHeaderInfoPress?: () => void;
}

export default function SharedConversationScreen({
  type,
  conversationId,
  groupId,
  conversationName,
  currentUserId,
  headerSubtitle,
  headerSubtitleColor,
  renderHeaderActions,
  renderAdditionalModals,
  onBack,
  onHeaderInfoPress,
}: SharedConversationScreenProps) {
  const authContext = useAuth();
  const user = authContext && 'user' in authContext ? authContext.user : null;
  // Note: token removed - not needed for polling version
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatusDisplayType>('Offline');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [audioDurations, setAudioDurations] = useState<{ [key: number]: number }>({});
  const [audioPositions, setAudioPositions] = useState<{ [key: number]: number }>({});
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [hasScrolledInitially, setHasScrolledInitially] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editingPoll, setEditingPoll] = useState<PollData | null>(null);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentData | null>(null);
  const [showAppointmentCreator, setShowAppointmentCreator] = useState(false);
  const [showMuteModal, setShowMuteModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const messageRefs = useRef<{ [key: number]: View | null }>({});
  const messageAnimations = useRef<{ [key: number]: Animated.Value }>({});
  const loadedIdRef = useRef<string | null>(null); // Track which conversation/group is loaded
  const router = useRouter();
  
  const id = type === 'dm' ? conversationId : groupId;

  // All emojis for picker (simplified - showing most common ones)
  const allEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
    '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
    '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
    '🔥', '💯', '✨', '⭐', '🌟', '💫', '⚡', '☄️', '💥', '💢', '💨', '💦', '💤', '🎉', '🎊', '🏆', '🥇', '🥈', '🥉', '🏅',
    '🎖', '🎗', '🎫', '🎟', '🎪', '🤹', '🎭', '🩹', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻',
    '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
    '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞',
    '🐜', '🦟', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳',
    '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎',
    '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
    '🥬', '🥒', '🌶', '🌽', '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖',
    '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪',
    '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫',
    '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '🫖', '☕️', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃',
  ];

  // Get status color and text from UserStatusDisplay
  const getStatusColor = (status: UserStatusDisplayType): string => {
    // Find the UserStatus enum key that matches the display label
    for (const value of Object.values(UserStatusDisplay)) {
      if (value.label === status) {
        return value.color;
      }
    }
    return '#E10600'; // Default to red if not found
  };

  const getStatusText = (status: UserStatusDisplayType): string => {
    return status;
  };

  // Load messages from API
  // Load poll votes for all poll messages
  const loadPollVotes = useCallback(async (messages: Message[]) => {
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
    if (!id || !currentUserId) return;
    
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
      
      // Backend returns array of messages directly
      let formattedMessages: Message[] = [];
      if (response && Array.isArray(response)) {
        // Map API messages to UI format
        // isOwn = true if the message sender is the current logged-in user
        formattedMessages = response.map((msg: ApiMessage) => {
          const isOwnMessage = msg.sender.id === currentUserId;
          return {
            ...msg,
            isOwn: isOwnMessage,
          };
        });
      } else if (response && Array.isArray((response as any).messages)) {
        // Fallback if response is wrapped in an object
        formattedMessages = (response as any).messages.map((msg: ApiMessage) => {
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
  }, [id, currentUserId, loadPollVotes, type]);

  // Load participant status (only for DM)
  const loadParticipantStatus = useCallback(async () => {
    if (type !== 'dm' || !conversationId || !currentUserId) return;
    
    try {
      const conversationIdNum = parseInt(conversationId);
      if (isNaN(conversationIdNum)) return;

      const statusData = await chatService.getParticipantStatus(conversationIdNum, currentUserId);
      const mappedStatus = mapApiStatusToDisplay(statusData.status as UserStatus);
      setUserStatus(mappedStatus);
    } catch (error) {
      console.error('Error loading participant status:', error);
      // Default to offline on error
      setUserStatus('Offline');
    }
  }, [conversationId, currentUserId, type]);

  // Refresh participant status periodically (only for DM, only when conversation changes)
  useEffect(() => {
    if (type !== 'dm' || !conversationId || !currentUserId) return;

    // Only load status if conversation changed
    const shouldLoad = loadedIdRef.current !== conversationId;
    if (shouldLoad) {
      loadParticipantStatus();
    }

    // Refresh status every 30 seconds
    const interval = setInterval(() => {
      loadParticipantStatus();
    }, 30 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [conversationId, currentUserId, loadParticipantStatus, type]);

  // Load messages on mount and when id or currentUserId changes
  useEffect(() => {
    if (id && currentUserId) {
      // Only reload if id changed
      const shouldReload = loadedIdRef.current !== id;
      loadMessages(shouldReload);
      // loadParticipantStatus is already called in its own useEffect for DM, no need to call it here
      
      // Mark conversation/group as read when opening it (only if id changed)
      if (shouldReload) {
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
      }
    }
  }, [id, currentUserId, loadMessages, type]);

  // Polling: Fetch new messages periodically for real-time updates
  useEffect(() => {
    if (!id || !currentUserId) return;

    const idNum = parseInt(id);
    if (isNaN(idNum)) return;

    console.log(`🔄 Starting polling for ${type === 'dm' ? 'conversation' : 'group'}: ${idNum}`);

    // Function to fetch and merge new messages
    const pollMessages = async () => {
      try {
        let response: ApiMessage[];
        if (type === 'dm') {
          response = await chatService.getMessages(idNum, currentUserId);
        } else {
          response = await groupService.getGroupMessages(idNum, currentUserId);
        }

        if (response && Array.isArray(response)) {
          // Map API messages to UI format
          const newMessages: Message[] = response.map((msg: ApiMessage) => ({
            ...msg,
            isOwn: msg.sender.id === currentUserId,
          }));

          // Merge new messages with existing ones (avoid duplicates)
          setMessages(prev => {
            // Create a map of existing message IDs for quick lookup
            const existingIds = new Set(prev.map(m => Number(m.id)));
            
            // Find new messages that don't exist yet
            const messagesToAdd = newMessages.filter(m => !existingIds.has(Number(m.id)));
            
            // Also update existing messages (for edits, reactions, etc.)
            const updatedMessages = prev.map(existingMsg => {
              const updatedVersion = newMessages.find(m => Number(m.id) === Number(existingMsg.id));
              return updatedVersion || existingMsg;
            });

            if (messagesToAdd.length > 0) {
              console.log(`📨 Polling found ${messagesToAdd.length} new message(s)`);
              return [...updatedMessages, ...messagesToAdd];
            }
            
            return updatedMessages;
          });
        }
      } catch (error) {
        // Silent fail for polling - don't spam user with errors
        console.log('Polling error (silent):', error);
      }
    };

    // Start polling interval
    const pollInterval = setInterval(pollMessages, POLLING_INTERVAL);

    // Cleanup: stop polling when component unmounts or id changes
    return () => {
      console.log(`🛑 Stopping polling for ${type === 'dm' ? 'conversation' : 'group'}: ${idNum}`);
      clearInterval(pollInterval);
    };
  }, [id, currentUserId, type]);

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
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Optionally set to offline when app goes to background
        // For now, we keep it online but could change this behavior
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
      // Set status to offline when component unmounts (user leaves conversation)
      // Note: This might be too aggressive if user is just navigating
      // Consider removing this or making it configurable
    };
  }, [currentUserId]);

  // Scroll to bottom when new messages arrive (only if already at bottom)
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current && isScrolledToBottom) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isScrolledToBottom]);

  // Scroll to selected message when options modal opens
  useEffect(() => {
    if (showMessageOptions && selectedMessage) {
      const messageIndex = messages.findIndex(msg => msg.id === selectedMessage.id);
      if (messageIndex !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: messageIndex,
            animated: true,
            viewPosition: 0.5, // Center the message
          });
        }, 100);
      }
    }
  }, [showMessageOptions, selectedMessage, messages]);
  
  // Initial scroll to bottom on mount and when messages are loaded
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current && !loading && !hasScrolledInitially) {
      // Use a longer timeout to ensure FlatList is fully rendered
      const timeoutId = setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: false });
          setIsScrolledToBottom(true);
          setHasScrolledInitially(true);
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, loading, hasScrolledInitially]);

  // Scroll to selected message when options modal opens
  useEffect(() => {
    if (showMessageOptions && selectedMessage) {
      const messageIndex = messages.findIndex(msg => msg.id === selectedMessage.id);
      if (messageIndex !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: messageIndex,
            animated: true,
            viewPosition: 0.3, // Position message in upper part to show reactions bar
          });
        }, 100);
      }
    } else if (!showMessageOptions && selectedMessage) {
      // Reset animation when modal closes
      const anim = messageAnimations.current[selectedMessage.id];
      if (anim) {
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  }, [showMessageOptions, selectedMessage, messages]);

  // Scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
      setIsScrolledToBottom(true);
    }
  }, []);

  // Handle scroll events to detect if user is at bottom
  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const paddingToBottom = 150; // Threshold in pixels (increased for better detection)
    
    // Calculate if we're at bottom
    const scrollPosition = contentOffset.y + layoutMeasurement.height;
    const contentHeight = contentSize.height;
    const isAtBottom = scrollPosition >= contentHeight - paddingToBottom || contentHeight <= layoutMeasurement.height;
    
    setIsScrolledToBottom(isAtBottom);
  }, []);

  // Helper function to send a message (uses correct service based on type)
  const sendMessageHelper = async (
    content: string,
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' = 'TEXT',
    replyToId?: number
  ): Promise<ApiMessage | null> => {
    if (!id || !currentUserId) return null;
    
    const idNum = parseInt(id);
    if (isNaN(idNum)) {
      Alert.alert('Error', `Invalid ${type === 'dm' ? 'conversation' : 'group'} ID`);
      return null;
    }

    try {
      if (type === 'dm') {
        return await chatService.sendMessage(idNum, content, currentUserId, messageType, replyToId);
      } else {
        return await groupService.sendGroupMessage(idNum, content, currentUserId, messageType, replyToId);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to send message');
      return null;
    }
  };

  // Send a message
  const sendMessage = async () => {
    if (!newMessage.trim() || !id || !currentUserId) return;

    const messageContent = newMessage.trim();

    setSending(true);
    try {
      // If editing a message, update it instead of creating a new one
      if (editingMessage) {
        try {
          const updatedMessage = await chatService.updateMessage(
            editingMessage.id,
            messageContent,
            currentUserId
          );
          // Update local state with the updated message
        setMessages(prev => prev.map(msg => 
          msg.id === editingMessage.id 
              ? { 
                  ...updatedMessage, 
                  isOwn: updatedMessage.sender.id === currentUserId,
                  isEdited: true 
                }
            : msg
        ));
        setNewMessage('');
        setEditingMessage(null);
        setSelectedMessage(null);
        setShowMessageOptions(false);
          setShowEmojiPicker(false);
        } catch (error: any) {
          console.error('Error updating message:', error);
          Alert.alert('Error', error.response?.data?.error || 'Failed to update message');
        }
      } else {
        // Send new message
        const sentMessage = await sendMessageHelper(
          messageContent,
          'TEXT',
          replyingTo?.id
        );
      
        if (sentMessage) {
          // Add sent message to list - always mark as own since current user sent it
          const newMsg: Message = {
            ...sentMessage,
            isOwn: sentMessage.sender.id === currentUserId,
          };
          setMessages(prev => [...prev, newMsg]);
          setNewMessage('');
          setReplyingTo(null); // Clear reply after sending
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle long press on message to show options
  const handleLongPressMessage = (message: Message, event?: any) => {
    setSelectedMessage(message);
    
    // Initialize animation for this message if not exists
    if (!messageAnimations.current[message.id]) {
      messageAnimations.current[message.id] = new Animated.Value(1);
    }
    
    // Animate message bubble to scale up and highlight
    Animated.sequence([
      Animated.spring(messageAnimations.current[message.id], {
        toValue: 1.05,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(messageAnimations.current[message.id], {
        toValue: 1.02,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
    
    // Get message position for menu placement
    if (event?.nativeEvent) {
      // Try to get message dimensions from ref
      const messageRef = messageRefs.current[message.id];
      if (messageRef) {
        messageRef.measure(() => {
          setShowMessageOptions(true);
        });
      } else {
        // Fallback: estimate position
        setShowMessageOptions(true);
      }
    } else {
      setShowMessageOptions(true);
    }
  };

  // Handle reply option
  const handleReply = () => {
    if (selectedMessage) {
      setReplyingTo(selectedMessage);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
        setIsScrolledToBottom(true);
      }, 100);
    }
  };

  // Handle edit option
  const handleEditMessage = () => {
    if (selectedMessage) {
      setEditingMessage(selectedMessage);
      if (selectedMessage.content.startsWith('POLL:')) {
        // Handle poll editing
        try {
          const pollJson = selectedMessage.content.replace('POLL:', '');
          const pollData: PollData = JSON.parse(pollJson);
          setEditingPoll(pollData);
          setShowPollCreator(true);
        } catch (e) {
          console.error('Error parsing poll for edit:', e);
        }
      } else if (selectedMessage.content.startsWith('APPOINTMENT:')) {
        // Handle appointment editing
        try {
          const appointmentJson = selectedMessage.content.replace('APPOINTMENT:', '');
          const appointmentData: AppointmentData = JSON.parse(appointmentJson);
          setEditingAppointment(appointmentData);
          setShowAppointmentCreator(true);
        } catch (e) {
          console.error('Error parsing appointment for edit:', e);
        }
      } else {
        // Handle text message editing
        setNewMessage(selectedMessage.content);
        setReplyingTo(null);
      }
    }
  };

  // Handle edit poll from gear icon
  const handleEditPoll = (message: Message) => {
    try {
      const pollJson = message.content.replace('POLL:', '');
      const pollData: PollData = JSON.parse(pollJson);
      setEditingPoll(pollData);
      setEditingMessage(message); // Set editingMessage so updateMessage is called instead of sendMessage
      setShowPollCreator(true);
    } catch (e) {
      console.error('Error parsing poll for edit:', e);
      Alert.alert('Error', 'Failed to load poll data');
    }
  };

  // Handle delete option
  const handleDeleteMessage = async () => {
    if (!selectedMessage || !currentUserId) return;
    
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedMessage = await chatService.deleteMessage(selectedMessage.id, currentUserId);
              // Update message in local state with system message
              setMessages(prev => prev.map(msg => 
                msg.id === selectedMessage.id 
                  ? { ...updatedMessage, isOwn: msg.isOwn }
                  : msg
              ));
              setShowMessageOptions(false);
              setSelectedMessage(null);
            } catch (error: any) {
              console.error('Error deleting message:', error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete message');
            }
          },
        },
      ]
    );
  };

  // Handle toggle reaction
  const handleToggleReaction = async (messageId: number, emoji: string) => {
    if (!currentUserId || !user) return;

    try {
      const currentUserName = user.name || 'You';
      
      // Optimistic update
      setMessages(prev => prev.map(msg => {
        if (msg.id !== messageId) return msg;

        const currentReactions = msg.reactions || [];
        const reactionIndex = currentReactions.findIndex(r => r.emoji === emoji);
        const userReacted = reactionIndex !== -1 && 
          currentReactions[reactionIndex].users.some(u => u.id === currentUserId);

        if (userReacted) {
          // Remove reaction
          const updatedReactions = currentReactions.map((reaction, idx) => {
            if (idx === reactionIndex) {
              const updatedUsers = reaction.users.filter(u => u.id !== currentUserId);
              if (updatedUsers.length === 0) {
                return null; // Remove reaction if no users left
              }
              return {
                ...reaction,
                count: reaction.count - 1,
                users: updatedUsers,
                currentUserReacted: false,
              };
            }
            return reaction;
          }).filter(Boolean) as typeof currentReactions;

          return {
            ...msg,
            reactions: updatedReactions,
          };
        } else {
          // Add reaction
          if (reactionIndex !== -1) {
            // Reaction exists, add user
            const updatedReactions = currentReactions.map((reaction, idx) => {
              if (idx === reactionIndex) {
                const newUser = { id: currentUserId, name: currentUserName };
                return {
                  ...reaction,
                  count: reaction.count + 1,
                  users: [...reaction.users, newUser],
                  currentUserReacted: true,
                };
              }
              return reaction;
            });
            return {
              ...msg,
              reactions: updatedReactions,
            };
          } else {
            // New reaction
            const newReaction = {
              emoji,
              count: 1,
              users: [{ id: currentUserId, name: currentUserName }],
              currentUserReacted: true,
            };
            return {
              ...msg,
              reactions: [...currentReactions, newReaction],
            };
          }
        }
      }));

      // API call
      await chatService.toggleReaction(messageId, emoji, currentUserId);
    } catch (error: any) {
      console.error('Error toggling reaction:', error);
      // Revert optimistic update on error
      await loadMessages();
    }
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Handle click on reply preview to scroll to original message
  const handleReplyClick = (replyToId: number) => {
    // Find the message index
    const messageIndex = messages.findIndex(msg => msg.id === replyToId);
    
    if (messageIndex !== -1) {
      // Scroll to the message
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ 
          index: messageIndex, 
          animated: true,
          viewPosition: 0.5 // Center the message
        });
      }, 100);

      // Highlight the message for 1 second
      setHighlightedMessageId(replyToId);
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 1000);
    }
  };

  // Format time for display
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
  };

  // Format audio duration (e.g., "0:10", "1:23")
  const formatAudioDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render a message
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.isOwn ?? false;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    
    // Initialize animation for this message if not exists
    if (!messageAnimations.current[item.id]) {
      messageAnimations.current[item.id] = new Animated.Value(1);
    }
    
    // Check if this is a system message (detected by content patterns)
    const isSystemMessage = item.content && (
      item.content.includes('joined the group') ||
      item.content.includes('left the group') ||
      item.content.includes('was deleted')
    );
    
    // Show avatar logic: avatar appears only on the last message of a consecutive series
    // Avatar shows if: there's no next message OR next message is from different sender OR next message is more than 5 minutes later
    const showAvatar = !nextMessage || 
                      nextMessage.sender?.id !== item.sender?.id ||
                      (nextMessage && (new Date(nextMessage.createdAt).getTime() - new Date(item.createdAt).getTime()) > 300000);
    
    // Group messages: same user, less than 5 minutes apart
    const isGrouped = previousMessage?.sender?.id === item.sender?.id &&
                     (new Date(item.createdAt).getTime() - new Date(previousMessage.createdAt).getTime()) < 300000;
    
    // Add margin top if it's a new group
    const isNewGroup = !isGrouped;

    // Render system message (centered)
    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>
            {item.content}
          </Text>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer, 
        isOwn ? styles.ownMessageContainer : styles.otherMessageContainer,
        isNewGroup && styles.newMessageGroup
      ]}>
        {/* Avatar for other users' messages (left side) */}
        {!isOwn && (
          showAvatar ? (
            <TouchableOpacity 
              style={styles.otherAvatarContainer}
              onPress={() => {
                if (item.sender?.id) {
                  router.push({
                    pathname: '/userProfile',
                    params: { userId: item.sender.id.toString() },
                  });
                }
              }}
              activeOpacity={0.7}
            >
              <VerifiedAvatar
                publicId={item.sender?.profilePicturePublicId}
                fallbackUrl={item.sender?.profilePicture}
                size={36}
                isVerify={item.sender?.isVerify || false}
                style={styles.messageAvatar}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.otherAvatarSpacer} />
          )
        )}
        
        {/* Message */}
        <View
          ref={(ref) => {
            if (ref) {
              messageRefs.current[item.id] = ref;
            }
          }}
          style={[
            styles.messageWrapper,
            highlightedMessageId === item.id && styles.highlightedMessage,
            selectedMessage?.id === item.id && styles.highlightedMessageBubble,
            selectedMessage?.id === item.id && styles.messageElevated,
          ]}
        >

          <Animated.View
            style={[
              {
                transform: [
                  {
                    scale: messageAnimations.current[item.id] || new Animated.Value(1),
                  },
                ],
              },
            ]}
          >
          <Pressable
            style={[
              styles.messageBubble, 
              isOwn ? styles.ownMessageBubble : styles.otherMessageBubble,
              isGrouped && styles.groupedMessage,
              selectedMessage?.id === item.id && styles.highlightedMessageBubble,
            ]}
            onLongPress={(event) => handleLongPressMessage(item, event)}
          >
            {/* Reply preview inside message bubble - clickable */}
            {item.replyTo && (
              <TouchableOpacity
                style={[styles.replyPreview, isOwn && styles.ownReplyPreview]}
                onPress={() => {
                  if (item.replyTo?.id) {
                    handleReplyClick(item.replyTo.id);
                  }
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <View style={[styles.replyLine, isOwn && styles.ownReplyLine]} />
                <View style={styles.replyPreviewContent}>
                  <Text style={[styles.replyAuthor, isOwn && styles.ownReplyAuthor]}>
                    {item.replyTo.sender.name || item.replyTo.sender.username}
                  </Text>
                  <Text 
                    style={[styles.replyPreviewText, isOwn && styles.ownReplyPreviewText]} 
                    numberOfLines={1}
                  >
                    {item.replyTo.content}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          
          {/* Show sender name for ALL messages (including own) for clarity */}
          <Text style={[styles.senderName, isOwn && styles.ownSenderName]}>
            {item.sender?.name || item.sender?.username || 'Unknown User'}
          </Text>
          
          {/* Render audio player if message type is AUDIO */}
          {item.messageType === 'AUDIO' ? (
            <AudioMessagePlayer
              audioUrl={item.content}
              isOwn={isOwn}
              onDurationLoaded={(duration) => {
                setAudioDurations(prev => ({ ...prev, [item.id]: duration }));
              }}
              onPositionUpdate={(position) => {
                setAudioPositions(prev => ({ ...prev, [item.id]: position }));
              }}
            />
          ) : (item.content && item.content.startsWith('POLL:')) ? (
            // Parse poll data (check before IMAGE to avoid conflicts)
            (() => {
              try {
                if (!item.content) {
                  throw new Error('Message content is empty');
                }
                const pollJson = item.content.replace('POLL:', '');
                let pollData: PollData;
                try {
                  pollData = JSON.parse(pollJson);
                } catch (parseError) {
                  console.error('Error parsing poll JSON:', parseError);
                  throw parseError;
                }
                
                // Get votes from message (loaded by loadPollVotes)
                const pollVotes = (item as any).pollVotes || [];
                const pollUserVotes = (item as any).pollUserVotes || [];
                
                // Format votes for PollCard
                const formattedVotes: PollVote[] = pollVotes.map((vote: any) => ({
                  optionId: vote.optionId,
                  userId: vote.userId,
                  userName: vote.userName,
                  userAvatar: vote.userAvatar,
                  userAvatarPublicId: vote.userAvatarPublicId,
                  isVerify: vote.isVerify,
                }));

                const pollWithVotes: PollWithVotes = {
                  ...pollData,
                  messageId: item.id,
                  userVotes: pollUserVotes,
                  votes: formattedVotes,
                  totalVotes: formattedVotes.length,
                };
                return (
                  <Pressable
                    onLongPress={(event) => handleLongPressMessage(item, event)}
                    style={selectedMessage?.id === item.id && styles.highlightedMessageBubble}
                  >
                    <PollCard
                      poll={pollWithVotes}
                      isOwn={isOwn}
                      currentUserId={currentUserId}
                      currentUserName={user?.name || undefined}
                      currentUserAvatar={(user as any)?.profilePicture || user?.photoURL}
                      currentUserAvatarPublicId={(user as any)?.profilePicturePublicId}
                      currentUserIsVerify={(user as any)?.isVerify}
                      onVote={async (optionId: string) => {
                        if (!currentUserId) return;
                        try {
                          await chatService.votePoll(item.id, optionId, currentUserId);
                          // Reload poll votes
                          const votesData = await chatService.getPollVotes(item.id, currentUserId);
                          // Update the specific message in the messages array
                          setMessages(prev => prev.map(msg => {
                            if (msg.id === item.id) {
                              return {
                                ...msg,
                                pollVotes: votesData.votes || [],
                                pollUserVotes: votesData.userVotes || [],
                              };
                            }
                            return msg;
                          }));
                        } catch (error: any) {
                          console.error('Error voting on poll:', error);
                          Alert.alert('Error', error.response?.data?.error || 'Failed to vote on poll');
                        }
                      }}
                      onEdit={isOwn ? () => handleEditPoll(item) : undefined}
                      onDelete={isOwn ? () => handleLongPressMessage(item) : undefined}
                    />
                  </Pressable>
                );
              } catch {
                // Fallback to text if parsing fails
                return (
                  <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
                    {item.content}
                  </Text>
                );
              }
            })()
          ) : item.messageType === 'IMAGE' ? (
            // Parse media from content (could be JSON array, JSON with caption, or single URL)
            (() => {
              try {
                // Check if content has a caption (format: "caption\nJSON")
                const parts = item.content.split('\n');
                let mediaData;
                
                if (parts.length > 1) {
                  // Has caption, JSON is after first newline
                  const jsonPart = parts.slice(1).join('\n');
                  try {
                    mediaData = JSON.parse(jsonPart);
                  } catch {
                    // If JSON parsing fails, try to treat jsonPart as a URL, otherwise fallback
                    const possibleUri = jsonPart.trim();
                    const singleUri = possibleUri.startsWith('http://') || possibleUri.startsWith('https://')
                      ? possibleUri
                      : item.content.trim();
                    if (!singleUri || singleUri === 'null') {
                      return (
                        <View>
                          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>Media unavailable</Text>
                        </View>
                      );
                    }
                    
                    return (
                      <MediaCarousel
                        media={[{
                          uri: singleUri,
                          type: 'image',
                          secureUrl: singleUri,
                        }]}
                        isOwn={isOwn}
                      />
                    );
                  }
                } else {
                  // No caption, try to parse as JSON first
                  try {
                    mediaData = JSON.parse(item.content);
                  } catch {
                    // Not JSON, treat as single URL (validate first)
                    const singleUri = item.content.trim();
                    if (!singleUri || singleUri === 'null') {
                      return (
                        <View>
                          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>Media unavailable</Text>
                        </View>
                      );
                    }
                    
                    return (
                      <MediaCarousel
                        media={[{
                          uri: singleUri,
                          type: 'image',
                          secureUrl: singleUri,
                        }]}
                        isOwn={isOwn}
                      />
                    );
                  }
                }
                
                if (Array.isArray(mediaData)) {
                  // Filter and validate media items
                  const validMedia = mediaData
                    .map((m: any) => {
                      const secureUrl = m.secureUrl || (typeof m === 'string' ? m : '');
                      const uri = secureUrl || m.uri || (typeof m === 'string' ? m : '');
                      
                      // Validate URI
                      if (!uri || uri === 'null' || uri.trim() === '' || typeof uri !== 'string') {
                        return null;
                      }
                      
                      return {
                        uri: uri as string,
                        type: (m.type || 'image') as 'image' | 'video',
                        secureUrl,
                        publicId: m.publicId,
                      };
                    })
                    .filter((m) => m !== null) as { uri: string; type: 'image' | 'video'; secureUrl?: string; publicId?: string }[];
                  
                  // If no valid media, show placeholder
                  if (validMedia.length === 0) {
                    return (
                      <View>
                        <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>Media unavailable</Text>
                      </View>
                    );
                  }
                  
                  return (
                    <>
                      {parts.length > 1 && (
                        <Text style={[styles.messageText, isOwn && styles.ownMessageText, { marginBottom: 8 }]}>
                          {parts[0]}
                        </Text>
                      )}
                      <MediaCarousel
                        media={validMedia}
                        isOwn={isOwn}
                      />
                    </>
                  );
                }
                
                // If parsed but not an array, treat as single URL (validate first)
                const singleUri = item.content.trim();
                if (!singleUri || singleUri === 'null') {
                  return (
                    <View>
                      <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>Media unavailable</Text>
                    </View>
                  );
                }
                
                return (
                  <MediaCarousel
                    media={[{
                      uri: singleUri,
                      type: 'image',
                      secureUrl: singleUri,
                    }]}
                    isOwn={isOwn}
                  />
                );
              } catch {
                // Fallback: treat as single URL (validate first)
                const singleUri = item.content.trim();
                if (!singleUri || singleUri === 'null') {
                  return (
                    <View>
                      <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>Media unavailable</Text>
                    </View>
                  );
                }
                
                return (
                  <MediaCarousel
                    media={[{
                      uri: singleUri,
                      type: 'image',
                      secureUrl: singleUri,
                    }]}
                    isOwn={isOwn}
                  />
                );
              }
            })()
          ) : item.content.startsWith('CONTACT:') ? (
            // Parse contact data
            (() => {
              try {
                const contactJson = item.content.replace('CONTACT:', '');
                const contactData: ContactData = JSON.parse(contactJson);
                return (
                  <ContactCard
                    contact={contactData}
                    isOwn={isOwn}
                  />
                );
              } catch {
                // Fallback to text if parsing fails
                return (
                  <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
                    {item.content}
                  </Text>
                );
              }
            })()
          ) : item.content.startsWith('APPOINTMENT:') ? (
            // Parse appointment data
            (() => {
              try {
                const appointmentJson = item.content.replace('APPOINTMENT:', '');
                const appointmentData: AppointmentData = JSON.parse(appointmentJson);
                return (
                  <Pressable
                    onLongPress={(event) => handleLongPressMessage(item, event)}
                    style={selectedMessage?.id === item.id && styles.highlightedMessageBubble}
                  >
                    <AppointmentCard
                      appointment={appointmentData}
                      isOwn={isOwn}
                    />
                  </Pressable>
                );
              } catch {
                // Fallback to text if parsing fails
                return (
                  <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
                    {item.content}
                  </Text>
                );
              }
            })()
          ) : item.content.startsWith('DOCUMENT:') || item.messageType === 'FILE' ? (
            // Parse document data
            (() => {
              try {
                let documentData: DocumentData;
                if (item.content.startsWith('DOCUMENT:')) {
                  const documentJson = item.content.replace('DOCUMENT:', '');
                  documentData = JSON.parse(documentJson);
                  // Ensure all required fields are present
                  if (!documentData.name) {
                    documentData.name = documentData.secureUrl?.split('/').pop() || 'document';
                  }
                  if (!documentData.secureUrl && documentData.uri) {
                    documentData.secureUrl = documentData.uri;
                  }
                  if (!documentData.uri && documentData.secureUrl) {
                    documentData.uri = documentData.secureUrl;
                  }
                } else {
                  // Fallback: create document from content URL
                  const fileName = item.content.split('/').pop() || 'document';
                  documentData = {
                    name: fileName,
                    uri: item.content,
                    secureUrl: item.content,
                  };
                }
                return (
                  <Pressable
                    onLongPress={(event) => handleLongPressMessage(item, event)}
                    style={selectedMessage?.id === item.id && styles.highlightedMessageBubble}
                  >
                    <DocumentCard
                      document={documentData}
                      isOwn={isOwn}
                    />
                  </Pressable>
                );
              } catch {
                // Fallback to text if parsing fails
                return (
            <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
              {item.content}
            </Text>
                );
              }
            })()
          ) : item.content.startsWith('LOCATION:') ? (
            // Parse location data
            (() => {
              try {
                const locationJson = item.content.replace('LOCATION:', '');
                const locationData: LocationData = JSON.parse(locationJson);
                return (
                  <Pressable
                    onLongPress={(event) => handleLongPressMessage(item, event)}
                    style={selectedMessage?.id === item.id && styles.highlightedMessageBubble}
                  >
                    <LocationCard
                      location={locationData}
                      isOwn={isOwn}
                    />
                  </Pressable>
                );
              } catch {
                // Fallback to text if parsing fails
                return (
                  <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
                    {item.content}
                  </Text>
                );
              }
            })()
          ) : (() => {
            // Check if content contains a group invite link
            const inviteLinkMatch = item.content.match(/https?:\/\/gearconnect\.app\/join\/([A-Z0-9]+)/i);
            if (inviteLinkMatch) {
              const inviteCode = inviteLinkMatch[1].toUpperCase();
              const inviteData: GroupInviteData = {
                inviteCode,
              };
              return (
                <Pressable
                  onLongPress={(event) => handleLongPressMessage(item, event)}
                  style={selectedMessage?.id === item.id && styles.highlightedMessageBubble}
                >
                  <GroupInviteCard
                    inviteData={inviteData}
                    isOwn={isOwn}
                    currentUserId={currentUserId}
                  />
                </Pressable>
              );
            }
            return null;
          })() || (
            <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
              {item.content}
            </Text>
          )}

          {/* Reactions display */}
          {item.reactions && item.reactions.length > 0 && (
            <View style={styles.reactionsContainer}>
              {item.reactions.map((reaction, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.reactionChip,
                    reaction.currentUserReacted && styles.reactionChipActive,
                    isOwn && styles.ownReactionChip,
                  ]}
                  onPress={async () => {
                    // Toggle reaction: if user already reacted, remove it; otherwise add it
                    await handleToggleReaction(item.id, reaction.emoji);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reactionChipEmoji}>{reaction.emoji}</Text>
                  <Text style={[
                    styles.reactionChipCount,
                    isOwn && styles.ownReactionChipCount,
                  ]}>
                    {reaction.count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Duration for audio messages (bottom left) and Timestamp (bottom right) */}
          <View style={styles.messageTimeContainer}>
            {/* Audio duration on the left (current position if playing, else total duration) */}
            {item.messageType === 'AUDIO' && audioDurations[item.id] && (
              <Text style={[styles.messageTime, styles.audioDuration, isOwn && styles.ownMessageTime]}>
                {formatAudioDuration(audioPositions[item.id] ?? audioDurations[item.id])}
              </Text>
            )}
            {/* Timestamp on the right with edited indicator and read receipts */}
            <View style={styles.messageTimeRow}>
              <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
                {formatTime(item.createdAt)}
              </Text>
              {item.isEdited && (
                <Text style={[styles.editedIndicator, isOwn && styles.ownEditedIndicator]}>
                  (edited)
                </Text>
              )}
              {/* Read receipts for own messages */}
              {isOwn && item.readReceipts !== undefined && (
                <View style={{ marginLeft: 4 }}>
                  {(() => {
                    const readCount = item.readReceipts?.length || 0;
                    
                    if (readCount === 0) {
                      // Message sent but not read yet - single check (gray)
                      return (
                        <FontAwesome 
                          name="check" 
                          size={12} 
                          color={isOwn ? 'rgba(255, 255, 255, 0.7)' : theme.colors.text.secondary} 
                        />
                      );
                    } else {
                      // Message read - double check (blue)
                      return (
                        <View style={{ flexDirection: 'row' }}>
                          <FontAwesome 
                            name="check" 
                            size={12} 
                            color="#4FC3F7" 
                          />
                          <FontAwesome 
                            name="check" 
                            size={12} 
                            color="#4FC3F7" 
                            style={{ marginLeft: -4 }}
                          />
                        </View>
                      );
                    }
                  })()}
                </View>
              )}
            </View>
          </View>
          </Pressable>
          </Animated.View>
        </View>

        {/* Avatar for own messages (right side) */}
        {isOwn && (
          showAvatar ? (
            <TouchableOpacity 
              style={styles.ownAvatarContainer}
              onPress={() => {
                if (item.sender?.id) {
                  router.push({
                    pathname: '/userProfile',
                    params: { userId: item.sender.id.toString() },
                  });
                }
              }}
              activeOpacity={0.7}
            >
              <VerifiedAvatar
                publicId={item.sender?.profilePicturePublicId}
                fallbackUrl={item.sender?.profilePicture}
                size={36}
                isVerify={item.sender?.isVerify || false}
                style={styles.messageAvatar}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.ownAvatarSpacer} />
          )
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack || (() => router.back())}
        >
          <FontAwesome name="arrow-left" size={20} color={theme.colors.text.primary} />
        </TouchableOpacity>
        
        {onHeaderInfoPress ? (
          <TouchableOpacity 
            style={styles.headerInfo}
            onPress={onHeaderInfoPress}
            activeOpacity={0.7}
          >
            <Text style={styles.headerTitle} numberOfLines={1}>
              {conversationName}
            </Text>
            {headerSubtitle && (
              <Text style={[styles.headerSubtitle, headerSubtitleColor && { color: headerSubtitleColor }]}>
                {headerSubtitle}
              </Text>
            )}
            {!headerSubtitle && type === 'dm' && (
              <Text style={[styles.headerSubtitle, { color: getStatusColor(userStatus) }]}>
                {getStatusText(userStatus)}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {conversationName}
            </Text>
            {headerSubtitle && (
              <Text style={[styles.headerSubtitle, headerSubtitleColor && { color: headerSubtitleColor }]}>
                {headerSubtitle}
              </Text>
            )}
            {!headerSubtitle && type === 'dm' && (
              <Text style={[styles.headerSubtitle, { color: getStatusColor(userStatus) }]}>
                {getStatusText(userStatus)}
              </Text>
            )}
          </View>
        )}

        <View style={styles.headerActions}>
          {renderHeaderActions ? renderHeaderActions() : (
            <>
              {/* Video call button with dropdown - TODO: Implement call functionality with Stream.io */}
              {/* <TouchableOpacity 
                style={styles.headerActionButton}
                onPress={() => setShowCallMenu(!showCallMenu)}
                activeOpacity={0.7}
              >
                <FontAwesome name="video-camera" size={20} color={theme.colors.text.secondary} />
                <FontAwesome name="chevron-down" size={12} color={theme.colors.text.secondary} style={{ marginLeft: 4 }} />
              </TouchableOpacity> */}
            </>
          )}
        </View>
      </View>

      {/* Messages list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `msg-${item.id}-${index}`}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={({ viewableItems }) => {
          // Mark messages as read when they become visible
          if (!currentUserId) return;
          
          const visibleMessageIds = viewableItems
            .filter(item => item.isViewable)
            .map(item => item.item.id);
          
          if (visibleMessageIds.length > 0) {
            // Filter to only mark messages from other users as read (not own messages)
            const messagesToMark = messages.filter(msg => 
              visibleMessageIds.includes(msg.id) && 
              msg.sender.id !== currentUserId
            );
            
            if (messagesToMark.length > 0) {
              const messageIdsToMark = messagesToMark.map(msg => msg.id);
              // Use batch read for efficiency
              chatService.markMessagesAsRead(messageIdsToMark, currentUserId).catch(error => {
                console.error('Error marking messages as read:', error);
              });
            }
          }
        }}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50, // Message is considered visible when 50% is shown
        }}
        onContentSizeChange={() => {
          // Always scroll to bottom on content size change if we haven't scrolled initially
          // or if user is already at bottom
          if (!hasScrolledInitially) {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
              setIsScrolledToBottom(true);
              setHasScrolledInitially(true);
            }, 100);
          } else if (isScrolledToBottom) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
        onScrollToIndexFailed={(info) => {
          // Handle scroll to index failure
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          });
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FontAwesome name="comment" size={40} color={theme.colors.text.secondary} />
            <Text style={styles.emptyStateText}>No messages yet. Start the conversation!</Text>
          </View>
        }
        inverted={false}
      />
      )}
      
      {/* Scroll to bottom button */}
      {!loading && !isScrolledToBottom && (
        <TouchableOpacity
          style={styles.scrollToBottomButton}
          onPress={scrollToBottom}
          activeOpacity={0.7}
        >
          <FontAwesome name="chevron-down" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Reply preview */}
      {replyingTo && (
        <View style={styles.replyPreviewContainer}>
          <View style={styles.replyPreviewWrapper}>
            <View style={styles.replyPreviewLeft}>
              <View style={styles.replyPreviewLine} />
              <View style={styles.replyPreviewInfo}>
                <Text style={styles.replyPreviewName}>
                  {replyingTo.sender?.name || replyingTo.sender?.username || 'Unknown User'}
                </Text>
                <Text style={styles.replyPreviewMessage} numberOfLines={1}>
                  {replyingTo.content}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.replyPreviewClose}
              onPress={cancelReply}
              activeOpacity={0.7}
            >
              <FontAwesome name="times" size={16} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Input area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          {/* Text Input or Voice Recorder */}
          {!isRecordingVoice ? (
            <>
              {/* Attach button */}
              <TouchableOpacity 
                style={styles.attachButton}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowAttachmentMenu(true);
                }}
                activeOpacity={0.7}
              >
                <FontAwesome name="plus" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
              
              <TextInput
                style={styles.textInput}
                value={newMessage}
                onChangeText={(text) => {
                  setNewMessage(text);
                  if (showAttachmentMenu) {
                    setShowAttachmentMenu(false);
                  }
                }}
                placeholder={editingMessage ? "Edit your message..." : "Type your message..."}
                placeholderTextColor={theme.colors.text.secondary}
                multiline
                maxLength={500}
              />
              
              {/* Cancel edit button (if editing) */}
              {editingMessage && (
                <TouchableOpacity
                  style={styles.cancelEditButton}
                  onPress={() => {
                    setEditingMessage(null);
                    setNewMessage('');
                    setSelectedMessage(null);
                    setShowMessageOptions(false);
                    setShowEmojiPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <FontAwesome 
                    name="times" 
                    size={16} 
                    color={theme.colors.text.secondary} 
                  />
                </TouchableOpacity>
              )}
              
              {/* Send button or microphone button */}
              {newMessage.trim() ? (
                <TouchableOpacity
                  style={[styles.sendButton, styles.sendButtonActive]}
                  onPress={sendMessage}
                  disabled={sending || loading}
                  activeOpacity={0.7}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <FontAwesome 
                      name="send" 
                      size={16} 
                      color="white" 
                    />
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.microphoneButton}
                  onPress={() => {
                    Keyboard.dismiss();
                    setIsRecordingVoice(true);
                  }}
                  activeOpacity={0.7}
                >
                  <FontAwesome 
                    name="microphone" 
                    size={18} 
                    color={theme.colors.text.secondary} 
                  />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <VoiceRecorder
              onRecordingComplete={async (uri, duration) => {
                if (!currentUserId || !id) return;
                
                setIsRecordingVoice(false);
                
                try {
                  setSending(true);
                  
                  // Upload audio to Cloudinary en raw pour garder le m4a intact (AVPlayer iOS)
                  const uploadResult = await cloudinaryService.uploadMedia(uri, {
                    folder: 'messages',
                    tags: ['message', 'audio'],
                    resource_type: 'raw',
                  });

                  // Send message with audio
                  const sentMessage = await sendMessageHelper(
                    uploadResult.secure_url,
                    'AUDIO',
                    replyingTo?.id
                  );
                  
                  if (sentMessage) {
                    const newMsg: Message = {
                      ...sentMessage,
                      isOwn: sentMessage.sender.id === currentUserId,
                    };
                    setMessages(prev => [...prev, newMsg]);
                  }
                } catch (error: any) {
                  console.error('Error sending voice message:', error);
                  Alert.alert('Error', error.response?.data?.error || 'Failed to send voice message');
                } finally {
                  setSending(false);
                }
              }}
              onCancel={() => {
                setIsRecordingVoice(false);
                console.log('Voice recording cancelled');
              }}
              disabled={sending || loading}
            />
          )}
        </View>
      </View>

      {/* Attachment Menu */}
      <AttachmentMenu
        visible={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        conversationId={id}
        onPhotosSelected={async (media, caption) => {
          if (!currentUserId) return;
          
          try {
            setSending(true);
            if (!id) {
              Alert.alert('Error', 'Conversation ID is missing');
              return;
            }
            
            // Group all media into a single message as JSON array (carousel)
            const mediaArray = media.map(m => ({
              uri: m.uri,
              type: m.type,
              secureUrl: m.secureUrl,
              publicId: m.publicId,
            }));

            // If there's a caption, prepend it to the JSON
            const content = caption
              ? `${caption}\n${JSON.stringify(mediaArray)}`
              : JSON.stringify(mediaArray);

            // Use IMAGE type for now (backend can handle both images and videos)
              const sentMessage = await sendMessageHelper(
                content,
                'IMAGE',
                replyingTo?.id
              );
            
            if (sentMessage) {
              const newMsg: Message = {
                ...sentMessage,
                isOwn: sentMessage.sender.id === currentUserId,
              };
              setMessages(prev => [...prev, newMsg]);
            }
          } catch (error: any) {
            console.error('Error sending media:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to send media');
          } finally {
            setSending(false);
          }
        }}
        onCameraSelected={async (media, caption) => {
          if (!currentUserId) return;
          
          try {
            setSending(true);
            if (!id) {
              Alert.alert('Error', 'Conversation ID is missing');
              return;
            }
            
            // Group camera media into a single message as JSON array
            const mediaArray = media.map(m => ({
              uri: m.uri,
              type: m.type,
              secureUrl: m.secureUrl,
              publicId: m.publicId,
            }));
            
            // If there's a caption, prepend it to the JSON
            const content = caption 
              ? `${caption}\n${JSON.stringify(mediaArray)}`
              : JSON.stringify(mediaArray);
            
            const sentMessage = await sendMessageHelper(
              content,
              'IMAGE',
              replyingTo?.id
            );
            
            if (sentMessage) {
              const newMsg: Message = {
                ...sentMessage,
                isOwn: sentMessage.sender.id === currentUserId,
              };
              setMessages(prev => [...prev, newMsg]);
            }
          } catch (error: any) {
            console.error('Error sending camera image:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to send image');
          } finally {
            setSending(false);
          }
        }}
        onLocationSelected={async () => {
          if (!currentUserId || !id) return;
          
          try {
            // Request location permission and get current position
            const { requestForegroundPermissionsAsync, getCurrentPositionAsync } = await import('expo-location');
            
            // Request permission
            const { status } = await requestForegroundPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(
                'Permission refusée',
                'L\'accès à la localisation est nécessaire pour partager votre position.',
                [{ text: 'OK' }]
              );
              return;
            }

            setSending(true);
            
            // Get current position
            const location = await getCurrentPositionAsync({
              accuracy: 6, // High accuracy
            });

            // Try to get address from coordinates (reverse geocoding)
            let address: string | undefined;
            try {
              const { reverseGeocodeAsync } = await import('expo-location');
              const [result] = await reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
              
              // Format address
              const addressParts = [];
              if (result.street) addressParts.push(result.street);
              if (result.city) addressParts.push(result.city);
              if (result.postalCode) addressParts.push(result.postalCode);
              if (result.country) addressParts.push(result.country);
              address = addressParts.join(', ') || undefined;
            } catch {
              console.log('Reverse geocoding failed, continuing without address');
            }

            // Create location data
            const locationData: LocationData = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              address: address,
            };

            // Send message with location
            const locationMessage = `LOCATION:${JSON.stringify(locationData)}`;
            const sentMessage = await sendMessageHelper(
              locationMessage,
              'TEXT',
              replyingTo?.id
            );
            
            if (sentMessage) {
              const newMsg: Message = {
                ...sentMessage,
                isOwn: sentMessage.sender.id === currentUserId,
              };
              setMessages(prev => [...prev, newMsg]);
            }
          } catch (error: any) {
            console.error('Error sending location:', error);
            Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to send location');
          } finally {
            setSending(false);
          }
        }}
        onContactSelected={async (contact) => {
          if (!currentUserId) return;
          
          try {
            setSending(true);
            if (!id) {
              Alert.alert('Error', 'Conversation ID is missing');
              return;
            }
            
            // Send contact as JSON with special prefix to identify it
            const contactData = {
              type: 'contact',
              name: contact.name,
              phoneNumbers: contact.phoneNumbers,
              emails: contact.emails,
              organization: contact.organization,
              jobTitle: contact.jobTitle,
            };
            
            const contactMessage = `CONTACT:${JSON.stringify(contactData)}`;
            
            const sentMessage = await sendMessageHelper(
              contactMessage,
              'TEXT',
              replyingTo?.id
            );
            
            if (sentMessage) {
              const newMsg: Message = {
                ...sentMessage,
                isOwn: sentMessage.sender.id === currentUserId,
              };
              setMessages(prev => [...prev, newMsg]);
            }
          } catch (error: any) {
            console.error('Error sending contact:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to send contact');
          } finally {
            setSending(false);
          }
        }}
        onDocumentSelected={async () => {
          if (!currentUserId || !id) return;
          
          try {
            // Open native document picker directly
            const result = await DocumentPicker.getDocumentAsync({
              type: '*/*',
              copyToCacheDirectory: true,
              multiple: false,
            });

            if (result.canceled) {
              return;
            }

            const document = result.assets[0];
            
            if (!document.uri) {
              Alert.alert('Error', 'Failed to access document');
              return;
            }

            // Security validation
            // @ts-expect-error TS2835 - Metro résout .ts sans extension ; .js provoque "Cannot find module" au runtime
            const { validateFileSafety } = await import('../../utils/fileSecurity');
            const validation = validateFileSafety(document.name || 'document', document.mimeType);
            
            if (!validation.isValid) {
              Alert.alert(
                'Security Error',
                validation.error || 'This file type is not allowed for security reasons.',
                [{ text: 'OK' }]
              );
              return;
            }

            // Verify file exists and has content before uploading (same checks as download)
            // @ts-expect-error TS2307 - expo-file-system/legacy existe à l'exécution (Expo SDK 54) mais les types ne sont pas exportés
            const { getInfoAsync } = await import('expo-file-system/legacy');
            const fileInfo = await getInfoAsync(document.uri, { size: true });
            
            if (!fileInfo.exists) {
              Alert.alert('Error', 'File does not exist at the provided location');
              return;
            }
            
            if (!fileInfo.size || fileInfo.size === 0) {
              Alert.alert('Error', 'File is empty (0 bytes). Please select a valid file.');
              return;
            }
            
            // Verify file size matches what DocumentPicker reported
            if (document.size && fileInfo.size !== document.size) {
              console.warn(`File size mismatch: DocumentPicker reported ${document.size}, FileSystem reports ${fileInfo.size}`);
            }
            
            console.log('📄 Document file info:', {
              uri: document.uri,
              name: document.name,
              size: fileInfo.size,
              reportedSize: document.size,
              mimeType: document.mimeType,
            });

            setSending(true);
            
            // Upload document to Cloudinary
            // Clean filename for Cloudinary public_id (remove special chars, keep extension)
            const originalName = document.name || 'document';
            const nameParts = originalName.split('.');
            nameParts.pop(); // Remove extension
            const baseName = nameParts.join('.').replace(/[^a-zA-Z0-9._-]/g, '_') || 'document';
            const cleanPublicId = `${baseName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            
            const uploadResult = await cloudinaryService.uploadMedia(document.uri, {
              folder: 'messages/documents',
              tags: ['message', 'document'],
              resource_type: 'raw', // Use 'raw' for documents
              public_id: cleanPublicId, // Use cleaned original filename
            });

            // Create document data
            const documentData: DocumentData = {
              name: document.name || 'document',
              uri: document.uri,
              secureUrl: uploadResult.secure_url,
              publicId: uploadResult.public_id,
              mimeType: document.mimeType,
              size: document.size,
            };

            // Send message with document
            const documentMessage = `DOCUMENT:${JSON.stringify(documentData)}`;
            const sentMessage = await sendMessageHelper(
              documentMessage,
              'FILE',
              replyingTo?.id
            );
            
            if (sentMessage) {
              const newMsg: Message = {
                ...sentMessage,
                isOwn: sentMessage.sender.id === currentUserId,
              };
              setMessages(prev => [...prev, newMsg]);
            }
          } catch (error: any) {
            console.error('Error sending document:', error);
            Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to send document');
          } finally {
            setSending(false);
          }
        }}
        onPollSelected={async (poll: PollData) => {
          if (!currentUserId) return;
          
          try {
            setSending(true);
            if (!id) {
              Alert.alert('Error', 'Conversation ID is missing');
              return;
            }
            
            // Send poll as JSON with special prefix to identify it
            const pollMessage = `POLL:${JSON.stringify(poll)}`;
            
            const sentMessage = await sendMessageHelper(
              pollMessage,
              'TEXT',
              replyingTo?.id
            );
            
            if (sentMessage) {
              const newMsg: Message = {
                ...sentMessage,
                isOwn: sentMessage.sender.id === currentUserId,
              };
              setMessages(prev => [...prev, newMsg]);
            }
          } catch (error: any) {
            console.error('Error sending poll:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to send poll');
          } finally {
            setSending(false);
          }
        }}
        onAppointmentSelected={() => {
          setShowAppointmentCreator(true);
        }}
      />

      {/* Poll Creator for editing */}
      <PollCreator
        visible={showPollCreator}
        onSend={async (poll: PollData) => {
          if (!currentUserId || !editingPoll) return;
          
          try {
            setSending(true);
            if (!id) {
              Alert.alert('Error', 'Conversation ID is missing');
              return;
            }
            
            // If editing, we need to update the existing message
            if (editingMessage && editingMessage.content.startsWith('POLL:')) {
              const pollMessage = `POLL:${JSON.stringify(poll)}`;
              const updatedMessage = await chatService.updateMessage(
                editingMessage.id,
                pollMessage,
                currentUserId
              );
              // Update local state with the updated message
              setMessages(prev => prev.map(msg => 
                msg.id === editingMessage.id 
                  ? { 
                      ...updatedMessage, 
                      isOwn: updatedMessage.sender.id === currentUserId,
                      isEdited: true 
                    }
                  : msg
              ));
              setEditingMessage(null);
              setEditingPoll(null);
              setShowPollCreator(false);
            } else {
              // Send as new poll (shouldn't happen in edit mode, but just in case)
              const pollMessage = `POLL:${JSON.stringify(poll)}`;
              const sentMessage = await sendMessageHelper(
                pollMessage,
                'TEXT',
                replyingTo?.id
              );
              if (sentMessage) {
                const newMsg: Message = {
                  ...sentMessage,
                  isOwn: sentMessage.sender.id === currentUserId,
                };
                setMessages(prev => [...prev, newMsg]);
              }
            }
          } catch (error: any) {
            console.error('Error saving poll:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to save poll');
          } finally {
            setSending(false);
            setShowPollCreator(false);
            setEditingPoll(null);
            setEditingMessage(null);
          }
        }}
        onCancel={() => {
          setShowPollCreator(false);
          setEditingPoll(null);
          setEditingMessage(null);
        }}
        initialData={editingPoll || undefined}
      />

      {/* Appointment Creator Modal */}
      <AppointmentCreator
        visible={showAppointmentCreator}
        onSend={async (appointment: AppointmentData) => {
          if (!currentUserId || !id) return;
          
          try {
            setSending(true);
            
            // If editing, we need to update the existing message
            if (editingMessage && editingMessage.content.startsWith('APPOINTMENT:')) {
              const appointmentMessage = `APPOINTMENT:${JSON.stringify(appointment)}`;
              const updatedMessage = await chatService.updateMessage(
                editingMessage.id,
                appointmentMessage,
                currentUserId
              );
              // Update local state with the updated message
              setMessages(prev => prev.map(msg => 
                msg.id === editingMessage.id 
                  ? { 
                      ...updatedMessage, 
                      isOwn: updatedMessage.sender.id === currentUserId,
                      isEdited: true 
                    }
                  : msg
              ));
              setEditingMessage(null);
              setEditingAppointment(null);
              setShowAppointmentCreator(false);
            } else {
              // Send as new appointment
              const appointmentMessage = `APPOINTMENT:${JSON.stringify(appointment)}`;
              const sentMessage = await sendMessageHelper(
                appointmentMessage,
                'TEXT',
                replyingTo?.id
              );
              if (sentMessage) {
                const newMsg: Message = {
                  ...sentMessage,
                  isOwn: sentMessage.sender.id === currentUserId,
                };
                setMessages(prev => [...prev, newMsg]);
              }
            }
          } catch (error: any) {
            console.error('Error saving appointment:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to save appointment');
          } finally {
            setSending(false);
            setShowAppointmentCreator(false);
            setEditingAppointment(null);
            setEditingMessage(null);
          }
        }}
        onCancel={() => {
          setShowAppointmentCreator(false);
          setEditingAppointment(null);
          setEditingMessage(null);
        }}
        initialData={editingAppointment || undefined}
      />

      {/* Unified Message Options Modal - New Logic */}
      {showMessageOptions && selectedMessage && (
        <Modal
          visible={showMessageOptions}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowMessageOptions(false);
            setSelectedMessage(null);
            setShowEmojiPicker(false); // Reset emoji picker state
          }}
        >
          <TouchableOpacity
            style={styles.unifiedModalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowMessageOptions(false);
              setSelectedMessage(null);
              setShowEmojiPicker(false); // Reset emoji picker state
            }}
          >
            <View style={styles.unifiedActionSheet} onStartShouldSetResponder={() => true}>
              <View style={styles.unifiedSheetHandle} />
              
              {/* Reactions section */}
              <View style={styles.unifiedReactionsSection}>
                <Text style={styles.unifiedSectionTitle}>React</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.unifiedReactionsRow}
                >
                  {['👍', '❤️', '😂', '😮', '😢', '🙏', '😭', '🔥', '💯', '👏', '🎉', '✨', '💪', '🤔', '😍', '😴', '🤮', '😡', '🤝', '🙌'].map((emoji, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.unifiedReactionButton}
                      onPress={async () => {
                        await handleToggleReaction(selectedMessage.id, emoji);
                        setShowMessageOptions(false);
                        setSelectedMessage(null);
                        setShowEmojiPicker(false);
                      }}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.unifiedReactionEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.unifiedReactionButton}
                    onPress={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.unifiedAddReactionButton, showEmojiPicker && styles.unifiedAddReactionButtonActive]}>
                      <FontAwesome name="plus" size={16} color="#8E8E93" />
                    </View>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {/* Emoji Picker - Expandable section */}
              {showEmojiPicker && (
                <View style={styles.emojiPickerContainer}>
                  <ScrollView 
                    style={styles.emojiPickerGrid}
                    contentContainerStyle={styles.emojiPickerGridContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {allEmojis.map((emoji, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.emojiPickerItem}
                        onPress={async () => {
                          await handleToggleReaction(selectedMessage.id, emoji);
                          setShowEmojiPicker(false);
                          setShowMessageOptions(false);
                          setSelectedMessage(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.emojiPickerEmoji}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Divider */}
              <View style={styles.unifiedDivider} />

              {/* Actions section */}
              <View style={styles.unifiedActionsSection}>
                <TouchableOpacity
                  style={styles.unifiedActionRow}
                  onPress={() => {
                    handleReply();
                    setShowMessageOptions(false);
                    setSelectedMessage(null);
                    setShowEmojiPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="reply" size={22} color="#000000" />
                  <Text style={styles.unifiedActionLabel}>Reply</Text>
                </TouchableOpacity>

                {selectedMessage.isOwn && (
                  <>
                    <TouchableOpacity
                      style={styles.unifiedActionRow}
                      onPress={() => {
                        handleEditMessage();
                        setShowMessageOptions(false);
                        setSelectedMessage(null);
                        setShowEmojiPicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <FontAwesome name="edit" size={22} color="#000000" />
                      <Text style={styles.unifiedActionLabel}>Edit</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.unifiedDivider} />
                    
                    <TouchableOpacity
                      style={styles.unifiedActionRow}
                      onPress={() => {
                        handleDeleteMessage();
                        setShowMessageOptions(false);
                        setSelectedMessage(null);
                        setShowEmojiPicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <FontAwesome name="trash" size={22} color="#FF3B30" />
                      <Text style={[styles.unifiedActionLabel, styles.unifiedActionLabelDanger]}>Delete</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Call Menu Contextual - TODO: Implement call functionality with Stream.io */}
      {/* {showCallMenu && (
        <>
          <TouchableOpacity
            style={styles.callMenuOverlay}
            activeOpacity={1}
            onPress={() => setShowCallMenu(false)}
          />
          <View style={styles.callMenu}>
            <TouchableOpacity
              style={styles.callMenuItem}
              onPress={() => {
                setShowCallMenu(false);
                // TODO: Implement voice call
                console.log('Voice call');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.callMenuText}>Voice call</Text>
              <FontAwesome name="phone" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callMenuItem}
              onPress={() => {
                setShowCallMenu(false);
                // TODO: Implement video call
                console.log('Video call');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.callMenuText}>Video call</Text>
              <FontAwesome name="video-camera" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callMenuItem}
              onPress={() => {
                setShowCallMenu(false);
                // TODO: Implement select people
                console.log('Select people');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.callMenuText}>Select people</Text>
              <FontAwesome name="check" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callMenuItem}
              onPress={() => {
                setShowCallMenu(false);
                // TODO: Implement send call link
                console.log('Send call link');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.callMenuText}>Send call link</Text>
              <FontAwesome name="link" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.callMenuItem, styles.callMenuItemLast]}
              onPress={() => {
                setShowCallMenu(false);
                // TODO: Implement schedule call
                console.log('Schedule call');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.callMenuText}>Schedule a call</Text>
              <FontAwesome name="calendar" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      )} */}

      {/* Mute Modal (only for DM) */}
      {type === 'dm' && (
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

      {/* Additional modals from props (e.g., MembersModal for groups) */}
      {renderAdditionalModals && renderAdditionalModals()}

    </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 