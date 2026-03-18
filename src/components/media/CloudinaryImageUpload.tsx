import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCloudinary } from '@/hooks/useCloudinary';
import {
  CloudinaryUploadResponse,
} from '@/services/cloudinary.service';
import { cloudinaryImageUploadStyles } from '@/styles/components/cloudinaryStyles';
import { useMessage } from '@/context/MessageContext';

export interface CloudinaryImageUploadProps {
  onUploadComplete?: (response: CloudinaryUploadResponse) => void;
  onUploadError?: (error: string) => void;
  folder?: string;
  tags?: string[];
  allowMultiple?: boolean;
  maxImages?: number;
  style?: any;
  buttonText?: string;
  showPreview?: boolean;
  /** Si false, pas de crop au choix (galerie/caméra) — dimensions originales conservées. Défaut true. */
  allowsEditing?: boolean;
  /** Ratio de crop [largeur, hauteur] quand allowsEditing=true. Ex: [4,3], [1,1]. */
  aspect?: [number, number];
}

export const CloudinaryImageUpload: React.FC<CloudinaryImageUploadProps> = ({
  onUploadComplete,
  onUploadError,
  folder,
  tags = [],
  allowMultiple = false,
  maxImages = 5,
  style,
  buttonText = "Ajouter une image",
  showPreview = true,
  allowsEditing,
  aspect,
}) => {
  const {
    uploading,
    error,
    uploadImage,
    uploadFromCamera,
    uploadMultiple,
    clearError,
  } = useCloudinary();
  const [uploadedImages, setUploadedImages] = useState<
    CloudinaryUploadResponse[]
  >([]);
  const { showError } = useMessage();

  const handleUploadOption = () => {
    Alert.alert(
      "Sélectionner une source",
      "D'où voulez-vous importer votre image ?",
      [
        {
          text: "Galerie",
          onPress: handleGalleryUpload,
        },
        {
          text: "Caméra",
          onPress: handleCameraUpload,
        },
        {
          text: "Annuler",
          style: "cancel",
        },
      ]
    );
  };

  const handleGalleryUpload = async () => {
    try {
      clearError();

      if (allowMultiple) {
        const results = await uploadMultiple({
          folder,
          tags,
        });

        if (results) {
          const limitedResults = results.slice(
            0,
            maxImages - uploadedImages.length
          );
          setUploadedImages((prev) => [...prev, ...limitedResults]);
          limitedResults.forEach((result) => onUploadComplete?.(result));
        }
      } else {
        const result = await uploadImage({
          folder,
          tags,
          allowsEditing,
          aspect,
        });

        if (result) {
          setUploadedImages((prev) => [...prev, result]);
          onUploadComplete?.(result);
        }
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      const errorMessage = error?.message || "Failed to upload image";

      showError(errorMessage);

      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  };

  const handleCameraUpload = async () => {
    try {
      clearError();

      const result = await uploadFromCamera({
        folder,
        tags,
        allowsEditing,
        aspect,
      });

      if (result) {
        setUploadedImages((prev) => [...prev, result]);
        onUploadComplete?.(result);
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      const errorMessage = error?.message || "Failed to upload image";

      showError(errorMessage);

      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const canAddMore = !allowMultiple
    ? uploadedImages.length === 0
    : uploadedImages.length < maxImages;

  return (
    <View style={[cloudinaryImageUploadStyles.container, style]}>
      {/* Bouton d'upload */}
      {canAddMore && (
        <TouchableOpacity
          style={[
            cloudinaryImageUploadStyles.uploadButton,
            uploading && cloudinaryImageUploadStyles.uploadButtonDisabled,
          ]}
          onPress={handleUploadOption}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#E53935" size="small" />
          ) : (
            <Ionicons name="camera" size={24} color="#E53935" />
          )}
          <Text style={cloudinaryImageUploadStyles.uploadButtonText}>
            {uploading ? "Upload en cours..." : buttonText}
          </Text>
        </TouchableOpacity>
      )}

      {/* Affichage des erreurs */}
      {error && (
        <View style={cloudinaryImageUploadStyles.errorContainer}>
          <Text style={cloudinaryImageUploadStyles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Ionicons name="close" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}

      {/* Prévisualisation des images */}
      {showPreview && uploadedImages.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={cloudinaryImageUploadStyles.previewContainer}
        >
          {uploadedImages.map((image, index) => (
            <View
              key={image.public_id}
              style={cloudinaryImageUploadStyles.imagePreview}
            >
              <Image
                source={{ uri: image.secure_url }}
                style={cloudinaryImageUploadStyles.previewImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={cloudinaryImageUploadStyles.removeButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Informations sur les limites */}
      {allowMultiple && (
        <Text style={cloudinaryImageUploadStyles.limitText}>
          {uploadedImages.length} / {maxImages} images
        </Text>
      )}
    </View>
  );
};
