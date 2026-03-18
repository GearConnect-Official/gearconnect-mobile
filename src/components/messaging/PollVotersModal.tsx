import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import theme from '@/theme';
import { VerifiedAvatar } from '@/components/media/VerifiedAvatar';

export interface PollVoter {
  userId: number;
  userName: string;
  userAvatar?: string;
  userAvatarPublicId?: string;
  isVerify?: boolean;
}

interface PollVotersModalProps {
  visible: boolean;
  optionText: string;
  voters: PollVoter[];
  isAnonymous: boolean;
  onClose: () => void;
}

const PollVotersModal: React.FC<PollVotersModalProps> = ({
  visible,
  optionText,
  voters = [],
  isAnonymous,
  onClose,
}) => {
  const router = useRouter();

  const handleVoterPress = (userId: number) => {
    onClose();
    router.push({
      pathname: '/userProfile',
      params: { userId: userId.toString() },
    });
  };

  const renderVoter = ({ item }: { item: PollVoter }) => {
    return (
      <TouchableOpacity
        style={styles.voterItem}
        onPress={() => handleVoterPress(item.userId)}
        activeOpacity={0.7}
      >
        <VerifiedAvatar
          publicId={item.userAvatarPublicId}
          fallbackUrl={item.userAvatar}
          size={40}
          isVerify={item.isVerify || false}
        />
        <View style={styles.voterInfo}>
          <Text style={styles.voterName}>{item.userName || 'Unknown User'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesome name="times" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Voters</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {optionText || ''}
            </Text>
          </View>
          <View style={styles.closeButton} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>
          {isAnonymous ? (
            <View style={styles.anonymousContainer}>
              <FontAwesome name="lock" size={48} color={theme.colors.text.secondary} />
              <Text style={styles.anonymousText}>
                This is an anonymous poll. Voter identities are hidden.
              </Text>
            </View>
          ) : voters.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="users" size={48} color={theme.colors.text.secondary} />
              <Text style={styles.emptyText}>No votes yet</Text>
            </View>
          ) : (
            <>
              <View style={styles.countContainer}>
                <Text style={styles.countText}>
                  {voters.length} {voters.length === 1 ? 'vote' : 'votes'}
                </Text>
              </View>
              <FlatList
                data={voters}
                renderItem={renderVoter}
                keyExtractor={(item) => item.userId.toString()}
                scrollEnabled={false}
              />
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.paper,
  },
  closeButton: {
    padding: theme.spacing.xs,
    width: 40,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  anonymousContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  anonymousText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  countContainer: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    marginBottom: theme.spacing.md,
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  voterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  voterInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  voterName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
});

export default PollVotersModal;
