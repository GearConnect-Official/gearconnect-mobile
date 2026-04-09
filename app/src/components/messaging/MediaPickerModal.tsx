import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import CustomTextInput from '../ui/CustomTextInput';
import theme from '../../styles/config/theme';
import { cloudinaryService } from '../../services/cloudinary.service';

const { width } = Dimensions.get('window');

export interface SelectedMedia {
  uri: string;
  type: 'image' | 'video';
  publicId?: string;
  secureUrl?: string;
}

interface MediaPickerModalProps {
  conversationId: string;
  onSend: (media: SelectedMedia[], caption: string) => void;
  onCancel: () => void;
}

const MediaPickerModal: React.FC<MediaPickerModalProps> = ({ onSend, onCancel }) => {
  const PHOTO_PAGE_SIZE = 60;
  const ALBUM_PAGE_SIZE = 60;

  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set()); // Fast lookup Set
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [currentTab, setCurrentTab] = useState<'Photos' | 'Albums'>('Photos');
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [photoPageInfo, setPhotoPageInfo] = useState<{ endCursor?: string; hasNextPage: boolean }>({ hasNextPage: false });
  const [isLoadingMorePhotos, setIsLoadingMorePhotos] = useState(false);
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<MediaLibrary.Album | null>(null);
  const [albumPhotos, setAlbumPhotos] = useState<MediaLibrary.Asset[]>([]); // Photos of selected album
  const [albumPhotoUris, setAlbumPhotoUris] = useState<Map<string, string>>(new Map()); // URIs for album photos
  const [albumPageInfo, setAlbumPageInfo] = useState<{ endCursor?: string; hasNextPage: boolean }>({ hasNextPage: false });
  const [isLoadingMoreAlbum, setIsLoadingMoreAlbum] = useState(false);
  const [loading, setLoading] = useState(true);
  const [photoUris, setPhotoUris] = useState<Map<string, string>>(new Map());
  const [assetInfoCache, setAssetInfoCache] = useState<Map<string, { localUri: string; type: 'image' | 'video' }>>(new Map()); // Cache for asset info

  const requestPermissions = useCallback(async () => {
    try {
      // Only request photo/video permissions, not audio (audio is handled separately by expo-av)
      const { status } = await MediaLibrary.requestPermissionsAsync(false, ['photo', 'video']);
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photos to send media.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error: any) {
      // Expo Go doesn't support granular permissions on Android 13+
      // Show a helpful message to the user
      if (error.message?.includes('Expo Go')) {
        Alert.alert(
          'Expo Go Limitation',
          'Media library access requires a development build on Android 13+. Please use "npx expo run:android" to create a development build.',
          [{ text: 'OK' }]
        );
        console.warn('MediaLibrary permissions not available in Expo Go on Android 13+');
      } else {
        console.error('Error requesting permissions:', error);
      }
      return false;
    }
  }, []);

  // Load photos and albums
  useEffect(() => {
    const loadMedia = async () => {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Load albums and filter out albums that only contain videos
        const albumsData = await MediaLibrary.getAlbumsAsync();
        
        // Filter albums: only keep those that contain at least one photo
        const albumsWithPhotos = await Promise.all(
          albumsData.map(async (album) => {
            try {
              // Check if album has at least one photo
              const photosCheck = await MediaLibrary.getAssetsAsync({
                album: album,
                mediaType: [MediaLibrary.MediaType.photo],
                first: 1, // Just check if at least one exists
              });
              return photosCheck.assets.length > 0 ? album : null;
            } catch (error) {
              console.error(`Error checking album ${album.title}:`, error);
              return null; // Exclude on error to be safe
            }
          })
        );
        
        // Filter out null values (albums with only videos)
        const validAlbums = albumsWithPhotos.filter((album): album is MediaLibrary.Album => album !== null);
        setAlbums(validAlbums);

        // Load first page of photos
        const photosData = await MediaLibrary.getAssetsAsync({
          mediaType: [MediaLibrary.MediaType.photo],
          sortBy: MediaLibrary.SortBy.creationTime,
          first: PHOTO_PAGE_SIZE,
        });
        
        setPhotos(photosData.assets);
        setPhotoPageInfo({
          endCursor: photosData.endCursor,
          hasNextPage: photosData.hasNextPage,
        });
        
        // Videos disabled - only photos allowed in messaging
        
        // Load photo URIs for display (initial page)
        const uriMap = new Map<string, string>();
        const infoCache = new Map<string, { localUri: string; type: 'image' | 'video' }>();
        const assetsToLoad = photosData.assets;
        
        await Promise.all(
          assetsToLoad.map(async (asset) => {
            try {
              const assetInfo = await MediaLibrary.getAssetInfoAsync(asset, {
                shouldDownloadFromNetwork: false, // Only photos, no videos
              });
              const localUri = assetInfo.localUri || assetInfo.uri || asset.uri;
              const type = 'image';
              
              // Validate URI before caching
              if (localUri && localUri !== 'null' && localUri.trim() !== '') {
                uriMap.set(asset.id, localUri);
                infoCache.set(asset.id, { localUri, type });
              } else {
                console.warn(`Invalid URI for asset ${asset.id}, skipping cache`);
              }
            } catch (error) {
              console.error(`Error getting asset info for ${asset.id}:`, error);
              // Fallback to asset.uri if getAssetInfoAsync fails, but validate it
              if (asset.uri && asset.uri !== 'null' && asset.uri.trim() !== '') {
                uriMap.set(asset.id, asset.uri);
                infoCache.set(asset.id, {
                  localUri: asset.uri,
                  type: 'image',
                });
              } else {
                console.warn(`Invalid fallback URI for asset ${asset.id}, skipping cache`);
              }
            }
          })
        );
        
        setPhotoUris(uriMap);
        setAssetInfoCache(prev => {
          const newMap = new Map(prev);
          infoCache.forEach((value, key) => newMap.set(key, value));
          return newMap;
        });

        // Videos disabled - no video loading
      } catch (error) {
        console.error('Error loading media:', error);
        Alert.alert('Error', 'Failed to load photos');
      } finally {
        setLoading(false);
      }
    };

    loadMedia();
  }, [requestPermissions]);

  // Load photos/videos from selected album (stay in Albums tab)
  const loadAlbumPhotos = useCallback(async (album: MediaLibrary.Album) => {
    try {
      setLoading(true);
      // Videos disabled - only load photos
      const assets = await MediaLibrary.getAssetsAsync({
        album: album,
        mediaType: [MediaLibrary.MediaType.photo], // Only photos, no videos
        sortBy: MediaLibrary.SortBy.creationTime,
        first: ALBUM_PAGE_SIZE,
      });
      
      setAlbumPhotos(assets.assets);
      setSelectedAlbum(album);
      setAlbumPageInfo({
        endCursor: assets.endCursor,
        hasNextPage: assets.hasNextPage,
      });
      
      // Load URIs for display
      const uriMap = new Map<string, string>();
      const infoCache = new Map<string, { localUri: string; type: 'image' | 'video' }>();
      const assetsToLoad = assets.assets;
      
      await Promise.all(
        assetsToLoad.map(async (asset) => {
          try {
            // For videos, get thumbnail only (don't download full video)
            // For images, get local URI
            const assetInfo = await MediaLibrary.getAssetInfoAsync(asset, {
              shouldDownloadFromNetwork: false, // Don't download videos, just get thumbnails
            });
            const localUri = assetInfo.localUri || assetInfo.uri || asset.uri;
            const type = 'image'; // Only images allowed
            
            // Validate URI before caching
            if (localUri && localUri !== 'null' && localUri.trim() !== '') {
              uriMap.set(asset.id, localUri);
              infoCache.set(asset.id, { localUri, type });
            } else {
              console.warn(`Invalid URI for asset ${asset.id}, skipping cache`);
            }
          } catch (error) {
            console.error(`Error getting asset info for ${asset.id}:`, error);
            // Fallback to asset.uri if getAssetInfoAsync fails, but validate it
            if (asset.uri && asset.uri !== 'null' && asset.uri.trim() !== '') {
              uriMap.set(asset.id, asset.uri);
              infoCache.set(asset.id, {
                localUri: asset.uri,
                type: 'image', // Only images allowed
              });
            } else {
              console.warn(`Invalid fallback URI for asset ${asset.id}, skipping cache`);
            }
          }
        })
      );
      
      setAlbumPhotoUris(uriMap);
      setAssetInfoCache(prev => {
        const newMap = new Map(prev);
        infoCache.forEach((value, key) => newMap.set(key, value));
        return newMap;
      });
    } catch (error) {
      console.error('Error loading album photos:', error);
      Alert.alert('Error', 'Failed to load album photos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Go back to albums list
  const goBackToAlbums = useCallback(() => {
    setSelectedAlbum(null);
    setAlbumPhotos([]);
    setAlbumPhotoUris(new Map());
  }, []);

  const loadMorePhotos = useCallback(async () => {
    if (isLoadingMorePhotos || !photoPageInfo.hasNextPage || !photoPageInfo.endCursor) return;
    try {
      setIsLoadingMorePhotos(true);
      const nextPage = await MediaLibrary.getAssetsAsync({
        mediaType: [MediaLibrary.MediaType.photo],
        sortBy: MediaLibrary.SortBy.creationTime,
        first: PHOTO_PAGE_SIZE,
        after: photoPageInfo.endCursor,
      });

      setPhotos(prev => [...prev, ...nextPage.assets]);
      setPhotoPageInfo({
        endCursor: nextPage.endCursor,
        hasNextPage: nextPage.hasNextPage,
      });

      // Cache URIs for new assets
      const newUriMap = new Map(photoUris);
      const newInfoCache = new Map(assetInfoCache);

      await Promise.all(
        nextPage.assets.map(async (asset) => {
          try {
            const assetInfo = await MediaLibrary.getAssetInfoAsync(asset, {
              shouldDownloadFromNetwork: false,
            });
            const localUri = assetInfo.localUri || assetInfo.uri || asset.uri;
            if (localUri && localUri !== 'null' && localUri.trim() !== '') {
              newUriMap.set(asset.id, localUri);
              newInfoCache.set(asset.id, { localUri, type: 'image' });
            }
          } catch {
            if (asset.uri && asset.uri !== 'null' && asset.uri.trim() !== '') {
              newUriMap.set(asset.id, asset.uri);
              newInfoCache.set(asset.id, { localUri: asset.uri, type: 'image' });
            }
          }
        })
      );

      setPhotoUris(newUriMap);
      setAssetInfoCache(newInfoCache);
    } finally {
      setIsLoadingMorePhotos(false);
    }
  }, [isLoadingMorePhotos, photoPageInfo, photoUris, assetInfoCache]);

  const loadMoreAlbum = useCallback(async () => {
    if (isLoadingMoreAlbum || !albumPageInfo.hasNextPage || !albumPageInfo.endCursor || !selectedAlbum) return;
    try {
      setIsLoadingMoreAlbum(true);
      const nextPage = await MediaLibrary.getAssetsAsync({
        album: selectedAlbum,
        mediaType: [MediaLibrary.MediaType.photo], // Only photos, no videos
        sortBy: MediaLibrary.SortBy.creationTime,
        first: ALBUM_PAGE_SIZE,
        after: albumPageInfo.endCursor,
      });

      setAlbumPhotos(prev => [...prev, ...nextPage.assets]);
      setAlbumPageInfo({
        endCursor: nextPage.endCursor,
        hasNextPage: nextPage.hasNextPage,
      });

      const newUriMap = new Map(albumPhotoUris);
      const newInfoCache = new Map(assetInfoCache);

      await Promise.all(
        nextPage.assets.map(async (asset) => {
          try {
            const assetInfo = await MediaLibrary.getAssetInfoAsync(asset, {
              shouldDownloadFromNetwork: asset.mediaType === MediaLibrary.MediaType.video,
            });
            const localUri = assetInfo.localUri || assetInfo.uri || asset.uri;
            if (localUri && localUri !== 'null' && localUri.trim() !== '') {
              newUriMap.set(asset.id, localUri);
              newInfoCache.set(asset.id, {
                localUri,
                type: 'image', // Only images allowed
              });
            }
          } catch {
            if (asset.uri && asset.uri !== 'null' && asset.uri.trim() !== '') {
              newUriMap.set(asset.id, asset.uri);
              newInfoCache.set(asset.id, {
                localUri: asset.uri,
                type: 'image', // Only images allowed
              });
            }
          }
        })
      );

      setAlbumPhotoUris(newUriMap);
      setAssetInfoCache(newInfoCache);
    } finally {
      setIsLoadingMoreAlbum(false);
    }
  }, [isLoadingMoreAlbum, albumPageInfo, selectedAlbum, albumPhotoUris, assetInfoCache]);

  const handleSelectPhoto = useCallback(async (asset: any) => {
    const assetId = asset.id;
    const isSelected = selectedMediaIds.has(assetId);
    
    if (isSelected) {
      // Deselect
      setSelectedMedia(prev => prev.filter(m => m.uri !== asset.uri && !m.uri.includes(assetId)));
      setSelectedMediaIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(assetId);
        return newSet;
      });
      return;
    }

    // Check cache first
    let cachedInfo = assetInfoCache.get(assetId);
    
    if (!cachedInfo) {
      try {
        // Get full asset info to ensure we have the correct local URI for upload
        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset, {
          shouldDownloadFromNetwork: false, // Only photos, no videos
        });
        const localUri = assetInfo.localUri || assetInfo.uri || asset.uri;
        
        // Validate URI
        if (!localUri || localUri === 'null' || localUri.trim() === '') {
          throw new Error('Invalid URI from asset info');
        }
        
        const type = 'image'; // Only images allowed
        
        cachedInfo = { localUri, type };
        // Cache the result
        setAssetInfoCache(prev => new Map(prev).set(assetId, cachedInfo!));
      } catch (error) {
        console.error('Error getting asset info, using asset.uri directly:', error);
        // Fallback to using asset.uri directly, but validate it
        if (!asset.uri || asset.uri === 'null' || asset.uri.trim() === '') {
          Alert.alert('Error', 'Unable to access this media file. Please try selecting another file.');
          return;
        }
        
        // Videos disabled - reject video selection
        if (asset.mediaType === MediaLibrary.MediaType.video) {
          Alert.alert('Videos not supported', 'Video messages are not available in conversations at this time.');
          return;
        }
        
        cachedInfo = {
          localUri: asset.uri,
          type: 'image',
        };
        setAssetInfoCache(prev => new Map(prev).set(assetId, cachedInfo!));
      }
    }

    // Final validation before adding to selection
    if (!cachedInfo.localUri || cachedInfo.localUri === 'null' || cachedInfo.localUri.trim() === '') {
      Alert.alert('Error', 'Invalid media file. Please try selecting another file.');
      return;
    }

    // Reject videos
    if (cachedInfo.type === 'video') {
      Alert.alert('Videos not supported', 'Video messages are not available in conversations at this time.');
      return;
    }

    const newMedia: SelectedMedia = {
      uri: cachedInfo.localUri,
      type: 'image', // Force image type
    };

    // Select
    setSelectedMedia(prev => [...prev, newMedia]);
    setSelectedMediaIds(prev => new Set(prev).add(assetId));
  }, [selectedMediaIds, assetInfoCache]);

  const handleRemoveMedia = useCallback((index: number) => {
    setSelectedMedia((prev) => {
      const removed = prev[index];
      const newMedia = prev.filter((_, i) => i !== index);
      
      // Also remove from selectedMediaIds
      if (removed) {
        // Find the asset ID from the URI
        const assetId = Array.from(assetInfoCache.entries()).find(([_, info]) => info.localUri === removed.uri)?.[0];
        if (assetId) {
          setSelectedMediaIds(prevIds => {
            const newSet = new Set(prevIds);
            newSet.delete(assetId);
            return newSet;
          });
        }
      }
      
      return newMedia;
    });
  }, [assetInfoCache]);

  const handleSend = useCallback(async () => {
    if (selectedMedia.length === 0) {
      Alert.alert('No Media', 'Please select at least one media item');
      return;
    }

    try {
      setUploading(true);

      // Validate and filter out media with invalid URIs
      const validMedia = selectedMedia.filter(media => {
        if (!media.uri || media.uri === 'null' || media.uri.trim() === '') {
          console.warn('Skipping media with invalid URI:', media);
          return false;
        }
        return true;
      });

      if (validMedia.length === 0) {
        Alert.alert('Error', 'No valid media files to upload. Please select media again.');
        setUploading(false);
        return;
      }

      // Upload all valid media to Cloudinary
      const uploadedMedia: SelectedMedia[] = await Promise.all(
        validMedia.map(async (media, index) => {
          try {
            if (!media.uri || media.uri === 'null' || media.uri.trim() === '') {
              throw new Error(`Invalid URI for media at index ${index}`);
            }

          const uploadResult = await cloudinaryService.uploadMedia(media.uri, {
            folder: 'messages',
            tags: ['message', media.type],
            resource_type: media.type,
          });

          return {
            ...media,
            publicId: uploadResult.public_id,
            secureUrl: uploadResult.secure_url,
          };
          } catch (error: any) {
            console.error(`Error uploading media at index ${index}:`, error);
            throw new Error(`Failed to upload media: ${error.message || 'Unknown error'}`);
          }
        })
      );

      onSend(uploadedMedia, caption);
    } catch (error: any) {
      console.error('Error uploading media:', error);
      Alert.alert('Error', error.message || 'Failed to upload media. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [selectedMedia, caption, onSend]);

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, currentTab === 'Photos' && styles.activeTab]}
              onPress={() => {
                setCurrentTab('Photos');
                goBackToAlbums(); // Reset album selection when switching to Photos
              }}
            >
              <Text style={[styles.tabText, currentTab === 'Photos' && styles.activeTabText]}>
                Photos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, currentTab === 'Albums' && styles.activeTab]}
              onPress={() => {
                setCurrentTab('Albums');
                // Don't reset album selection, just switch tab
              }}
            >
              <Text style={[styles.tabText, currentTab === 'Albums' && styles.activeTabText]}>
                Albums
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.placeholder} />
        </View>

        {/* Selected Media Preview - Compact */}
        {selectedMedia.length > 0 && (
          <View style={styles.selectedMediaContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.selectedMediaScroll}
              contentContainerStyle={styles.selectedMediaContent}
            >
              {selectedMedia.map((media, index) => (
                <View key={index} style={styles.selectedMediaItem}>
                  <Image
                    source={{ uri: media.uri }}
                    style={styles.selectedMediaImage}
                    resizeMode="cover"
                  />
                  {media.type === 'video' && (
                    <View style={styles.videoBadge}>
                      <FontAwesome name="play" size={10} color="#FFFFFF" />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveMedia(index)}
                  >
                    <FontAwesome name="times-circle" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <View style={styles.selectedNumberBadge}>
                    <Text style={styles.selectedNumberText}>{index + 1}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Album Header (if album selected) */}
        {currentTab === 'Albums' && selectedAlbum && (
          <View style={styles.albumHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={goBackToAlbums}
              activeOpacity={0.7}
            >
              <FontAwesome name="arrow-left" size={18} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.albumHeaderTitle} numberOfLines={1}>
              {selectedAlbum.title}
            </Text>
            <View style={styles.albumHeaderPlaceholder} />
          </View>
        )}

        {/* Media Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text style={styles.loadingText}>Loading photos...</Text>
          </View>
        ) : currentTab === 'Photos' ? (
          <FlatList
            key="photos-grid"
            data={photos}
            numColumns={3}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.mediaGrid}
            onEndReached={loadMorePhotos}
            onEndReachedThreshold={0.6}
            ListFooterComponent={
              isLoadingMorePhotos ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={theme.colors.primary.main} />
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const isSelected = selectedMediaIds.has(item.id);
              const imageUri = photoUris.get(item.id) || item.uri;
              
              // Lazy load URI if not already loaded (batch load to avoid too many calls)
              if (!photoUris.has(item.id) && item.uri && !assetInfoCache.has(item.id)) {
                // Use a small delay to batch requests
                setTimeout(() => {
                  MediaLibrary.getAssetInfoAsync(item, { shouldDownloadFromNetwork: item.mediaType === MediaLibrary.MediaType.video })
                    .then((assetInfo) => {
                      const localUri = assetInfo.localUri || assetInfo.uri || item.uri;
                      const type = item.mediaType === MediaLibrary.MediaType.video ? 'video' : 'image';
                      
                      setPhotoUris(prev => {
                        if (!prev.has(item.id)) {
                          return new Map(prev).set(item.id, localUri);
                        }
                        return prev;
                      });
                      
                      setAssetInfoCache(prev => {
                        if (!prev.has(item.id)) {
                          return new Map(prev).set(item.id, { localUri, type });
                        }
                        return prev;
                      });
                    })
                    .catch(() => {
                      if (item.uri) {
                        setPhotoUris(prev => {
                          if (!prev.has(item.id)) {
                            return new Map(prev).set(item.id, item.uri);
                          }
                          return prev;
                        });
                        setAssetInfoCache(prev => {
                          if (!prev.has(item.id)) {
                            return new Map(prev).set(item.id, {
                              localUri: item.uri,
                              type: item.mediaType === MediaLibrary.MediaType.video ? 'video' : 'image',
                            });
                          }
                          return prev;
                        });
                      }
                    });
                }, 100); // Small delay to batch requests
              }
              
              return (
                <TouchableOpacity
                  style={[styles.photoItem, isSelected && styles.photoItemSelected]}
                  onPress={() => handleSelectPhoto(item)}
                  activeOpacity={0.7}
                >
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.photoThumbnail}
                      resizeMode="cover"
                      onError={() => {
                        // Silently handle error - image won't display but won't crash
                        // Remove from photoUris to prevent retry
                        setPhotoUris(prev => {
                          const newMap = new Map(prev);
                          newMap.delete(item.id);
                          return newMap;
                        });
                      }}
                    />
                  ) : (
                    <View style={[styles.photoThumbnail, styles.photoPlaceholder]}>
                      <FontAwesome name="image" size={24} color={theme.colors.text.secondary} />
                    </View>
                  )}
                  {item.mediaType === MediaLibrary.MediaType.video && (
                    <View style={styles.videoIndicator}>
                      <FontAwesome name="play" size={12} color="#FFFFFF" />
                    </View>
                  )}
                  {isSelected && (
                    <View style={styles.selectedOverlay}>
                      <View style={styles.selectedCheckBadge}>
                        <Text style={styles.selectedCheckText}>
                          {Array.from(selectedMediaIds).indexOf(item.id) + 1}
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        ) : selectedAlbum ? (
          // Show album photos in Albums tab
          <FlatList
            key="album-photos-grid"
            data={albumPhotos}
            numColumns={3}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.mediaGrid}
            onEndReached={loadMoreAlbum}
            onEndReachedThreshold={0.6}
            ListFooterComponent={
              isLoadingMoreAlbum ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={theme.colors.primary.main} />
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const isSelected = selectedMediaIds.has(item.id);
              const imageUri = albumPhotoUris.get(item.id) || item.uri;
              
              // Lazy load URI if not already loaded (batch load to avoid too many calls)
              if (!albumPhotoUris.has(item.id) && item.uri && !assetInfoCache.has(item.id)) {
                // Use a small delay to batch requests
                setTimeout(() => {
                  MediaLibrary.getAssetInfoAsync(item, { shouldDownloadFromNetwork: false })
                    .then((assetInfo) => {
                      const localUri = assetInfo.localUri || item.uri;
                      const type = 'image'; // Only images allowed, videos filtered out
                      
                      setAlbumPhotoUris(prev => {
                        if (!prev.has(item.id)) {
                          return new Map(prev).set(item.id, localUri);
                        }
                        return prev;
                      });
                      
                      setAssetInfoCache(prev => {
                        if (!prev.has(item.id)) {
                          return new Map(prev).set(item.id, { localUri, type });
                        }
                        return prev;
                      });
                    })
                    .catch(() => {
                      if (item.uri) {
                        setAlbumPhotoUris(prev => {
                          if (!prev.has(item.id)) {
                            return new Map(prev).set(item.id, item.uri);
                          }
                          return prev;
                        });
                        setAssetInfoCache(prev => {
                          if (!prev.has(item.id)) {
                            return new Map(prev).set(item.id, {
                              localUri: item.uri,
                              type: item.mediaType === MediaLibrary.MediaType.video ? 'video' : 'image',
                            });
                          }
                          return prev;
                        });
                      }
                    });
                }, 100); // Small delay to batch requests
              }
              
              return (
                <TouchableOpacity
                  style={[styles.photoItem, isSelected && styles.photoItemSelected]}
                  onPress={() => handleSelectPhoto(item)}
                  activeOpacity={0.7}
                >
                  {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.photoThumbnail}
                        resizeMode="cover"
                        onError={() => {
                          // Silently handle error
                          setAlbumPhotoUris(prev => {
                            const newMap = new Map(prev);
                            newMap.delete(item.id);
                            return newMap;
                          });
                        }}
                      />
                  ) : (
                    <View style={[styles.photoThumbnail, styles.photoPlaceholder]}>
                      <FontAwesome 
                        name={item.mediaType === MediaLibrary.MediaType.video ? "video-camera" : "image"} 
                        size={24} 
                        color={theme.colors.text.secondary} 
                      />
                    </View>
                  )}
                  {item.mediaType === MediaLibrary.MediaType.video && (
                    <View style={styles.videoIndicator}>
                      <FontAwesome name="play" size={12} color="#FFFFFF" />
                    </View>
                  )}
                  {isSelected && (
                    <View style={styles.selectedOverlay}>
                      <View style={styles.selectedCheckBadge}>
                        <Text style={styles.selectedCheckText}>
                          {Array.from(selectedMediaIds).indexOf(item.id) + 1}
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <FlatList
            key="albums-list"
            data={albums}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.albumsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.albumItem}
                onPress={() => {
                  loadAlbumPhotos(item);
                  // Stay in Albums tab
                }}
                activeOpacity={0.7}
              >
                <View style={styles.albumThumbnail}>
                  <FontAwesome name="folder" size={32} color={theme.colors.text.secondary} />
                </View>
                <View style={styles.albumInfo}>
                  <Text style={styles.albumName}>{item.title}</Text>
                  <Text style={styles.albumCount}>{item.assetCount} items</Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            )}
          />
        )}

        {/* Caption Input */}
        <View style={styles.captionContainer}>
          <CustomTextInput
            style={styles.captionInput}
            placeholder="Add a caption..."
            placeholderTextColor={theme.colors.text.secondary}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={500}
          />
          <View style={styles.sendButtonContainer}>
            {selectedMedia.length > 0 && (
              <View style={styles.sendButtonBadge}>
                <Text style={styles.sendButtonBadgeText}>
                  {selectedMedia.length > 9 ? '9+' : selectedMedia.length}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (uploading || selectedMedia.length === 0) && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={uploading || selectedMedia.length === 0}
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
    backgroundColor: theme.colors.background.default,
    paddingTop: 50, // Safe area for status bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.paper,
  },
  cancelButton: {
    padding: theme.spacing.xs,
    minWidth: 60,
  },
  cancelText: {
    fontSize: 16,
    color: theme.colors.primary.main,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.grey[200],
    borderRadius: 8,
    padding: 2,
  },
  tab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: theme.colors.background.paper,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  albumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.paper,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  albumHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  albumHeaderPlaceholder: {
    width: 40,
  },
  selectedMediaContainer: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.paper,
  },
  selectedMediaScroll: {
    paddingHorizontal: theme.spacing.sm,
  },
  selectedMediaContent: {
    paddingRight: theme.spacing.sm,
  },
  selectedMediaItem: {
    width: 60,
    height: 60,
    marginRight: theme.spacing.xs,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: theme.colors.grey[200],
  },
  selectedMediaImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 2,
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E10600',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  selectedNumberBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: theme.colors.primary.main,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  selectedNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mediaGrid: {
    padding: 2,
  },
  photoItem: {
    width: (width - 4) / 3,
    height: (width - 4) / 3,
    margin: 1,
    position: 'relative',
    backgroundColor: theme.colors.grey[200],
    overflow: 'hidden',
  },
  photoItemSelected: {
    opacity: 0.6,
    borderWidth: 3,
    borderColor: theme.colors.primary.main,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.grey[200],
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.grey[100],
  },
  videoIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  selectedCheckBadge: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  selectedCheckText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingMore: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  albumsList: {
    padding: theme.spacing.sm,
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  albumThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: theme.colors.grey[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  albumInfo: {
    flex: 1,
  },
  albumName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  albumCount: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  captionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl, // Same as conversation inputContainer
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.paper,
  },
  captionInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.grey[100],
    borderRadius: 20,
    fontSize: 15,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  sendButtonContainer: {
    position: 'relative',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.grey[300],
    opacity: 0.5,
  },
  sendButtonBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#25D366', // Green color
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 1,
  },
  sendButtonBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default MediaPickerModal;
