import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Plus, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

const getTextColor = (backgroundColor: string) => {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

// Função para gerar cor de fundo suave baseada na cor da situação
const getSoftBackgroundColor = (color: string | undefined): string | undefined => {
  if (!color) return undefined;
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, 0.15)`;
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
import { ServiceOrderInformaticaForm } from './ServiceOrderInformaticaForm';
import { ServiceOrderInformaticaPrint } from './ServiceOrderInformaticaPrint';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ServiceOrderInformatica {
  id: string;
  os_number: number;
  deleted: boolean;
  senha: string | null;
  entry_date: string;
  client_name: string;
  contact: string | null;
  other_contacts: string | null;
  equipment: string;
  accessories: string | null;
  defect: string;
  more_details: string | null;
  value: number | null;
  observations: string | null;
  service_date: string | null;
  exit_date: string | null;
  withdrawn_by: string | null;
  client_notified: boolean;
  situation: {
    id: string;
    name: string;
    color: string;
  } | null;
  withdrawal_situation: {
    name: string;
    color: string;
  } | null;
  received_by: {
    name: string;
  } | null;
  equipment_location: {
    name: string;
    color: string;
  } | null;
}

interface Filters {
  search: string;
  situation: string;
  location: string;
  withdrawal: string;
  startDate: string;
  endDate: string;
}

export const ServiceOrdersInformaticaTable = () => {
  const isMobile = useIsMobile();
  const { session } = useAuth();
  const [orders, setOrders] = useState<ServiceOrderInformatica[]>([]);
  const [situations, setSituations] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [withdrawalSituations, setWithdrawalSituations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteOrder, setDeleteOrder] = useState<{ id: string; os_number: number; client_name: string } | null>(null);
  const [showNewOrderDrawer, setShowNewOrderDrawer] = useState(false);
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [printOrderId, setPrintOrderId] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    situation: 'all',
    location: 'all',
    withdrawal: 'all',
    startDate: '',
    endDate: '',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 50,
  });

  // Search state - only applied when button is clicked
  const [appliedFilters, setAppliedFilters] = useState(filters);
  
  const handleSearch = () => {
    setAppliedFilters(filters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    if (!session) return;
    
    fetchData();

    const channel = supabase
      .channel('service-orders-informatica-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_orders_informatica'
        },
        (payload) => {
          // Não atualizar se um drawer de cadastro está aberto
          if (showNewOrderDrawer || editOrderId) {
            console.log('Drawer aberto, ignorando atualização realtime');
            return;
          }
          
          if (payload.eventType === 'INSERT') {
            fetchSingleOrder(payload.new.id);
          } else if (payload.eventType === 'UPDATE') {
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
  }, [session, showNewOrderDrawer, editOrderId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [ordersData, situationsData, locationsData, withdrawalData] = await Promise.all([
        supabase
          .from('service_orders_informatica')
          .select(`
            *,
            situation:situacao_informatica(id, name, color),
            withdrawal_situation:retirada_informatica(name, color),
            received_by:employees!service_orders_informatica_received_by_id_fkey(name),
            equipment_location:local_equipamento(name, color)
          `)
          .eq('deleted', false)
          .order('os_number', { ascending: false }),
        supabase.from('situacao_informatica').select('*'),
        supabase.from('local_equipamento').select('*'),
        supabase.from('retirada_informatica').select('*'),
      ]);

      if (ordersData.error) throw ordersData.error;
      if (situationsData.error) throw situationsData.error;
      if (locationsData.error) throw locationsData.error;
      if (withdrawalData.error) throw withdrawalData.error;

      setOrders(ordersData.data || []);
      setSituations(situationsData.data || []);
      setLocations(locationsData.data || []);
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
        .from('service_orders_informatica')
        .select(`
          *,
          situation:situacao_informatica(id, name, color),
          withdrawal_situation:retirada_informatica(name, color),
          received_by:employees!service_orders_informatica_received_by_id_fkey(name),
          equipment_location:local_equipamento(name, color)
        `)
        .eq('id', orderId)
        .eq('deleted', false)
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
          const newOrders = [...prev];
          newOrders[index] = data;
          return newOrders;
        } else {
          return [data, ...prev];
        }
      });
    } catch (error: any) {
      console.error('Erro ao buscar ordem:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteOrder) {
      console.log('handleDelete: deleteOrder is null');
      return;
    }

    console.log('handleDelete: Deleting order', deleteOrder.id);

    try {
      const { error, data } = await supabase
        .from('service_orders_informatica')
        .update({ deleted: true })
        .eq('id', deleteOrder.id)
        .select();

      console.log('handleDelete: Response', { error, data });

      if (error) throw error;

      // Atualizar lista local imediatamente
      setOrders(prev => prev.filter(order => order.id !== deleteOrder.id));
      toast.success('OS excluída com sucesso');
      setDeleteOrder(null);
      
      // Recarregar dados do servidor para garantir consistência
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao excluir OS: ' + error.message);
      console.error('handleDelete error:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    // Filtrar itens deletados
    if (order.deleted) return false;

    const searchTerm = appliedFilters.search?.trim() || '';
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = searchTerm === '' || 
      order.os_number.toString().includes(searchTerm) ||
      order.client_name.toLowerCase().includes(searchLower) ||
      order.equipment.toLowerCase().includes(searchLower) ||
      order.defect?.toLowerCase().includes(searchLower);

    const matchesSituation = appliedFilters.situation === 'all' || order.situation?.id === appliedFilters.situation;
    const matchesLocation = appliedFilters.location === 'all' || order.equipment_location?.name === appliedFilters.location;
    const matchesWithdrawal = appliedFilters.withdrawal === 'all' || order.withdrawal_situation?.name === appliedFilters.withdrawal;

    const matchesDate = (!appliedFilters.startDate || new Date(order.entry_date) >= new Date(appliedFilters.startDate)) &&
                       (!appliedFilters.endDate || new Date(order.entry_date) <= new Date(appliedFilters.endDate));

    return matchesSearch && matchesSituation && matchesLocation && matchesWithdrawal && matchesDate;
  });

  const paginatedOrders = filteredOrders.slice(
    (pagination.page - 1) * pagination.perPage,
    pagination.page * pagination.perPage
  );

  const totalPages = Math.ceil(filteredOrders.length / pagination.perPage);

  const viewedOrder = orders.find(o => o.id === viewOrderId);

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
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por OS, nome ou equipamento..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={handleKeyPress}
              className="pl-10 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSearch}
              variant="secondary"
              className="shrink-0"
            >
              <Search className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Pesquisar</span>
            </Button>
            <Button
              onClick={() => setShowNewOrderDrawer(true)}
              className="flex-1 sm:flex-none shrink-0"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="sm:inline">Nova OS</span>
            </Button>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0"
            >
              <Filter className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Filtros</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                const clearedFilters = {
                  search: '',
                  situation: 'all',
                  location: 'all',
                  withdrawal: 'all',
                  startDate: '',
                  endDate: '',
                };
                setFilters(clearedFilters);
                setAppliedFilters(clearedFilters);
                setPagination({ page: 1, perPage: 50 });
              }}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              title="Limpar filtros"
            >
              <span className="text-sm">Limpar</span>
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg animate-in slide-in-from-top-2">
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

            <Select value={filters.location} onValueChange={(value) => setFilters({ ...filters, location: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Local" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os locais</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-muted-foreground">
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

      {/* Cards para Mobile */}
      {isMobile ? (
        <div className="space-y-3">
          {paginatedOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma ordem de serviço encontrada
            </div>
          ) : (
            paginatedOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden" style={{ backgroundColor: getSoftBackgroundColor(order.situation?.color) }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="font-mono font-bold text-primary text-lg">#{order.os_number}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {format(new Date(order.entry_date), 'dd/MM/yy', { locale: ptBR })}
                      </span>
                    </div>
                    {order.situation && (
                      <Badge 
                        style={{ 
                          backgroundColor: order.situation.color,
                          color: getTextColor(order.situation.color)
                        }}
                        className="shadow-sm text-xs"
                      >
                        {order.situation.name}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 mb-3">
                    <p className="font-medium truncate">{order.client_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{order.equipment}</p>
                    {order.value && (
                      <p className="text-sm font-medium text-primary">R$ {order.value.toFixed(2)}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-2 border-t">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setViewOrderId(order.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setPrintOrderId(order.id)}>
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setEditOrderId(order.id)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setDeleteOrder({ id: order.id, os_number: order.os_number, client_name: order.client_name })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">OS</TableHead>
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="font-semibold">Equipamento</TableHead>
                  <TableHead className="font-semibold">Situação</TableHead>
                  <TableHead className="font-semibold">Local</TableHead>
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
                    <TableRow key={order.id} className="hover:bg-muted/50 transition-colors" style={{ backgroundColor: getSoftBackgroundColor(order.situation?.color) }}>
                      <TableCell className="font-mono font-bold text-primary">#{order.os_number}</TableCell>
                      <TableCell className="text-sm">{format(new Date(order.entry_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.client_name}</div>
                          <div className="text-xs text-muted-foreground">{order.contact}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{order.equipment}</TableCell>
                      <TableCell>
                        {order.situation && (
                          <Badge style={{ backgroundColor: order.situation.color, color: getTextColor(order.situation.color) }} className="shadow-sm">
                            {order.situation.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.equipment_location && (
                          <Badge variant="outline" style={{ borderColor: order.equipment_location.color, color: order.equipment_location.color }}>
                            {order.equipment_location.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{order.value ? `R$ ${order.value.toFixed(2)}` : '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewOrderId(order.id)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPrintOrderId(order.id)}><Printer className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOrderId(order.id)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteOrder({ id: order.id, os_number: order.os_number, client_name: order.client_name })}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })} disabled={pagination.page === 1}>
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Anterior</span>
          </Button>
          <span className="text-sm text-muted-foreground px-2">{pagination.page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })} disabled={pagination.page === totalPages}>
            <span className="hidden sm:inline mr-1">Próxima</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Drawer Nova OS */}
      <Drawer open={showNewOrderDrawer} onOpenChange={setShowNewOrderDrawer}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Nova Ordem de Serviço - Informática</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="h-[calc(90vh-80px)] px-4">
            <ServiceOrderInformaticaForm
              onSuccess={() => {
                setShowNewOrderDrawer(false);
                fetchData();
              }}
              onCancel={() => setShowNewOrderDrawer(false)}
            />
          </ScrollArea>
        </DrawerContent>
      </Drawer>

      {/* Drawer Visualizar OS */}
      <Drawer open={!!viewOrderId} onOpenChange={() => setViewOrderId(null)}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>
              OS #{viewedOrder?.os_number} - Visualizar
            </DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="h-[calc(90vh-80px)] px-4 pb-6">
            {viewedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">OS</span>
                    <p className="font-mono font-bold">#{viewedOrder.os_number}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Data de Entrada</span>
                    <p>{format(new Date(viewedOrder.entry_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Senha</span>
                    <p>{viewedOrder.senha || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Cliente</span>
                    <p className="font-medium">{viewedOrder.client_name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Contato</span>
                    <p>{viewedOrder.contact || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Outro Contato</span>
                    <p>{viewedOrder.other_contacts || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-muted-foreground">Equipamento</span>
                    <p>{viewedOrder.equipment}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Acessórios</span>
                    <p>{viewedOrder.accessories || '-'}</p>
                  </div>
                  <div className="col-span-3">
                    <span className="text-sm text-muted-foreground">Defeito</span>
                    <p>{viewedOrder.defect}</p>
                  </div>
                  {viewedOrder.more_details && (
                    <div className="col-span-3">
                      <span className="text-sm text-muted-foreground">Mais Detalhes</span>
                      <p>{viewedOrder.more_details}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-muted-foreground">Valor</span>
                    <p className="font-medium">{viewedOrder.value ? `R$ ${viewedOrder.value.toFixed(2)}` : '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Situação</span>
                    <div className="mt-1">
                      {viewedOrder.situation && (
                        <Badge 
                          style={{ 
                            backgroundColor: viewedOrder.situation.color,
                            color: getTextColor(viewedOrder.situation.color)
                          }}
                        >
                          {viewedOrder.situation.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Local do Equipamento</span>
                    <div className="mt-1">
                      {viewedOrder.equipment_location && (
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: viewedOrder.equipment_location.color,
                            color: viewedOrder.equipment_location.color
                          }}
                        >
                          {viewedOrder.equipment_location.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {viewedOrder.observations && (
                    <div className="col-span-3">
                      <span className="text-sm text-muted-foreground">Observações</span>
                      <p>{viewedOrder.observations}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-muted-foreground">Quem Recebeu</span>
                    <p>{viewedOrder.received_by?.name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Para Quando</span>
                    <p>{viewedOrder.service_date ? format(new Date(viewedOrder.service_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Cliente Avisado</span>
                    <p>{viewedOrder.client_notified ? 'Sim' : 'Não'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Situação Retirada</span>
                    <div className="mt-1">
                      {viewedOrder.withdrawal_situation && (
                        <Badge 
                          style={{ 
                            backgroundColor: viewedOrder.withdrawal_situation.color,
                            color: getTextColor(viewedOrder.withdrawal_situation.color)
                          }}
                        >
                          {viewedOrder.withdrawal_situation.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Quem Retirou</span>
                    <p>{viewedOrder.withdrawn_by || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Data de Saída</span>
                    <p>{viewedOrder.exit_date ? format(new Date(viewedOrder.exit_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DrawerContent>
      </Drawer>

      {/* Drawer Editar OS */}
      <Drawer open={!!editOrderId} onOpenChange={() => setEditOrderId(null)}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Editar Ordem de Serviço</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="h-[calc(90vh-80px)] px-4">
            <ServiceOrderInformaticaForm
              orderId={editOrderId || undefined}
              onSuccess={() => {
                setEditOrderId(null);
                fetchData();
              }}
              onCancel={() => setEditOrderId(null)}
            />
          </ScrollArea>
        </DrawerContent>
      </Drawer>

      {/* Dialog de Exclusão */}
      <AlertDialog open={!!deleteOrder} onOpenChange={() => setDeleteOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a <strong>OS #{deleteOrder?.os_number}</strong> do cliente <strong>{deleteOrder?.client_name}</strong>? Esta ação não pode ser desfeita.
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

      {/* Print Component */}
      {printOrderId && (
        <ServiceOrderInformaticaPrint
          orderId={printOrderId}
          onClose={() => setPrintOrderId(null)}
        />
      )}
    </div>
  );
};
