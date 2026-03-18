// Media type constants and utilities

/**
 * Supported video file extensions
 */
export const VIDEO_EXTENSIONS = [
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.webm',
  '.m4v'
] as const;

/**
 * Video format identifiers for URLs
 */
export const VIDEO_URL_PATTERNS = [
  '/video/upload',
  '/v_',
  'f_mp4',
  'f_webm',
  'f_mov'
] as const;

/**
 * Video resource types in metadata
 */
export const VIDEO_RESOURCE_TYPES = [
  'video'
] as const;

/**
 * Video metadata formats
 */
export const VIDEO_METADATA_FORMATS = [
  'mp4',
  'mov',
  'avi',
  'webm',
  'mkv'
] as const;

/**
 * Media types
 */
export type MediaType = 'image' | 'video';

/**
 * Detect media type from metadata
 */
export const detectMediaTypeFromMetadata = (imageMetadata?: string): MediaType | null => {
  if (!imageMetadata) return null;

  try {
    const metadata = JSON.parse(imageMetadata);

    if (metadata.resource_type === 'video' ||
        metadata.mediaType === 'video' ||
        metadata.resourceType === 'video') {
      return 'video';
    }

    if (metadata.format && VIDEO_METADATA_FORMATS.includes(metadata.format.toLowerCase())) {
      return 'video';
    }
  } catch (e) {
    console.warn('Failed to parse image metadata:', e);
  }

  return null;
};

/**
 * Detect media type from URL
 */
export const detectMediaTypeFromUrl = (url?: string): MediaType | null => {
  if (!url) return null;

  const lowercaseUrl = url.toLowerCase();

  const hasVideoExtension = VIDEO_EXTENSIONS.some(ext => lowercaseUrl.includes(ext));
  if (hasVideoExtension) {
    return 'video';
  }

  const hasVideoPattern = VIDEO_URL_PATTERNS.some(pattern => lowercaseUrl.includes(pattern));
  if (hasVideoPattern) {
    return 'video';
  }

  return null;
};

/**
 * Comprehensive media type detection
 */
export const detectMediaType = (cloudinaryUrl?: string, cloudinaryPublicId?: string, imageMetadata?: string): MediaType => {
  const metadataType = detectMediaTypeFromMetadata(imageMetadata);
  if (metadataType) {
    return metadataType;
  }

  const urlType = detectMediaTypeFromUrl(cloudinaryUrl);
  if (urlType) {
    return urlType;
  }

  if (cloudinaryPublicId) {
    const lowercaseId = cloudinaryPublicId.toLowerCase();
    if (lowercaseId.includes('video') || lowercaseId.startsWith('videos/') || lowercaseId.includes('/video/')) {
      return 'video';
    }
  }

  return 'image';
};
