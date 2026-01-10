import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CameraCapture } from '@/components/CameraCapture';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Camera, Video, Monitor } from 'lucide-react';
import { useOsNumberValidation } from '@/hooks/useOsNumberValidation';
import { processMediaFile, formatFileSize } from '@/lib/mediaCompression';
import { getSignedUrl, getSignedUrls } from '@/lib/storageUtils';

interface ServiceOrderInformaticaFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  orderId?: string;
}

interface FormData {
  os_number: number;
  senha?: string;
  entry_date: string;
  client_name: string;
  contact?: string;
  other_contacts?: string;
  equipment: string;
  accessories?: string;
  defect: string;
  more_details?: string;
  value?: number;
  situation_id?: string;
  observations?: string;
  service_date?: string;
  received_by_id?: string;
  equipment_location_id?: string;
  withdrawal_situation_id?: string;
  client_notified: boolean;
  exit_date?: string;
  withdrawn_by?: string;
}

interface MediaFile {
  url: string;
  path: string;
  type: 'image' | 'video';
  name: string;
}

export const ServiceOrderInformaticaForm = ({ onSuccess, onCancel, orderId }: ServiceOrderInformaticaFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [situations, setSituations] = useState<any[]>([]);
  const [withdrawalSituations, setWithdrawalSituations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState('');
  const [cameraMode, setCameraMode] = useState<'photo' | 'video' | null>(null);

  const { validating, validateAndGetAvailableOsNumber, saveWithRetry } = useOsNumberValidation({
    table: 'service_orders_informatica',
    currentOrderId: orderId,
  });
  
  
  const form = useForm<FormData>({
    defaultValues: {
      os_number: 1,
      senha: '',
      entry_date: new Date().toISOString().split('T')[0],
      client_name: '',
      contact: '',
      other_contacts: '',
      equipment: '',
      accessories: '',
      defect: '',
      more_details: '',
      value: undefined,
      situation_id: undefined,
      observations: '',
      service_date: undefined,
      received_by_id: undefined,
      equipment_location_id: undefined,
      withdrawal_situation_id: undefined,
      client_notified: false,
      exit_date: undefined,
      withdrawn_by: '',
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
        .from('service_orders_informatica')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return;

      form.reset({
        os_number: data.os_number,
        senha: data.senha || '',
        entry_date: new Date(data.entry_date).toISOString().split('T')[0],
        client_name: data.client_name,
        contact: data.contact || '',
        other_contacts: data.other_contacts || '',
        equipment: data.equipment,
        accessories: data.accessories || '',
        defect: data.defect,
        more_details: data.more_details || '',
        value: data.value || undefined,
        situation_id: data.situation_id || undefined,
        observations: data.observations || '',
        service_date: data.service_date ? new Date(data.service_date).toISOString().split('T')[0] : undefined,
        received_by_id: data.received_by_id || undefined,
        equipment_location_id: data.equipment_location_id || undefined,
        withdrawal_situation_id: data.withdrawal_situation_id || undefined,
        client_notified: data.client_notified,
        exit_date: data.exit_date ? new Date(data.exit_date).toISOString().split('T')[0] : undefined,
        withdrawn_by: data.withdrawn_by || '',
      });

      // Carregar arquivos de mídia com URLs assinadas
      if (data.media_files && Array.isArray(data.media_files)) {
        const files = data.media_files as unknown as MediaFile[];
        const signedFiles = await getSignedUrls(files);
        setMediaFiles(signedFiles);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar dados da OS');
      console.error(error);
    }
  };

  const fetchNextOsNumber = async () => {
    try {
      // Buscar número inicial das configurações do usuário
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'os_starting_number_informatica')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      const startingNumber = settingsData ? parseInt(settingsData.value) : 1;

      // Buscar maior número de OS existente DO USUÁRIO (RLS já filtra automaticamente)
      const { data: ordersData } = await supabase
        .from('service_orders_informatica')
        .select('os_number')
        .eq('deleted', false)
        .order('os_number', { ascending: false })
        .limit(1);

      let nextOsNumber = startingNumber;
      
      if (ordersData && ordersData.length > 0) {
        const highestExisting = ordersData[0].os_number + 1;
        // Usar o maior entre o número inicial configurado e o próximo sequencial
        nextOsNumber = Math.max(startingNumber, highestExisting);
      }

      form.setValue('os_number', nextOsNumber);
    } catch (error: any) {
      console.error('Erro ao buscar próximo número de OS:', error);
    }
  };

  const fetchOptions = async () => {
    try {
      const [situationsData, withdrawalData, employeesData, locationsData] = await Promise.all([
        supabase.from('situacao_informatica').select('*'),
        supabase.from('retirada_informatica').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('local_equipamento').select('*'),
      ]);

      if (situationsData.error) throw situationsData.error;
      if (withdrawalData.error) throw withdrawalData.error;
      if (employeesData.error) throw employeesData.error;
      if (locationsData.error) throw locationsData.error;

      setSituations(situationsData.data || []);
      setWithdrawalSituations(withdrawalData.data || []);
      setEmployees(employeesData.data || []);
      setLocations(locationsData.data || []);

      // Definir situação padrão
      if (!orderId) {
        const defaultSituation = situationsData.data?.find(
          (sit) => sit.name.toLowerCase() === 'em fila'
        );
        if (defaultSituation) {
          form.setValue('situation_id', defaultSituation.id);
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

      for (const file of Array.from(files)) {
        try {
          setCurrentFileName(file.name);
          setUploadProgress(0);

          const originalSize = formatFileSize(file.size);
          const processedFile = await processMediaFile(file, (progress) => {
            setUploadProgress(progress);
          });
          const compressedSize = formatFileSize(processedFile.size);
          
          console.log(`Arquivo processado: ${file.name} (${originalSize} → ${compressedSize})`);

          setUploadProgress(70);
          const fileExt = file.type.startsWith('video/') ? 
            file.name.split('.').pop() : 'jpg';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `informatica/${orderId || 'temp'}/${fileName}`;

          setUploadProgress(80);
          const { error: uploadError } = await supabase.storage
            .from('service-orders-media')
            .upload(filePath, processedFile, {
              contentType: processedFile.type,
              upsert: false
            });

          if (uploadError) {
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

          const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

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
        setMediaFiles([...mediaFiles, ...uploadedFiles]);
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

      setMediaFiles(mediaFiles.filter((_, i) => i !== index));
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
      const fileExt = file.type.startsWith('video/') ? 
        file.name.split('.').pop() : 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `informatica/${orderId || 'temp'}/${fileName}`;

      setUploadProgress(80);
      const { error: uploadError } = await supabase.storage
        .from('service-orders-media')
        .upload(filePath, processedFile, {
          contentType: processedFile.type,
          upsert: false
        });

      if (uploadError) throw uploadError;
      
      setUploadProgress(90);

      // Get signed URL for the uploaded file
      const signedUrl = await getSignedUrl(filePath);
      if (!signedUrl) {
        throw new Error('Erro ao gerar URL de acesso');
      }

      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

      setMediaFiles(prev => [...prev, {
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
    try {
      setLoading(true);

      // Validar número da OS antes de salvar
      if (!orderId) {
        const validation = await validateAndGetAvailableOsNumber(
          data.os_number,
          (existingOrder, newNumber) => {
            form.setValue('os_number', newNumber);
            toast.info(`Número de OS alterado para ${newNumber}`);
          }
        );

        if (!validation.valid && validation.newNumber) {
          data.os_number = validation.newNumber;
        }
      }

      const orderData: any = {
        os_number: data.os_number,
        senha: data.senha || null,
        entry_date: new Date(data.entry_date).toISOString(),
        client_name: data.client_name,
        contact: data.contact || null,
        other_contacts: data.other_contacts || null,
        equipment: data.equipment,
        accessories: data.accessories || null,
        defect: data.defect,
        more_details: data.more_details || null,
        value: data.value || null,
        situation_id: data.situation_id || null,
        observations: data.observations || null,
        service_date: data.service_date ? new Date(data.service_date).toISOString() : null,
        received_by_id: data.received_by_id || null,
        equipment_location_id: data.equipment_location_id || null,
        withdrawal_situation_id: data.withdrawal_situation_id || null,
        client_notified: data.client_notified,
        exit_date: data.exit_date ? new Date(data.exit_date).toISOString() : null,
        withdrawn_by: data.withdrawn_by || null,
        user_id: user?.id,
        media_files: mediaFiles,
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
              .from('service_orders_informatica')
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

        toast.success('OS atualizada com sucesso');
      } else {
        // Criar nova OS com retry para race conditions
        const result = await saveWithRetry(
          orderData,
          async (retryData) => {
            return await supabase
              .from('service_orders_informatica')
              .insert(retryData);
          }
        );

        if (!result.success) {
          throw new Error('Não foi possível criar a OS');
        }

        if (result.finalOsNumber) {
          toast.success(`OS criada com sucesso (Nº ${result.finalOsNumber})`);
        } else {
          toast.success('OS criada com sucesso');
        }
      }

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <FormLabel>Data de Entrada *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Senha do equipamento" {...field} />
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
                    <Input placeholder="(00) 00000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="other_contacts"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Outro Contato</FormLabel>
                  <FormControl>
                    <Input placeholder="E-mail, Instagram, outro telefone..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Informações do Equipamento */}
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Informações do Equipamento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="equipment"
              rules={{ required: 'Equipamento é obrigatório' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipamento *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Notebook Dell Inspiron 15" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accessories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Acessórios</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Carregador, mouse, mochila" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defect"
              rules={{ required: 'Defeito é obrigatório' }}
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Defeito *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva o defeito relatado pelo cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="more_details"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Mais Detalhes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Informações adicionais sobre o problema" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Status e Atribuições */}
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Status e Atribuições
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      placeholder="0,00" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="situation_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Situação</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a situação" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {situations.map((sit) => (
                        <SelectItem key={sit.id} value={sit.id}>{sit.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="received_by_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quem Recebeu</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipment_location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Onde Está o Equipamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o local" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem className="md:col-span-2 lg:col-span-3">
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações internas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Retirada */}
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Retirada
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="withdrawal_situation_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Situação de Retirada</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {withdrawalSituations.map((ws) => (
                        <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              name="client_notified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Cliente Avisado
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
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
              <Label htmlFor="camera-photo-info" className="cursor-pointer">
                <div className="border-2 border-dashed border-border rounded-lg p-3 sm:p-4 hover:border-primary transition-colors text-center cursor-pointer">
                  <input
                    id="camera-photo-info"
                    type="file"
                    accept="image/*"
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

              <Label htmlFor="camera-video-info" className="cursor-pointer">
                <div className="border-2 border-dashed border-border rounded-lg p-3 sm:p-4 hover:border-primary transition-colors text-center cursor-pointer">
                  <input
                    id="camera-video-info"
                    type="file"
                    accept="video/*"
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

              <Label htmlFor="media-upload-info" className="cursor-pointer">
                <div className="border-2 border-dashed border-border rounded-lg p-3 sm:p-4 hover:border-primary transition-colors text-center h-full flex items-center justify-center">
                  <input
                    id="media-upload-info"
                    type="file"
                    multiple
                    accept="image/*,video/*"
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

            {/* Arquivos Enviados */}
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      {file.type === 'image' ? (
                        <img 
                          src={file.url} 
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video 
                          src={file.url}
                          className="w-full h-full object-cover"
                          controls
                        />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveMedia(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botões */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {orderId ? 'Salvar Alterações' : 'Criar OS'}
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
