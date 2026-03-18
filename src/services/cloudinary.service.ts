import { cloudinaryConfig } from '@/config';
import * as FileSystem from 'expo-file-system/legacy';

export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  resource_type: 'image' | 'video' | 'raw' | 'auto';
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
  created_at: string;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  public_id?: string;
  tags?: string[];
  transformation?: Record<string, any>;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  /** Disables crop in the picker (gallery/camera). If false, original dimensions are preserved. */
  allowsEditing?: boolean;
  /** Crop ratio [width, height] when allowsEditing=true. Ex: [4,3], [1,1]. */
  aspect?: [number, number];
}

class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;
  private apiKey: string;

  constructor() {
    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
      throw new Error('Cloudinary configuration is missing. Please check your environment variables.');
    }

    this.cloudName = cloudinaryConfig.cloudName;
    this.uploadPreset = cloudinaryConfig.uploadPreset;
    this.apiKey = cloudinaryConfig.apiKey || '';
  }

  /**
   * Upload an image or video to Cloudinary
   */
  async uploadMedia(
    uri: string,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResponse> {
    try {
      // Validate URI
      if (!uri || uri === 'null' || uri.trim() === '') {
        throw new Error('Invalid media URI: URI is null or empty');
      }

      const formData = new FormData();

      // Determine file type
      const fileType = this.getFileType(uri);
      const resourceType = options.resource_type || (fileType.startsWith('video') ? 'video' : 'image');

      const fileName = options.public_id
        ? (options.public_id.includes('.') ? options.public_id : `${options.public_id}.${this.getFileExtension(uri)}`)
        : `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${this.getFileExtension(uri)}`;

      if (resourceType === 'raw') {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          throw new Error('File does not exist at the provided URI');
        }

        if (!fileInfo.size || fileInfo.size === 0) {
          throw new Error('File is empty (0 bytes)');
        }

        console.log('📄 Raw file info:', {
          uri,
          size: fileInfo.size,
          exists: fileInfo.exists,
        });

        formData.append('file', {
          uri: uri,
          type: fileType,
          name: fileName,
        } as any);
      } else {
        formData.append('file', {
          uri,
          type: fileType,
          name: fileName,
        } as any);
      }

      formData.append('upload_preset', this.uploadPreset);

      if (resourceType === 'raw') {
        formData.append('resource_type', 'raw');
      } else {
      formData.append('quality', 'auto:best');
      formData.append('fetch_format', 'auto');
      }

      if (options.folder) {
        formData.append('folder', options.folder);
      }

      if (options.public_id) {
        formData.append('public_id', options.public_id);
      }

      if (options.tags && options.tags.length > 0) {
        formData.append('tags', options.tags.join(','));
      }

      if (options.transformation) {
        formData.append('transformation', JSON.stringify(options.transformation));
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      return result as CloudinaryUploadResponse;
    } catch (error) {
      console.error('Erreur lors de l\'upload vers Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleMedia(
    uris: string[],
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResponse[]> {
    const uploadPromises = uris.map((uri, index) =>
      this.uploadMedia(uri, {
        ...options,
        public_id: options.public_id ? `${options.public_id}_${index}` : undefined,
      })
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Delete a media from Cloudinary
   */
  async deleteMedia(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('api_key', this.apiKey);

      const timestamp = Math.round(new Date().getTime() / 1000);
      formData.append('timestamp', timestamp.toString());

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/destroy`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();
      return result.result === 'ok';
    } catch (error) {
      console.error('Erreur lors de la suppression du média:', error);
      return false;
    }
  }

  /**
   * Generate an optimized URL for a media
   */
  generateOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: 'fill' | 'fit' | 'limit' | 'scale' | 'crop';
      quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low' | number;
      format?: 'auto' | 'webp' | 'jpg' | 'png' | 'mp4' | 'webm';
      resource_type?: 'image' | 'video';
    } = {}
  ): string {
    const {
      width,
      height,
      crop = 'fill',
      quality = 'auto:best',
      format = 'auto',
      resource_type = 'image',
    } = options;

    console.log('🔧 CloudinaryService - generateOptimizedUrl called with:', {
      publicId,
      options,
      resource_type
    });

    let finalPublicId = publicId;
    let useFormatParam = true;

    if (resource_type === 'video' && !publicId.includes('.')) {
      finalPublicId = `${publicId}.mp4`;
      useFormatParam = false;
    }

    let transformationString = '';
    const transformations = [];

    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (width || height) transformations.push(`c_${crop}`);
    transformations.push(`q_${quality}`);

    if (useFormatParam) {
      if (resource_type === 'video' && format === 'auto') {
        transformations.push(`f_mp4`);
      } else {
        transformations.push(`f_${format}`);
      }
    }

    if (transformations.length > 0) {
      transformationString = `/${transformations.join(',')}`;
    }

    const generatedUrl = `https://res.cloudinary.com/${this.cloudName}/${resource_type}/upload${transformationString}/${finalPublicId}`;

    console.log('🔧 CloudinaryService - generated URL:', {
      resource_type,
      originalPublicId: publicId,
      finalPublicId,
      useFormatParam,
      generatedUrl
    });

    return generatedUrl;
  }

  /**
   * Get MIME type based on file extension
   */
  private getFileType(uri: string): string {
    const extension = this.getFileExtension(uri).toLowerCase();

    const imageTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
    };

    const videoTypes: { [key: string]: string } = {
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'mkv': 'video/x-matroska',
      'webm': 'video/webm',
    };

    return imageTypes[extension] || videoTypes[extension] || 'application/octet-stream';
  }

  /**
   * Extract file extension
   */
  private getFileExtension(uri: string): string {
    return uri.split('.').pop() || '';
  }
}

export const cloudinaryService = new CloudinaryService();
