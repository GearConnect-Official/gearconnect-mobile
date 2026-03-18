import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import theme from '@/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MessageOptionsModalProps {
  visible: boolean;
  isOwnMessage: boolean;
  messagePosition?: { x: number; y: number; width: number; height: number };
  messageId?: number;
  onClose: () => void;
  onReply: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReaction?: (emoji: string) => void;
  onScrollToMessage?: (messageId: number) => void;
}

const reactions = ['👍', '❤️', '😂', '😮', '😢', '🙏', '😭'];

const MessageOptionsModal: React.FC<MessageOptionsModalProps> = ({
  visible,
  isOwnMessage,
  messagePosition,
  messageId,
  onClose,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  onScrollToMessage,
}) => {
  React.useEffect(() => {
    if (visible && messageId && onScrollToMessage) {
      // Scroll to message when modal opens
      setTimeout(() => {
        onScrollToMessage(messageId);
      }, 100);
    }
  }, [visible, messageId, onScrollToMessage]);

  // Calculate menu position - show on the side
  const getMenuPosition = () => {
    if (!messagePosition) {
      return { top: screenHeight / 2, left: screenWidth / 2 };
    }

    const menuWidth = 180;
    const menuHeight = isOwnMessage && onEdit ? 140 : 60;
    const spacing = 8;

    // Position on the right side for own messages, left side for others
    const left = isOwnMessage 
      ? messagePosition.x - menuWidth - spacing
      : messagePosition.x + messagePosition.width + spacing;
    
    // Center vertically with the message
    const top = messagePosition.y + (messagePosition.height / 2) - (menuHeight / 2);

    // Ensure menu stays within screen bounds
    const adjustedTop = Math.max(10, Math.min(top, screenHeight - menuHeight - 10));
    const adjustedLeft = Math.max(10, Math.min(left, screenWidth - menuWidth - 10));

    return { top: adjustedTop, left: adjustedLeft };
  };

  const menuPosition = getMenuPosition();
  const reactionBarTop = messagePosition 
    ? messagePosition.y - 50 
    : screenHeight / 2 - 50;
  
  // Center the reactions bar above the message
  const reactionsBarWidth = 280; // Approximate width of reactions bar
  const reactionBarLeft = messagePosition 
    ? Math.max(10, Math.min(
        messagePosition.x + (messagePosition.width / 2) - (reactionsBarWidth / 2),
        screenWidth - reactionsBarWidth - 10
      ))
    : screenWidth / 2 - (reactionsBarWidth / 2);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Reactions bar above message */}
        {messagePosition && (
          <View style={[styles.reactionsBar, { top: reactionBarTop, left: reactionBarLeft }]}>
            {reactions.map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={styles.reactionButton}
                onPress={() => {
                  if (onReaction) {
                    onReaction(emoji);
                  }
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.reactionButton}
              onPress={() => {
                // TODO: Open emoji picker
                onClose();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.addReactionButton}>
                <FontAwesome name="plus" size={14} color={theme.colors.text.secondary} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Options menu on the side */}
        <View style={[styles.menuContainer, { top: menuPosition.top, left: menuPosition.left }]}>
          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              onReply();
              onClose();
            }}
            activeOpacity={0.7}
          >
            <FontAwesome name="reply" size={18} color={theme.colors.text.primary} />
            <Text style={styles.optionText}>Reply</Text>
          </TouchableOpacity>

          {isOwnMessage && onEdit && (
            <TouchableOpacity
              style={styles.option}
              onPress={() => {
                onEdit();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <FontAwesome name="edit" size={18} color={theme.colors.text.primary} />
              <Text style={styles.optionText}>Edit</Text>
            </TouchableOpacity>
          )}

          {isOwnMessage && onDelete && (
            <TouchableOpacity
              style={[styles.option, styles.deleteOption]}
              onPress={() => {
                onDelete();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <FontAwesome name="trash" size={18} color={theme.colors.status.error} />
              <Text style={[styles.optionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Fond opaque sombre
  },
  reactionsBar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.grey[800],
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
    minWidth: 280,
    justifyContent: 'center',
    // Ombre
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  reactionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  reactionEmoji: {
    fontSize: 24,
  },
  addReactionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.grey[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: theme.colors.background.paper,
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 150,
    // Ombre
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  optionText: {
    fontSize: 15,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  deleteOption: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    marginTop: 4,
    paddingTop: 12,
  },
  deleteText: {
    color: theme.colors.status.error,
  },
});

export default MessageOptionsModal;
