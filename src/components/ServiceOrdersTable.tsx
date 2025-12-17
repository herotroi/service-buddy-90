import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Plus, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Função para calcular contraste e definir cor do texto
const getTextColor = (backgroundColor: string) => {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};
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
import { ServiceOrderPrint } from './ServiceOrderPrint';

interface ServiceOrder {
  id: string;
  os_number: number;
  entry_date: string;
  client_name: string;
  contact: string;
  other_contacts: string | null;
  device_model: string;
  device_password: string | null;
  reported_defect: string;
  client_message: string | null;
  value: number | null;
  part_order_date: string | null;
  service_date: string | null;
  exit_date: string | null;
  withdrawn_by: string | null;
  mensagem_finalizada: boolean;
  mensagem_entregue: boolean;
  media_files: any;
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
  received_by: {
    name: string;
  } | null;
}

interface MediaFile {
  url: string;
  path: string;
  type: 'image' | 'video';
  name: string;
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
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [printOrderId, setPrintOrderId] = useState<string | null>(null);
  
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

    // Configurar realtime para service_orders
    const channel = supabase
      .channel('service-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_orders'
        },
        (payload) => {
          console.log('Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Buscar a ordem completa com relações
            fetchSingleOrder(payload.new.id);
          } else if (payload.eventType === 'UPDATE') {
            // Buscar a ordem atualizada com relações
            fetchSingleOrder(payload.new.id);
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
            technician:employees!service_orders_technician_id_fkey(name),
            received_by:employees!service_orders_received_by_id_fkey(name)
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

  const fetchSingleOrder = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          situation:situations(id, name, color),
          withdrawal_situation:withdrawal_situations(name, color),
          technician:employees!service_orders_technician_id_fkey(name),
          received_by:employees!service_orders_received_by_id_fkey(name)
        `)
        .eq('id', orderId)
        .maybeSingle();

      if (error) throw error;

      // Se não encontrou (pode ter sido soft-deleted), remover da lista
      if (!data) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        return;
      }

      setOrders(prev => {
        const index = prev.findIndex(o => o.id === orderId);
        if (index !== -1) {
          // Atualizar ordem existente
          const newOrders = [...prev];
          newOrders[index] = data;
          return newOrders;
        } else {
          // Adicionar nova ordem
          return [data, ...prev];
        }
      });
    } catch (error: any) {
      console.error('Erro ao buscar ordem:', error);
    }
  };


  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('service_orders')
        .update({ deleted: true })
        .eq('id', deleteId);

      if (error) throw error;

      setOrders(orders.filter(order => order.id !== deleteId));
      toast.success('OS excluída com sucesso');
      setDeleteId(null);
    } catch (error: any) {
      toast.error('Erro ao excluir OS');
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
                <TableHead className="font-semibold text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
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
                            color: getTextColor(order.situation.color)
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
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setViewOrderId(order.id)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setPrintOrderId(order.id)}
                          title="Imprimir"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setEditOrderId(order.id)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(order.id)}
                          title="Excluir"
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

      {/* Drawer para visualizar OS */}
      <Drawer open={!!viewOrderId} onOpenChange={() => setViewOrderId(null)}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b pb-4">
            <DrawerTitle className="text-2xl">Visualizar Ordem de Serviço</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-6 pb-6">
            {viewOrderId && (() => {
              const order = orders.find(o => o.id === viewOrderId);
              if (!order) return null;
              
              return (
                <div className="space-y-6 max-w-4xl mx-auto py-6">
                  {/* Informações Básicas */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Informações da OS</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Número da OS</p>
                        <p className="text-lg font-bold">#{order.os_number}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Data de Entrada</p>
                        <p className="text-lg">{format(new Date(order.entry_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                      </div>
                    </div>
                  </div>

                  {/* Informações do Cliente */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Informações do Cliente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Nome do Cliente</p>
                        <p className="text-lg">{order.client_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Contato</p>
                        <p className="text-lg">{order.contact || '-'}</p>
                      </div>
                      {order.other_contacts && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Outros Contatos</p>
                          <p className="text-lg">{order.other_contacts}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações do Aparelho */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Informações do Aparelho</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Modelo do Aparelho</p>
                        <p className="text-lg">{order.device_model}</p>
                      </div>
                      {order.device_password && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Senha do Aparelho</p>
                          <p className="text-lg font-mono bg-muted px-3 py-2 rounded-md">{order.device_password}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Defeito e Mensagem */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Descrição do Serviço</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Defeito Relatado</p>
                        <p className="text-base bg-muted p-4 rounded-md">{order.reported_defect}</p>
                      </div>
                      {order.client_message && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Mensagem para o Cliente</p>
                          <p className="text-base bg-muted p-4 rounded-md">{order.client_message}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detalhes do Serviço */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Detalhes do Serviço</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Situação</p>
                        {order.situation ? (
                          <Badge 
                            style={{ 
                              backgroundColor: order.situation.color,
                              color: getTextColor(order.situation.color)
                            }}
                            className="text-sm mt-1"
                          >
                            {order.situation.name}
                          </Badge>
                        ) : '-'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Valor</p>
                        <p className="text-lg font-bold">{order.value ? `R$ ${order.value.toFixed(2)}` : '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Data da Encomenda da Peça</p>
                        <p className="text-lg">{order.part_order_date ? format(new Date(order.part_order_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Para Quando é o Serviço</p>
                        <p className="text-lg">{order.service_date ? format(new Date(order.service_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Quem Recebeu</p>
                        <p className="text-lg">{order.received_by?.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Técnico Responsável</p>
                        <p className="text-lg">{order.technician?.name || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Informações de Retirada */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Informações de Retirada</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Quem Retirou</p>
                        <p className="text-lg">{order.withdrawn_by || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Data de Saída</p>
                        <p className="text-lg">{order.exit_date ? format(new Date(order.exit_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Situação de Retirada</p>
                        {order.withdrawal_situation ? (
                          <Badge 
                            style={{ 
                              backgroundColor: order.withdrawal_situation.color,
                              color: getTextColor(order.withdrawal_situation.color)
                            }}
                            className="text-sm mt-1"
                          >
                            {order.withdrawal_situation.name}
                          </Badge>
                        ) : '-'}
                      </div>
                    </div>
                  </div>

                  {/* Status das Mensagens */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Status das Mensagens</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Mensagem Finalizada</p>
                        <Badge variant={order.mensagem_finalizada ? "default" : "secondary"}>
                          {order.mensagem_finalizada ? 'Sim' : 'Não'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Mensagem Entregue</p>
                        <Badge variant={order.mensagem_entregue ? "default" : "secondary"}>
                          {order.mensagem_entregue ? 'Sim' : 'Não'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Fotos e Vídeos */}
                  {order.media_files && Array.isArray(order.media_files) && (order.media_files as any[]).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Fotos e Vídeos</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {((order.media_files as unknown as MediaFile[]) || []).map((file, index) => {
                          // Garantir que a URL seja pública e válida
                          const mediaUrl = file.url.startsWith('http') 
                            ? file.url 
                            : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/service-orders-media/${file.path}`;
                          
                          return (
                            <div key={index} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                                {file.type === 'image' ? (
                                  <img 
                                    src={mediaUrl} 
                                    alt={file.name}
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(mediaUrl, '_blank')}
                                    onError={(e) => {
                                      console.error('Erro ao carregar imagem:', file);
                                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EErro%3C/text%3E%3C/svg%3E';
                                    }}
                                  />
                                ) : (
                                  <video 
                                    src={mediaUrl}
                                    className="w-full h-full object-cover"
                                    controls
                                    preload="metadata"
                                    onError={(e) => {
                                      console.error('Erro ao carregar vídeo:', file);
                                    }}
                                  >
                                    Seu navegador não suporta vídeos.
                                  </video>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Drawer para editar OS */}
      <Drawer open={!!editOrderId} onOpenChange={() => setEditOrderId(null)}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b pb-4">
            <DrawerTitle className="text-2xl">Editar Ordem de Serviço</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-6 py-6">
            <div className="max-w-4xl mx-auto">
              <ServiceOrderForm 
                orderId={editOrderId || undefined}
                onSuccess={() => {
                  setEditOrderId(null);
                  fetchData();
                }}
                onCancel={() => setEditOrderId(null)}
              />
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Print Component */}
      {printOrderId && (
        <ServiceOrderPrint 
          orderId={printOrderId} 
          onClose={() => setPrintOrderId(null)} 
        />
      )}
    </div>
  );
};
