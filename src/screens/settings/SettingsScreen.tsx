import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useMessage } from '@/context/MessageContext';
import MessageService from '@/services/messageService';
import { MessageType } from '@/types/message.types';
import styles, { colors } from '@/styles/screens/user/settingsStyles';


interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isDestructive?: boolean;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  children,
}) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  isDestructive = false,
}) => (
  <TouchableOpacity
    style={styles.settingsItem}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.settingsItemLeft}>
      <View
        style={[
          styles.iconContainer,
          isDestructive ? styles.destructiveIconContainer : null,
        ]}
      >
        <FontAwesome
          name={icon}
          size={20}
          color={isDestructive ? colors.iconError : colors.iconPrimary}
        />
      </View>
      <View style={styles.settingsItemTextContainer}>
        <Text
          style={[
            styles.settingsItemTitle,
            isDestructive ? styles.destructiveText : null,
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
        )}
      </View>
    </View>
    <View style={styles.settingsItemRight}>
      {rightElement ||
        (onPress && (
          <FontAwesome
            name="chevron-right"
            size={16}
            color={colors.iconChevron}
          />
        ))}
    </View>
  </TouchableOpacity>
);

const SettingsScreen: React.FC = () => {
  const router = useRouter();
  const auth = useAuth();
  const { showMessage, showConfirmation } = useMessage();
  const [isFetchingUser, setIsFetchingUser] = useState(true);
  const [appVersion] = useState("1.0.0");

  // Initial load of user preferences
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        // fetch user preferences or local storage
        setTimeout(() => {
          setIsFetchingUser(false);
        }, 500);
      } catch (error) {
        console.error("Error loading user preferences:", error);
        setIsFetchingUser(false);
      }
    };

    loadUserPreferences();
  }, []);

  const handlePrivacySettings = () => {
    router.push('/privacySettings');
  };

  const handleAccountSettings = () => {
    router.push('/editProfile');
  };

  const handleVerificationRequest = () => {
    router.push('/verificationRequest');
  };

  const handleHelpCenter = async () => {
    try {
      const url = 'https://gearconnect-landing.vercel.app/faq';
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        showMessage({
          type: MessageType.ERROR,
          message: 'Unable to open the help center link'
        });
      }
    } catch (error) {
      // L'erreur peut survenir même si l'URL s'ouvre correctement
      // On ne l'affiche pas à l'utilisateur car l'action a probablement réussi
      console.log('Help center link opened (error can be ignored):', error);
    }
  };

  const handleTermsAndConditions = () => {
    router.push('/termsAndConditions');
  };

  const handleLogout = async () => {
    showConfirmation({
      ...MessageService.CONFIRMATIONS.LOGOUT,
      onConfirm: async () => {
        try {
          if (auth?.logout) {
            await auth.logout();
            router.replace("/(auth)");
          }
        } catch (error) {
          console.error("Error during logout:", error);
          showMessage(MessageService.ERROR.LOGOUT_FAILED);
        }
      },
    });
  };

  if (isFetchingUser) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
        edges={["top", "left", "right"]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.statusBarBackground}
          translucent={true}
        />
        <ActivityIndicator size="large" color={colors.activityIndicator} />
        <Text style={styles.loadingText}>Loading settings...</Text>
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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholderRight} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <SettingsSection title="Account">
          <SettingsItem
            icon="user"
            title="Account Settings"
            subtitle="Manage your profile information"
            onPress={handleAccountSettings}
          />
          <SettingsItem
            icon="lock"
            title="Privacy Settings"
            subtitle="Control your privacy preferences"
            onPress={handlePrivacySettings}
          />
          <SettingsItem
            icon="check-circle"
            title="Request Verification"
            subtitle="Apply for account verification"
            onPress={handleVerificationRequest}
          />
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection title="Notifications">
          <SettingsItem
            icon="bell"
            title="Messaging Notifications"
            subtitle="Control what notifications you receive"
            onPress={() => router.push('/notificationSettings')}
          />
        </SettingsSection>

        {/* Permissions Section */}
        <SettingsSection title="Permissions">
          <SettingsItem
            icon="shield"
            title="App Permissions"
            subtitle="Manage camera, photos, contacts permissions"
            onPress={() => router.push('/permissions')}
          />
        </SettingsSection>
        
        {/* Support Section */}
        <SettingsSection title="Support">
          <SettingsItem
            icon="question-circle"
            title="Help Center"
            subtitle="Get assistance and answers to your questions"
            onPress={handleHelpCenter}
          />
          <SettingsItem
            icon="file-text-o"
            title="Terms & Conditions"
            subtitle="Review our terms of service"
            onPress={handleTermsAndConditions}
          />
          <SettingsItem
            icon="info-circle"
            title="App Version"
            subtitle="Current version of the application"
            rightElement={
              <Text style={styles.settingsItemValue}>{appVersion}</Text>
            }
          />
        </SettingsSection>
        
        {/* Actions Section */}
        <SettingsSection title="Actions">
          <SettingsItem
            icon="sign-out"
            title="Logout"
            subtitle="Sign out of your account"
            onPress={handleLogout}
          />
        </SettingsSection>
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles are imported from settingsStyles.ts

export default SettingsScreen;
