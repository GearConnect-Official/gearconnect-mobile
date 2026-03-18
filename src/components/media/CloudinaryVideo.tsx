import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { cloudinaryService } from '@/services/cloudinary.service';
import keepAwakeService from '@/services/keepAwakeService';

interface CloudinaryVideoProps {
  publicId: string;
  width?: number;
  height?: number;
  quality?: 'auto' | number;
  format?: 'auto' | 'mp4' | 'webm' | 'mov';
  crop?: 'fill' | 'fit' | 'limit' | 'scale' | 'crop';
  style?: ViewStyle;
  fallbackUrl?: string;
  shouldPlay?: boolean;
  isLooping?: boolean;
  isMuted?: boolean;
  useNativeControls?: boolean;
}

const CloudinaryVideo: React.FC<CloudinaryVideoProps> = ({
  publicId,
  width = 300,
  height = 300,
  quality = 'auto',
  format = 'mp4',
  crop = 'fill',
  style,
  fallbackUrl,
  shouldPlay = false,
  isLooping = true,
  isMuted = true,
  useNativeControls = true,
}) => {
  const videoRef = useRef<Video>(null);

  // Ensure keep-awake is activated before video playback
  useEffect(() => {
    if (shouldPlay) {
      keepAwakeService.activate().catch(() => {
        // Non-critical, ignore
      });
    }
  }, [shouldPlay]);

  // Force video to play when shouldPlay changes
  useEffect(() => {
    const controlVideoPlayback = async () => {
      if (videoRef.current && shouldPlay) {
        try {
          // Ensure keep-awake is activated before playing
          await keepAwakeService.activate();
          console.log('📹 Attempting to play video...');
          await videoRef.current.playAsync();
        } catch (error: any) {
          // Silently ignore "keep awake" errors
          if (error?.message?.includes('keep awake')) {
            // Non-critical error, continue with playback
            try {
              await videoRef.current.playAsync();
            } catch (playError) {
              console.error('📹 Error playing video:', playError);
            }
          } else {
            console.error('📹 Error playing video:', error);
          }
        }
      } else if (videoRef.current && !shouldPlay) {
        try {
          await videoRef.current.pauseAsync();
        } catch (error) {
          console.error('📹 Error pausing video:', error);
        }
      }
    };

    const timeoutId = setTimeout(controlVideoPlayback, 100);
    return () => clearTimeout(timeoutId);
  }, [shouldPlay]);

  // Fonction pour extraire le publicId d'une URL Cloudinary complète
  const extractPublicIdFromUrl = (url: string): string | null => {
    try {
      // Pattern pour URLs Cloudinary: https://res.cloudinary.com/cloud_name/video/upload/...../public_id.ext
      const cloudinaryPattern = /https:\/\/res\.cloudinary\.com\/[^\/]+\/video\/upload\/(?:[^\/]+\/)*([^\/\.]+)/;
      const match = url.match(cloudinaryPattern);
      
      if (match && match[1]) {
        console.log('📹 Extracted publicId from URL:', match[1]);
        return match[1];
      }
      
      // Pattern alternatif pour URLs avec transformations
      const transformPattern = /\/([^\/\.]+)\.[^\/]+$/;
      const transformMatch = url.match(transformPattern);
      
      if (transformMatch && transformMatch[1]) {
        console.log('📹 Extracted publicId (alternative):', transformMatch[1]);
        return transformMatch[1];
      }
      
      return null;
    } catch (error) {
      console.warn('Error extracting publicId from URL:', error);
      return null;
    }
  };

  const getVideoUrl = () => {
    console.log('📹 CloudinaryVideo - Getting video URL...', {
      publicId,
      fallbackUrl,
      hasPublicId: !!publicId,
      hasFallback: !!fallbackUrl
    });

    // Prioriser fallbackUrl (secureUrl) si disponible - c'est l'URL directe Cloudinary sans transformations
    // Les transformations peuvent causer des erreurs de lecture vidéo
    if (fallbackUrl && fallbackUrl.trim() !== '') {
      console.log('📹 Using fallback URL directly (secureUrl):', fallbackUrl);
      
      // Pour Cloudinary, assurer que l'URL est correcte pour les vidéos
      if (fallbackUrl.includes('cloudinary.com')) {
        // Si l'URL contient 'image/upload', la corriger pour 'video/upload'
        if (fallbackUrl.includes('/image/upload/')) {
          const correctedUrl = fallbackUrl.replace('/image/upload/', '/video/upload/');
          console.log('📹 Corrected URL from image to video:', correctedUrl);
          return correctedUrl;
        }
      }
      
      // Utiliser l'URL de fallback directement (pas de transformations)
      return fallbackUrl;
    }

    // Si pas de fallbackUrl, utiliser publicId avec génération d'URL
    // Mais seulement si on n'a pas de fallbackUrl valide
    if (publicId && publicId.trim() !== '') {
      try {
        // Pour les vidéos, utiliser l'URL de base sans transformations complexes
        // Les transformations peuvent causer des erreurs -1008
        const baseUrl = cloudinaryService.generateOptimizedUrl(publicId, {
          width: undefined, // Pas de resize pour éviter les erreurs
          height: undefined,
          quality: 'auto',
          format: 'mp4',
          crop: undefined,
          resource_type: 'video'
        });
        console.log('📹 Generated base URL from publicId:', baseUrl);
        return baseUrl;
      } catch (error) {
        console.error('📹 Error generating URL from publicId:', error);
      }
    }
    
    console.warn('📹 No valid URL source available');
    return null;
  };

  const videoUrl = getVideoUrl();

  if (!videoUrl) {
    console.warn('📹 No video URL available, not rendering video');
    return null;
  }

  console.log('📹 Rendering video with URL:', videoUrl);

  return (
    <Video
      ref={videoRef}
      source={{ uri: videoUrl }}
      style={[{ width, height }, style]}
      resizeMode={ResizeMode.COVER}
      shouldPlay={shouldPlay}
      isLooping={isLooping}
      isMuted={isMuted}
      useNativeControls={useNativeControls}
      progressUpdateIntervalMillis={1000}
      positionMillis={0}
      onError={(error) => {
        console.error('📹 Video playback error:', error);
        console.error('📹 Error details:', {
          error: error,
          url: videoUrl
        });
        
        // Essayer de réessayer avec des paramètres différents si erreur -1100
        console.log('📹 Error detected, possibly malformed URL or unsupported format');
      }}
      onLoad={async (status) => {
        if (status.isLoaded) {
          console.log('📹 Video loaded successfully:', {
            isLoaded: status.isLoaded,
            durationMillis: status.durationMillis,
          });
        }
        if (shouldPlay && videoRef.current) {
          try {
            // Ensure keep-awake is activated before playing
            await keepAwakeService.activate();
            console.log('📹 Starting video playback after load...');
            await videoRef.current.playAsync();
          } catch (error: any) {
            // Silently ignore "keep awake" errors
            if (error?.message?.includes('keep awake')) {
              // Non-critical error, try to play anyway
              try {
                await videoRef.current?.playAsync();
              } catch (playError) {
                console.error('📹 Error starting playback after load:', playError);
              }
            } else {
              console.error('📹 Error starting playback after load:', error);
            }
          }
        }
      }}
      onLoadStart={() => {
        console.log('📹 Video loading started for URL:', videoUrl);
      }}
      onPlaybackStatusUpdate={(status) => {
        if (status.isLoaded) {
          // Log uniquement les changements importants pour éviter le spam
          if ('isPlaying' in status) {
            console.log('📹 Video status update:', {
              isPlaying: status.isPlaying,
              positionMillis: status.positionMillis,
              durationMillis: status.durationMillis
            });
          }
        } else if ('error' in status) {
          console.error('📹 Video playback status error:', status.error);
        }
      }}
    />
  );
};

export default CloudinaryVideo; 