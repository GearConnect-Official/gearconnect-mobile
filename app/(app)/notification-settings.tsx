import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMessage } from '@/context/MessageContext';
import { MessageType } from '@/types/messages';
import styles, { colors } from '@/styles/screens/user/settingsStyles';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

const SettingsItem: React.FC<SettingsItemProps> = ({ 
  icon, 
  title, 
  subtitle, 
  rightElement,
}) => (
  <View style={styles.settingsItem}>
    <View style={styles.settingsItemLeft}>
      <View style={styles.iconContainer}>
        <FontAwesome name={icon as any} size={20} color={colors.iconPrimary} />
      </View>
      <View style={styles.settingsItemTextContainer}>
        <Text style={styles.settingsItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    {rightElement && (
      <View style={styles.settingsItemRight}>
        {rightElement}
      </View>
    )}
  </View>
);

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { showMessage } = useMessage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Notification preferences
  const [notifyUnreadMessages, setNotifyUnreadMessages] = useState(true);
  const [notifyPendingRequests, setNotifyPendingRequests] = useState(true);
  const [notifyCommercialMessages, setNotifyCommercialMessages] = useState(true);
  const [notifyGroupMessages, setNotifyGroupMessages] = useState(true);
  const [notifyDirectMessages, setNotifyDirectMessages] = useState(true);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      setIsLoading(true);
      // TODO: Load from backend or AsyncStorage
      // For now, using defaults
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      setIsLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      setIsSaving(true);
      // TODO: Save to backend or AsyncStorage
      // For now, just save locally
      await new Promise(resolve => setTimeout(resolve, 500));
      showMessage({
        type: MessageType.SUCCESS,
        message: 'Notification settings saved',
      });
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      showMessage({
        type: MessageType.ERROR,
        message: 'Failed to save notification settings',
      });
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.statusBarBackground} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <View style={styles.placeholderRight} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.activityIndicator} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.statusBarBackground} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <TouchableOpacity
          onPress={saveNotificationSettings}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.activityIndicator} />
          ) : (
            <Text style={{ color: colors.iconPrimary, fontSize: 16, fontWeight: '600' }}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Messaging Notifications Section */}
        <SettingsSection title="Messaging Notifications">
          <SettingsItem
            icon="envelope"
            title="Unread Messages"
            subtitle="Show badge for unread messages"
            rightElement={
              <Switch
                value={notifyUnreadMessages}
                onValueChange={setNotifyUnreadMessages}
                disabled={isSaving}
                trackColor={{ false: colors.switchTrackInactive, true: colors.switchTrackActive }}
                thumbColor={notifyUnreadMessages ? colors.switchThumbActive : colors.switchThumbInactive}
              />
            }
          />
          <SettingsItem
            icon="user-plus"
            title="Pending Requests"
            subtitle="Show badge for message requests"
            rightElement={
              <Switch
                value={notifyPendingRequests}
                onValueChange={setNotifyPendingRequests}
                disabled={isSaving}
                trackColor={{ false: colors.switchTrackInactive, true: colors.switchTrackActive }}
                thumbColor={notifyPendingRequests ? colors.switchThumbActive : colors.switchThumbInactive}
              />
            }
          />
          <SettingsItem
            icon="briefcase"
            title="Commercial Messages"
            subtitle="Show badge for commercial conversations"
            rightElement={
              <Switch
                value={notifyCommercialMessages}
                onValueChange={setNotifyCommercialMessages}
                disabled={isSaving}
                trackColor={{ false: colors.switchTrackInactive, true: colors.switchTrackActive }}
                thumbColor={notifyCommercialMessages ? colors.switchThumbActive : colors.switchThumbInactive}
              />
            }
          />
        </SettingsSection>

        {/* Message Types Section */}
        <SettingsSection title="Message Types">
          <SettingsItem
            icon="users"
            title="Group Messages"
            subtitle="Receive notifications for group messages"
            rightElement={
              <Switch
                value={notifyGroupMessages}
                onValueChange={setNotifyGroupMessages}
                disabled={isSaving}
                trackColor={{ false: colors.switchTrackInactive, true: colors.switchTrackActive }}
                thumbColor={notifyGroupMessages ? colors.switchThumbActive : colors.switchThumbInactive}
              />
            }
          />
          <SettingsItem
            icon="user"
            title="Direct Messages"
            subtitle="Receive notifications for direct messages"
            rightElement={
              <Switch
                value={notifyDirectMessages}
                onValueChange={setNotifyDirectMessages}
                disabled={isSaving}
                trackColor={{ false: colors.switchTrackInactive, true: colors.switchTrackActive }}
                thumbColor={notifyDirectMessages ? colors.switchThumbActive : colors.switchThumbInactive}
              />
            }
          />
        </SettingsSection>
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}
