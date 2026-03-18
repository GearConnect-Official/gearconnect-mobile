import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import styles from '@/styles/Profile/menuProfileStyles';

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
  onSettingsPress: () => void;
  onEditProfilePress: () => void;
  onLogoutPress: () => void;
  onPerformancesPress?: () => void;
  userId: number;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  onPress,
  color = "#1E1E1E",
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <FontAwesome5 name={icon} size={18} color={color} style={styles.menuIcon} />
    <Text style={[styles.menuText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const ProfileMenu: React.FC<ProfileMenuProps> = ({
  visible,
  onClose,
  onSettingsPress,
  onEditProfilePress,
  onLogoutPress,
  onPerformancesPress,
  userId,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.menuContainer}>
          <View>
            <MenuItem icon="cog" label="Settings" onPress={onSettingsPress} />
            {/* <MenuItem
              icon="user-edit"
              label="Edit Profile"
              onPress={() => {
                onClose();
                onEditProfilePress();
              }}
            /> */}
            <View style={styles.separator} />
            <MenuItem
              icon="sign-out-alt"
              label="Logout"
              onPress={onLogoutPress}
              color="#E10600"
            />
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default ProfileMenu;
