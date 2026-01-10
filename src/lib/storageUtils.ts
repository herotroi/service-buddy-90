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

/**
 * Lista todos os arquivos de uma OS no storage
 * Útil para recuperar arquivos órfãos que não foram salvos no banco
 * @param orderId - O ID da OS
 */
export const listOrderFiles = async (orderId: string): Promise<MediaFile[]> => {
  try {
    const { data: files, error } = await supabase.storage
      .from('service-orders-media')
      .list(orderId, { limit: 100 });

    if (error) {
      console.error('Erro ao listar arquivos do storage:', error);
      return [];
    }

    if (!files || files.length === 0) {
      return [];
    }

    // Converter para MediaFile com URLs assinadas
    const mediaFiles: MediaFile[] = await Promise.all(
      files.map(async (file) => {
        const path = `${orderId}/${file.name}`;
        const signedUrl = await getSignedUrl(path, 3600);
        
        // Detectar tipo pelo nome do arquivo
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const isVideo = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'quicktime'].includes(ext);
        
        return {
          url: signedUrl || '',
          path,
          type: isVideo ? 'video' : 'image',
          name: file.name,
        } as MediaFile;
      })
    );

    // Filtrar arquivos sem URL válida
    return mediaFiles.filter(f => f.url);
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    return [];
  }
};
