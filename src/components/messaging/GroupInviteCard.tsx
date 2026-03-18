import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import theme from '@/theme';
import groupService from '@/services/groupService';
import { CloudinaryAvatar } from '@/components/media/CloudinaryImage';
import styles from '@/styles/components/messaging/groupInviteCardStyles';

const { width: screenWidth } = Dimensions.get('window');

export interface GroupInviteData {
  inviteCode: string;
  groupName?: string;
  groupIcon?: string;
  groupIconPublicId?: string;
}

interface GroupInviteCardProps {
  inviteData: GroupInviteData;
  isOwn: boolean;
  currentUserId: number;
}

const GroupInviteCard: React.FC<GroupInviteCardProps> = ({ inviteData, isOwn, currentUserId }) => {
  const [joining, setJoining] = useState(false);
  const [groupInfo, setGroupInfo] = useState<{ name?: string; iconPublicId?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Try to fetch group info from the invite code if not provided
    if (!inviteData.groupName && inviteData.inviteCode) {
      // We could fetch group info here, but for now we'll use what's provided
      // The backend endpoint would need to return group info when joining
    }
  }, [inviteData]);

  const handleJoin = async () => {
    if (joining) return;

    setJoining(true);
    try {
      const result = await groupService.joinGroup(inviteData.inviteCode, currentUserId);
      
      // Update group info if available
      if (result.group) {
        setGroupInfo({
          name: result.group.name,
          iconPublicId: result.group.iconPublicId,
        });
      
      Alert.alert(
        'Success',
        `You've joined ${result.group.name}!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to the group
              router.push({
                pathname: '/(app)/groupDetail',
                params: {
                  groupId: result.group.id.toString(),
                },
              });
            },
          },
        ]
      );
      } else {
        Alert.alert('Success', 'You\'ve joined the group!');
      }
    } catch (error: any) {
      console.error('Error joining group:', error);
      const errorMessage = error.response?.data?.error || 'Failed to join group';
      Alert.alert('Error', errorMessage);
    } finally {
      setJoining(false);
    }
  };

  const displayName = inviteData.groupName || groupInfo?.name || 'Group Invitation';

  return (
    <View style={[styles.container, isOwn && styles.ownContainer]}>
      <View style={styles.content}>
        {/* Group Icon or Default Icon */}
        <View style={[styles.iconContainer, isOwn && styles.ownIconContainer]}>
          {inviteData.groupIconPublicId || groupInfo?.iconPublicId ? (
            <CloudinaryAvatar
              publicId={inviteData.groupIconPublicId || groupInfo?.iconPublicId || ''}
              size={screenWidth * 0.12}
            />
          ) : (
            <FontAwesome
              name="users"
              size={screenWidth * 0.06}
              color={isOwn ? '#FFFFFF' : theme.colors.primary.main}
            />
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text
            style={[styles.groupName, isOwn && styles.ownGroupName]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {displayName}
          </Text>

          <Text style={[styles.inviteText, isOwn && styles.ownInviteText]}>
            Group Invitation
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.joinButton, isOwn && styles.ownJoinButton, joining && styles.joinButtonDisabled]}
        onPress={handleJoin}
        disabled={joining}
        activeOpacity={0.7}
      >
        {joining ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={[styles.joinButtonText, isOwn && styles.ownJoinButtonText]}>
            Join
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default GroupInviteCard;
