/**
 * File Security Utilities
 * Validates file safety before upload to prevent dangerous file types
 */

// List of dangerous file extensions to block
export const DANGEROUS_EXTENSIONS = [
  // Executables (Windows, Mac, Linux)
  'exe', 'bat', 'cmd', 'com', 'scr', 'msi', 'app', 'dmg', 'deb', 'rpm', 'pkg',
  // Scripts
  'js', 'jsx', 'ts', 'tsx', 'php', 'py', 'pyc', 'pyo', 'rb', 'sh', 'bash', 'ps1', 'vbs', 'jar', 'class',
  // Libraries and binaries
  'dll', 'so', 'dylib', 'bin',
  // Mobile apps
  'apk', 'ipa',
  // Other potentially dangerous
  'plist', 'swf', 'action', 'cgi', 'pl',
];

// List of dangerous MIME types to block
export const DANGEROUS_MIME_TYPES = [
  'application/x-msdownload',
  'application/x-executable',
  'application/x-msdos-program',
  'application/x-sh',
  'application/x-shellscript',
  'application/x-perl',
  'application/x-python',
  'application/x-ruby',
  'application/x-php',
  'application/javascript',
  'application/x-javascript',
  'text/javascript',
  'application/x-java-archive',
  'application/java-archive',
  'application/x-ms-application',
  'application/x-ms-shortcut',
];

/**
 * Validates if a file is safe to upload
 * @param fileName - Name of the file
 * @param mimeType - MIME type of the file (optional)
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateFileSafety = (
  fileName: string,
  mimeType?: string
): { isValid: boolean; error?: string } => {
  if (!fileName || fileName.trim() === '') {
    return {
      isValid: false,
      error: 'File name is required.',
    };
  }

  // Check file extension
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (!extension) {
    if (!mimeType) {
      return {
        isValid: false,
        error: 'File must have a valid extension. Please select a document file.',
      };
    }
  } else if (DANGEROUS_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `File type .${extension} is not allowed for security reasons. Please select a document file (PDF, Word, Excel, etc.).`,
    };
  }

  // Check MIME type
  if (mimeType) {
    const normalizedMimeType = mimeType.toLowerCase();
    for (const dangerousMime of DANGEROUS_MIME_TYPES) {
      if (normalizedMimeType.includes(dangerousMime)) {
        return {
          isValid: false,
          error: 'This file type is not allowed for security reasons. Please select a document file (PDF, Word, Excel, etc.).',
        };
      }
    }
  }

  return { isValid: true };
};

/**
 * Gets a safe list of allowed file types for document picker
 * This is a whitelist approach - only allow known safe types
 */
export const getAllowedFileTypes = (): string[] => {
  return [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/rtf',
    'text/plain',
    'text/csv',
    // Images (already handled by image picker, but safe)
    'image/*',
    // Archives (with caution)
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
  ];
};
