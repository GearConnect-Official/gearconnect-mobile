import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useMessage } from '@/context/MessageContext';
import { privacySettingsService } from '@/services/privacySettingsService';
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
  rightElement
}) => (
  <View style={styles.settingsItem}>
    <View style={styles.settingsItemLeft}>
      <View style={styles.iconContainer}>
        <FontAwesome 
          name={icon} 
          size={20} 
          color={colors.iconPrimary} 
        />
      </View>
      <View style={styles.settingsItemTextContainer}>
        <Text style={styles.settingsItemTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
        )}
      </View>
    </View>
    <View style={styles.settingsItemRight}>
      {rightElement}
    </View>
  </View>
);

const PrivacySettingsScreen: React.FC = () => {
  const router = useRouter();
  const authContext = useAuth();
  const user = authContext?.user;
  const { showMessage } = useMessage();
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [allowMessages, setAllowMessages] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadPrivacySettings = useCallback(async () => {
    if (!user?.id) {
      showMessage({
        type: MessageType.ERROR,
        message: 'User not authenticated',
      });
      return;
    }

    try {
      setIsLoading(true);
      const result = await privacySettingsService.getPrivacySettings(Number(user.id));
      
      if (result.success && result.data) {
        setProfileVisibility(result.data.profileVisibility);
        setShowEmail(result.data.showEmail);
        setAllowMessages(result.data.allowMessages);
        setShowActivity(result.data.showActivity);
      } else {
        showMessage({
          type: MessageType.ERROR,
          message: result.error || 'Failed to load privacy settings',
        });
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      showMessage({
        type: MessageType.ERROR,
        message: 'Failed to load privacy settings',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, showMessage]);

  // Load privacy settings on mount
  useEffect(() => {
    loadPrivacySettings();
  }, [loadPrivacySettings]);

  const updateSetting = async (
    setting: 'profileVisibility' | 'showEmail' | 'allowMessages' | 'showActivity',
    value: boolean
  ) => {
    if (!user?.id) {
      showMessage({
        type: MessageType.ERROR,
        message: 'User not authenticated',
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Update local state immediately for better UX
      switch (setting) {
        case 'profileVisibility':
          setProfileVisibility(value);
          break;
        case 'showEmail':
          setShowEmail(value);
          break;
        case 'allowMessages':
          setAllowMessages(value);
          break;
        case 'showActivity':
          setShowActivity(value);
          break;
      }

      // Update on server
      const result = await privacySettingsService.updateSingleSetting(Number(user.id), setting, value);
      
      if (!result.success) {
        // Revert on error
        showMessage({
          type: MessageType.ERROR,
          message: result.error || 'Failed to update setting',
        });
        // Reload settings to get correct state
        await loadPrivacySettings();
      } else {
        showMessage({
          type: MessageType.SUCCESS,
          message: 'Privacy setting updated successfully',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      showMessage({
        type: MessageType.ERROR,
        message: 'Failed to update setting',
      });
      // Reload settings to get correct state
      await loadPrivacySettings();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
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
          <Text style={styles.headerTitle}>Privacy Settings</Text>
          <View style={styles.placeholderRight} />
        </View>
        
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.activityIndicator} />
          <Text style={{ marginTop: 16, color: colors.textPrimary }}>
            Loading privacy settings...
          </Text>
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
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <View style={styles.placeholderRight} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Privacy Section */}
        <SettingsSection title="Profile Privacy">
          <SettingsItem
            icon="eye"
            title="Profile Visibility"
            subtitle="Control who can see your profile"
            rightElement={
              <Switch
                value={profileVisibility}
                onValueChange={(value) => updateSetting('profileVisibility', value)}
                disabled={isSaving}
                trackColor={{ false: colors.switchTrackInactive, true: colors.switchTrackActive }}
                thumbColor={profileVisibility ? colors.switchThumbActive : colors.switchThumbInactive}
              />
            }
          />
          <SettingsItem
            icon="envelope"
            title="Show Email Address"
            subtitle="Display your email on your profile"
            rightElement={
              <Switch
                value={showEmail}
                onValueChange={(value) => updateSetting('showEmail', value)}
                disabled={isSaving}
                trackColor={{ false: colors.switchTrackInactive, true: colors.switchTrackActive }}
                thumbColor={showEmail ? colors.switchThumbActive : colors.switchThumbInactive}
              />
            }
          />
        </SettingsSection>
        
        {/* Messages Section */}
        <SettingsSection title="Messages">
          <SettingsItem
            icon="comments"
            title="Allow Messages"
            subtitle="Let others send you messages"
            rightElement={
              <Switch
                value={allowMessages}
                onValueChange={(value) => updateSetting('allowMessages', value)}
                disabled={isSaving}
                trackColor={{ false: colors.switchTrackInactive, true: colors.switchTrackActive }}
                thumbColor={allowMessages ? colors.switchThumbActive : colors.switchThumbInactive}
              />
            }
          />
        </SettingsSection>
        
        {/* Activity Section */}
        <SettingsSection title="Activity">
          <SettingsItem
            icon="clock-o"
            title="Show Activity Status"
            subtitle="Display when you're online"
            rightElement={
              <Switch
                value={showActivity}
                onValueChange={(value) => updateSetting('showActivity', value)}
                disabled={isSaving}
                trackColor={{ false: colors.switchTrackInactive, true: colors.switchTrackActive }}
                thumbColor={showActivity ? colors.switchThumbActive : colors.switchThumbInactive}
              />
            }
          />
        </SettingsSection>
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacySettingsScreen;

