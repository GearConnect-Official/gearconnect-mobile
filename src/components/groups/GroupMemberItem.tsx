import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { ProfilePicture } from '@/components/ui/ProfilePicture';
import { GroupMember, GroupRole } from '@/types/group';

interface GroupMemberItemProps {
  member: GroupMember;
  onPress: () => void;
}

export const GroupMemberItem: React.FC<GroupMemberItemProps> = ({
  member,
  onPress,
}) => {
  const displayName = member.nickname || member.user.name;
  const highestRole = member.roles.reduce(
    (highest: { role: GroupRole } | null, current: { role: GroupRole }) => {
      return current.role.position > (highest?.role.position || 0)
        ? current
        : highest;
    },
    member.roles[0] || null
  );

  const formatLastActive = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Aujourd'hui";
    if (diffDays === 2) return "Hier";
    if (diffDays <= 7) return `Il y a ${diffDays - 1} jours`;
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <ProfilePicture
          publicId={member.user.profilePicturePublicId}
          imageUrl={member.user.profilePicture}
          size={40}
        />
        <View style={[styles.onlineStatus, { backgroundColor: "#10B981" }]} />
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {member.user.isVerify && (
            <FontAwesome name="check-circle" size={14} color="#E10600" />
          )}
        </View>
        <View style={styles.metaRow}>
          {highestRole && (
            <Text
              style={[
                styles.role,
                { color: highestRole.role.color || "#6A707C" },
              ]}
            >
              {highestRole.role.name}
            </Text>
          )}
          <Text style={styles.lastActive}>
            {formatLastActive(member.lastActiveAt)}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={onPress}>
        <FontAwesome name="comment" size={16} color="#6A707C" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  onlineStatus: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginRight: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  role: {
    fontSize: 12,
    marginRight: 8,
  },
  lastActive: {
    fontSize: 12,
    color: "#6A707C",
  },
  actionButton: {
    padding: 8,
  },
});
