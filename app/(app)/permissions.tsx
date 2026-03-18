import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import * as Calendar from 'expo-calendar';
import { Audio } from 'expo-av';
import theme from '@/styles/config/theme';

type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'checking';

interface Permission {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: PermissionStatus;
  checkPermission: () => Promise<PermissionStatus>;
}

export default function PermissionsScreen() {
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const checkCameraPermission = async (): Promise<PermissionStatus> => {
    try {
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
    } catch {
      return 'undetermined';
    }
  };

  const checkMediaLibraryPermission = async (): Promise<PermissionStatus> => {
    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
    } catch {
      return 'undetermined';
    }
  };

  const checkContactsPermission = async (): Promise<PermissionStatus> => {
    try {
      const { status } = await Contacts.getPermissionsAsync();
      return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
    } catch {
      return 'undetermined';
    }
  };

  const checkLocationPermission = async (): Promise<PermissionStatus> => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
    } catch {
      return 'undetermined';
    }
  };

  const checkCalendarPermission = async (): Promise<PermissionStatus> => {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
    } catch {
      return 'undetermined';
    }
  };

  const checkMicrophonePermission = async (): Promise<PermissionStatus> => {
    try {
      const { status } = await Audio.getPermissionsAsync();
      return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
    } catch {
      return 'undetermined';
    }
  };

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const [cameraStatus, mediaStatus, contactsStatus, locationStatus, calendarStatus, microphoneStatus] = await Promise.all([
        checkCameraPermission(),
        checkMediaLibraryPermission(),
        checkContactsPermission(),
        checkLocationPermission(),
        checkCalendarPermission(),
        checkMicrophonePermission(),
      ]);

      setPermissions([
        {
          id: 'camera',
          name: 'Camera',
          description: 'Take photos and videos',
          icon: 'camera',
          status: cameraStatus,
          checkPermission: checkCameraPermission,
        },
        {
          id: 'photos',
          name: 'Photos',
          description: 'Access your photo library',
          icon: 'image',
          status: mediaStatus,
          checkPermission: checkMediaLibraryPermission,
        },
        {
          id: 'contacts',
          name: 'Contacts',
          description: 'Share contacts in conversations',
          icon: 'user',
          status: contactsStatus,
          checkPermission: checkContactsPermission,
        },
        {
          id: 'location',
          name: 'Location',
          description: 'Share your location in conversations',
          icon: 'map-marker',
          status: locationStatus,
          checkPermission: checkLocationPermission,
        },
        {
          id: 'calendar',
          name: 'Calendar',
          description: 'Add appointments to your calendar',
          icon: 'calendar',
          status: calendarStatus,
          checkPermission: checkCalendarPermission,
        },
        {
          id: 'microphone',
          name: 'Microphone',
          description: 'Record voice messages',
          icon: 'microphone',
          status: microphoneStatus,
          checkPermission: checkMicrophonePermission,
        },
      ]);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const handleOpenSettings = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Unable to open settings. Please go to your device settings manually.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRequestPermission = async (permission: Permission) => {
    try {
      let newStatus: PermissionStatus = 'undetermined';

      switch (permission.id) {
        case 'camera':
          const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
          newStatus = cameraResult.status === 'granted' ? 'granted' : 'denied';
          break;
        case 'photos':
          const mediaResult = await MediaLibrary.requestPermissionsAsync();
          newStatus = mediaResult.status === 'granted' ? 'granted' : 'denied';
          break;
        case 'contacts':
          const contactsResult = await Contacts.requestPermissionsAsync();
          newStatus = contactsResult.status === 'granted' ? 'granted' : 'denied';
          break;
        case 'location':
          const locationResult = await Location.requestForegroundPermissionsAsync();
          newStatus = locationResult.status === 'granted' ? 'granted' : 'denied';
          break;
        case 'calendar':
          const calendarResult = await Calendar.requestCalendarPermissionsAsync();
          newStatus = calendarResult.status === 'granted' ? 'granted' : 'denied';
          break;
        case 'microphone':
          const microphoneResult = await Audio.requestPermissionsAsync();
          newStatus = microphoneResult.status === 'granted' ? 'granted' : 'denied';
          break;
      }

      // Update permission status
      setPermissions((prev) =>
        prev.map((p) => (p.id === permission.id ? { ...p, status: newStatus } : p))
      );

      if (newStatus === 'denied') {
        Alert.alert(
          'Permission Denied',
          'To change this permission, please go to your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: handleOpenSettings },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Error', 'Failed to request permission');
    }
  };

  const getStatusColor = (status: PermissionStatus) => {
    switch (status) {
      case 'granted':
        return '#34C759'; // Green
      case 'denied':
        return '#FF3B30'; // Red
      case 'undetermined':
        return '#FF9500'; // Orange
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusText = (status: PermissionStatus) => {
    switch (status) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      case 'undetermined':
        return 'Not Set';
      default:
        return 'Unknown';
    }
  };

  const renderPermissionItem = (permission: Permission) => {
    const statusColor = getStatusColor(permission.status);
    const statusText = getStatusText(permission.status);

    return (
      <View key={permission.id} style={styles.permissionItem}>
        <View style={styles.permissionLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${statusColor}20` }]}>
            <FontAwesome name={permission.icon as any} size={24} color={statusColor} />
          </View>
          <View style={styles.permissionInfo}>
            <Text style={styles.permissionName}>{permission.name}</Text>
            <Text style={styles.permissionDescription}>{permission.description}</Text>
          </View>
        </View>
        <View style={styles.permissionRight}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
          {permission.status === 'denied' ? (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleOpenSettings}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsButtonText}>Settings</Text>
            </TouchableOpacity>
          ) : permission.status === 'undetermined' ? (
            <TouchableOpacity
              style={styles.requestButton}
              onPress={() => handleRequestPermission(permission)}
              activeOpacity={0.7}
            >
              <Text style={styles.requestButtonText}>Allow</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <FontAwesome name="arrow-left" size={20} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Permissions</Text>
        <View style={styles.placeholderRight} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading permissions...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.infoContainer}>
            <FontAwesome name="info-circle" size={20} color={theme.colors.primary.main} />
            <Text style={styles.infoText}>
              Manage app permissions. To revoke a permission, tap "Settings" and change it in your device settings.
            </Text>
          </View>

          <View style={styles.permissionsList}>
            {permissions.map(renderPermissionItem)}
          </View>

          <View style={styles.helpContainer}>
            <Text style={styles.helpTitle}>How to revoke permissions:</Text>
            <Text style={styles.helpText}>
              {Platform.OS === 'ios'
                ? 'Go to Settings > Privacy & Security > [Permission Type] > GearConnect and toggle off the permission.'
                : 'Go to Settings > Apps > GearConnect > Permissions and toggle off the permission.'}
            </Text>
            <TouchableOpacity
              style={styles.openSettingsButton}
              onPress={handleOpenSettings}
              activeOpacity={0.7}
            >
              <FontAwesome name="cog" size={18} color="#FFFFFF" />
              <Text style={styles.openSettingsButtonText}>Open Device Settings</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 0,
    backgroundColor: '#fff',
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center' as const,
  },
  placeholderRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.primary.light + '20',
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 12,
    gap: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  permissionsList: {
    paddingHorizontal: theme.spacing.md,
  },
  permissionItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: theme.colors.background.paper,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  permissionLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: theme.spacing.md,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionName: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  permissionRight: {
    alignItems: 'flex-end' as const,
    gap: theme.spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
    gap: theme.spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  requestButton: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  settingsButton: {
    backgroundColor: theme.colors.grey[200],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  helpContainer: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  helpText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  openSettingsButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: theme.colors.primary.main,
    padding: theme.spacing.md,
    borderRadius: 12,
    gap: theme.spacing.sm,
  },
  openSettingsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  bottomSpace: {
    height: theme.spacing.xl,
  },
};
