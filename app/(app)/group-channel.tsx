import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CloudinaryAvatar } from '@/components/media/CloudinaryImage';
import { groupChannelScreenStyles as styles } from '@/styles/screens/groups';
import groupService, { ChannelMessage } from '@/services/groupService';
import { useAuth } from '@/context/AuthContext';

// Extend ChannelMessage to include isOwn for UI rendering
interface UIChannelMessage extends ChannelMessage {
  isOwn: boolean;
}

const GroupChannelScreen: React.FC = () => {
  const router = useRouter();
  const { groupId, channelId, channelName, channelType } = useLocalSearchParams();
  const { user } = useAuth() || {};
  const [messages, setMessages] = useState<UIChannelMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChannelMessage | null>(null);
  const flatListRef = useRef<FlatList<UIChannelMessage>>(null);
  const currentUserId = user?.id ? parseInt(user.id.toString()) : undefined;

  const loadMessages = useCallback(async () => {
    if (!groupId || !channelId) return;

    try {
      setLoading(true);
      const groupIdNum = parseInt(groupId as string);
      const channelIdNum = parseInt(channelId as string);
      if (isNaN(groupIdNum) || isNaN(channelIdNum)) {
        Alert.alert('Error', 'Invalid group or channel ID');
        return;
      }
      const fetchedMessages = await groupService.getChannelMessages(
        groupIdNum,
        channelIdNum,
        currentUserId
      );
      // Sort by creation date (oldest first) and add isOwn property
      const sortedMessages = fetchedMessages
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((msg: ChannelMessage): UIChannelMessage => ({
          ...msg,
          isOwn: msg.sender.id === currentUserId,
        }));
      setMessages(sortedMessages);
      // Scroll to bottom after loading
      setTimeout(() => scrollToBottom(), 100);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [groupId, channelId, currentUserId]);

  useEffect(() => {
    if (groupId && channelId && currentUserId) {
      loadMessages();
    }
  }, [groupId, channelId, currentUserId, loadMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !groupId || !channelId) return;

    setSending(true);
    try {
      const messageContent = newMessage.trim();
      const groupIdNum = parseInt(groupId as string);
      const channelIdNum = parseInt(channelId as string);

      if (isNaN(groupIdNum) || isNaN(channelIdNum)) {
        Alert.alert('Error', 'Invalid group or channel ID');
        return;
      }

      const sentMessage = await groupService.sendChannelMessage(
        groupIdNum,
        channelIdNum,
        messageContent,
        currentUserId,
        replyingTo?.id
      );

      const newMsg: UIChannelMessage = {
        ...sentMessage,
        isOwn: true,
      };
      setMessages((prev: UIChannelMessage[]) => [...prev, newMsg]);
      setNewMessage('');
      setReplyingTo(null);

      // Scroll to bottom after sending
      setTimeout(() => scrollToBottom(), 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const addReaction = (messageId: number, emoji: string) => {
    console.log('Adding reaction:', { messageId, emoji });

    setMessages(prev => prev.map(message => {
      if (message.id === messageId) {
        const existingReaction = message.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          return {
            ...message,
            reactions: message.reactions.map(r =>
              r.emoji === emoji ? { ...r, count: r.count + 1 } : r
            )
          };
        } else {
          return {
            ...message,
            reactions: [...message.reactions, { emoji, count: 1, users: [] }]
          };
        }
      }
      return message;
    }));
  };

  const replyToMessage = (message: ChannelMessage) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'VOICE':
        return 'volume-up';
      case 'ANNOUNCEMENT':
        return 'bullhorn';
      default:
        return 'hashtag';
    }
  };

  const renderMessage = ({ item, index }: { item: UIChannelMessage; index: number }) => {
    const isSystemMessage = item.messageType === 'SYSTEM';
    const isOwn = item.isOwn ?? false;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    const showDate = !previousMessage ||
      formatDate(item.createdAt) !== formatDate(previousMessage.createdAt);

    const showAvatar = !nextMessage ||
      nextMessage.sender?.id !== item.sender?.id ||
      (nextMessage && (new Date(nextMessage.createdAt).getTime() - new Date(item.createdAt).getTime()) > 300000);

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>
              {formatDate(item.createdAt)}
            </Text>
            <View style={styles.dateLine} />
          </View>
        )}

        {isSystemMessage ? (
          <View style={styles.systemMessage}>
            <FontAwesome name="info-circle" size={14} color="#6A707C" />
            <Text style={styles.systemMessageText}>
              {item.content}
            </Text>
            <Text style={styles.systemMessageTime}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        ) : (
          <View style={[
            styles.messageContainer,
            isOwn ? styles.ownMessageContainer : styles.otherMessageContainer
          ]}>
            {item.replyTo && (
              <View style={[styles.replyContainer, isOwn && styles.ownReplyContainer]}>
                <View style={styles.replyLine} />
                <Text style={[styles.replyText, isOwn && styles.ownReplyText]}>
                  <Text style={styles.replyAuthor}>
                    {item.replyTo.sender.name}
                  </Text>
                  {' '}
                  <Text numberOfLines={1}>
                    {item.replyTo.content}
                  </Text>
                </Text>
              </View>
            )}

            {!isOwn && (
              showAvatar ? (
                <TouchableOpacity
                  style={styles.messageAvatar}
                  onPress={() => {
                    if (item.sender?.id) {
                      router.push({
                        pathname: '/user-profile',
                        params: { userId: item.sender.id.toString() },
                      });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  {item.sender.profilePicturePublicId ? (
                    <CloudinaryAvatar
                      publicId={item.sender.profilePicturePublicId}
                      size={36}
                      style={styles.avatar}
                    />
                  ) : item.sender.profilePicture ? (
                    <Image source={{ uri: item.sender.profilePicture }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.defaultAvatar]}>
                      <FontAwesome name="user" size={14} color="#6A707C" />
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.messageAvatar} />
              )
            )}

            <View style={[styles.messageBody, isOwn && styles.ownMessageBody]}>
              <View style={styles.messageHeader}>
                <Text style={[styles.senderName, isOwn && styles.ownSenderName]}>
                  {item.sender.name}
                </Text>
                {item.sender.isVerify && (
                  <FontAwesome name="check-circle" size={12} color={isOwn ? "#FFFFFF" : "#E10600"} />
                )}
                <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
                  {formatTime(item.createdAt)}
                </Text>
                {item.isEdited && (
                  <Text style={[styles.editedLabel, isOwn && styles.ownEditedLabel]}>
                    (edited)
                  </Text>
                )}
                {item.isPinned && (
                  <FontAwesome name="thumb-tack" size={10} color={isOwn ? "#FFFFFF" : "#F59E0B"} />
                )}
              </View>

              <Pressable
                onLongPress={() => replyToMessage(item)}
                style={[styles.messageTextContainer, isOwn && styles.ownMessageTextContainer]}
              >
                <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
                  {item.content}
                </Text>
              </Pressable>

              {item.reactions.length > 0 && (
                <View style={styles.reactionsContainer}>
                  {item.reactions.map((reaction, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.reactionButton}
                      onPress={() => addReaction(item.id, reaction.emoji)}
                    >
                      <Text style={styles.reactionEmoji}>
                        {reaction.emoji}
                      </Text>
                      <Text style={styles.reactionCount}>
                        {reaction.count}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={styles.addReactionButton}
                    onPress={() => {
                      const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🏎️', '🏆', '🔥'];
                      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                      addReaction(item.id, randomEmoji);
                    }}
                  >
                    <FontAwesome name="plus" size={12} color="#6A707C" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {isOwn && (
              showAvatar ? (
                <TouchableOpacity
                  style={styles.messageAvatar}
                  onPress={() => {
                    if (item.sender?.id) {
                      router.push({
                        pathname: '/user-profile',
                        params: { userId: item.sender.id.toString() },
                      });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  {item.sender.profilePicturePublicId ? (
                    <CloudinaryAvatar
                      publicId={item.sender.profilePicturePublicId}
                      size={36}
                      style={styles.avatar}
                    />
                  ) : item.sender.profilePicture ? (
                    <Image source={{ uri: item.sender.profilePicture }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.defaultAvatar]}>
                      <FontAwesome name="user" size={14} color="#6A707C" />
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.messageAvatar} />
              )
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={20} color="#6A707C" />
        </TouchableOpacity>

        <View style={styles.channelInfo}>
          <FontAwesome
            name={getChannelIcon(channelType as string)}
            size={18}
            color="#6A707C"
          />
          <Text style={styles.channelName}>
            {channelName}
          </Text>
        </View>

        <TouchableOpacity style={styles.headerButton}>
          <FontAwesome name="users" size={18} color="#6A707C" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push({
            pathname: '/(app)/group-detail',
            params: {
              groupId: groupId as string,
              groupName: channelName as string
            }
          })}
        >
          <FontAwesome name="cog" size={18} color="#6A707C" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesListContent}
          showsVerticalScrollIndicator={true}
          onContentSizeChange={() => scrollToBottom()}
        />

        {replyingTo && (
          <View style={styles.replyPreview}>
            <View style={styles.replyPreviewContent}>
              <Text style={styles.replyPreviewLabel}>
                Replying to {replyingTo.sender.name}
              </Text>
              <Text style={styles.replyPreviewText} numberOfLines={2}>
                {replyingTo.content}
              </Text>
            </View>
            <TouchableOpacity onPress={cancelReply}>
              <FontAwesome name="times" size={16} color="#6A707C" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder={`Message ${channelName}`}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <FontAwesome
              name={sending ? "circle-o-notch" : "paper-plane"}
              size={16}
              color={(!newMessage.trim() || sending) ? "#9CA3AF" : "#E10600"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default GroupChannelScreen;
