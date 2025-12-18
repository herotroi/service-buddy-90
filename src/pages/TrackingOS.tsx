import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Smartphone, Calendar, CheckCircle2, Clock, ClipboardList, Image, Shield, PackageCheck, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MediaFile {
  name: string;
  path: string;
  type: string;
  url: string;
}

interface TrackingData {
  os_number: number;
  device_model: string;
  entry_date: string;
  reported_defect: string;
  situation_name: string | null;
  situation_color: string | null;
  withdrawal_name: string | null;
  withdrawal_color: string | null;
  exit_date: string | null;
  withdrawn_by: string | null;
  media_files: MediaFile[] | null;
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

const getTextColor = (backgroundColor: string) => {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

const checklistLabels: Record<string, string> = {
  checklist_houve_queda: 'Houve queda',
  checklist_face_id: 'Face ID',
  checklist_carrega: 'Carrega',
  checklist_tela_quebrada: 'Tela quebrada',
  checklist_vidro_trincado: 'Vidro trincado',
  checklist_manchas_tela: 'Manchas na tela',
  checklist_carcaca_torta: 'Carcaça torta',
  checklist_riscos_tampa: 'Riscos na tampa',
  checklist_riscos_laterais: 'Riscos laterais',
  checklist_vidro_camera: 'Vidro da câmera',
  checklist_acompanha_chip: 'Acompanha chip',
  checklist_acompanha_sd: 'Acompanha SD',
  checklist_acompanha_capa: 'Acompanha capa',
  checklist_esta_ligado: 'Está ligado',
};

// Security: Rate limiting storage key
const RATE_LIMIT_KEY = 'tracking_requests';
const MAX_REQUESTS_PER_MINUTE = 10;

// Security: Check if running in iframe (clickjacking protection)
const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

// Security: Simple client-side rate limiting
const checkRateLimit = (): boolean => {
  const now = Date.now();
  const stored = sessionStorage.getItem(RATE_LIMIT_KEY);
  let requests: number[] = stored ? JSON.parse(stored) : [];
  
  // Remove requests older than 1 minute
  requests = requests.filter(time => now - time < 60000);
  
  if (requests.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  requests.push(now);
  sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(requests));
  return true;
};

// Security: Strict UUID validation (UUID v4)
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const TrackingOS = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [securityBlocked, setSecurityBlocked] = useState(false);

  // Security: Prevent right-click and keyboard shortcuts
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    const preventKeyShortcuts = (e: KeyboardEvent) => {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventKeyShortcuts);
    
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventKeyShortcuts);
    };
  }, []);

  // Security: Check for iframe embedding
  useEffect(() => {
    if (isInIframe()) {
      setSecurityBlocked(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      // Security: Check rate limit
      if (!checkRateLimit()) {
        setError('Muitas requisições. Tente novamente em alguns instantes.');
        setLoading(false);
        return;
      }

      if (!token) {
        setError('Token inválido');
        setLoading(false);
        return;
      }

      // Security: Strict UUID validation
      if (!isValidUUID(token)) {
        setError('Token inválido');
        setLoading(false);
        return;
      }

      // Security: Sanitize token
      const sanitizedToken = token.toLowerCase().trim();

      try {
        // Use secure function that only returns non-sensitive data
        const { data: orders, error: fetchError } = await supabase
          .rpc('get_tracking_order', { p_token: sanitizedToken });

        if (fetchError) throw fetchError;
        if (!orders || orders.length === 0) throw new Error('Ordem não encontrada');

        const order = orders[0];

        // Parse media_files safely
        let mediaFiles: MediaFile[] = [];
        if (order.media_files && Array.isArray(order.media_files)) {
          mediaFiles = order.media_files as unknown as MediaFile[];
        }

        setData({
          os_number: order.os_number,
          device_model: order.device_model,
          entry_date: order.entry_date,
          reported_defect: order.reported_defect,
          situation_name: order.situation_name,
          situation_color: order.situation_color,
          withdrawal_name: order.withdrawal_name,
          withdrawal_color: order.withdrawal_color,
          exit_date: order.exit_date,
          withdrawn_by: order.withdrawn_by,
          media_files: mediaFiles,
          checklist_houve_queda: order.checklist_houve_queda,
          checklist_face_id: order.checklist_face_id,
          checklist_carrega: order.checklist_carrega,
          checklist_tela_quebrada: order.checklist_tela_quebrada,
          checklist_vidro_trincado: order.checklist_vidro_trincado,
          checklist_manchas_tela: order.checklist_manchas_tela,
          checklist_carcaca_torta: order.checklist_carcaca_torta,
          checklist_riscos_tampa: order.checklist_riscos_tampa,
          checklist_riscos_laterais: order.checklist_riscos_laterais,
          checklist_vidro_camera: order.checklist_vidro_camera,
          checklist_acompanha_chip: order.checklist_acompanha_chip,
          checklist_acompanha_sd: order.checklist_acompanha_sd,
          checklist_acompanha_capa: order.checklist_acompanha_capa,
          checklist_esta_ligado: order.checklist_esta_ligado,
        });
      } catch (err: any) {
        // Security: Don't expose detailed error messages
        setError('Ordem de serviço não encontrada ou link inválido.');
      } finally {
        setLoading(false);
      }
    };

    if (!securityBlocked) {
      fetchOrder();
    }
  }, [token, securityBlocked]);

  // Get checklist items
  const getChecklistItems = () => {
    if (!data) return [];
    
    const items: { key: string; label: string; value: boolean | null }[] = [];
    
    Object.keys(checklistLabels).forEach((key) => {
      const value = data[key as keyof TrackingData] as boolean | null;
      items.push({
        key,
        label: checklistLabels[key],
        value,
      });
    });
    
    return items;
  };

  // Security: Block if iframe detected
  if (securityBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mb-4 text-destructive">
              <ShieldAlert className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Acesso Bloqueado
            </h2>
            <p className="text-muted-foreground">
              Por motivos de segurança, esta página não pode ser exibida em um iframe.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mb-4 text-destructive">
              <ShieldAlert className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Acesso não autorizado
            </h2>
            <p className="text-muted-foreground">
              {error || 'O link de acompanhamento é inválido ou expirou.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const checklistItems = getChecklistItems();
  const hasChecklist = checklistItems.some(item => item.value !== null);
  const hasMedia = data.media_files && data.media_files.length > 0;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
          <Shield className="w-3 h-3" />
          <span>Página de visualização apenas - Dados protegidos</span>
        </div>

        {/* Header */}
        <div className="text-center py-6">
          <Smartphone className="w-12 h-12 mx-auto text-primary mb-2" />
          <h1 className="text-2xl font-bold text-foreground">
            Acompanhamento de Serviço
          </h1>
          <p className="text-muted-foreground mt-1">
            OS #{data.os_number}
          </p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Status Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.situation_name && data.situation_color ? (
              <Badge
                className="text-lg px-4 py-2 select-none pointer-events-none"
                style={{
                  backgroundColor: data.situation_color,
                  color: getTextColor(data.situation_color),
                }}
              >
                {data.situation_name}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-lg px-4 py-2 select-none pointer-events-none">
                Aguardando
              </Badge>
            )}
            {data.exit_date && (
              <p className="mt-3 text-sm text-muted-foreground">
                Concluído em: {format(new Date(data.exit_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal Card */}
        {(data.exit_date || data.withdrawn_by || data.withdrawal_name) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-primary" />
                Informações de Retirada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.withdrawal_name && data.withdrawal_color && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Situação da Retirada</p>
                  <Badge
                    className="select-none pointer-events-none"
                    style={{
                      backgroundColor: data.withdrawal_color,
                      color: getTextColor(data.withdrawal_color),
                    }}
                  >
                    {data.withdrawal_name}
                  </Badge>
                </div>
              )}
              {data.withdrawn_by && (
                <div>
                  <p className="text-sm text-muted-foreground">Retirado por</p>
                  <p className="font-semibold text-foreground select-none">{data.withdrawn_by}</p>
                </div>
              )}
              {data.exit_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Data de Saída</p>
                  <p className="font-semibold text-foreground select-none">
                    {format(new Date(data.exit_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Smartphone className="w-4 h-4" />
                Aparelho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-foreground select-none">{data.device_model}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Data de Entrada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-foreground select-none">
                {format(new Date(data.entry_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                Defeito Relatado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground text-sm select-none">{data.reported_defect}</p>
            </CardContent>
          </Card>
        </div>

        {/* Checklist Card */}
        {hasChecklist && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Checklist do Aparelho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {checklistItems.map((item) => (
                  <div 
                    key={item.key} 
                    className="flex items-center gap-2 text-sm select-none pointer-events-none"
                  >
                    <span className={`w-5 h-5 rounded border flex items-center justify-center text-xs font-bold ${
                      item.value === true 
                        ? 'bg-green-500/20 border-green-500 text-green-600' 
                        : item.value === false 
                        ? 'bg-red-500/20 border-red-500 text-red-600'
                        : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                    }`}>
                      {item.value === true ? '✓' : item.value === false ? '✗' : '-'}
                    </span>
                    <span className="text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Media Files Card */}
        {hasMedia && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                Fotos e Vídeos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {data.media_files!.map((file, index) => (
                  <div 
                    key={index} 
                    className="relative rounded-lg overflow-hidden border border-border select-none"
                  >
                    {file.type === 'video' ? (
                      <video
                        src={file.url}
                        controls
                        className="w-full aspect-video object-cover"
                        controlsList="nodownload"
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    ) : (
                      <img
                        src={file.url}
                        alt={`Mídia ${index + 1}`}
                        className="w-full aspect-square object-cover"
                        onContextMenu={(e) => e.preventDefault()}
                        draggable={false}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pb-4">
          <p>Esta é uma página pública de acompanhamento.</p>
          <p>Dados sensíveis não são exibidos por segurança.</p>
        </div>
      </div>
    </div>
  );
};

export default TrackingOS;
