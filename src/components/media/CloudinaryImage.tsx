import React, { useState, useEffect } from 'react';
import { View, Image, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { cloudinaryService } from '@/services/cloudinary.service';
import { CLOUDINARY_CONFIG } from '@/config';
import { cloudinaryImageStyles } from '@/styles/components/cloudinaryStyles';

export interface CloudinaryImageProps extends Omit<ImageProps, 'source'> {
  publicId: string;
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'limit' | 'scale' | 'crop';
  quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  fallbackUrl?: string;
  transformation?: string;
}

export const CloudinaryImage: React.FC<CloudinaryImageProps> = ({
  publicId,
  width,
  height,
  crop = 'fill',
  quality = 'auto:best', // Qualité optimale par défaut pour préserver la résolution
  format = 'auto',
  fallbackUrl,
  transformation,
  style,
  ...imageProps
}) => {
  // Générer l'URL optimisée
  const getOptimizedUrl = () => {
    if (!publicId) {
      return fallbackUrl || null;
    }

    if (transformation) {
      // Utiliser une transformation personnalisée
      return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${transformation}/${publicId}`;
    }

    // Utiliser la méthode de génération d'URL optimisée
    return cloudinaryService.generateOptimizedUrl(publicId, {
      width,
      height,
      crop,
      quality,
      format,
      resource_type: 'image',
    });
  };

  const optimizedUrl = getOptimizedUrl();

  if (!optimizedUrl) {
    // If no URL and no fallback, return null (parent component should handle placeholder)
    return null;
  }

  return (
    <Image
      {...imageProps}
      source={{ uri: optimizedUrl }}
      style={[
        style,
        width && height ? { width, height } : undefined,
      ]}
      onError={() => {
        // If Cloudinary image fails, try fallback
        if (fallbackUrl) {
          console.log('Cloudinary image failed, using fallback:', fallbackUrl);
        }
      }}
    />
  );
};

// Composants pré-configurés pour des cas d'usage courants
export const CloudinaryAvatar: React.FC<Omit<CloudinaryImageProps, 'width' | 'height' | 'crop'> & { size?: number }> = ({
  size = 50,
  fallbackUrl,
  publicId,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // If no publicId and no fallback, return null (parent should handle placeholder)
  if (!publicId && !fallbackUrl) {
    return null;
  }

  const cloudinaryImage = publicId ? (
    <CloudinaryImage
      {...props}
      publicId={publicId}
      width={size}
      height={size}
      crop="fill"
      style={[cloudinaryImageStyles.avatar, props.style]}
      fallbackUrl={fallbackUrl}
      onError={() => {
        setImageError(true);
      }}
      onLoad={() => {
        setImageLoaded(true);
      }}
    />
  ) : null;

  // If CloudinaryImage failed or returned null, use fallback
  if ((imageError || !cloudinaryImage) && fallbackUrl && typeof fallbackUrl === 'string') {
    return (
      <Image
        source={{ uri: fallbackUrl }}
        style={[cloudinaryImageStyles.avatar, props.style, { width: size, height: size, borderRadius: size / 2 }]}
        onError={() => {
          setImageError(true);
        }}
        onLoad={() => {
          setImageLoaded(true);
        }}
      />
    );
  }

  return cloudinaryImage;
};

export const CloudinaryThumbnail: React.FC<Omit<CloudinaryImageProps, 'width' | 'height'> & { size?: number }> = ({
  size = 100,
  ...props
}) => (
  <CloudinaryImage
    {...props}
    width={size}
    height={size}
    style={[cloudinaryImageStyles.thumbnail, props.style]}
  />
);

export const CloudinaryHeroImage: React.FC<Omit<CloudinaryImageProps, 'width' | 'height'> & { aspectRatio?: number }> = ({
  aspectRatio = 16/9,
  ...props
}) => (
  <CloudinaryImage
    {...props}
    crop="fill"
    style={[
      cloudinaryImageStyles.heroImage,
      { aspectRatio },
      props.style
    ]}
  />
); 