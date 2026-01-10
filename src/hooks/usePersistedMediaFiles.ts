import { useState, useEffect, useCallback, useRef } from 'react';
import { getSignedUrl } from '@/lib/storageUtils';

export interface MediaFile {
  url: string;
  path: string;
  type: 'image' | 'video';
  name: string;
}

const STORAGE_PREFIX = 'os_media_files_';

// Função helper para salvar no sessionStorage de forma síncrona
const saveToStorage = (key: string, files: MediaFile[]) => {
  try {
    if (files.length > 0) {
      sessionStorage.setItem(key, JSON.stringify(files));
      console.log(`[usePersistedMediaFiles] Salvando ${files.length} arquivos no sessionStorage (sync)`);
    } else {
      sessionStorage.removeItem(key);
    }
  } catch (error) {
    console.error('[usePersistedMediaFiles] Erro ao salvar sessionStorage:', error);
  }
};

// Função helper para ler do sessionStorage
const loadFromStorage = (key: string): MediaFile[] => {
  try {
    const stored = sessionStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log(`[usePersistedMediaFiles] Restaurando ${parsed.length} arquivos do sessionStorage`);
      return parsed;
    }
  } catch (error) {
    console.error('[usePersistedMediaFiles] Erro ao ler sessionStorage:', error);
  }
  return [];
};

/**
 * Hook para persistir arquivos de mídia no sessionStorage
 * Resolve o problema de perda de estado quando o navegador mobile
 * desmonta o componente ao abrir a câmera nativa
 * 
 * IMPORTANTE: Usa persistência SÍNCRONA para garantir que os dados
 * são salvos antes de qualquer possível desmontagem do componente
 */
export const usePersistedMediaFiles = (
  formType: 'service_orders' | 'service_orders_informatica',
  orderId?: string
) => {
  const storageKey = orderId 
    ? `${STORAGE_PREFIX}${formType}_edit_${orderId}` 
    : `${STORAGE_PREFIX}${formType}_new`;

  const hasLoadedFromDb = useRef(false);
  const hasRefreshedUrls = useRef(false);

  // Inicializa com dados do sessionStorage
  const [mediaFiles, setMediaFilesState] = useState<MediaFile[]>(() => {
    return loadFromStorage(storageKey);
  });

  // Wrapper para setMediaFiles que também persiste imediatamente
  const setMediaFiles = useCallback((filesOrUpdater: MediaFile[] | ((prev: MediaFile[]) => MediaFile[])) => {
    setMediaFilesState(prev => {
      const newFiles = typeof filesOrUpdater === 'function' ? filesOrUpdater(prev) : filesOrUpdater;
      // Persistir IMEDIATAMENTE de forma síncrona
      if (!hasLoadedFromDb.current) {
        saveToStorage(storageKey, newFiles);
      }
      return newFiles;
    });
  }, [storageKey]);

  // Função para definir arquivos vindos do banco de dados
  // IMPORTANTE: Mescla com arquivos persistidos no sessionStorage para não perder uploads em andamento
  const setMediaFilesFromDb = useCallback((dbFiles: MediaFile[]) => {
    hasLoadedFromDb.current = true;
    
    // Carregar arquivos que podem estar no sessionStorage (uploads feitos durante remontagem)
    const persistedFiles = loadFromStorage(storageKey);
    
    if (persistedFiles.length > 0) {
      // Mesclar: arquivos do DB + arquivos persistidos (evitando duplicatas por path)
      const existingPaths = new Set(dbFiles.map(f => f.path));
      const newPersistedFiles = persistedFiles.filter(f => !existingPaths.has(f.path));
      const merged = [...dbFiles, ...newPersistedFiles];
      
      console.log(`[usePersistedMediaFiles] Mesclando ${dbFiles.length} do DB + ${newPersistedFiles.length} persistidos = ${merged.length} total`);
      
      // Manter persistência para não perder os novos arquivos
      saveToStorage(storageKey, merged);
      setMediaFilesState(merged);
    } else {
      // Não há arquivos persistidos, apenas usar os do DB
      sessionStorage.removeItem(storageKey);
      setMediaFilesState(dbFiles);
      console.log(`[usePersistedMediaFiles] Definindo ${dbFiles.length} arquivos do banco de dados`);
    }
  }, [storageKey]);

  // Função para adicionar arquivos (preserva existentes) - PERSISTE IMEDIATAMENTE
  const addMediaFiles = useCallback((newFiles: MediaFile[]) => {
    setMediaFilesState(prev => {
      const updated = [...prev, ...newFiles];
      console.log(`[usePersistedMediaFiles] Adicionando ${newFiles.length} arquivos, total: ${updated.length}`);
      // Persistir IMEDIATAMENTE de forma síncrona
      saveToStorage(storageKey, updated);
      return updated;
    });
  }, [storageKey]);

  // Função para remover um arquivo - PERSISTE IMEDIATAMENTE
  const removeMediaFile = useCallback((index: number) => {
    setMediaFilesState(prev => {
      const updated = prev.filter((_, i) => i !== index);
      console.log(`[usePersistedMediaFiles] Removendo arquivo índice ${index}, restantes: ${updated.length}`);
      // Persistir IMEDIATAMENTE de forma síncrona
      saveToStorage(storageKey, updated);
      return updated;
    });
  }, [storageKey]);

  // Função para limpar após sucesso
  const clearPersistedFiles = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
      // Limpar também a chave de "nova OS" se estivermos editando
      if (orderId) {
        sessionStorage.removeItem(`${STORAGE_PREFIX}${formType}_new`);
      }
      setMediaFilesState([]);
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

    // Atualizar estado e persistir
    setMediaFilesState(refreshedFiles);
    saveToStorage(storageKey, refreshedFiles);
  }, [mediaFiles, storageKey]);

  // Verificar se há arquivos persistidos que precisam de renovação de URL
  useEffect(() => {
    if (mediaFiles.length > 0 && !hasLoadedFromDb.current && !hasRefreshedUrls.current) {
      hasRefreshedUrls.current = true;
      // Arquivos vieram do sessionStorage, podem ter URLs expiradas
      refreshSignedUrls();
    }
  }, [mediaFiles.length, refreshSignedUrls]);

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
