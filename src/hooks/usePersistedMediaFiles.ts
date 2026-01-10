import { useState, useCallback, useRef } from 'react';
import { getSignedUrl } from '@/lib/storageUtils';

export interface MediaFile {
  url: string;
  path: string;
  type: 'image' | 'video';
  name: string;
}

const STORAGE_PREFIX = 'os_media_files_';

// Função helper para salvar no localStorage (mais persistente que sessionStorage)
const saveToStorage = (key: string, files: MediaFile[]) => {
  try {
    if (files.length > 0) {
      localStorage.setItem(key, JSON.stringify(files));
      console.log(`[MediaPersist] ✅ Salvou ${files.length} arquivos em localStorage`);
    } else {
      localStorage.removeItem(key);
      console.log(`[MediaPersist] 🗑️ Limpou localStorage (sem arquivos)`);
    }
  } catch (error) {
    console.error('[MediaPersist] ❌ Erro ao salvar:', error);
  }
};

// Função helper para ler do localStorage
const loadFromStorage = (key: string): MediaFile[] => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log(`[MediaPersist] 📂 Restaurou ${parsed.length} arquivos do localStorage`);
      return parsed;
    }
  } catch (error) {
    console.error('[MediaPersist] ❌ Erro ao ler:', error);
  }
  return [];
};

/**
 * Hook simplificado para persistir arquivos de mídia no localStorage
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

  const hasRefreshedUrls = useRef(false);

  // Inicializa com dados do localStorage
  const [mediaFiles, setMediaFilesState] = useState<MediaFile[]>(() => {
    const stored = loadFromStorage(storageKey);
    console.log(`[MediaPersist] 🚀 Inicializando com ${stored.length} arquivos (key: ${storageKey})`);
    return stored;
  });

  // Wrapper para setMediaFiles - SEMPRE persiste
  const setMediaFiles = useCallback((filesOrUpdater: MediaFile[] | ((prev: MediaFile[]) => MediaFile[])) => {
    setMediaFilesState(prev => {
      const newFiles = typeof filesOrUpdater === 'function' ? filesOrUpdater(prev) : filesOrUpdater;
      saveToStorage(storageKey, newFiles);
      return newFiles;
    });
  }, [storageKey]);

  // Função para definir arquivos vindos do banco de dados
  // Mescla com arquivos persistidos no localStorage para não perder uploads em andamento
  const setMediaFilesFromDb = useCallback((dbFiles: MediaFile[]) => {
    const persistedFiles = loadFromStorage(storageKey);
    
    if (persistedFiles.length > 0) {
      // Mesclar: arquivos do DB + arquivos persistidos (evitando duplicatas por path)
      const dbPaths = new Set(dbFiles.map(f => f.path));
      const newPersistedFiles = persistedFiles.filter(f => !dbPaths.has(f.path));
      const merged = [...dbFiles, ...newPersistedFiles];
      
      console.log(`[MediaPersist] 🔀 Merge: ${dbFiles.length} DB + ${newPersistedFiles.length} localStorage = ${merged.length}`);
      saveToStorage(storageKey, merged);
      setMediaFilesState(merged);
    } else {
      console.log(`[MediaPersist] 📥 Carregou ${dbFiles.length} arquivos do DB`);
      saveToStorage(storageKey, dbFiles);
      setMediaFilesState(dbFiles);
    }
  }, [storageKey]);

  // Função para adicionar arquivos - PERSISTE IMEDIATAMENTE
  const addMediaFiles = useCallback((newFiles: MediaFile[]) => {
    console.log(`[MediaPersist] ➕ Adicionando ${newFiles.length} arquivo(s)...`);
    
    setMediaFilesState(prev => {
      const updated = [...prev, ...newFiles];
      console.log(`[MediaPersist] 📊 Total agora: ${updated.length} arquivos`);
      saveToStorage(storageKey, updated);
      return updated;
    });
  }, [storageKey]);

  // Função para remover um arquivo - PERSISTE IMEDIATAMENTE
  const removeMediaFile = useCallback((index: number) => {
    setMediaFilesState(prev => {
      const updated = prev.filter((_, i) => i !== index);
      console.log(`[MediaPersist] ➖ Removeu índice ${index}, restam: ${updated.length}`);
      saveToStorage(storageKey, updated);
      return updated;
    });
  }, [storageKey]);

  // Função para limpar após sucesso
  const clearPersistedFiles = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      if (orderId) {
        localStorage.removeItem(`${STORAGE_PREFIX}${formType}_new`);
      }
      setMediaFilesState([]);
      console.log(`[MediaPersist] 🧹 Limpou localStorage`);
    } catch (error) {
      console.error('[MediaPersist] ❌ Erro ao limpar:', error);
    }
  }, [storageKey, formType, orderId]);

  // Função para renovar URLs assinadas expiradas
  const refreshSignedUrls = useCallback(async () => {
    if (mediaFiles.length === 0) return;

    console.log(`[MediaPersist] 🔄 Renovando URLs para ${mediaFiles.length} arquivos...`);
    
    const refreshedFiles = await Promise.all(
      mediaFiles.map(async (file) => {
        try {
          const signedUrl = await getSignedUrl(file.path, 3600);
          if (signedUrl) {
            return { ...file, url: signedUrl };
          }
        } catch (error) {
          console.error(`[MediaPersist] ❌ Erro ao renovar URL:`, file.path, error);
        }
        return file;
      })
    );

    setMediaFilesState(refreshedFiles);
    saveToStorage(storageKey, refreshedFiles);
    console.log(`[MediaPersist] ✅ URLs renovadas`);
  }, [mediaFiles, storageKey]);

  // Renovar URLs ao inicializar se houver arquivos persistidos
  const initialFilesCount = useRef(mediaFiles.length);
  if (mediaFiles.length > 0 && !hasRefreshedUrls.current && initialFilesCount.current > 0) {
    hasRefreshedUrls.current = true;
    // Agendar renovação para depois do render
    setTimeout(() => refreshSignedUrls(), 100);
  }

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
