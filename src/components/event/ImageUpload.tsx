import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { CloudinaryImageUpload } from '@/components/media/CloudinaryImageUpload';
import { CloudinaryUploadResponse } from '@/services/cloudinary.service';
import { createEventStyles as styles } from '@/styles/screens';

interface ImageUploadProps {
  title: string;
  buttonText: string;
  onImageSelected?: (cloudinaryUrl: string, publicId: string) => void;
  folder?: string;
  tags?: string[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  title,
  buttonText,
  onImageSelected,
  folder = 'events',
  tags = ['event'],
}) => {
  const [uploadedImage, setUploadedImage] = useState<CloudinaryUploadResponse | null>(null);

  const handleUploadComplete = (response: CloudinaryUploadResponse) => {
    setUploadedImage(response);
    onImageSelected?.(response.secure_url, response.public_id);
  };

  const handleUploadError = (error: string) => {
    Alert.alert('Erreur d\'upload', error);
  };

  return (
    <View style={styles.imageUploadContainer}>
      <Text style={styles.imageUploadTitle}>{title}</Text>
      
      <CloudinaryImageUpload
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        folder={folder}
        tags={tags}
        allowMultiple={false}
        buttonText={buttonText}
        showPreview={true}
        style={styles.imageUploadButton}
      />
      
      {uploadedImage && (
        <View style={styles.uploadInfoContainer}>
          <Text style={styles.uploadInfoText}>
            Image uploadée avec succès
          </Text>
          <Text style={styles.uploadInfoDetails}>
            Format: {uploadedImage.format.toUpperCase()} • 
            Taille: {(uploadedImage.bytes / 1024 / 1024).toFixed(1)} MB
          </Text>
        </View>
      )}
    </View>
  );
};

export default ImageUpload;