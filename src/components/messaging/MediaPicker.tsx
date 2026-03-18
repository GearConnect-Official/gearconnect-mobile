import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '@/theme';
import cloudinaryService from '@/services/cloudinary.service';

export interface SelectedMedia {
  uri: string;
  type: 'image' | 'video';
  publicId?: string;
  secureUrl?: string;
}

interface MediaPickerProps {
  onSend: (media: SelectedMedia[], caption: string) => void;
  onCancel: () => void;
}

const MediaPicker: React.FC<MediaPickerProps> = ({ onSend, onCancel }) => {
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [currentTab, setCurrentTab] = useState<'Photos' | 'Albums'>('Photos');

  const requestPermissions = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photos to send media.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  }, []);

  const handleSelectMedia = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 1.0,
        videoQuality: ImagePicker.VideoQuality.High,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const newMedia: SelectedMedia[] = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
      }));

      setSelectedMedia((prev) => [...prev, ...newMedia]);
    } catch (error) {
      console.error('Error selecting media:', error);
      Alert.alert('Error', 'Failed to select media');
    }
  }, [requestPermissions]);

  const handleRemoveMedia = useCallback((index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSend = useCallback(async () => {
    if (selectedMedia.length === 0) {
      Alert.alert('No Media', 'Please select at least one media item');
      return;
    }

    try {
      setUploading(true);

      // Validate and filter out media with invalid URIs
      const validMedia = selectedMedia.filter(media => {
        if (!media.uri || media.uri === 'null' || media.uri.trim() === '') {
          console.warn('Skipping media with invalid URI:', media);
          return false;
        }
        return true;
      });

      if (validMedia.length === 0) {
        Alert.alert('Error', 'No valid media files to upload. Please select media again.');
        setUploading(false);
        return;
      }

      // Upload all valid media to Cloudinary
      const uploadedMedia: SelectedMedia[] = await Promise.all(
        validMedia.map(async (media, index) => {
          try {
            if (!media.uri || media.uri === 'null' || media.uri.trim() === '') {
              throw new Error(`Invalid URI for media at index ${index}`);
            }

          const uploadResult = await cloudinaryService.uploadMedia(media.uri, {
            folder: 'messages',
            tags: ['message', media.type],
            resource_type: media.type,
          });

          return {
            ...media,
            publicId: uploadResult.public_id,
            secureUrl: uploadResult.secure_url,
          };
          } catch (error: any) {
            console.error(`Error uploading media at index ${index}:`, error);
            throw new Error(`Failed to upload media: ${error.message || 'Unknown error'}`);
          }
        })
      );

      onSend(uploadedMedia, caption);
    } catch (error: any) {
      console.error('Error uploading media:', error);
      Alert.alert('Error', error.message || 'Failed to upload media. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [selectedMedia, caption, onSend]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, currentTab === 'Photos' && styles.activeTab]}
            onPress={() => setCurrentTab('Photos')}
          >
            <Text style={[styles.tabText, currentTab === 'Photos' && styles.activeTabText]}>
              Photos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, currentTab === 'Albums' && styles.activeTab]}
            onPress={() => setCurrentTab('Albums')}
          >
            <Text style={[styles.tabText, currentTab === 'Albums' && styles.activeTabText]}>
              Albums
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.placeholder} />
      </View>

      {/* Media Grid */}
      <ScrollView style={styles.mediaGrid}>
        {selectedMedia.length > 0 && (
          <View style={styles.selectedMediaContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedMediaScroll}>
              {selectedMedia.map((media, index) => (
                <View key={index} style={styles.selectedMediaItem}>
                  <Image
                    source={{ uri: media.uri }}
                    style={styles.selectedMediaImage}
                    resizeMode="cover"
                  />
                  {media.type === 'video' && (
                    <View style={styles.videoBadge}>
                      <FontAwesome name="play" size={12} color="#FFFFFF" />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveMedia(index)}
                  >
                    <FontAwesome name="times-circle" size={20} color="#E10600" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Placeholder for gallery - in real implementation, this would show actual gallery */}
        <View style={styles.galleryPlaceholder}>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={handleSelectMedia}
            disabled={uploading}
          >
            <FontAwesome name="image" size={48} color={theme.colors.text.secondary} />
            <Text style={styles.selectButtonText}>Select from Gallery</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Caption Input */}
      <View style={styles.captionContainer}>
        <TextInput
          style={styles.captionInput}
          placeholder="Add a caption..."
          placeholderTextColor={theme.colors.text.secondary}
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (uploading || selectedMedia.length === 0) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={uploading || selectedMedia.length === 0}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <FontAwesome name="send" size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.paper,
  },
  cancelButton: {
    padding: theme.spacing.xs,
  },
  cancelText: {
    fontSize: 16,
    color: theme.colors.primary.main,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.grey[200],
    borderRadius: 8,
    padding: 2,
  },
  tab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: theme.colors.background.paper,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  placeholder: {
    width: 60, // Same width as cancel button to center tabs
  },
  mediaGrid: {
    flex: 1,
  },
  selectedMediaContainer: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  selectedMediaScroll: {
    paddingHorizontal: theme.spacing.sm,
  },
  selectedMediaItem: {
    width: 100,
    height: 100,
    marginRight: theme.spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedMediaImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 2,
  },
  galleryPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  selectButton: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  selectButtonText: {
    marginTop: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  captionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.paper,
  },
  captionInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.grey[100],
    borderRadius: 20,
    fontSize: 15,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.grey[300],
    opacity: 0.5,
  },
});

export default MediaPicker;
