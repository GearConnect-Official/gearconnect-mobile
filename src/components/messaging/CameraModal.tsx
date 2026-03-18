import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import theme from '@/theme';
import { cloudinaryService } from '@/services/cloudinary.service';

export interface CameraMedia {
  uri: string;
  type: 'image' | 'video';
  secureUrl?: string;
  publicId?: string;
}

interface CameraModalProps {
  visible: boolean;
  onSend: (media: CameraMedia[], caption: string) => void;
  onCancel: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({
  visible,
  onSend,
  onCancel,
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (visible) {
      // Open camera directly when modal becomes visible
      takePicture();
    } else {
      // Reset state when modal closes
      setCapturedImage(null);
      setCaption('');
      setUploading(false);
    }
  }, [visible]);

  const takePicture = async () => {
    try {
      // Request permission first
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your camera to take photos.',
          [{ text: 'OK', onPress: onCancel }]
        );
        return;
      }

      // Open camera directly
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
      } else {
        // User cancelled, close modal
        onCancel();
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to open camera');
      onCancel();
    }
  };

  const handleRetake = async () => {
    setCapturedImage(null);
    setCaption('');
    // Reopen camera
    await takePicture();
  };

  const handleSend = async () => {
    if (!capturedImage) return;

    try {
      setUploading(true);

      // Upload to Cloudinary
      const uploadResult = await cloudinaryService.uploadMedia(capturedImage, {
        folder: 'messages',
        tags: ['message', 'camera', 'image'],
        resource_type: 'image',
      });

      if (!uploadResult) {
        Alert.alert('Error', 'Failed to upload image');
        setUploading(false);
        return;
      }

      // Create media object
      const media: CameraMedia[] = [{
        uri: capturedImage,
        type: 'image',
        secureUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      }];

      // Send with caption
      onSend(media, caption.trim());
      
      // Reset state
      setCapturedImage(null);
      setCaption('');
      setUploading(false);
    } catch (error) {
      console.error('Error sending camera image:', error);
      Alert.alert('Error', 'Failed to send image');
      setUploading(false);
    }
  };

  // If no image captured yet, don't show anything (camera is opening)
  if (!capturedImage) {
    return null;
  }

  // Show preview with caption input
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleRetake}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Retake</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Preview</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.previewContainer}>
            <Image
              source={{ uri: capturedImage }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              placeholder="Add a caption..."
              placeholderTextColor={theme.colors.text.secondary}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
              editable={!uploading}
            />
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.sendButton, uploading && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={uploading}
              activeOpacity={0.7}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <FontAwesome name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  cancelButton: {
    padding: theme.spacing.xs,
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 60, // Same width as cancel button for centering
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cameraHint: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    maxHeight: 500,
    borderRadius: 12,
  },
  captionContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  captionInput: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 12,
    padding: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: 16,
    minHeight: 50,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default CameraModal;
