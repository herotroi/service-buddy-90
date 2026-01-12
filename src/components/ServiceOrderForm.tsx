import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { TriStateCheckbox, TriStateValue } from '@/components/ui/tri-state-checkbox';
import { PatternLock } from '@/components/PatternLock';
import { CameraCapture } from '@/components/CameraCapture';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Camera, Video, Monitor } from 'lucide-react';
import { UniversalVideoPlayer } from '@/components/UniversalVideoPlayer';
import { processMediaFile, formatFileSize, isVideoFile } from '@/lib/mediaCompression';
import { Progress } from '@/components/ui/progress';
import { useOsNumberValidation } from '@/hooks/useOsNumberValidation';
import { usePersistedMediaFiles, MediaFile } from '@/hooks/usePersistedMediaFiles';
import { getSignedUrl, getSignedUrls, listOrderFiles } from '@/lib/storageUtils';

interface ServiceOrderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  orderId?: string;
}

interface FormData {
  os_number: number;
  entry_date: string;
  client_name: string;
  client_cpf?: string;
  client_address?: string;
  contact?: string;
  other_contacts?: string;
  device_model: string;
  device_brand?: string;
  device_chip?: string;
  memory_card_size?: string;
  device_password?: string;
  device_pattern?: string;
  reported_defect: string;
  client_message?: string;
  value?: number;
  situation_id?: string;
  technician_id?: string;
  received_by_id?: string;
  part_order_date?: string;
  service_date?: string;
  withdrawn_by?: string;
  exit_date?: string;
  withdrawal_situation_id?: string;
  mensagem_finalizada: boolean;
  mensagem_entregue: boolean;
  technical_info?: string;
  // Checklist fields - tri-state (null/true/false)
  checklist_houve_queda: boolean | null;
  checklist_face_id: boolean | null;
  checklist_carrega: boolean | null;
  checklist_tela_quebrada: boolean | null;
  checklist_vidro_trincado: boolean | null;
  checklist_manchas_tela: boolean | null;
  checklist_carcaca_torta: boolean | null;
  checklist_riscos_tampa: boolean | null;
  checklist_riscos_laterais: boolean | null;
  checklist_vidro_camera: boolean | null;
  checklist_acompanha_chip: boolean | null;
  checklist_acompanha_sd: boolean | null;
  checklist_acompanha_capa: boolean | null;
  checklist_esta_ligado: boolean | null;
}

// MediaFile interface is imported from usePersistedMediaFiles hook

