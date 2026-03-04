import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { cloudinaryService, CloudinaryUploadResponse } from '../../services/cloudinary.service';
import { CloudinaryAvatar } from '../media/CloudinaryImage';
import { cloudinaryConfig } from '../../config';
import { useMessage } from '../../context/MessageContext';
import MessageService from '../../services/messageService';


interface ProfilePictureUploadProps {
  currentProfilePicture?: string;
  currentPublicId?: string;
  onUploadComplete?: (cloudinaryUrl: string, publicId: string) => void;
  onUploadError?: (error: string) => void;
  userId: number;
  size?: number;
  style?: any;
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentProfilePicture,
  currentPublicId,
  onUploadComplete,
  onUploadError,
  userId,
  size = 120,
  style
}) => {
  const { showMessage } = useMessage();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  // Debug de la configuration Cloudinary
  useEffect(() => {
    console.log('🔍 ProfilePictureUpload: Cloudinary Config Check:', {
      cloudName: cloudinaryConfig.cloudName,
      hasApiKey: !!cloudinaryConfig.apiKey,
      hasUploadPreset: !!cloudinaryConfig.uploadPreset,
    });

    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
      const configError = 'Cloudinary configuration is missing. Please check your environment variables.';
      console.error('❌ ProfilePictureUpload:', configError);
      setError(configError);
    }
  }, []);

  const clearError = () => {
    setError(null);
  };

  const handleImagePick = async () => {
    try {
      clearError();
      
      // Vérifier la configuration avant de continuer
      if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
        const configError = 'Cloudinary not configured. Please check your environment variables.';
        setError(configError);
        showMessage(MessageService.ERROR.CONFIGURATION_ERROR);
        return;
      }
      
      // Demander la permission d'accéder à la galerie
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showMessage(MessageService.createCustomMessage(
          MessageService.ERROR.LOGIN_REQUIRED.type,
          "Veuillez autoriser l'accès à votre galerie photo pour changer votre photo de profil.",
          6000
        ));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Force un ratio carré pour les photos de profil
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setLocalImageUri(result.assets[0].uri);
        await handleUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error("❌ ProfilePictureUpload: Error picking image:", error);
      const errorMessage = "An unexpected error occurred while picking the image";
      setError(errorMessage);
      onUploadError?.(errorMessage);
      showMessage(MessageService.ERROR.GENERIC_ERROR);
    }
  };

  const handleUpload = async (imageUri: string) => {
    try {
      setUploading(true);
      setError(null);

      console.log('🔄 ProfilePictureUpload: Starting upload...', {
        userId,
        imageUri: imageUri.substring(0, 50) + '...',
        cloudName: cloudinaryConfig.cloudName,
        uploadPreset: cloudinaryConfig.uploadPreset,
      });

      // Utiliser directement le service cloudinary
      const response = await cloudinaryService.uploadMedia(imageUri, {
        folder: 'users/avatars',
        tags: ['profile', 'avatar', `user_${userId}`],
        public_id: `user_${userId}_avatar_${Date.now()}`,
        resource_type: 'image',
      });

      console.log('✅ ProfilePictureUpload: Upload response:', response);

      if (response) {
        onUploadComplete?.(response.secure_url, response.public_id);
        showMessage(MessageService.SUCCESS.PROFILE_PICTURE_UPDATED);
        setLocalImageUri(null); // Reset local image after successful upload
      }
    } catch (error: any) {
      console.error("❌ ProfilePictureUpload: Error uploading profile picture:", error);
      const errorMessage = error.message || "Failed to upload profile picture";
      setError(errorMessage);
      onUploadError?.(errorMessage);
      showMessage(MessageService.ERROR.PROFILE_PICTURE_UPLOAD_FAILED);
      setLocalImageUri(null); // Reset on error
    } finally {
      setUploading(false);
    }
  };

  const renderProfileImage = () => {
    // Style circulaire cohérent pour toutes les images
    const circularImageStyle = {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 3,
      borderColor: '#E0E0E0',
    };

    // Afficher l'image locale pendant l'upload (avec style circulaire)
    if (localImageUri) {
      return (
        <Image
          source={{ uri: localImageUri }}
          style={[circularImageStyle, style]}
        />
      );
    }

    // Afficher l'image Cloudinary optimisée si disponible (avec style circulaire)
    if (currentPublicId) {
      return (
        <CloudinaryAvatar
          publicId={currentPublicId}
          size={size}
          quality="auto"
          format="auto"
          style={[circularImageStyle, style]}
          fallbackUrl={currentProfilePicture}
        />
      );
    }

    // Fallback vers l'URL classique (avec style circulaire)
    if (currentProfilePicture) {
      return (
        <Image
          source={{ uri: currentProfilePicture }}
          style={[circularImageStyle, style]}
        />
      );
    }

    // Placeholder par défaut (circulaire)
    return (
      <View style={[
        circularImageStyle,
        {
          backgroundColor: '#F8F8F8',
          justifyContent: 'center',
          alignItems: 'center',
          borderColor: '#E0E0E0',
          borderStyle: 'dashed',
        },
        style
      ]}>
        <FontAwesome name="user" size={size * 0.4} color="#999" />
        <Text style={{
          fontSize: 10,
          color: '#999',
          textAlign: 'center',
          marginTop: 4,
        }}>
          Tap to add
        </Text>
      </View>
    );
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <TouchableOpacity
        onPress={handleImagePick}
        disabled={uploading}
        style={{
          position: 'relative',
          marginBottom: 16,
        }}
        activeOpacity={0.8}
      >
        {renderProfileImage()}
        
        {/* Overlay de chargement (circulaire) */}
        {uploading && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: size / 2,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={{
              color: '#FFF',
              fontSize: 12,
              marginTop: 8,
              textAlign: 'center',
            }}>
              Uploading...
            </Text>
          </View>
        )}

        {/* Icône d'édition (design amélioré) */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          backgroundColor: '#E10600',
          borderRadius: 18,
          width: 36,
          height: 36,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 3,
          borderColor: '#FFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}>
          <FontAwesome name="camera" size={16} color="#FFF" />
        </View>
      </TouchableOpacity>

      {error && (
        <View style={{
          backgroundColor: '#FFEBEE',
          padding: 12,
          borderRadius: 8,
          marginTop: 8,
          maxWidth: size * 1.8,
          borderLeftWidth: 4,
          borderLeftColor: '#D32F2F',
        }}>
          <Text style={{ color: '#D32F2F', fontSize: 13, textAlign: 'center', fontWeight: '500' }}>
            {error}
          </Text>
          <TouchableOpacity onPress={clearError} style={{ marginTop: 8 }}>
            <Text style={{ color: '#007AFF', fontSize: 13, textAlign: 'center', fontWeight: '600' }}>
              Dismiss
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ProfilePictureUpload; 