import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useCloudinary } from '@/hooks/useCloudinary';
import { CloudinaryUploadResponse } from '@/services/cloudinary.service';
import { cloudinaryVideoUploadStyles } from '@/styles/components/cloudinaryStyles';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { CloudinaryUploadOptions } from '@/services/cloudinary.service';
import { cloudinaryUploadStyles } from '@/styles/components/cloudinaryStyles';
import { useMessage } from '@/context/MessageContext';
import MessageService from '@/services/messageService';
import { QuickMessages } from '@/utils/messageUtils';

export interface CloudinaryVideoUploadProps {
  onUploadComplete?: (response: CloudinaryUploadResponse) => void;
  onUploadError?: (error: string) => void;
  folder?: string;
  tags?: string[];
  allowMultiple?: boolean;
  maxVideos?: number;
  style?: any;
  buttonText?: string;
  showPreview?: boolean;
}

export const CloudinaryVideoUpload: React.FC<CloudinaryVideoUploadProps> = ({
  onUploadComplete,
  onUploadError,
  folder,
  tags = [],
  allowMultiple = false,
  maxVideos = 3,
  style,
  buttonText = 'Ajouter une vidéo',
  showPreview = true,
}) => {
  const { uploading, error, uploadVideo, uploadFromCamera, clearError } = useCloudinary();
  const [uploadedVideos, setUploadedVideos] = useState<CloudinaryUploadResponse[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { showError, showMessage } = useMessage();

  const handleUploadOption = () => {
    Alert.alert(
      'Sélectionner une source',
      'D\'où voulez-vous importer votre vidéo ?',
      [
        {
          text: 'Galerie',
          onPress: handleGalleryUpload,
        },
        {
          text: 'Caméra',
          onPress: handleCameraUpload,
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const handleGalleryUpload = async () => {
    try {
      clearError();
      
      const result = await uploadVideo({
        folder,
        tags,
      });
      
      if (result) {
        setUploadedVideos(prev => [...prev, result]);
        onUploadComplete?.(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'upload';
      onUploadError?.(errorMessage);
    }
  };

  const handleCameraUpload = async () => {
    try {
      clearError();
      
      const result = await uploadFromCamera({
        folder,
        tags,
        resource_type: 'video',
      });
      
      if (result && result.resource_type === 'video') {
        setUploadedVideos(prev => [...prev, result]);
        onUploadComplete?.(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'upload';
      onUploadError?.(errorMessage);
    }
  };

  const removeVideo = (index: number) => {
    setUploadedVideos(prev => prev.filter((_, i) => i !== index));
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const canAddMore = !allowMultiple ? uploadedVideos.length === 0 : uploadedVideos.length < maxVideos;

  const pickAndUploadVideo = async () => {
    try {
      // ... existing video picking logic ...
      
      if (result.canceled) {
        return;
      }

      // ... existing upload logic ...
      
    } catch (error: any) {
      console.error('Error uploading video:', error);
      const errorMessage = error?.message || 'Failed to upload video';
      
      // REMPLACÉ: Alert.alert par le système centralisé
      showError(errorMessage);
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={[cloudinaryVideoUploadStyles.container, style]}>
      {/* Bouton d'upload */}
      {canAddMore && (
        <TouchableOpacity
          style={[cloudinaryVideoUploadStyles.uploadButton, uploading && cloudinaryVideoUploadStyles.uploadButtonDisabled]}
          onPress={handleUploadOption}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#007AFF" size="small" />
          ) : (
            <Ionicons name="videocam" size={24} color="#007AFF" />
          )}
          <Text style={cloudinaryVideoUploadStyles.uploadButtonText}>
            {uploading ? 'Upload en cours...' : buttonText}
          </Text>
        </TouchableOpacity>
      )}

      {/* Affichage des erreurs */}
      {error && (
        <View style={cloudinaryVideoUploadStyles.errorContainer}>
          <Text style={cloudinaryVideoUploadStyles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Ionicons name="close" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}

      {/* Prévisualisation des vidéos */}
      {showPreview && uploadedVideos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={cloudinaryVideoUploadStyles.previewContainer}>
          {uploadedVideos.map((video, index) => (
            <View key={video.public_id} style={cloudinaryVideoUploadStyles.videoPreview}>
              <Video
                source={{ uri: video.secure_url }}
                style={cloudinaryVideoUploadStyles.previewVideo}
                useNativeControls
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
              />
              
              {/* Informations sur la vidéo */}
              <View style={cloudinaryVideoUploadStyles.videoInfo}>
                <Text style={cloudinaryVideoUploadStyles.videoDuration}>
                  {formatDuration(video.duration)}
                </Text>
                <Text style={cloudinaryVideoUploadStyles.videoSize}>
                  {formatFileSize(video.bytes)}
                </Text>
              </View>
              
              <TouchableOpacity
                style={cloudinaryVideoUploadStyles.removeButton}
                onPress={() => removeVideo(index)}
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Informations sur les limites */}
      {allowMultiple && (
        <Text style={cloudinaryVideoUploadStyles.limitText}>
          {uploadedVideos.length} / {maxVideos} vidéos
        </Text>
      )}
    </View>
  );
}; 