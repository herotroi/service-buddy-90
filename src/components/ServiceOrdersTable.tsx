import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ServiceOrder {
  id: string;
  os_number: number;
  entry_date: string;
  client_name: string;
  contact: string;
  device_model: string;
  situation: {
    name: string;
    color: string;
  } | null;
  value: number | null;
  mensagem_finalizada: boolean;
  mensagem_entregue: boolean;
}

export const ServiceOrdersTable = () => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [situationFilter, setSituationFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          situation:situations(name, color)
        `)
        .order('os_number', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar ordens de serviço');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateCheckbox = async (id: string, field: 'mensagem_finalizada' | 'mensagem_entregue', value: boolean) => {
    try {
      const { error } = await supabase
        .from('service_orders')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === id ? { ...order, [field]: value } : order
      ));
      
      toast.success('Atualizado com sucesso');
    } catch (error: any) {
      toast.error('Erro ao atualizar');
      console.error(error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.os_number.toString().includes(searchTerm) ||
      order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.device_model.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSituation = situationFilter === 'all' || order.situation?.name === situationFilter;

    return matchesSearch && matchesSituation;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por OS, nome ou modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={situationFilter} onValueChange={setSituationFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as situações</SelectItem>
            <SelectItem value="AGENDADO">AGENDADO</SelectItem>
            <SelectItem value="EM BANCADA">EM BANCADA</SelectItem>
            <SelectItem value="FINALIZADO">FINALIZADO</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>OS</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Msg Final</TableHead>
              <TableHead>Msg Entregue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  Nenhuma ordem de serviço encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono font-semibold">#{order.os_number}</TableCell>
                  <TableCell>
                    {format(new Date(order.entry_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">{order.client_name}</TableCell>
                  <TableCell>{order.contact}</TableCell>
                  <TableCell>{order.device_model}</TableCell>
                  <TableCell>
                    {order.situation && (
                      <Badge 
                        style={{ 
                          backgroundColor: order.situation.color,
                          color: '#ffffff'
                        }}
                      >
                        {order.situation.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {order.value ? `R$ ${order.value.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={order.mensagem_finalizada}
                      onCheckedChange={(checked) => 
                        updateCheckbox(order.id, 'mensagem_finalizada', checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={order.mensagem_entregue}
                      onCheckedChange={(checked) => 
                        updateCheckbox(order.id, 'mensagem_entregue', checked as boolean)
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