export const ServiceOrderForm = ({ onSuccess, onCancel, orderId }: ServiceOrderFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [situations, setSituations] = useState<any[]>([]);
  const [withdrawalSituations, setWithdrawalSituations] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Usar hook de persistência para mídias (resolve problema de perda de estado no mobile)
  const { 
    mediaFiles, 
    setMediaFiles, 
    setMediaFilesFromDb, 
    addMediaFiles, 
    removeMediaFile, 
    clearPersistedFiles 
  } = usePersistedMediaFiles('service_orders', orderId);
  
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState('');
  const [cameraMode, setCameraMode] = useState<'photo' | 'video' | null>(null);

  const { validating, validateAndGetAvailableOsNumber, saveWithRetry, getNextOsNumberFromDb } = useOsNumberValidation({
    table: 'service_orders',
    currentOrderId: orderId,
  });
  
  const getLocalDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  // Converte data do banco para formato local (datetime-local)
  const formatDateTimeForInput = (dateString: string) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  // Converte data do banco para formato local (date only)
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
  };

  // Converte data do input para ISO preservando timezone local
  const formatDateForSave = (dateString: string) => {
    // Se já é uma data válida, apenas retorna como ISO
    const date = new Date(dateString);
    return date.toISOString();
  };

  const form = useForm<FormData>({
    defaultValues: {
      os_number: 1,
      entry_date: getLocalDateTime(),
      client_name: '',
      client_cpf: '',
      client_address: '',
      contact: '',
      other_contacts: '',
      device_model: '',
      device_brand: '',
      device_chip: '',
      memory_card_size: '',
      device_password: '',
      device_pattern: '',
      technical_info: '',
      reported_defect: '',
      client_message: '',
      value: undefined,
      situation_id: '',
      technician_id: '',
      received_by_id: '',
      part_order_date: '',
      service_date: '',
      withdrawn_by: '',
      exit_date: '',
      withdrawal_situation_id: '',
      mensagem_finalizada: false,
      mensagem_entregue: false,
      // Checklist defaults - null means not evaluated
      checklist_houve_queda: null,
      checklist_face_id: null,
      checklist_carrega: null,
      checklist_tela_quebrada: null,
      checklist_vidro_trincado: null,
      checklist_manchas_tela: null,
      checklist_carcaca_torta: null,
      checklist_riscos_tampa: null,
      checklist_riscos_laterais: null,
      checklist_vidro_camera: null,
      checklist_acompanha_chip: null,
      checklist_acompanha_sd: null,
      checklist_acompanha_capa: null,
      checklist_esta_ligado: null,
    },
  });


  useEffect(() => {
    const initialize = async () => {
      await fetchOptions();
      if (orderId) {
        await loadOrderData(orderId);
      } else {
        await fetchNextOsNumber();
      }
    };
    initialize();
  }, [orderId]);

  const loadOrderData = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return;

      // Detectar e migrar senha de padrão antiga
      let passwordValue = data.device_password || '';
      let patternValue = (data as any).device_pattern || '';

      // Migrar senha de padrão antiga que estava em device_password
      if (!patternValue && passwordValue) {
        const cleanPassword = passwordValue.replace(/\s/g, '');
        if (/^[0-8]([-,][0-8])+$/.test(cleanPassword)) {
          patternValue = cleanPassword.replace(/-/g, ',');
          passwordValue = '';
        }
      }

      form.reset({
        os_number: data.os_number,
        entry_date: formatDateTimeForInput(data.entry_date),
        client_name: data.client_name,
        client_cpf: data.client_cpf || '',
        client_address: data.client_address || '',
        contact: data.contact || '',
        other_contacts: data.other_contacts || '',
        device_model: data.device_model,
        device_chip: data.device_chip || '',
        memory_card_size: data.memory_card_size || '',
        device_password: passwordValue,
        device_pattern: patternValue,
        reported_defect: data.reported_defect || '',
        technical_info: data.technical_info || '',
        client_message: data.client_message || '',
        value: data.value || undefined,
        situation_id: data.situation_id || undefined,
        technician_id: data.technician_id || undefined,
        received_by_id: data.received_by_id || undefined,
        part_order_date: data.part_order_date ? formatDateForInput(data.part_order_date) : undefined,
        service_date: data.service_date ? formatDateForInput(data.service_date) : undefined,
        withdrawn_by: data.withdrawn_by || '',
        exit_date: data.exit_date ? formatDateForInput(data.exit_date) : undefined,
        withdrawal_situation_id: data.withdrawal_situation_id || undefined,
        mensagem_finalizada: data.mensagem_finalizada,
        mensagem_entregue: data.mensagem_entregue,
        checklist_houve_queda: data.checklist_houve_queda,
        checklist_face_id: data.checklist_face_id,
        checklist_carrega: data.checklist_carrega,
        checklist_tela_quebrada: data.checklist_tela_quebrada,
        checklist_vidro_trincado: data.checklist_vidro_trincado,
        checklist_manchas_tela: data.checklist_manchas_tela,
        checklist_carcaca_torta: data.checklist_carcaca_torta,
        checklist_riscos_tampa: data.checklist_riscos_tampa,
        checklist_riscos_laterais: data.checklist_riscos_laterais,
        checklist_vidro_camera: data.checklist_vidro_camera,
        checklist_acompanha_chip: data.checklist_acompanha_chip,
        checklist_acompanha_sd: data.checklist_acompanha_sd,
        checklist_acompanha_capa: data.checklist_acompanha_capa,
        checklist_esta_ligado: data.checklist_esta_ligado,
      });

      // Carregar arquivos de mídia com URLs assinadas
      let dbFiles = data.media_files && Array.isArray(data.media_files) 
        ? data.media_files as unknown as MediaFile[] 
        : [];
      
      // Se não há arquivos no banco, tentar recuperar do storage (arquivos órfãos)
      if (dbFiles.length === 0) {
        console.log('[loadOrderData] 🔍 Buscando arquivos órfãos no storage...');
        const storageFiles = await listOrderFiles(id);
        if (storageFiles.length > 0) {
          console.log(`[loadOrderData] 📦 Encontrou ${storageFiles.length} arquivos no storage!`);
          dbFiles = storageFiles;
          
          // Salvar os arquivos recuperados no banco de dados
          const { error: updateError } = await supabase
            .from('service_orders')
            .update({ media_files: JSON.parse(JSON.stringify(storageFiles)) })
            .eq('id', id);
          
          if (updateError) {
            console.error('[loadOrderData] Erro ao sincronizar arquivos:', updateError);
          } else {
            console.log('[loadOrderData] ✅ Arquivos sincronizados com o banco!');
          }
        }
      }
      
      const signedFiles = dbFiles.length > 0 ? await getSignedUrls(dbFiles) : [];
      setMediaFilesFromDb(signedFiles);
      
      // Marcar que o carregamento inicial foi concluído
      setIsInitialLoad(false);
    } catch (error: any) {
      toast.error('Erro ao carregar dados da OS');
      console.error(error);
    }
  };

  const fetchNextOsNumber = async () => {
    try {
      // Usar função atômica do banco para evitar race conditions
      const nextNumber = await getNextOsNumberFromDb();
      
      if (nextNumber) {
        form.setValue('os_number', nextNumber);
        return;
      }
      
      // Fallback: método antigo caso a função não esteja disponível
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'os_starting_number')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      const startingNumber = settingsData ? parseInt(settingsData.value) : 1;

      const { data: ordersData } = await supabase
        .from('service_orders')
        .select('os_number')
        .eq('deleted', false)
        .order('os_number', { ascending: false })
        .limit(1);

      let nextOsNumber = startingNumber;
      
      if (ordersData && ordersData.length > 0) {
        const highestExisting = ordersData[0].os_number + 1;
        nextOsNumber = Math.max(startingNumber, highestExisting);
      }

      form.setValue('os_number', nextOsNumber);
    } catch (error: any) {
      console.error('Erro ao buscar próximo número de OS:', error);
    }
  };

  const fetchOptions = async () => {
    try {
      const [situationsData, withdrawalSituationsData, techniciansData, employeesData] = await Promise.all([
        supabase.from('situations').select('*'),
        supabase.from('withdrawal_situations').select('*'),
        supabase.from('employees').select('*').eq('type', 'Técnico'),
        supabase.from('employees').select('*'),
      ]);

      if (situationsData.error) throw situationsData.error;
      if (withdrawalSituationsData.error) throw withdrawalSituationsData.error;
      if (techniciansData.error) throw techniciansData.error;
      if (employeesData.error) throw employeesData.error;

      setSituations(situationsData.data || []);
      setWithdrawalSituations(withdrawalSituationsData.data || []);
      setTechnicians(techniciansData.data || []);
      setEmployees(employeesData.data || []);

      // Definir "EM FILA" como situação padrão apenas se não estiver editando
      if (!orderId) {
        const emFilaSituation = situationsData.data?.find(
          (sit) => sit.name.toLowerCase() === 'em fila'
        );
        if (emFilaSituation) {
          form.setValue('situation_id', emFilaSituation.id);
        }
      }
    } catch (error: any) {
      toast.error('Erro ao carregar opções');
      console.error(error);
    }
  };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingMedia(true);
    
    try {
      const uploadedFiles: MediaFile[] = [];
      let processedCount = 0;
      const totalFiles = files.length;

      for (const file of Array.from(files)) {
        try {
          processedCount++;
          setCurrentFileName(file.name);
          setUploadProgress(0);

          // Comprimir/processar o arquivo com callback de progresso
          const originalSize = formatFileSize(file.size);
          const processedFile = await processMediaFile(file, (progress) => {
            setUploadProgress(progress);
          });
          const compressedSize = formatFileSize(processedFile.size);
          
          console.log(`Arquivo processado: ${file.name} (${originalSize} → ${compressedSize})`);

          // Upload do arquivo processado
          // Upload para o storage (70% -> 100%)
          setUploadProgress(70);
          
          // Usar detecção robusta baseada em extensão também (importante para iPhone/Android)
          const isVideoType = isVideoFile(file);
          const originalExt = file.name.split('.').pop()?.toLowerCase() || '';
          const fileExt = isVideoType ? (originalExt || 'mp4') : 'jpg';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${orderId || 'temp'}/${fileName}`;

          setUploadProgress(80);
          const { error: uploadError } = await supabase.storage
            .from('service-orders-media')
            .upload(filePath, processedFile, {
              contentType: processedFile.type || (isVideoType ? 'video/mp4' : 'image/jpeg'),
              upsert: false
            });

          if (uploadError) {
            // Mensagem de erro mais específica
            if (uploadError.message.includes('exceeded')) {
              throw new Error('O arquivo excede o limite de 5GB. Por favor, use um arquivo menor.');
            }
            throw uploadError;
          }
          setUploadProgress(90);

          // Get signed URL for the uploaded file
          const signedUrl = await getSignedUrl(filePath);
          if (!signedUrl) {
            throw new Error('Erro ao gerar URL de acesso');
          }

          const mediaType = isVideoType ? 'video' : 'image';

          uploadedFiles.push({
            url: signedUrl,
            path: filePath,
            type: mediaType,
            name: file.name,
          });
          
          setUploadProgress(100);
        } catch (fileError: any) {
          console.error(`Erro ao processar ${file.name}:`, fileError);
          toast.error(`Erro ao processar ${file.name}: ${fileError.message}`);
        }
      }

      setUploadProgress(0);
      setCurrentFileName('');

      if (uploadedFiles.length > 0) {
        addMediaFiles(uploadedFiles);
        toast.success(
          uploadedFiles.length === 1 
            ? 'Arquivo enviado com sucesso' 
            : `${uploadedFiles.length} arquivos enviados com sucesso`
        );
      }
    } catch (error: any) {
      toast.error('Erro ao enviar arquivos');
      console.error(error);
    } finally {
      setUploadingMedia(false);
      setUploadProgress(0);
      setCurrentFileName('');
      // Limpar o input para permitir re-upload do mesmo arquivo
      event.target.value = '';
    }
  };

  const handleRemoveMedia = async (index: number) => {
    const fileToRemove = mediaFiles[index];
    
    try {
      const { error } = await supabase.storage
        .from('service-orders-media')
        .remove([fileToRemove.path]);

      if (error) throw error;

      removeMediaFile(index);
      toast.success('Arquivo removido');
    } catch (error: any) {
      toast.error('Erro ao remover arquivo');
      console.error(error);
    }
  };

  const handleCameraCapture = async (file: File) => {
    setUploadingMedia(true);
    setCurrentFileName(file.name);
    setUploadProgress(0);
    
    try {
      const originalSize = formatFileSize(file.size);
      const processedFile = await processMediaFile(file, (progress) => {
        setUploadProgress(progress);
      });
      const compressedSize = formatFileSize(processedFile.size);
      
      console.log(`Arquivo da câmera processado: ${file.name} (${originalSize} → ${compressedSize})`);

      setUploadProgress(70);
      
      // Usar detecção robusta baseada em extensão também
      const isVideoType = isVideoFile(file);
      const originalExt = file.name.split('.').pop()?.toLowerCase() || '';
      const fileExt = isVideoType ? (originalExt || 'mp4') : 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${orderId || 'temp'}/${fileName}`;

      setUploadProgress(80);
      const { error: uploadError } = await supabase.storage
        .from('service-orders-media')
        .upload(filePath, processedFile, {
          contentType: processedFile.type || (isVideoType ? 'video/mp4' : 'image/jpeg'),
          upsert: false
        });

      if (uploadError) throw uploadError;
      
      setUploadProgress(90);

      // Get signed URL for the uploaded file
      const signedUrl = await getSignedUrl(filePath);
      if (!signedUrl) {
        throw new Error('Erro ao gerar URL de acesso');
      }

      const mediaType = isVideoType ? 'video' : 'image';

      addMediaFiles([{
        url: signedUrl,
        path: filePath,
        type: mediaType,
        name: file.name,
      }]);
      
      setUploadProgress(100);
      toast.success(mediaType === 'video' ? 'Vídeo gravado com sucesso' : 'Foto capturada com sucesso');
    } catch (error: any) {
      toast.error('Erro ao processar arquivo da câmera');
      console.error(error);
    } finally {
      setUploadingMedia(false);
      setUploadProgress(0);
      setCurrentFileName('');
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      // IMPORTANTE: Recarregar do localStorage para garantir dados atualizados
      // Isso resolve o problema de perda de estado no mobile
      const storageKey = orderId 
        ? `os_media_files_service_orders_edit_${orderId}`
        : `os_media_files_service_orders_new`;
      
      let currentMediaFiles = mediaFiles;
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`[onSubmit] 📂 Recuperando ${parsed.length} arquivos do localStorage`);
            currentMediaFiles = parsed;
          }
        }
      } catch (e) {
        console.error('[onSubmit] Erro ao ler localStorage:', e);
      }
      
      console.log(`[onSubmit] 📊 Salvando com ${currentMediaFiles.length} arquivos de mídia`);
      
      // Validar número da OS antes de salvar (apenas para nova OS)
      if (!orderId) {
        const validation = await validateAndGetAvailableOsNumber(
          data.os_number,
          (existingOrder, newNumber) => {
            form.setValue('os_number', newNumber);
            toast.info(`Número de OS ${data.os_number} já existe. Usando ${newNumber}.`);
          }
        );

        if (!validation.valid && validation.newNumber) {
          data.os_number = validation.newNumber;
        }
      }

      // Função para converter data do input para formato ISO sem alterar o fuso
      const toISOWithTimezone = (dateStr: string) => {
        if (!dateStr) return null;
        // Se já inclui horário (datetime-local), usa diretamente
        if (dateStr.includes('T')) {
          const date = new Date(dateStr);
          return date.toISOString();
        }
        // Se é só data, adiciona meio-dia para evitar problemas de fuso
        const date = new Date(dateStr + 'T12:00:00');
        return date.toISOString();
      };

      const orderData: any = {
        os_number: data.os_number,
        entry_date: toISOWithTimezone(data.entry_date),
        client_name: data.client_name,
        client_cpf: data.client_cpf || null,
        client_address: data.client_address || null,
        contact: data.contact || null,
        other_contacts: data.other_contacts || null,
        device_model: data.device_model,
        device_brand: data.device_brand || null,
        device_chip: data.device_chip || null,
        memory_card_size: data.memory_card_size || null,
        device_password: data.device_password || null,
        device_pattern: data.device_pattern || null,
        technical_info: data.technical_info || null,
        reported_defect: data.reported_defect,
        client_message: data.client_message || null,
        value: data.value || null,
        situation_id: data.situation_id || null,
        technician_id: data.technician_id || null,
        received_by_id: data.received_by_id || null,
        part_order_date: toISOWithTimezone(data.part_order_date || ''),
        service_date: toISOWithTimezone(data.service_date || ''),
        withdrawn_by: data.withdrawn_by || null,
        exit_date: toISOWithTimezone(data.exit_date || ''),
        withdrawal_situation_id: data.withdrawal_situation_id || null,
        mensagem_finalizada: data.mensagem_finalizada,
        mensagem_entregue: data.mensagem_entregue,
        media_files: JSON.parse(JSON.stringify(currentMediaFiles)),
        checklist_houve_queda: data.checklist_houve_queda,
        checklist_face_id: data.checklist_face_id,
        checklist_carrega: data.checklist_carrega,
        checklist_tela_quebrada: data.checklist_tela_quebrada,
        checklist_vidro_trincado: data.checklist_vidro_trincado,
        checklist_manchas_tela: data.checklist_manchas_tela,
        checklist_carcaca_torta: data.checklist_carcaca_torta,
        checklist_riscos_tampa: data.checklist_riscos_tampa,
        checklist_riscos_laterais: data.checklist_riscos_laterais,
        checklist_vidro_camera: data.checklist_vidro_camera,
        checklist_acompanha_chip: data.checklist_acompanha_chip,
        checklist_acompanha_sd: data.checklist_acompanha_sd,
        checklist_acompanha_capa: data.checklist_acompanha_capa,
        checklist_esta_ligado: data.checklist_esta_ligado,
        user_id: user?.id,
      };

      if (orderId) {
        // Validar se o número foi alterado durante edição
        const validation = await validateAndGetAvailableOsNumber(
          data.os_number,
          (existingOrder, newNumber) => {
            form.setValue('os_number', newNumber);
            toast.info(`Número de OS alterado para ${newNumber}`);
          }
        );

        if (!validation.valid && validation.newNumber) {
          orderData.os_number = validation.newNumber;
        }

        const result = await saveWithRetry(
          orderData,
          async (retryData) => {
            return await supabase
              .from('service_orders')
              .update(retryData)
              .eq('id', orderId);
          }
        );

        if (!result.success) {
          throw new Error('Não foi possível atualizar a OS');
        }

        if (result.finalOsNumber && result.finalOsNumber !== data.os_number) {
          form.setValue('os_number', result.finalOsNumber);
        }

        console.log('[onSubmit] ✅ OS atualizada com', currentMediaFiles.length, 'arquivos de mídia');
        toast.success('OS atualizada com sucesso');
      } else {
        // Criar nova OS com retry para race conditions
        const result = await saveWithRetry(
          orderData,
          async (retryData) => {
            return await supabase
              .from('service_orders')
              .insert(retryData)
              .select()
              .single();
          }
        );

        if (!result.success) {
          throw new Error('Não foi possível criar a OS');
        }

        const newOrder = result.data;

        // Se houver arquivos, mover para a pasta da OS e atualizar o banco
        if (currentMediaFiles.length > 0 && newOrder) {
          console.log('[onSubmit] 📦 Movendo', currentMediaFiles.length, 'arquivos de temp/ para', newOrder.id);
          const updatedFiles: MediaFile[] = [];
          for (const file of currentMediaFiles) {
            // Verificar se o arquivo está em temp/ ou já na pasta da OS
            if (file.path.startsWith('temp/')) {
              const newPath = file.path.replace('temp/', `${newOrder.id}/`);
              
              const { error: moveError } = await supabase.storage
                .from('service-orders-media')
                .move(file.path, newPath);

              if (moveError) {
                console.error('Erro ao mover arquivo:', moveError);
                // Tentar manter o arquivo no temp mesmo assim
                updatedFiles.push(file);
              } else {
                // Gerar nova URL assinada para o caminho atualizado
                const signedUrl = await getSignedUrl(newPath);
                updatedFiles.push({
                  ...file,
                  path: newPath,
                  url: signedUrl || file.url,
                });
              }
            } else {
              // Arquivo já está no caminho correto
              updatedFiles.push(file);
            }
          }

          // Atualizar os arquivos no banco de dados
          const { error: updateError } = await supabase
            .from('service_orders')
            .update({ media_files: JSON.parse(JSON.stringify(updatedFiles)) } as any)
            .eq('id', newOrder.id);
          
          if (updateError) {
            console.error('Erro ao atualizar media_files:', updateError);
          }
        }

        if (result.finalOsNumber) {
          toast.success(`OS criada com sucesso (Nº ${result.finalOsNumber})`);
        } else {
          toast.success('OS criada com sucesso');
        }
      }

      // Limpar dados persistidos após sucesso
      clearPersistedFiles();
      
      onSuccess();
      if (!orderId) {
        form.reset();
      }
    } catch (error: any) {
      toast.error(orderId ? 'Erro ao atualizar OS' : 'Erro ao criar OS');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Informações da OS */}
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Informações da OS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="os_number"
              rules={{ required: 'Número da OS é obrigatório' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da OS *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="1" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="entry_date"
              rules={{ required: 'Data de entrada é obrigatória' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e Hora de Entrada *</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Informações do Cliente */}
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Informações do Cliente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="client_name"
              rules={{ required: 'Nome do cliente é obrigatório' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cliente *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Celular/Telefone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="(00) 00000-0000"
                      onChange={(e) => {
                        // Remove tudo que não é número
                        const digits = e.target.value.replace(/\D/g, '');
                        
                        // Limita a 11 dígitos
                        const limitedDigits = digits.slice(0, 11);
                        
                        // Aplica a máscara baseado na quantidade de dígitos
                        let formatted = limitedDigits;
                        if (limitedDigits.length > 0) {
                          if (limitedDigits.length <= 2) {
                            formatted = `(${limitedDigits}`;
                          } else if (limitedDigits.length <= 6) {
                            formatted = `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2)}`;
                          } else if (limitedDigits.length <= 10) {
                            // Telefone fixo: (99) 9999-9999
                            formatted = `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 6)}-${limitedDigits.slice(6)}`;
                          } else {
                            // Celular: (99) 99999-9999
                            formatted = `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 7)}-${limitedDigits.slice(7)}`;
                          }
                        }
                        
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="other_contacts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outros Contatos</FormLabel>
                  <FormControl>
                    <Input placeholder="Instagram, email ou outro número" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        const limitedDigits = digits.slice(0, 11);
                        let formatted = limitedDigits;
                        if (limitedDigits.length > 0) {
                          if (limitedDigits.length <= 3) {
                            formatted = limitedDigits;
                          } else if (limitedDigits.length <= 6) {
                            formatted = `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3)}`;
                          } else if (limitedDigits.length <= 9) {
                            formatted = `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3, 6)}.${limitedDigits.slice(6)}`;
                          } else {
                            formatted = `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3, 6)}.${limitedDigits.slice(6, 9)}-${limitedDigits.slice(9)}`;
                          }
                        }
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Endereço do Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Endereço completo do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="device_model"
              rules={{ required: 'Modelo do aparelho é obrigatório' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo do Aparelho *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: iPhone 12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <FormItem>
                <FormLabel>Senha do Aparelho</FormLabel>
                <div className="space-y-4">
                  {/* Senha de texto */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Senha de texto</Label>
                    <FormField
                      control={form.control}
                      name="device_password"
                      render={({ field }) => (
                        <FormControl>
                          <Input type="text" placeholder="Senha de texto (opcional)" {...field} />
                        </FormControl>
                      )}
                    />
                  </div>
                  
                  {/* Padrão de 9 pontos */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Padrão de 9 pontos</Label>
                    <FormField
                      control={form.control}
                      name="device_pattern"
                      render={({ field }) => (
                        <FormControl>
                          <PatternLock 
                            value={field.value || ''} 
                            onChange={field.onChange} 
                          />
                        </FormControl>
                      )}
                    />
                  </div>
                </div>
              </FormItem>
            </div>
          </div>
        </div>

        {/* Checklist Técnico */}
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Checklist Técnico
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Clique para alternar: — (não avaliado) → S (sim) → N (não)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: 'checklist_houve_queda', label: 'Houve queda?' },
              { name: 'checklist_face_id', label: 'Face ID funcionando (iPhone)' },
              { name: 'checklist_carrega', label: 'Carrega' },
              { name: 'checklist_tela_quebrada', label: 'Tela quebrada' },
              { name: 'checklist_vidro_trincado', label: 'Vidro trincado' },
              { name: 'checklist_manchas_tela', label: 'Manchas na tela' },
              { name: 'checklist_carcaca_torta', label: 'Carcaça torta' },
              { name: 'checklist_riscos_tampa', label: 'Riscos na tampa traseira' },
              { name: 'checklist_riscos_laterais', label: 'Riscos nas laterais' },
              { name: 'checklist_vidro_camera', label: 'Vidro da câmera quebrado' },
              { name: 'checklist_acompanha_chip', label: 'Acompanha chip' },
              { name: 'checklist_acompanha_sd', label: 'Acompanha SD' },
              { name: 'checklist_acompanha_capa', label: 'Acompanha capa' },
              { name: 'checklist_esta_ligado', label: 'Está ligado' },
            ].map((item) => (
              <FormField
                key={item.name}
                control={form.control}
                name={item.name as keyof FormData}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <TriStateCheckbox
                        value={field.value as TriStateValue}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal text-sm cursor-pointer">
                      {item.label}
                    </FormLabel>
                  </FormItem>
                )}
              />
            ))}
          </div>
          
          {/* Campos descritivos do checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="device_chip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chip</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Claro, Vivo, Tim, Oi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="memory_card_size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tamanho do Cartão de Memória</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 32GB, 64GB, 128GB" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Detalhes do Serviço */}
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Detalhes do Serviço
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="situation_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Situação</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma situação" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {situations.map((situation) => (
                        <SelectItem key={situation.id} value={situation.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full shrink-0" 
                              style={{ backgroundColor: situation.color }}
                            />
                            <span>{situation.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="technician_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Técnico Responsável</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um técnico" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="received_by_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recebido Por</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione quem recebeu" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {orderId && (
              <FormField
                control={form.control}
                name="part_order_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Encomenda de Peça</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="service_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Para Quando é o Serviço</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Informações Técnicas - apenas no modo de edição */}
        {orderId && (
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
              Informações Técnicas
            </h3>
            <FormField
              control={form.control}
              name="technical_info"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Técnicas</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações técnicas detalhadas sobre o aparelho ou serviço realizado..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Campos adicionais apenas no modo de edição */}
        {orderId && (
          <>
            {/* Informações de Retirada */}
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
                Informações de Retirada
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="withdrawn_by"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quem Retirou</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome de quem retirou" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exit_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Saída</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="withdrawal_situation_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situação de Retirada</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma situação" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {withdrawalSituations.map((situation) => (
                            <SelectItem key={situation.id} value={situation.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full shrink-0" 
                                  style={{ backgroundColor: situation.color }}
                                />
                                <span>{situation.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Status das Mensagens */}
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
                Status das Mensagens
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="mensagem_finalizada"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-input"
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Mensagem Finalizada
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mensagem_entregue"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-input"
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Mensagem Entregue
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </>
        )}

        {/* Descrição do Serviço */}
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Descrição do Serviço
          </h3>
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="reported_defect"
              rules={{ required: 'Defeito relatado é obrigatório' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Defeito Relatado *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o problema relatado pelo cliente" 
                      className="min-h-24 resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {orderId && (
              <FormField
                control={form.control}
                name="client_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem ao Cliente</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Mensagem que será enviada ao cliente (opcional)" 
                        className="min-h-24 resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        {/* Fotos e Vídeos */}
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Fotos e Vídeos
          </h3>
          <div className="space-y-4">
            {/* Botões de captura da câmera */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <Label htmlFor="camera-photo" className="cursor-pointer">
                <div className="border-2 border-dashed border-border rounded-lg p-3 sm:p-4 hover:border-primary transition-colors text-center cursor-pointer">
                  <input
                    id="camera-photo"
                    type="file"
                    accept="image/*,.heic,.heif"
                    capture="environment"
                    onChange={handleMediaUpload}
                    disabled={uploadingMedia}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                    <span className="text-xs sm:text-sm font-medium">Tirar Foto</span>
                  </div>
                </div>
              </Label>

              <Label htmlFor="camera-video" className="cursor-pointer">
                <div className="border-2 border-dashed border-border rounded-lg p-3 sm:p-4 hover:border-primary transition-colors text-center cursor-pointer">
                  <input
                    id="camera-video"
                    type="file"
                    accept="video/*,.mov,.mp4,.m4v,.3gp,.webm"
                    capture="environment"
                    onChange={handleMediaUpload}
                    disabled={uploadingMedia}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    <Video className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                    <span className="text-xs sm:text-sm font-medium">Gravar Vídeo</span>
                  </div>
                </div>
              </Label>

              <button
                type="button"
                onClick={() => setCameraMode('photo')}
                disabled={uploadingMedia}
                className="border-2 border-dashed border-border rounded-lg p-3 sm:p-4 hover:border-primary transition-colors text-center cursor-pointer disabled:opacity-50"
              >
                <div className="flex flex-col items-center gap-1 sm:gap-2">
                  <Monitor className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  <span className="text-xs sm:text-sm font-medium">Usar Webcam</span>
                </div>
              </button>

              <Label htmlFor="media-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-border rounded-lg p-3 sm:p-4 hover:border-primary transition-colors text-center h-full flex items-center justify-center">
                  <input
                    id="media-upload"
                    type="file"
                    multiple
                    accept="image/*,video/*,.heic,.heif,.mov,.mp4,.m4v,.3gp,.webm"
                    onChange={handleMediaUpload}
                    disabled={uploadingMedia}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                    <span className="text-xs sm:text-sm font-medium">Galeria</span>
                  </div>
                </div>
              </Label>
            </div>

            {/* Progress */}
            {uploadingMedia && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="font-medium text-center mb-2">Processando e enviando...</p>
                <p className="text-sm text-muted-foreground text-center mb-3">{currentFileName}</p>
                {uploadProgress > 0 && (
                  <div className="w-full max-w-md mx-auto space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      {uploadProgress}% completo
                    </p>
                  </div>
                )}
              </div>
            )}

            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {mediaFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className="relative group rounded-lg overflow-hidden border border-border"
                  >
                    {file.type === 'video' ? (
                      <UniversalVideoPlayer
                        src={file.url}
                        name={file.name}
                        className="w-full aspect-video object-cover"
                      />
                    ) : (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full aspect-square object-cover"
                      />
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveMedia(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <p className="text-xs text-muted-foreground p-2 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end pt-4 sm:pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {orderId ? 'Atualizar OS' : 'Criar OS'}
          </Button>
        </div>
      </form>

      <CameraCapture
        open={cameraMode !== null}
        onClose={() => setCameraMode(null)}
        onCapture={handleCameraCapture}
        mode={cameraMode || 'photo'}
      />
    </Form>
  );
};
