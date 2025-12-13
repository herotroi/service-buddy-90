import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Smartphone, Calendar, CheckCircle2, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  exit_date: string | null;
}

const getTextColor = (backgroundColor: string) => {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
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
            situation:situations(name, color)
          `)
          .eq('tracking_token', token)
          .single();

        if (fetchError) throw fetchError;
        if (!order) throw new Error('Ordem de serviço não encontrada');

        setData(order as TrackingData);
      } catch (err: any) {
        console.error('Erro ao buscar OS:', err);
        setError('Ordem de serviço não encontrada ou link inválido.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [token]);

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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
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
                className="text-lg px-4 py-2"
                style={{
                  backgroundColor: data.situation.color,
                  color: getTextColor(data.situation.color),
                }}
              >
                {data.situation.name}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-lg px-4 py-2">
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
              <p className="font-semibold text-foreground">{data.client_name}</p>
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
              <p className="font-semibold text-foreground">{data.device_model}</p>
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
              <p className="font-semibold text-foreground">
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
              <p className="text-foreground text-sm">{data.reported_defect}</p>
            </CardContent>
          </Card>
        </div>

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
