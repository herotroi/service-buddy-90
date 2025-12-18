import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Smartphone, Calendar, CheckCircle2, Clock, User, ClipboardList, Image, Shield, PackageCheck } from 'lucide-react';
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
  client_name: string;
  device_model: string;
  entry_date: string;
  reported_defect: string;
  situation: {
    name: string;
    color: string;
  } | null;
  withdrawal_situation: {
    name: string;
    color: string;
  } | null;
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

const TrackingOS = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!token) {
        setError('Token inválido');
        setLoading(false);
        return;
      }

      // Validate token format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(token)) {
        setError('Token inválido');
        setLoading(false);
        return;
      }

      try {
        const { data: order, error: fetchError } = await supabase
          .from('service_orders')
          .select(`
            os_number,
            client_name,
            device_model,
            entry_date,
            reported_defect,
            exit_date,
            withdrawn_by,
            media_files,
            checklist_houve_queda,
            checklist_face_id,
            checklist_carrega,
            checklist_tela_quebrada,
            checklist_vidro_trincado,
            checklist_manchas_tela,
            checklist_carcaca_torta,
            checklist_riscos_tampa,
            checklist_riscos_laterais,
            checklist_vidro_camera,
            checklist_acompanha_chip,
            checklist_acompanha_sd,
            checklist_acompanha_capa,
            checklist_esta_ligado,
            situation:situations(name, color),
            withdrawal_situation:withdrawal_situations(name, color)
          `)
          .eq('tracking_token', token)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!order) throw new Error('Ordem de serviço não encontrada');

        // Parse media_files safely
        let mediaFiles: MediaFile[] = [];
        if (order.media_files && Array.isArray(order.media_files)) {
          mediaFiles = order.media_files as unknown as MediaFile[];
        }

        setData({
          ...order,
          media_files: mediaFiles,
        } as TrackingData);
      } catch (err: any) {
        console.error('Erro ao buscar OS:', err);
        setError('Ordem de serviço não encontrada ou link inválido.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [token]);

  // Get checklist items that have been evaluated (not null)
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
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
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
            {data.situation ? (
              <Badge
                className="text-lg px-4 py-2 select-none pointer-events-none"
                style={{
                  backgroundColor: data.situation.color,
                  color: getTextColor(data.situation.color),
                }}
              >
                {data.situation.name}
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

        {/* Withdrawal Card - Only show if there's withdrawal data */}
        {(data.exit_date || data.withdrawn_by || data.withdrawal_situation) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-primary" />
                Informações de Retirada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.withdrawal_situation && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Situação da Retirada</p>
                  <Badge
                    className="select-none pointer-events-none"
                    style={{
                      backgroundColor: data.withdrawal_situation.color,
                      color: getTextColor(data.withdrawal_situation.color),
                    }}
                  >
                    {data.withdrawal_situation.name}
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
                <User className="w-4 h-4" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-foreground select-none">{data.client_name}</p>
            </CardContent>
          </Card>

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

          <Card>
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
                        controlsList="nodownload"
                        disablePictureInPicture
                        className="w-full h-32 object-cover pointer-events-auto"
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    ) : (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-32 object-cover pointer-events-none"
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate pointer-events-none">
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>Este é um link exclusivo para acompanhamento.</p>
          <p>Não compartilhe com terceiros.</p>
        </div>
      </div>
    </div>
  );
};

export default TrackingOS;
