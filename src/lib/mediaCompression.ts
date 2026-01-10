import heic2any from 'heic2any';

// Configurações de compressão - qualidade alta para preservar detalhes
const MAX_IMAGE_WIDTH = 2560;
const MAX_IMAGE_HEIGHT = 2560;
const IMAGE_QUALITY = 0.92; // Qualidade alta para preservar detalhes
const MAX_VIDEO_SIZE_MB = 5000; // Limite máximo para vídeos (5GB)

// Extensões de imagem suportadas (iPhone + Android)
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.bmp', '.tiff'];
// Extensões de vídeo suportadas (iPhone + Android)
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v', '.3gp', '.3gpp', '.quicktime', '.ts', '.mts'];

/**
 * Detecta se o arquivo é uma imagem baseado no tipo MIME ou extensão
 */
export const isImageFile = (file: File): boolean => {
  // Verificar pelo tipo MIME primeiro
  if (file.type && file.type.startsWith('image/')) {
    return true;
  }
  
  // Fallback: verificar pela extensão do arquivo (importante para iPhone/Android)
  const fileName = file.name.toLowerCase();
  return IMAGE_EXTENSIONS.some(ext => fileName.endsWith(ext));
};

/**
 * Detecta se o arquivo é um vídeo baseado no tipo MIME ou extensão
 */
export const isVideoFile = (file: File): boolean => {
  // Verificar pelo tipo MIME primeiro
  if (file.type && (file.type.startsWith('video/') || file.type === 'video/quicktime')) {
    return true;
  }
  
  // Fallback: verificar pela extensão do arquivo (importante para iPhone/Android com MOV, 3GP, WebM)
  const fileName = file.name.toLowerCase();
  return VIDEO_EXTENSIONS.some(ext => fileName.endsWith(ext));
};

/**
 * Detecta se o arquivo é HEIC/HEIF (formato padrão do iPhone)
 */
const isHeicFile = (file: File): boolean => {
  const mimeTypes = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];
  if (file.type && mimeTypes.includes(file.type.toLowerCase())) {
    return true;
  }
  
  // iPhone às vezes não envia o MIME type correto, verificar extensão
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.heic') || fileName.endsWith('.heif');
};

/**
 * Converte HEIC para JPEG se necessário
 */
const convertHeicIfNeeded = async (file: File): Promise<File> => {
  if (!isHeicFile(file)) {
    return file;
  }

  console.log('Detectado arquivo HEIC/HEIF, iniciando conversão...');
  
  try {
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92 // Qualidade alta para preservar detalhes
    }) as Blob;
    
    const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    console.log(`HEIC convertido para JPEG: ${file.name} -> ${newFileName}`);
    
    return new File(
      [convertedBlob],
      newFileName,
      { type: 'image/jpeg' }
    );
  } catch (error) {
    console.error('Erro ao converter HEIC:', error);
    throw new Error('Não foi possível converter a imagem HEIC. Por favor, tente novamente ou use formato JPEG/PNG.');
  }
};

/**
 * Comprime uma imagem redimensionando e ajustando a qualidade
 */
export const compressImage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> => {
  return new Promise(async (resolve, reject) => {
    try {
      onProgress?.(5);
      
      // Converter HEIC se necessário
      let convertedFile: File;
      try {
        convertedFile = await convertHeicIfNeeded(file);
        if (convertedFile !== file) {
          console.log('Arquivo HEIC convertido com sucesso');
        }
      } catch (heicError) {
        reject(heicError);
        return;
      }
      
      onProgress?.(15);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        onProgress?.(25);
        const img = new Image();
        
        img.onload = () => {
          onProgress?.(40);
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
          
          // Desenhar imagem redimensionada com alta qualidade
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          onProgress?.(60);
          
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
                convertedFile.name.replace(/\.[^.]+$/, '.jpg'),
                { type: 'image/jpeg' }
              );
              
              console.log(`Imagem comprimida: ${(convertedFile.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (${width}x${height})`);
              onProgress?.(70);
              resolve(compressedFile);
            },
            'image/jpeg',
            IMAGE_QUALITY
          );
        };
        
        img.onerror = () => {
          console.error('Erro ao carregar imagem no canvas');
          reject(new Error('Falha ao carregar imagem. Verifique se o arquivo não está corrompido.'));
        };
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => {
        console.error('Erro ao ler arquivo');
        reject(new Error('Falha ao ler arquivo. Tente novamente.'));
      };
      reader.readAsDataURL(convertedFile);
    } catch (error: any) {
      console.error('Erro geral na compressão:', error);
      reject(error);
    }
  });
};

/**
 * Valida e prepara vídeo para upload
 * Para vídeos, apenas validamos o tamanho já que compressão real requer backend
 */
export const prepareVideo = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> => {
  onProgress?.(30);
  const fileSizeMB = file.size / 1024 / 1024;
  
  if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
    throw new Error(`Vídeo muito grande. Tamanho máximo: ${MAX_VIDEO_SIZE_MB}MB. Seu arquivo: ${fileSizeMB.toFixed(0)}MB`);
  }
  
  // Corrigir o tipo MIME para vídeos que não têm tipo detectado corretamente
  let processedFile = file;
  const fileName = file.name.toLowerCase();
  const ext = fileName.split('.').pop() || '';
  
  // Mapear extensões para tipos MIME corretos
  const mimeMap: Record<string, string> = {
    'mov': 'video/quicktime',
    'mp4': 'video/mp4',
    'm4v': 'video/x-m4v',
    'webm': 'video/webm',
    '3gp': 'video/3gpp',
    '3gpp': 'video/3gpp',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
    'ts': 'video/mp2t',
    'mts': 'video/mp2t',
  };
  
  if ((!file.type || file.type === '' || file.type === 'application/octet-stream') && mimeMap[ext]) {
    processedFile = new File([file], file.name, { type: mimeMap[ext] });
    console.log(`Tipo MIME do vídeo corrigido para ${mimeMap[ext]}`);
  }
  
  console.log(`Vídeo preparado para upload: ${fileSizeMB.toFixed(2)}MB (${processedFile.type || 'tipo não detectado'})`);
  onProgress?.(70);
  return processedFile;
};

/**
 * Processa arquivo de mídia (imagem ou vídeo)
 */
export const processMediaFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> => {
  console.log(`Processando arquivo: ${file.name}, tipo: ${file.type || 'não detectado'}, tamanho: ${formatFileSize(file.size)}`);
  
  // Usar detecção robusta baseada em extensão também (importante para iPhone)
  if (isImageFile(file)) {
    console.log('Arquivo detectado como imagem');
    return await compressImage(file, onProgress);
  } else if (isVideoFile(file)) {
    console.log('Arquivo detectado como vídeo');
    return await prepareVideo(file, onProgress);
  }
  
  // Tentar detectar pelo conteúdo do arquivo como último recurso
  const fileName = file.name.toLowerCase();
  console.warn(`Tipo de arquivo não reconhecido: ${file.name} (${file.type})`);
  
  // Se tem extensão conhecida de imagem ou vídeo, tentar processar
  if (IMAGE_EXTENSIONS.some(ext => fileName.endsWith(ext))) {
    console.log('Tentando processar como imagem baseado na extensão');
    return await compressImage(file, onProgress);
  }
  if (VIDEO_EXTENSIONS.some(ext => fileName.endsWith(ext))) {
    console.log('Tentando processar como vídeo baseado na extensão');
    return await prepareVideo(file, onProgress);
  }
  
  throw new Error(`Tipo de arquivo não suportado: ${file.name}. Use imagens (JPG, PNG, HEIC) ou vídeos (MP4, MOV).`);
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
