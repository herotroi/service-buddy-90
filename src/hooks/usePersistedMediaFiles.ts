import { useState, useEffect, useCallback, useRef } from 'react';
import { getSignedUrl } from '@/lib/storageUtils';

export interface MediaFile {
  url: string;
  path: string;
  type: 'image' | 'video';
  name: string;
}

const STORAGE_PREFIX = 'os_media_files_';

/**
 * Hook para persistir arquivos de mídia no sessionStorage
 * Resolve o problema de perda de estado quando o navegador mobile
 * desmonta o componente ao abrir a câmera nativa
 */
export const usePersistedMediaFiles = (
  formType: 'service_orders' | 'service_orders_informatica',
  orderId?: string
) => {
  const storageKey = orderId 
    ? `${STORAGE_PREFIX}${formType}_edit_${orderId}` 
    : `${STORAGE_PREFIX}${formType}_new`;

  // Usar ref para evitar re-renders desnecessários
  const isInitialMount = useRef(true);
  const hasLoadedFromDb = useRef(false);

  // Inicializa com dados do sessionStorage
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log(`[usePersistedMediaFiles] Restaurando ${parsed.length} arquivos do sessionStorage`);
        return parsed;
      }
    } catch (error) {
      console.error('[usePersistedMediaFiles] Erro ao ler sessionStorage:', error);
    }
    return [];
  });

  // Sincroniza com sessionStorage a cada mudança (exceto na montagem inicial)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    try {
      if (mediaFiles.length > 0) {
        sessionStorage.setItem(storageKey, JSON.stringify(mediaFiles));
        console.log(`[usePersistedMediaFiles] Salvando ${mediaFiles.length} arquivos no sessionStorage`);
      } else {
        // Não remover se acabou de carregar do DB e está vazio
        if (!hasLoadedFromDb.current) {
          sessionStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error('[usePersistedMediaFiles] Erro ao salvar sessionStorage:', error);
    }
  }, [mediaFiles, storageKey]);

  // Função para definir arquivos vindos do banco de dados
  // Isso limpa qualquer dado persistido e usa os dados do DB
  const setMediaFilesFromDb = useCallback((files: MediaFile[]) => {
    hasLoadedFromDb.current = true;
    sessionStorage.removeItem(storageKey);
    setMediaFiles(files);
    console.log(`[usePersistedMediaFiles] Definindo ${files.length} arquivos do banco de dados`);
  }, [storageKey]);

  // Função para adicionar arquivos (preserva existentes)
  const addMediaFiles = useCallback((newFiles: MediaFile[]) => {
    setMediaFiles(prev => {
      const updated = [...prev, ...newFiles];
      console.log(`[usePersistedMediaFiles] Adicionando ${newFiles.length} arquivos, total: ${updated.length}`);
      return updated;
    });
  }, []);

  // Função para remover um arquivo
  const removeMediaFile = useCallback((index: number) => {
    setMediaFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      console.log(`[usePersistedMediaFiles] Removendo arquivo índice ${index}, restantes: ${updated.length}`);
      return updated;
    });
  }, []);

  // Função para limpar após sucesso
  const clearPersistedFiles = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
      // Limpar também a chave de "nova OS" se estivermos editando
      if (orderId) {
        sessionStorage.removeItem(`${STORAGE_PREFIX}${formType}_new`);
      }
      setMediaFiles([]);
      console.log(`[usePersistedMediaFiles] Dados limpos do sessionStorage`);
    } catch (error) {
      console.error('[usePersistedMediaFiles] Erro ao limpar sessionStorage:', error);
    }
  }, [storageKey, formType, orderId]);

  // Função para renovar URLs assinadas expiradas
  const refreshSignedUrls = useCallback(async () => {
    if (mediaFiles.length === 0) return;

    console.log(`[usePersistedMediaFiles] Renovando URLs assinadas para ${mediaFiles.length} arquivos`);
    
    const refreshedFiles = await Promise.all(
      mediaFiles.map(async (file) => {
        try {
          // Verificar se a URL parece expirada (contém token e é antiga)
          const signedUrl = await getSignedUrl(file.path, 3600);
          if (signedUrl) {
            return { ...file, url: signedUrl };
          }
        } catch (error) {
          console.error(`[usePersistedMediaFiles] Erro ao renovar URL para ${file.path}:`, error);
        }
        return file;
      })
    );

    setMediaFiles(refreshedFiles);
  }, [mediaFiles]);

  // Verificar se há arquivos persistidos que precisam de renovação de URL
  useEffect(() => {
    if (mediaFiles.length > 0 && !hasLoadedFromDb.current) {
      // Arquivos vieram do sessionStorage, podem ter URLs expiradas
      refreshSignedUrls();
    }
  }, []); // Executar apenas na montagem

  return {
    mediaFiles,
    setMediaFiles,
    setMediaFilesFromDb,
    addMediaFiles,
    removeMediaFile,
    clearPersistedFiles,
    refreshSignedUrls,
  };
};
