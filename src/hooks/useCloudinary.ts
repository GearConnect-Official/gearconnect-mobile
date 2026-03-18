import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { cloudinaryService, CloudinaryUploadResponse, CloudinaryUploadOptions } from '@/services/cloudinary.service';

export interface UseCloudinaryReturn {
  uploading: boolean;
  error: string | null;
  uploadImage: (options?: CloudinaryUploadOptions) => Promise<CloudinaryUploadResponse | null>;
  uploadVideo: (options?: CloudinaryUploadOptions) => Promise<CloudinaryUploadResponse | null>;
  uploadFromCamera: (options?: CloudinaryUploadOptions) => Promise<CloudinaryUploadResponse | null>;
  uploadMultiple: (options?: CloudinaryUploadOptions) => Promise<CloudinaryUploadResponse[] | null>;
  clearError: () => void;
}

export const useCloudinary = (): UseCloudinaryReturn => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const requestPermissions = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission d\'accès à la galerie requise');
    }
  }, []);

  const requestCameraPermissions = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission d\'accès à la caméra requise');
    }
  }, []);

  const uploadImage = useCallback(async (options?: CloudinaryUploadOptions): Promise<CloudinaryUploadResponse | null> => {
    try {
      setUploading(true);
      setError(null);

      await requestPermissions();

      const allowsEditing = options?.allowsEditing !== false;
      const aspect = allowsEditing ? (options?.aspect || [4, 3]) : undefined;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        ...(aspect ? { aspect } : {}),
        quality: 1.0, // Qualité maximale pour préserver la résolution originale
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const uploadResult = await cloudinaryService.uploadMedia(
        result.assets[0].uri,
        {
          ...options,
          resource_type: 'image',
        }
      );

      return uploadResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'upload de l\'image';
      setError(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  }, [requestPermissions]);

  const uploadVideo = useCallback(async (options?: CloudinaryUploadOptions): Promise<CloudinaryUploadResponse | null> => {
    try {
      setUploading(true);
      setError(null);

      await requestPermissions();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1.0, // Qualité maximale pour préserver la résolution originale
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const uploadResult = await cloudinaryService.uploadMedia(
        result.assets[0].uri,
        {
          ...options,
          resource_type: 'video',
        }
      );

      return uploadResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'upload de la vidéo';
      setError(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  }, [requestPermissions]);

  const uploadFromCamera = useCallback(async (options?: CloudinaryUploadOptions): Promise<CloudinaryUploadResponse | null> => {
    try {
      setUploading(true);
      setError(null);

      await requestCameraPermissions();

      const allowsEditing = options?.allowsEditing !== false;
      const aspect = allowsEditing ? (options?.aspect || [4, 3]) : undefined;
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing,
        ...(aspect ? { aspect } : {}),
        quality: 1.0, // Qualité maximale pour préserver la résolution originale
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];
      const resourceType = asset.type === 'video' ? 'video' : 'image';

      const uploadResult = await cloudinaryService.uploadMedia(
        asset.uri,
        {
          ...options,
          resource_type: resourceType,
        }
      );

      return uploadResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'upload depuis la caméra';
      setError(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  }, [requestCameraPermissions]);

  const uploadMultiple = useCallback(async (options?: CloudinaryUploadOptions): Promise<CloudinaryUploadResponse[] | null> => {
    try {
      setUploading(true);
      setError(null);

      await requestPermissions();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 1.0, // Qualité maximale pour préserver la résolution originale
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const uris = result.assets.map(asset => asset.uri);
      const uploadResults = await cloudinaryService.uploadMultipleMedia(uris, options);

      return uploadResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'upload multiple';
      setError(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  }, [requestPermissions]);

  return {
    uploading,
    error,
    uploadImage,
    uploadVideo,
    uploadFromCamera,
    uploadMultiple,
    clearError,
  };
};
