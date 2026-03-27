import { cloudinaryConfig } from '../config';
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
  /** Désactive le crop dans le sélecteur (galerie/caméra). Si false, les dimensions originales sont conservées. */
  allowsEditing?: boolean;
  /** Ratio de découpe [largeur, hauteur] quand allowsEditing=true. Ex: [4,3], [1,1]. */
  aspect?: [number, number];
}

class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;

  constructor() {
    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
      throw new Error('Cloudinary configuration is missing. Please check your environment variables.');
    }

    this.cloudName = cloudinaryConfig.cloudName;
    this.uploadPreset = cloudinaryConfig.uploadPreset;
  }

  /**
   * Upload une image ou vidéo vers Cloudinary
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
      
      // Déterminer le type de fichier
      const fileType = this.getFileType(uri);
      const resourceType = options.resource_type || (fileType.startsWith('video') ? 'video' : 'image');
      
      // Use public_id if provided, otherwise generate a unique name
      // If public_id is provided, use it as-is (it may already include extension)
      const fileName = options.public_id 
        ? (options.public_id.includes('.') ? options.public_id : `${options.public_id}.${this.getFileExtension(uri)}`)
        : `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${this.getFileExtension(uri)}`;
      
      // For raw files, we need to read the file and send it properly
      // React Native FormData doesn't handle raw file URIs the same way as images/videos
      if (resourceType === 'raw') {
        // Verify file exists and get its info
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          throw new Error('File does not exist at the provided URI');
        }
        
        // Verify file is not empty
        if (!fileInfo.size || fileInfo.size === 0) {
          throw new Error('File is empty (0 bytes)');
        }
        
        console.log('📄 Raw file info:', {
          uri,
          size: fileInfo.size,
          exists: fileInfo.exists,
        });
        
        // For raw files on React Native, we need to ensure the URI is properly formatted
        // The URI from DocumentPicker should work, but we verify it's accessible
        // React Native FormData can handle file URIs directly for raw files
        formData.append('file', {
          uri: uri,
          type: fileType,
          name: fileName,
        } as any);
      } else {
        // For images and videos, use the uri directly (works fine)
      formData.append('file', {
        uri,
        type: fileType,
          name: fileName,
      } as any);
      }
      
      formData.append('upload_preset', this.uploadPreset);
      
      // For raw files, ensure we specify resource_type explicitly
      if (resourceType === 'raw') {
        formData.append('resource_type', 'raw');
        // Note: access_mode cannot be set with unsigned uploads
        // The upload preset must be configured to upload files as public
        // For raw files, don't apply any transformations that might corrupt the file
        // Ensure the file is uploaded as-is
      } else {
      // Paramètres pour garantir une haute qualité lors de l'upload
      // Ces paramètres peuvent être surchargés par le preset, mais on les spécifie explicitement
      formData.append('quality', 'auto:best'); // Qualité maximale pour les posts
      formData.append('fetch_format', 'auto'); // Format optimal selon le navigateur
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
   * Génère une URL optimisée pour un média
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
      quality = 'auto:best', // Qualité optimale par défaut pour préserver la résolution
      format = 'auto',
      resource_type = 'image',
    } = options;

    console.log('🔧 CloudinaryService - generateOptimizedUrl called with:', {
      publicId,
      options,
      resource_type
    });

    // Pour les vidéos, ajouter l'extension .mp4 si elle n'est pas déjà présente
    let finalPublicId = publicId;
    let useFormatParam = true;
    
    if (resource_type === 'video' && !publicId.includes('.')) {
      finalPublicId = `${publicId}.mp4`;
      // Si on ajoute l'extension .mp4, pas besoin du paramètre f_mp4
      useFormatParam = false;
    }

    let transformationString = '';
    const transformations = [];

    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (width || height) transformations.push(`c_${crop}`);
    transformations.push(`q_${quality}`);
    
    // Ajouter le paramètre de format seulement si on n'a pas déjà l'extension
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
   * Obtient le type MIME du fichier basé sur l'extension
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
   * Extrait l'extension du fichier
   */
  private getFileExtension(uri: string): string {
    return uri.split('.').pop() || '';
  }
}

export const cloudinaryService = new CloudinaryService(); 