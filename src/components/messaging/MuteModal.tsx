import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import theme from '@/theme';

export type MuteDuration = '15min' | '1h' | '3h' | '8h' | '24h' | 'forever';

interface MuteModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDuration: (duration: MuteDuration) => void;
  isMuted: boolean;
  onUnmute: () => void;
}

const MuteModal: React.FC<MuteModalProps> = ({
  visible,
  onClose,
  onSelectDuration,
  isMuted,
  onUnmute,
}) => {
  const durations: { label: string; value: MuteDuration }[] = [
    { label: '15 minutes', value: '15min' },
    { label: '1 hour', value: '1h' },
    { label: '3 hours', value: '3h' },
    { label: '8 hours', value: '8h' },
    { label: '24 hours', value: '24h' },
    { label: 'Until I change it', value: 'forever' },
  ];

  const handleUnmute = () => {
    Alert.alert(
      'Unmute',
      'Are you sure you want to unmute this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unmute',
          style: 'destructive',
          onPress: () => {
            onUnmute();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Mute Notifications</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome name="times" size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {isMuted ? (
            <View style={styles.content}>
              <Text style={styles.subtitle}>This conversation is muted</Text>
              <TouchableOpacity
                style={[styles.durationButton, styles.unmuteButton]}
                onPress={handleUnmute}
              >
                <FontAwesome name="bell" size={18} color="#FFFFFF" />
                <Text style={styles.unmuteButtonText}>Unmute</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.content}>
              <Text style={styles.subtitle}>Mute notifications for:</Text>
              {durations.map((duration) => (
                <TouchableOpacity
                  key={duration.value}
                  style={styles.durationButton}
                  onPress={() => {
                    onSelectDuration(duration.value);
                    onClose();
                  }}
                >
                  <Text style={styles.durationText}>{duration.label}</Text>
                  <FontAwesome name="chevron-right" size={16} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 16,
  },
  durationButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.grey[100],
    marginBottom: 12,
  },
  durationText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  unmuteButton: {
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    gap: 8,
  },
  unmuteButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default MuteModal;
