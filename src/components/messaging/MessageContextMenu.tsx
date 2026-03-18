import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import theme from '@/theme';

export interface MessageContextMenuOption {
  label: string;
  icon: string;
  onPress: () => void;
  color?: string;
}

interface MessageContextMenuProps {
  visible: boolean;
  options: MessageContextMenuOption[];
  onClose: () => void;
}

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  visible,
  options,
  onClose,
}) => {
  const handleOptionPress = (onPress: () => void) => {
    onPress();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menuContainer}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === options.length - 1 && styles.lastMenuItem,
              ]}
              onPress={() => handleOptionPress(option.onPress)}
              activeOpacity={0.7}
            >
              <FontAwesome
                name={option.icon as any}
                size={20}
                color={option.color || theme.colors.text.primary}
              />
              <Text
                style={[
                  styles.menuItemText,
                  option.color && { color: option.color },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
});

export default MessageContextMenu;
