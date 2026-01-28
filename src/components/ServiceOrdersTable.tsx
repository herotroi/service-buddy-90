import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Plus, Printer, ArrowUpDown } from 'lucide-react';
import { UniversalVideoPlayer } from '@/components/UniversalVideoPlayer';
import { getSignedUrls } from '@/lib/storageUtils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

// Função para calcular contraste e definir cor do texto
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
import { ServiceOrderForm } from './ServiceOrderForm';
import { ServiceOrderPrint } from './ServiceOrderPrint';
import { PatternLock } from './PatternLock';

interface ServiceOrder {
  id: string;
  os_number: number;
  entry_date: string;
  client_name: string;
  client_cpf: string | null;
  client_address: string | null;
  contact: string;
  other_contacts: string | null;
  device_model: string;
  device_password: string | null;
  device_pattern: string | null;
  device_chip: string | null;
  memory_card_size: string | null;
  technical_info: string | null;
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
  // Checklist fields
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
  const isMobile = useIsMobile();
  const { session } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [situations, setSituations] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [withdrawalSituations, setWithdrawalSituations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteOrder, setDeleteOrder] = useState<{ id: string; os_number: number; client_name: string } | null>(null);
  const [showNewOrderDrawer, setShowNewOrderDrawer] = useState(false);
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [printOrderId, setPrintOrderId] = useState<string | null>(null);
  const [signedMediaFiles, setSignedMediaFiles] = useState<MediaFile[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  
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
    perPage: 50,
  });
  const [totalCount, setTotalCount] = useState(0);

  const [sortBy, setSortBy] = useState<'entry_date' | 'client_name' | 'os_number' | 'situation' | 'service_date'>('os_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  // Fetch orders when session is ready and filters change
  // NÃO buscar dados se drawer está aberto para evitar re-render e perda de dados
  useEffect(() => {
    if (session && !showNewOrderDrawer && !editOrderId) {
      fetchOrders();
    }
  }, [session, pagination.page, pagination.perPage, sortBy, sortOrder, appliedFilters, showNewOrderDrawer, editOrderId]);

  // Load signed URLs when viewing an order
  useEffect(() => {
    const loadSignedUrls = async () => {
      if (!viewOrderId) {
        setSignedMediaFiles([]);
        return;
      }

      const order = orders.find(o => o.id === viewOrderId);
      if (!order?.media_files || !Array.isArray(order.media_files) || (order.media_files as any[]).length === 0) {
        setSignedMediaFiles([]);
        return;
      }

      setLoadingMedia(true);
      try {
        const mediaFiles = order.media_files as unknown as MediaFile[];
        const signedFiles = await getSignedUrls(mediaFiles);
        setSignedMediaFiles(signedFiles);
      } catch (error) {
        console.error('Error loading signed URLs:', error);
        setSignedMediaFiles(order.media_files as unknown as MediaFile[]);
      } finally {
        setLoadingMedia(false);
      }
    };

    loadSignedUrls();
  }, [viewOrderId, orders]);

  // Referências para verificar se drawer está aberto (evita recriar canal)
  const showNewOrderDrawerRef = useRef(showNewOrderDrawer);
  const editOrderIdRef = useRef(editOrderId);
  
  // Atualizar refs quando valores mudarem
  useEffect(() => {
    showNewOrderDrawerRef.current = showNewOrderDrawer;
  }, [showNewOrderDrawer]);
  
  useEffect(() => {
    editOrderIdRef.current = editOrderId;
  }, [editOrderId]);

  // Fetch filter options when session is ready
  useEffect(() => {
    if (!session) return;
    
    fetchFilterOptions();

    // Configurar realtime para service_orders - atualização incremental para não fechar drawers
    const channel = supabase
      .channel('service-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_orders'
        },
        async (payload) => {
          console.log('Realtime update:', payload);
          
          // Não atualizar se um drawer de cadastro está aberto (usar refs para evitar recriação do canal)
          if (showNewOrderDrawerRef.current || editOrderIdRef.current) {
            console.log('Drawer aberto, ignorando atualização realtime');
            return;
          }
          
          if (payload.eventType === 'INSERT') {
            // Buscar o novo registro completo
            const { data, error } = await supabase
              .from('service_orders')
              .select(`
                *,
                situation:situations(id, name, color),
                withdrawal_situation:withdrawal_situations(name, color),
                technician:employees!service_orders_technician_id_fkey(name),
                received_by:employees!service_orders_received_by_id_fkey(name)
              `)
              .eq('id', payload.new.id)
              .eq('deleted', false)
              .maybeSingle();
              
            if (!error && data) {
              setOrders(prev => {
                // Verificar se já existe
                const exists = prev.some(o => o.id === data.id);
                if (exists) return prev;
                return [data, ...prev];
              });
              setTotalCount(prev => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Buscar o registro atualizado
            const { data, error } = await supabase
              .from('service_orders')
              .select(`
                *,
                situation:situations(id, name, color),
                withdrawal_situation:withdrawal_situations(name, color),
                technician:employees!service_orders_technician_id_fkey(name),
                received_by:employees!service_orders_received_by_id_fkey(name)
              `)
              .eq('id', payload.new.id)
              .maybeSingle();
              
            if (!error && data) {
              if (data.deleted) {
                // Se foi soft-deleted, remover da lista
                setOrders(prev => prev.filter(o => o.id !== data.id));
                setTotalCount(prev => prev - 1);
              } else {
                // Atualizar o registro
                setOrders(prev => prev.map(o => o.id === data.id ? data : o));
              }
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
            setTotalCount(prev => prev - 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]); // Removido showNewOrderDrawer e editOrderId das dependências

  const fetchFilterOptions = async () => {
    try {
      const [situationsData, techniciansData, withdrawalData] = await Promise.all([
        supabase.from('situations').select('*'),
        supabase.from('employees').select('*').eq('type', 'Técnico'),
        supabase.from('withdrawal_situations').select('*'),
      ]);

      if (situationsData.error) throw situationsData.error;
      if (techniciansData.error) throw techniciansData.error;
      if (withdrawalData.error) throw withdrawalData.error;

      setSituations(situationsData.data || []);
      setTechnicians(techniciansData.data || []);
      setWithdrawalSituations(withdrawalData.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar opções de filtro:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const searchTerm = appliedFilters.search?.trim() || '';
      const hasSearch = searchTerm.length > 0;
      
      // Build query with server-side filtering
      let query = supabase
        .from('service_orders')
        .select(`
          *,
          situation:situations(id, name, color),
          withdrawal_situation:withdrawal_situations(name, color),
          technician:employees!service_orders_technician_id_fkey(name),
          received_by:employees!service_orders_received_by_id_fkey(name)
        `, { count: 'exact' })
        .eq('deleted', false);
      
      if (appliedFilters.situation !== 'all') {
        query = query.eq('situation_id', appliedFilters.situation);
      }
      
      if (appliedFilters.startDate) {
        query = query.gte('entry_date', appliedFilters.startDate);
      }
      
      if (appliedFilters.endDate) {
        query = query.lte('entry_date', appliedFilters.endDate + 'T23:59:59');
      }

      // Apply sorting
      if (sortBy === 'service_date') {
        // Para "Para Quando é o Serviço", ordenar com datas futuras primeiro (mais próximas primeiro)
        query = query.order('service_date', { ascending: true, nullsFirst: false });
      } else {
        const sortColumn = sortBy === 'situation' ? 'situation_id' : sortBy;
        query = query.order(sortColumn, { ascending: sortOrder === 'asc' });
      }

      // If searching, fetch all records to filter client-side for OS partial match
      // Otherwise use server-side pagination
      if (hasSearch) {
        query = query.limit(5000);
      } else {
        const from = (pagination.page - 1) * pagination.perPage;
        const to = from + pagination.perPage - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      let filteredData = data || [];
      
      // Apply search filter client-side for partial OS number matching
      if (hasSearch) {
        const searchLower = searchTerm.toLowerCase();
        filteredData = filteredData.filter(order => {
          const osMatch = order.os_number?.toString().includes(searchTerm);
          const modelMatch = order.device_model?.toLowerCase().includes(searchLower);
          const nameMatch = order.client_name?.toLowerCase().includes(searchLower);
          const defectMatch = order.reported_defect?.toLowerCase().includes(searchLower);
          return osMatch || modelMatch || nameMatch || defectMatch;
        });
      }
      
      // Filter by technician and withdrawal client-side (join fields)
      if (appliedFilters.technician !== 'all') {
        filteredData = filteredData.filter(o => o.technician?.name === appliedFilters.technician);
      }
      if (appliedFilters.withdrawal !== 'all') {
        filteredData = filteredData.filter(o => o.withdrawal_situation?.name === appliedFilters.withdrawal);
      }

      // Para ordenação por service_date:
      // 1. Datas futuras primeiro, ordenadas da mais próxima para a mais distante
      // 2. Depois datas passadas, ordenadas da mais recente para a mais antiga
      // 3. Sem data vai para o final
      if (sortBy === 'service_date') {
        const now = new Date().getTime();
        filteredData = filteredData.sort((a, b) => {
          const dateA = a.service_date ? new Date(a.service_date).getTime() : null;
          const dateB = b.service_date ? new Date(b.service_date).getTime() : null;
          
          // Nulls vão para o final
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          
          // Ordenar pela distância absoluta ao momento atual
          const diffA = Math.abs(dateA - now);
          const diffB = Math.abs(dateB - now);
          
          return diffA - diffB; // Menor diferença = mais próximo = primeiro
        });
      }

      // For search results, apply client-side pagination
      if (hasSearch) {
        const totalFiltered = filteredData.length;
        const from = (pagination.page - 1) * pagination.perPage;
        const to = from + pagination.perPage;
        const paginatedData = filteredData.slice(from, to);
        setOrders(paginatedData);
        setTotalCount(totalFiltered);
      } else {
        setOrders(filteredData);
        setTotalCount(count || 0);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
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
        .from('service_orders')
        .update({ deleted: true })
        .eq('id', deleteOrder.id)
        .select();

      console.log('handleDelete: Response', { error, data });

      if (error) throw error;

      // Atualizar lista local imediatamente
      setOrders(prev => prev.filter(order => order.id !== deleteOrder.id));
      setTotalCount(prev => prev - 1);
      toast.success('OS excluída com sucesso');
      setDeleteOrder(null);
      
      // Não recarregar dados do servidor aqui - o realtime vai cuidar disso
      // e a atualização local já foi feita
    } catch (error: any) {
      toast.error('Erro ao excluir OS: ' + error.message);
      console.error('handleDelete error:', error);
    }
  };

  // Orders are already filtered and sorted server-side, just use them directly
  const totalPages = Math.ceil(totalCount / pagination.perPage);

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
              placeholder="Buscar por OS, nome ou modelo..."
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
                  technician: 'all',
                  withdrawal: 'all',
                  startDate: '',
                  endDate: '',
                };
                setFilters(clearedFilters);
                setAppliedFilters(clearedFilters);
                setSortBy('os_number');
                setSortOrder('desc');
                setPagination({ page: 1, perPage: 10 });
              }}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              title="Limpar filtros"
            >
              <span className="text-sm">Limpar</span>
            </Button>
          </div>
        </div>

        {/* Painel de filtros expandido */}
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

      {/* Estatísticas e Ordenação */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          Mostrando <span className="font-medium text-foreground">{orders.length}</span> de{' '}
          <span className="font-medium text-foreground">{totalCount}</span> OS
        </span>
        <div className="flex gap-2 flex-wrap">
          <Select
            value={sortBy}
            onValueChange={(value: 'entry_date' | 'client_name' | 'os_number' | 'situation' | 'service_date') => setSortBy(value)}
          >
            <SelectTrigger className="w-48">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry_date">Data de Entrada</SelectItem>
              <SelectItem value="client_name">Nome</SelectItem>
              <SelectItem value="os_number">Número OS</SelectItem>
              <SelectItem value="situation">Situação</SelectItem>
              <SelectItem value="service_date">Para Quando é o Serviço</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="h-9"
          >
            {sortOrder === 'asc' ? '↑ Crescente' : '↓ Decrescente'}
          </Button>
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
      </div>

      {/* Cards para Mobile */}
      {isMobile ? (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma ordem de serviço encontrada
            </div>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="overflow-hidden" style={{ backgroundColor: getSoftBackgroundColor(order.situation?.color) }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="font-mono font-bold text-primary text-lg">#{order.os_number}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {format(new Date(order.entry_date), 'dd/MM/yy', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
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
                      {order.service_date && (
                        <span className="text-xs text-muted-foreground">
                          📅 {format(new Date(order.service_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 mb-3">
                    <p className="font-medium truncate">{order.client_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{order.device_model}</p>
                    {order.value && (
                      <p className="text-sm font-medium text-primary">R$ {order.value.toFixed(2)}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-2 border-t">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9"
                      onClick={() => setViewOrderId(order.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9"
                      onClick={() => setPrintOrderId(order.id)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9"
                      onClick={() => setEditOrderId(order.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-destructive hover:text-destructive"
                      onClick={() => setDeleteOrder({ id: order.id, os_number: order.os_number, client_name: order.client_name })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Tabela para Desktop */
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
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      Nenhuma ordem de serviço encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50 transition-colors" style={{ backgroundColor: getSoftBackgroundColor(order.situation?.color) }}>
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
                        <div className="flex flex-col gap-1">
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
                          {order.service_date && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              📅 {format(new Date(order.service_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </span>
                          )}
                        </div>
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
                            onClick={() => setDeleteOrder({ id: order.id, os_number: order.os_number, client_name: order.client_name })}
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
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Anterior</span>
          </Button>
          
          <span className="text-sm text-muted-foreground px-2">
            {pagination.page} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === totalPages}
          >
            <span className="hidden sm:inline mr-1">Próxima</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Dialog de confirmação de exclusão */}
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

      {/* Drawer para nova OS */}
      <Drawer open={showNewOrderDrawer} onOpenChange={setShowNewOrderDrawer} modal={false}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b pb-4">
            <DrawerTitle className="text-2xl">Nova Ordem de Serviço</DrawerTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Preencha os dados abaixo para criar uma nova OS
            </p>
          </DrawerHeader>
          <div className="overflow-y-auto px-6 py-6">
            <div className="max-w-4xl mx-auto">
              {showNewOrderDrawer && (
                <ServiceOrderForm 
                  key="new-order-form"
                  onSuccess={() => {
                    setShowNewOrderDrawer(false);
                    fetchOrders();
                  }}
                  onCancel={() => setShowNewOrderDrawer(false)}
                />
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Drawer para visualizar OS */}
      <Drawer open={!!viewOrderId} onOpenChange={() => setViewOrderId(null)}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b pb-4 flex flex-row items-center justify-between">
            <DrawerTitle className="text-2xl">Visualizar Ordem de Serviço</DrawerTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setPrintOrderId(viewOrderId);
                setViewOrderId(null);
              }}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
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
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Outros Contatos</p>
                        <p className="text-lg">{order.other_contacts || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">CPF</p>
                        <p className="text-lg">{order.client_cpf || '-'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Endereço</p>
                        <p className="text-lg">{order.client_address || '-'}</p>
                      </div>
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
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Chip</p>
                        <p className="text-lg">{order.device_chip || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Tamanho do Cartão de Memória</p>
                        <p className="text-lg">{order.memory_card_size || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Senha de Texto</p>
                        <p className="text-lg font-mono bg-muted px-3 py-2 rounded-md">{order.device_password || '-'}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Padrão de 9 Pontos</p>
                      {order.device_pattern ? (
                        <PatternLock
                          value={order.device_pattern}
                          onChange={() => {}}
                          disabled={true}
                        />
                      ) : (
                        <p className="text-lg">-</p>
                      )}
                    </div>
                    {order.technical_info && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Informações Técnicas</p>
                        <p className="text-base bg-muted p-4 rounded-md whitespace-pre-wrap">{order.technical_info}</p>
                      </div>
                    )}
                  </div>

                  {/* Checklist Técnico */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Checklist Técnico</h3>
                    
                    {/* Chip e Cartão de Memória */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center justify-between p-3 rounded-md border bg-muted/50">
                        <span className="text-sm font-medium">Chip</span>
                        <span className="font-medium">{order.device_chip || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-md border bg-muted/50">
                        <span className="text-sm font-medium">Tamanho do Cartão de Memória</span>
                        <span className="font-medium">{order.memory_card_size || '-'}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[
                        { key: 'checklist_houve_queda', label: 'Houve queda?' },
                        { key: 'checklist_face_id', label: 'Face ID funcionando' },
                        { key: 'checklist_carrega', label: 'Carrega' },
                        { key: 'checklist_tela_quebrada', label: 'Tela quebrada' },
                        { key: 'checklist_vidro_trincado', label: 'Vidro trincado' },
                        { key: 'checklist_manchas_tela', label: 'Manchas na tela' },
                        { key: 'checklist_carcaca_torta', label: 'Carcaça torta' },
                        { key: 'checklist_riscos_tampa', label: 'Riscos na tampa' },
                        { key: 'checklist_riscos_laterais', label: 'Riscos laterais' },
                        { key: 'checklist_vidro_camera', label: 'Vidro câmera quebrado' },
                        { key: 'checklist_acompanha_chip', label: 'Acompanha chip' },
                        { key: 'checklist_acompanha_sd', label: 'Acompanha SD' },
                        { key: 'checklist_acompanha_capa', label: 'Acompanha capa' },
                        { key: 'checklist_esta_ligado', label: 'Está ligado' },
                      ].map((item) => {
                        const value = order[item.key as keyof ServiceOrder];
                        const displayValue = value === null ? '—' : value === true ? 'S' : 'N';
                        const bgColor = value === null ? 'bg-muted' : value === true ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30';
                        const textColor = value === null ? 'text-muted-foreground' : value === true ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400';
                        return (
                          <div key={item.key} className={`flex items-center justify-between p-2 rounded-md border ${bgColor}`}>
                            <span className="text-sm">{item.label}</span>
                            <span className={`font-bold ${textColor}`}>{displayValue}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Defeito e Mensagem */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Descrição do Serviço</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Defeito Relatado</p>
                        <p className="text-base bg-muted p-4 rounded-md">{order.reported_defect || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Mensagem para o Cliente</p>
                        <p className="text-base bg-muted p-4 rounded-md">{order.client_message || '-'}</p>
                      </div>
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
                        <p className="text-lg">{order.service_date ? format(new Date(order.service_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}</p>
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
                  <div>
                    <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Fotos e Vídeos</h3>
                    {loadingMedia ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : signedMediaFiles.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {signedMediaFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className={`${file.type === 'video' ? 'aspect-video' : 'aspect-square'} rounded-lg overflow-hidden bg-muted border border-border`}>
                              {file.type === 'image' ? (
                                <img 
                                  src={file.url} 
                                  alt={file.name}
                                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(file.url, '_blank')}
                                  onError={(e) => {
                                    console.error('Erro ao carregar imagem:', file);
                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EErro%3C/text%3E%3C/svg%3E';
                                  }}
                                />
                              ) : (
                                <UniversalVideoPlayer
                                  src={file.url}
                                  name={file.name}
                                  className="w-full aspect-video"
                                />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhum arquivo anexado</p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Drawer para editar OS */}
      <Drawer open={!!editOrderId} onOpenChange={() => setEditOrderId(null)} modal={false}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b pb-4">
            <DrawerTitle className="text-2xl">Editar Ordem de Serviço</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-6 py-6">
            <div className="max-w-4xl mx-auto">
              {editOrderId && (
                <ServiceOrderForm 
                  key={`edit-order-${editOrderId}`}
                  orderId={editOrderId}
                  onSuccess={() => {
                    setEditOrderId(null);
                    fetchOrders();
                  }}
                  onCancel={() => setEditOrderId(null)}
                />
              )}
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
