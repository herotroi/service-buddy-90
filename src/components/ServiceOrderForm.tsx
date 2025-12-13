import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PatternLock } from '@/components/PatternLock';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { processMediaFile, formatFileSize } from '@/lib/mediaCompression';
import { Progress } from '@/components/ui/progress';

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
  contact?: string;
  other_contacts?: string;
  device_model: string;
  device_password?: string;
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
  // Checklist fields
  checklist_houve_queda: boolean;
  checklist_face_id: boolean;
  checklist_carrega: boolean;
  checklist_tela_quebrada: boolean;
  checklist_vidro_trincado: boolean;
  checklist_manchas_tela: boolean;
  checklist_carcaca_torta: boolean;
  checklist_riscos_tampa: boolean;
  checklist_riscos_laterais: boolean;
  checklist_vidro_camera: boolean;
  checklist_acompanha_chip: boolean;
  checklist_acompanha_sd: boolean;
  checklist_acompanha_capa: boolean;
  checklist_esta_ligado: boolean;
}

interface MediaFile {
  url: string;
  path: string;
  type: 'image' | 'video';
  name: string;
}

export const ServiceOrderForm = ({ onSuccess, onCancel, orderId }: ServiceOrderFormProps) => {
  const [loading, setLoading] = useState(false);
  const [situations, setSituations] = useState<any[]>([]);
  const [withdrawalSituations, setWithdrawalSituations] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [passwordType, setPasswordType] = useState<'text' | 'pattern'>('text');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState('');
  
  const form = useForm<FormData>({
    defaultValues: {
      os_number: 1,
      entry_date: new Date().toISOString().split('T')[0],
      client_name: '',
      client_cpf: '',
      contact: '',
      other_contacts: '',
      device_model: '',
      device_password: '',
      reported_defect: '',
      client_message: '',
      value: undefined,
      situation_id: undefined,
      technician_id: undefined,
      received_by_id: undefined,
      part_order_date: undefined,
      service_date: undefined,
      withdrawn_by: '',
      exit_date: undefined,
      withdrawal_situation_id: undefined,
      mensagem_finalizada: false,
      mensagem_entregue: false,
      // Checklist defaults
      checklist_houve_queda: false,
      checklist_face_id: false,
      checklist_carrega: false,
      checklist_tela_quebrada: false,
      checklist_vidro_trincado: false,
      checklist_manchas_tela: false,
      checklist_carcaca_torta: false,
      checklist_riscos_tampa: false,
      checklist_riscos_laterais: false,
      checklist_vidro_camera: false,
      checklist_acompanha_chip: false,
      checklist_acompanha_sd: false,
      checklist_acompanha_capa: false,
      checklist_esta_ligado: false,
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

      form.reset({
        os_number: data.os_number,
        entry_date: new Date(data.entry_date).toISOString().split('T')[0],
        client_name: data.client_name,
        client_cpf: data.client_cpf || '',
        contact: data.contact || '',
        other_contacts: data.other_contacts || '',
        device_model: data.device_model,
        device_password: data.device_password || '',
        reported_defect: data.reported_defect,
        client_message: data.client_message || '',
        value: data.value || undefined,
        situation_id: data.situation_id || undefined,
        technician_id: data.technician_id || undefined,
        received_by_id: data.received_by_id || undefined,
        part_order_date: data.part_order_date ? new Date(data.part_order_date).toISOString().split('T')[0] : undefined,
        service_date: data.service_date ? new Date(data.service_date).toISOString().split('T')[0] : undefined,
        withdrawn_by: data.withdrawn_by || '',
        exit_date: data.exit_date ? new Date(data.exit_date).toISOString().split('T')[0] : undefined,
        withdrawal_situation_id: data.withdrawal_situation_id || undefined,
        mensagem_finalizada: data.mensagem_finalizada,
        mensagem_entregue: data.mensagem_entregue,
        // Checklist fields
        checklist_houve_queda: data.checklist_houve_queda || false,
        checklist_face_id: data.checklist_face_id || false,
        checklist_carrega: data.checklist_carrega || false,
        checklist_tela_quebrada: data.checklist_tela_quebrada || false,
        checklist_vidro_trincado: data.checklist_vidro_trincado || false,
        checklist_manchas_tela: data.checklist_manchas_tela || false,
        checklist_carcaca_torta: data.checklist_carcaca_torta || false,
        checklist_riscos_tampa: data.checklist_riscos_tampa || false,
        checklist_riscos_laterais: data.checklist_riscos_laterais || false,
        checklist_vidro_camera: data.checklist_vidro_camera || false,
        checklist_acompanha_chip: data.checklist_acompanha_chip || false,
        checklist_acompanha_sd: data.checklist_acompanha_sd || false,
        checklist_acompanha_capa: data.checklist_acompanha_capa || false,
        checklist_esta_ligado: data.checklist_esta_ligado || false,
      });

      // Carregar arquivos de mídia
      if (data.media_files && Array.isArray(data.media_files)) {
        setMediaFiles(data.media_files as unknown as MediaFile[]);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar dados da OS');
      console.error(error);
    }
  };

  const fetchNextOsNumber = async () => {
    try {
      // Buscar o próximo número de OS
      const { data: ordersData } = await supabase
        .from('service_orders')
        .select('os_number')
        .order('os_number', { ascending: false })
        .limit(1);

      let nextOsNumber = 1;
      
      // Se não houver ordens, buscar o número inicial das configurações
      if (!ordersData || ordersData.length === 0) {
        const { data: settingsData } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'os_starting_number')
          .maybeSingle();
        
        if (settingsData) {
          nextOsNumber = parseInt(settingsData.value);
        }
      } else {
        nextOsNumber = ordersData[0].os_number + 1;
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
          const fileExt = file.type.startsWith('video/') ? 
            file.name.split('.').pop() : 'jpg';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${orderId || 'temp'}/${fileName}`;

          setUploadProgress(80);
          const { error: uploadError } = await supabase.storage
            .from('service-orders-media')
            .upload(filePath, processedFile, {
              contentType: processedFile.type,
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

          const { data: { publicUrl } } = supabase.storage
            .from('service-orders-media')
            .getPublicUrl(filePath);

          const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

          uploadedFiles.push({
            url: publicUrl,
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

      setMediaFiles(mediaFiles.filter((_, i) => i !== index));
      toast.success('Arquivo removido');
    } catch (error: any) {
      toast.error('Erro ao remover arquivo');
      console.error(error);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      const orderData: any = {
        os_number: data.os_number,
        entry_date: new Date(data.entry_date).toISOString(),
        client_name: data.client_name,
        client_cpf: data.client_cpf || null,
        contact: data.contact || null,
        other_contacts: data.other_contacts || null,
        device_model: data.device_model,
        device_password: data.device_password || null,
        reported_defect: data.reported_defect,
        client_message: data.client_message || null,
        value: data.value || null,
        situation_id: data.situation_id || null,
        technician_id: data.technician_id || null,
        received_by_id: data.received_by_id || null,
        part_order_date: data.part_order_date ? new Date(data.part_order_date).toISOString() : null,
        service_date: data.service_date ? new Date(data.service_date).toISOString() : null,
        withdrawn_by: data.withdrawn_by || null,
        exit_date: data.exit_date ? new Date(data.exit_date).toISOString() : null,
        withdrawal_situation_id: data.withdrawal_situation_id || null,
        mensagem_finalizada: data.mensagem_finalizada,
        mensagem_entregue: data.mensagem_entregue,
        media_files: JSON.parse(JSON.stringify(mediaFiles)),
        // Checklist fields
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
      };

      if (orderId) {
        // Atualizar OS existente
        const { error } = await supabase
          .from('service_orders')
          .update(orderData)
          .eq('id', orderId);

        if (error) throw error;
        toast.success('OS atualizada com sucesso');
      } else {
        // Criar nova OS
        const { data: newOrder, error } = await supabase
          .from('service_orders')
          .insert(orderData)
          .select()
          .single();

        if (error) throw error;

        // Se houver arquivos temporários, mover para a pasta da OS
        if (mediaFiles.length > 0 && newOrder) {
          const updatedFiles: MediaFile[] = [];
          for (const file of mediaFiles) {
            if (file.path.startsWith('temp/')) {
              const newPath = file.path.replace('temp/', `${newOrder.id}/`);
              
              const { error: moveError } = await supabase.storage
                .from('service-orders-media')
                .move(file.path, newPath);

              if (moveError) {
                console.error('Erro ao mover arquivo:', moveError);
                updatedFiles.push(file);
              } else {
                const { data: { publicUrl } } = supabase.storage
                  .from('service-orders-media')
                  .getPublicUrl(newPath);

                updatedFiles.push({
                  ...file,
                  path: newPath,
                  url: publicUrl,
                });
              }
            } else {
              updatedFiles.push(file);
            }
          }

          // Atualizar a OS com os novos caminhos dos arquivos
          await supabase
            .from('service_orders')
            .update({ media_files: JSON.parse(JSON.stringify(updatedFiles)) } as any)
            .eq('id', newOrder.id);
        }

        toast.success('OS criada com sucesso');
      }

      onSuccess();
      if (!orderId) {
        form.reset();
        setMediaFiles([]);
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
                  <FormLabel>Data de Entrada *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
              <FormField
                control={form.control}
                name="device_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha do Aparelho</FormLabel>
                    <div className="space-y-4">
                      <RadioGroup
                        value={passwordType}
                        onValueChange={(value: 'text' | 'pattern') => {
                          setPasswordType(value);
                          if (value === 'pattern') {
                            field.onChange('');
                          }
                        }}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="text" id="text" />
                          <Label htmlFor="text" className="cursor-pointer font-normal">
                            Senha de texto
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pattern" id="pattern" />
                          <Label htmlFor="pattern" className="cursor-pointer font-normal">
                            Padrão de 9 pontos
                          </Label>
                        </div>
                      </RadioGroup>

                      {passwordType === 'text' ? (
                        <FormControl>
                          <Input type="text" placeholder="Senha (opcional)" {...field} />
                        </FormControl>
                      ) : (
                        <FormControl>
                          <PatternLock value={field.value} onChange={field.onChange} />
                        </FormControl>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Checklist Técnico */}
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Checklist Técnico
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: 'checklist_houve_queda', label: 'Houve queda?' },
              { name: 'checklist_face_id', label: 'Face ID funcionando' },
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
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value as boolean}
                        onCheckedChange={field.onChange}
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

            <FormField
              control={form.control}
              name="service_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Para Quando é o Serviço</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

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
          </div>
        </div>

        {/* Fotos e Vídeos */}
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Fotos e Vídeos
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="media-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary transition-colors text-center">
                  <input
                    id="media-upload"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    disabled={uploadingMedia}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <div className="w-full">
                      <p className="font-medium text-center">
                        {uploadingMedia ? 'Processando e enviando...' : 'Adicionar fotos ou vídeos'}
                      </p>
                      <p className="text-sm text-muted-foreground text-center">
                        {uploadingMedia 
                          ? currentFileName 
                          : 'Imagens serão comprimidas automaticamente'}
                      </p>
                      {uploadingMedia && uploadProgress > 0 && (
                        <div className="mt-3 w-full max-w-md mx-auto space-y-2">
                          <Progress value={uploadProgress} className="h-2" />
                          <p className="text-xs text-center text-muted-foreground">
                            {uploadProgress}% completo
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Label>
            </div>

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

        <div className="flex gap-3 justify-end pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} size="lg">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} size="lg">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {orderId ? 'Atualizar OS' : 'Criar OS'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
