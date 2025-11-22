// Configurações de compressão
const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1920;
const IMAGE_QUALITY = 0.8;
const MAX_VIDEO_SIZE_MB = 5000; // Limite máximo para vídeos (5GB)

/**
 * Comprime uma imagem redimensionando e ajustando a qualidade
 */
export const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
          if (width > height) {
            height = Math.round((height * MAX_IMAGE_WIDTH) / width);
            width = MAX_IMAGE_WIDTH;
          } else {
            width = Math.round((width * MAX_IMAGE_HEIGHT) / height);
            height = MAX_IMAGE_HEIGHT;
          }
        }
        
        // Criar canvas e redimensionar
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'));
          return;
        }
        
        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para blob com compressão
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Falha ao comprimir imagem'));
              return;
            }
            
            // Criar novo arquivo com o blob comprimido
            const compressedFile = new File(
              [blob],
              file.name,
              { type: 'image/jpeg' }
            );
            
            console.log(`Imagem comprimida: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
            resolve(compressedFile);
          },
          'image/jpeg',
          IMAGE_QUALITY
        );
      };
      
      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
};

/**
 * Valida e prepara vídeo para upload
 * Para vídeos, apenas validamos o tamanho já que compressão real requer backend
 */
export const prepareVideo = async (file: File): Promise<File> => {
  const fileSizeMB = file.size / 1024 / 1024;
  
  if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
    throw new Error(`Vídeo muito grande. Tamanho máximo: ${MAX_VIDEO_SIZE_MB}MB`);
  }
  
  console.log(`Vídeo preparado para upload: ${fileSizeMB.toFixed(2)}MB`);
  return file;
};

/**
 * Processa arquivo de mídia (imagem ou vídeo)
 */
export const processMediaFile = async (file: File): Promise<File> => {
  const fileType = file.type.split('/')[0];
  
  if (fileType === 'image') {
    return await compressImage(file);
  } else if (fileType === 'video') {
    return await prepareVideo(file);
  }
  
  throw new Error('Tipo de arquivo não suportado');
};

/**
 * Formata tamanho de arquivo para exibição
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
