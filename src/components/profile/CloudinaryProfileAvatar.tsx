import React from 'react';
import { View, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { CloudinaryAvatar } from '@/components/media/CloudinaryImage';
import { defaultImages } from '@/config/defaultImages';

export interface CloudinaryProfileAvatarProps {
  publicId?: string;
  fallbackUrl?: string;
  size?: 'small' | 'medium' | 'large' | number;
  style?: any;
  borderRadius?: number;
  showPlaceholder?: boolean;
}

/**
 * Composant intelligent pour afficher les avatars de profil avec Cloudinary
 * Gère automatiquement les transformations et les tailles optimales
 */
export const CloudinaryProfileAvatar: React.FC<CloudinaryProfileAvatarProps> = ({
  publicId,
  fallbackUrl,
  size = 'medium',
  style,
  borderRadius,
  showPlaceholder = true,
}) => {
  // Définir les tailles prédéfinies
  const getSizeValue = (sizeParam: 'small' | 'medium' | 'large' | number): number => {
    if (typeof sizeParam === 'number') return sizeParam;
    
    switch (sizeParam) {
      case 'small': return 32;   // Pour les listes, commentaires
      case 'medium': return 50;  // Pour les feeds, posts
      case 'large': return 80;   // Pour les profils principaux
      default: return 50;
    }
  };

  const sizeValue = getSizeValue(size);
  const radius = borderRadius !== undefined ? borderRadius : sizeValue / 2;

  // Style de base pour l'avatar
  const avatarStyle = {
    width: sizeValue,
    height: sizeValue,
    borderRadius: radius,
  };

  // Si on a un publicId Cloudinary, utiliser CloudinaryAvatar optimisé
  if (publicId) {
    return (
      <CloudinaryAvatar
        publicId={publicId}
        size={sizeValue}
        quality="auto"
        format="auto"
        style={[avatarStyle, style]}
        fallbackUrl={fallbackUrl}
      />
    );
  }

  // Si on a une URL de fallback, l'utiliser
  if (fallbackUrl) {
    return (
      <Image
        source={{ uri: fallbackUrl }}
        style={[avatarStyle, style]}
      />
    );
  }

  // Si showPlaceholder est false, ne rien afficher
  if (!showPlaceholder) {
    return null;
  }

  // Placeholder par défaut
  return (
    <View style={[
      avatarStyle,
      {
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
      },
      style
    ]}>
      <FontAwesome 
        name="user" 
        size={sizeValue * 0.4} 
        color="#999" 
      />
    </View>
  );
};

/**
 * Composants pré-configurés pour des cas d'usage spécifiques
 */

// Avatar pour les listes d'utilisateurs, commentaires
export const SmallProfileAvatar: React.FC<Omit<CloudinaryProfileAvatarProps, 'size'>> = (props) => (
  <CloudinaryProfileAvatar {...props} size="small" />
);

// Avatar pour les posts, feeds
export const MediumProfileAvatar: React.FC<Omit<CloudinaryProfileAvatarProps, 'size'>> = (props) => (
  <CloudinaryProfileAvatar {...props} size="medium" />
);

// Avatar pour les pages de profil
export const LargeProfileAvatar: React.FC<Omit<CloudinaryProfileAvatarProps, 'size'>> = (props) => (
  <CloudinaryProfileAvatar {...props} size="large" />
);

// Avatar avec style carré (pour certains designs)
export const SquareProfileAvatar: React.FC<CloudinaryProfileAvatarProps> = (props) => (
  <CloudinaryProfileAvatar {...props} borderRadius={8} />
);

export default CloudinaryProfileAvatar; 