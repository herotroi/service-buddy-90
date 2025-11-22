import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ServiceOrderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  client_name: string;
  contact: string;
  device_model: string;
  device_password?: string;
  reported_defect: string;
  client_message?: string;
  value?: number;
  situation_id?: string;
  technician_id?: string;
  received_by_id?: string;
}

export const ServiceOrderForm = ({ onSuccess, onCancel }: ServiceOrderFormProps) => {
  const [loading, setLoading] = useState(false);
  const [situations, setSituations] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const form = useForm<FormData>({
    defaultValues: {
      client_name: '',
      contact: '',
      device_model: '',
      device_password: '',
      reported_defect: '',
      client_message: '',
      value: undefined,
      situation_id: undefined,
      technician_id: undefined,
      received_by_id: undefined,
    },
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [situationsData, techniciansData, employeesData] = await Promise.all([
        supabase.from('situations').select('*'),
        supabase.from('employees').select('*').eq('type', 'Técnico'),
        supabase.from('employees').select('*'),
      ]);

      if (situationsData.error) throw situationsData.error;
      if (techniciansData.error) throw techniciansData.error;
      if (employeesData.error) throw employeesData.error;

      setSituations(situationsData.data || []);
      setTechnicians(techniciansData.data || []);
      setEmployees(employeesData.data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar opções');
      console.error(error);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

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
          .single();
        
        if (settingsData) {
          nextOsNumber = parseInt(settingsData.value);
        }
      } else {
        nextOsNumber = ordersData[0].os_number + 1;
      }

      const { error } = await supabase.from('service_orders').insert({
        os_number: nextOsNumber,
        client_name: data.client_name,
        contact: data.contact,
        device_model: data.device_model,
        device_password: data.device_password || null,
        reported_defect: data.reported_defect,
        client_message: data.client_message || null,
        value: data.value || null,
        situation_id: data.situation_id || null,
        technician_id: data.technician_id || null,
        received_by_id: data.received_by_id || null,
        entry_date: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('OS criada com sucesso');
      onSuccess();
      form.reset();
    } catch (error: any) {
      toast.error('Erro ao criar OS');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            rules={{ required: 'Contato é obrigatório' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contato *</FormLabel>
                <FormControl>
                  <Input placeholder="Telefone ou email" {...field} />
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

          <FormField
            control={form.control}
            name="device_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha do Aparelho</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Senha (opcional)" {...field} />
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
                      <SelectValue placeholder="Selecione uma situação" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {situations.map((situation) => (
                      <SelectItem key={situation.id} value={situation.id}>
                        {situation.name}
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
        </div>

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
                  className="min-h-20"
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
                  className="min-h-20"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar OS
          </Button>
        </div>
      </form>
    </Form>
  );
};
