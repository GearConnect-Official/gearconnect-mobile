import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useCloudinary } from '@/hooks/useCloudinary';
import { CloudinaryUploadResponse, cloudinaryService } from '@/services/cloudinary.service';
import { publicationStyles as styles } from '@/styles/screens';
import * as ImagePicker from 'expo-image-picker';

// Racing color palette
const THEME_COLORS = {
  primary: '#E10600', // Racing Red
  secondary: '#1E1E1E', // Racing Black
  background: '#FFFFFF',
  textSecondary: '#6E6E6E',
  border: '#E0E0E0',
  cardLight: '#F8F8F8',
};

interface MediaSectionProps {
  onImageSelected: (cloudinaryResponse: CloudinaryUploadResponse) => void;
}

const MediaSection: React.FC<MediaSectionProps> = ({ onImageSelected }) => {
  const { uploadFromCamera, clearError } = useCloudinary();
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearLocalError = () => {
    setError(null);
  };

  const handleSelectFromGallery = async () => {
    try {
      setUploading(true);
      setError(null);
      setUploadProgress('Sélection du média...');
      
      // Utiliser directement expo-image-picker avec support images et vidéos
      await ImagePicker.requestMediaLibraryPermissionsAsync();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Support images ET vidéos
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1.0, // Qualité maximale pour préserver la résolution originale
      });

      if (result.canceled || !result.assets[0]) {
        setUploadProgress('');
        return;
      }

      const asset = result.assets[0];
      const resourceType = asset.type === 'video' ? 'video' : 'image';
      
      setUploadProgress(`Upload ${resourceType}...`);
      
      // Utiliser le service Cloudinary importé statiquement
      const uploadResult = await cloudinaryService.uploadMedia(
        asset.uri,
        {
          folder: 'posts',
          tags: ['post', 'gallery', resourceType],
          resource_type: resourceType,
        }
      );
      
      if (uploadResult) {
        setUploadProgress('Upload terminé !');
        onImageSelected(uploadResult);
        setTimeout(() => setUploadProgress(''), 2000);
      } else {
        setUploadProgress('');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'upload';
      setError(errorMessage);
      Alert.alert('Erreur', errorMessage);
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      clearError();
      setUploadProgress('Prise de photo/vidéo...');
      
      const result = await uploadFromCamera({
        folder: 'posts',
        tags: ['post', 'camera'],
      });
      
      if (result) {
        setUploadProgress('Upload terminé !');
        onImageSelected(result);
        setTimeout(() => setUploadProgress(''), 2000);
      } else {
        setUploadProgress('');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'upload';
      Alert.alert('Erreur', errorMessage);
      setUploadProgress('');
    }
  };

  return (
    <View style={styles.mediaSectionContainer}>
      <Text style={styles.mediaSectionTitle}>Create a Post</Text>
      
      <Text style={styles.mediaSectionSubtitle}>
        Share your best racing photos, videos, cars, events and more.
      </Text>
      
      {uploadProgress && (
        <View style={styles.mediaSectionProgressContainer}>
          <Text style={styles.mediaSectionProgressText}>{uploadProgress}</Text>
        </View>
      )}
      
      {error && (
        <View style={styles.mediaSectionErrorContainer}>
          <Text style={styles.mediaSectionErrorText}>{error}</Text>
          <TouchableOpacity onPress={clearLocalError}>
            <FontAwesome name="times" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.mediaSectionButtonContainer}>
        <TouchableOpacity 
          style={[styles.mediaSectionOptionButton, uploading && styles.mediaSectionDisabledButton]}
          onPress={handleSelectFromGallery}
          disabled={uploading}
        >
          <View style={styles.mediaSectionIconContainer}>
            <FontAwesome name="image" size={30} color={THEME_COLORS.background} />
          </View>
          <Text style={styles.mediaSectionButtonLabel}>Gallery</Text>
          <Text style={styles.mediaSectionButtonDescription}>
            {uploading ? 'Uploading...' : 'Photos & Videos'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.mediaSectionOptionButton, uploading && styles.mediaSectionDisabledButton]}
          onPress={handleTakePhoto}
          disabled={uploading}
        >
          <View style={styles.mediaSectionIconContainer}>
            <FontAwesome name="camera" size={30} color={THEME_COLORS.background} />
          </View>
          <Text style={styles.mediaSectionButtonLabel}>Camera</Text>
          <Text style={styles.mediaSectionButtonDescription}>
            {uploading ? 'Uploading...' : 'Photo/Video'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MediaSection;