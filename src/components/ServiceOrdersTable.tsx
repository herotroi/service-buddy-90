import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ServiceOrderForm } from './ServiceOrderForm';

interface ServiceOrder {
  id: string;
  os_number: number;
  entry_date: string;
  client_name: string;
  contact: string;
  device_model: string;
  reported_defect: string;
  value: number | null;
  mensagem_finalizada: boolean;
  mensagem_entregue: boolean;
  situation: {
    id: string;
    name: string;
    color: string;
  } | null;
  withdrawal_situation: {
    name: string;
    color: string;
  } | null;
  technician: {
    name: string;
  } | null;
  exit_date: string | null;
}

interface Filters {
  search: string;
  situation: string;
  technician: string;
  withdrawal: string;
  startDate: string;
  endDate: string;
}

export const ServiceOrdersTable = () => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [situations, setSituations] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [withdrawalSituations, setWithdrawalSituations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showNewOrderDrawer, setShowNewOrderDrawer] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    situation: 'all',
    technician: 'all',
    withdrawal: 'all',
    startDate: '',
    endDate: '',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [ordersData, situationsData, techniciansData, withdrawalData] = await Promise.all([
        supabase
          .from('service_orders')
          .select(`
            *,
            situation:situations(id, name, color),
            withdrawal_situation:withdrawal_situations(name, color),
            technician:employees!service_orders_technician_id_fkey(name)
          `)
          .order('os_number', { ascending: false }),
        supabase.from('situations').select('*'),
        supabase.from('employees').select('*').eq('type', 'Técnico'),
        supabase.from('withdrawal_situations').select('*'),
      ]);

      if (ordersData.error) throw ordersData.error;
      if (situationsData.error) throw situationsData.error;
      if (techniciansData.error) throw techniciansData.error;
      if (withdrawalData.error) throw withdrawalData.error;

      setOrders(ordersData.data || []);
      setSituations(situationsData.data || []);
      setTechnicians(techniciansData.data || []);
      setWithdrawalSituations(withdrawalData.data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados');
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

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setOrders(orders.filter(order => order.id !== deleteId));
      toast.success('OS deletada com sucesso');
      setDeleteId(null);
    } catch (error: any) {
      toast.error('Erro ao deletar OS');
      console.error(error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.os_number.toString().includes(filters.search) ||
      order.client_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      order.device_model.toLowerCase().includes(filters.search.toLowerCase());

    const matchesSituation = filters.situation === 'all' || order.situation?.id === filters.situation;
    const matchesTechnician = filters.technician === 'all' || order.technician?.name === filters.technician;
    const matchesWithdrawal = filters.withdrawal === 'all' || order.withdrawal_situation?.name === filters.withdrawal;

    const matchesDate = (!filters.startDate || new Date(order.entry_date) >= new Date(filters.startDate)) &&
                       (!filters.endDate || new Date(order.entry_date) <= new Date(filters.endDate));

    return matchesSearch && matchesSituation && matchesTechnician && matchesWithdrawal && matchesDate;
  });

  const paginatedOrders = filteredOrders.slice(
    (pagination.page - 1) * pagination.perPage,
    pagination.page * pagination.perPage
  );

  const totalPages = Math.ceil(filteredOrders.length / pagination.perPage);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de busca e filtros */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por OS, nome ou modelo..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 transition-all"
            />
          </div>
          <Button
            onClick={() => setShowNewOrderDrawer(true)}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova OS
          </Button>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Painel de filtros expandido */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-lg animate-in slide-in-from-top-2">
            <Select value={filters.situation} onValueChange={(value) => setFilters({ ...filters, situation: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as situações</SelectItem>
                {situations.map((sit) => (
                  <SelectItem key={sit.id} value={sit.id}>{sit.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.technician} onValueChange={(value) => setFilters({ ...filters, technician: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Técnico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os técnicos</SelectItem>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.name}>{tech.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.withdrawal} onValueChange={(value) => setFilters({ ...filters, withdrawal: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Retirada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as retiradas</SelectItem>
                {withdrawalSituations.map((ws) => (
                  <SelectItem key={ws.id} value={ws.name}>{ws.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="flex-1"
              />
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Mostrando <span className="font-medium text-foreground">{paginatedOrders.length}</span> de{' '}
          <span className="font-medium text-foreground">{filteredOrders.length}</span> OS
        </span>
        <Select
          value={pagination.perPage.toString()}
          onValueChange={(value) => setPagination({ ...pagination, perPage: Number(value), page: 1 })}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 por página</SelectItem>
            <SelectItem value="25">25 por página</SelectItem>
            <SelectItem value="50">50 por página</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">OS</TableHead>
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="font-semibold">Cliente</TableHead>
                <TableHead className="font-semibold">Modelo</TableHead>
                <TableHead className="font-semibold">Situação</TableHead>
                <TableHead className="font-semibold">Técnico</TableHead>
                <TableHead className="font-semibold">Valor</TableHead>
                <TableHead className="font-semibold text-center">Msg Final</TableHead>
                <TableHead className="font-semibold text-center">Msg Entregue</TableHead>
                <TableHead className="font-semibold text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    Nenhuma ordem de serviço encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono font-bold text-primary">
                      #{order.os_number}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(order.entry_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.client_name}</div>
                        <div className="text-xs text-muted-foreground">{order.contact}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{order.device_model}</TableCell>
                    <TableCell>
                      {order.situation && (
                        <Badge 
                          style={{ 
                            backgroundColor: order.situation.color,
                            color: '#ffffff'
                          }}
                          className="shadow-sm"
                        >
                          {order.situation.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.technician?.name || '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {order.value ? `R$ ${order.value.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={order.mensagem_finalizada}
                        onCheckedChange={(checked) => 
                          updateCheckbox(order.id, 'mensagem_finalizada', checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={order.mensagem_entregue}
                        onCheckedChange={(checked) => 
                          updateCheckbox(order.id, 'mensagem_entregue', checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(order.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={pagination.page === page ? "default" : "outline"}
                size="sm"
                onClick={() => setPagination({ ...pagination, page })}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === totalPages}
          >
            Próxima
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Drawer para nova OS */}
      <Drawer open={showNewOrderDrawer} onOpenChange={setShowNewOrderDrawer}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b pb-4">
            <DrawerTitle className="text-2xl">Nova Ordem de Serviço</DrawerTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Preencha os dados abaixo para criar uma nova OS
            </p>
          </DrawerHeader>
          <div className="overflow-y-auto px-6 py-6">
            <div className="max-w-4xl mx-auto">
              <ServiceOrderForm 
                onSuccess={() => {
                  setShowNewOrderDrawer(false);
                  fetchData();
                }}
                onCancel={() => setShowNewOrderDrawer(false)}
              />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
