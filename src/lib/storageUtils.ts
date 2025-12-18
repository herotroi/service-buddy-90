import { supabase } from '@/integrations/supabase/client';

export interface MediaFile {
  url: string;
  path: string;
  type: 'image' | 'video';
  name: string;
}

/**
 * Generate a signed URL for a media file in private storage
 * @param path - The storage path of the file
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export const getSignedUrl = async (
  path: string,
  expiresIn: number = 3600
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('service-orders-media')
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
};

/**
 * Generate signed URLs for multiple media files
 * @param files - Array of media files with paths
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export const getSignedUrls = async (
  files: MediaFile[],
  expiresIn: number = 3600
): Promise<MediaFile[]> => {
  const signedFiles = await Promise.all(
    files.map(async (file) => {
      const signedUrl = await getSignedUrl(file.path, expiresIn);
      return {
        ...file,
        url: signedUrl || file.url, // Fallback to original URL if signing fails
      };
    })
  );

  return signedFiles;
};

/**
 * Upload a file and get a signed URL back (instead of public URL)
 * @param path - The storage path for the file
 * @param file - The file to upload
 * @param contentType - The MIME type of the file
 */
export const uploadAndGetSignedUrl = async (
  path: string,
  file: File | Blob,
  contentType: string
): Promise<{ signedUrl: string; path: string } | null> => {
  try {
    const { error: uploadError } = await supabase.storage
      .from('service-orders-media')
      .upload(path, file, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const signedUrl = await getSignedUrl(path);
    if (!signedUrl) {
      return null;
    }

    return { signedUrl, path };
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};
