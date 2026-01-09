import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';

interface ServiceOrderInformaticaPrintProps {
  orderId: string;
  onClose: () => void;
}

interface OrderData {
  os_number: number;
  entry_date: string;
  client_name: string;
  contact: string | null;
  other_contacts: string | null;
  equipment: string;
  accessories: string | null;
  defect: string;
  more_details: string | null;
  senha: string | null;
  value: number | null;
  observations: string | null;
  id: string;
}

interface Profile {
  full_name: string | null;
  phone: string | null;
  cnpj: string | null;
  logo_url: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

export const ServiceOrderInformaticaPrint = ({ orderId, onClose }: ServiceOrderInformaticaPrintProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [printQrCodeEnabled, setPrintQrCodeEnabled] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orderResponse, profileResponse, settingsResponse] = await Promise.all([
          supabase
            .from('service_orders_informatica')
            .select('*')
            .eq('id', orderId)
            .single(),
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user?.id)
            .single(),
          supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'print_qr_code_informatica_enabled')
            .eq('user_id', user?.id)
            .maybeSingle()
        ]);

        if (orderResponse.error) throw orderResponse.error;
        if (profileResponse.error) throw profileResponse.error;

        setOrderData(orderResponse.data as OrderData);
        setProfile(profileResponse.data);
        
        if (settingsResponse.data) {
          setPrintQrCodeEnabled(settingsResponse.data.value === 'true');
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [orderId, user?.id]);

  const handlePrint = () => {
    window.print();
  };

  const getAddress = () => {
    if (!profile) return '';
    const parts = [
      profile.street,
      profile.number,
      profile.complement,
      profile.neighborhood,
      profile.city,
      profile.state,
      profile.zip_code ? `CEP ${profile.zip_code}` : null
    ].filter(Boolean);
    return parts.join(', ');
  };

  const trackingUrl = orderData 
    ? `${window.location.origin}/acompanhar-informatica/${orderData.id}`
    : '';

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden sticky top-0 bg-background border-b p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Visualização de Impressão</h2>
        <div className="flex gap-2">
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </div>
      </div>

      {/* Print Content */}
      <div 
        ref={printRef} 
        className="max-w-[210mm] mx-auto bg-white text-black p-4 print:p-2 print:max-w-none"
        style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px' }}
      >
        {/* Header */}
        <div className="border border-black">
          {/* Logo and Company Info */}
          <div className="flex justify-between items-start p-2 border-b border-black">
            <div className="flex items-start gap-2">
              {profile?.logo_url && (
                <img 
                  src={profile.logo_url} 
                  alt="Logo" 
                  className="w-16 h-16 object-contain"
                />
              )}
              <div className="text-xs">
                <h1 className="text-sm font-bold">{profile?.full_name || 'Empresa'}</h1>
                {profile?.phone && <p>Fone: {profile.phone}</p>}
                {getAddress() && <p className="max-w-[280px]">{getAddress()}</p>}
                {profile?.cnpj && <p>CNPJ: {profile.cnpj}</p>}
              </div>
            </div>
            <div className="text-right border border-black p-1">
              <p className="text-xs font-bold">ORDEM DE SERVIÇO</p>
              <p className="text-[9px] text-gray-600">INFORMÁTICA</p>
              <p className="text-lg font-bold text-blue-600">Nº {orderData.os_number}</p>
            </div>
          </div>

          {/* Client Info - Compact */}
          <div className="p-2 border-b border-black text-xs">
            <p><strong>Cliente:</strong> {orderData.client_name} | <strong>Tel:</strong> {orderData.contact || '___________'} {orderData.other_contacts && `| ${orderData.other_contacts}`}</p>
            <p><strong>Entrada:</strong> {format(new Date(orderData.entry_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </div>

          {/* Equipment Info - Compact */}
          <div className="p-2 border-b border-black text-xs">
            <p><strong>Equipamento:</strong> {orderData.equipment} | <strong>Acessórios:</strong> {orderData.accessories || 'Nenhum'} | <strong>Senha:</strong> {orderData.senha || '______'}</p>
          </div>

          {/* Defect - Compact */}
          <div className="p-2 border-b border-black text-xs">
            <p><strong>DEFEITO:</strong> {orderData.defect}</p>
          </div>

          {/* More Details - Compact */}
          {orderData.more_details && (
            <div className="p-2 border-b border-black text-xs">
              <p><strong>DETALHES:</strong> {orderData.more_details}</p>
            </div>
          )}

          {/* Observations - Compact */}
          {orderData.observations && (
            <div className="p-2 border-b border-black text-xs">
              <p><strong>OBS:</strong> {orderData.observations}</p>
            </div>
          )}

          {/* Value - Compact */}
          <div className="p-2 border-b border-black text-xs">
            <p><strong>Orçamento R$</strong> {orderData.value?.toFixed(2) || '_____________'}</p>
          </div>

          {/* Approval - Compact */}
          <div className="p-2 border-b border-black">
            <div className="flex gap-6 mb-1 text-xs">
              <p>APROVADO ( )</p>
              <p>NÃO APROVADO ( )</p>
            </div>
            <div className="text-[8px] space-y-0 leading-tight">
              <p><strong>I:</strong> O equipamento não poderá ser retirado por terceiros sem aviso prévio do proprietário ou 2ª via da OS.</p>
              <p><strong>II:</strong> Garantia de 90 dias das peças trocadas. Não cobre danos por mal uso, quedas ou líquidos.</p>
              <p><strong>III:</strong> O cliente é responsável pela procedência do equipamento.</p>
              <p><strong>IV:</strong> Não somos responsáveis por arquivos. Backup é responsabilidade do cliente.</p>
              <p><strong>V:</strong> Prazo de 30 dias para retirada após confirmação do conserto.</p>
              <p><strong>VI:</strong> Declaro estar de acordo com os itens acima.</p>
            </div>
          </div>

          {/* QR Code and Signatures - Compact */}
          <div className="p-2 flex justify-between items-end">
            {printQrCodeEnabled ? (
              <div className="text-center">
                <QRCodeSVG value={trackingUrl} size={50} />
                <p className="text-[8px]">Acompanhe</p>
              </div>
            ) : (
              <div />
            )}
            <div className="flex gap-8">
              <div className="text-center">
                <div className="h-8" />
                <div className="border-t border-black w-32 pt-0.5 text-[10px]">Cliente</div>
              </div>
              <div className="text-center">
                <div className="h-8" />
                <div className="border-t border-black w-32 pt-0.5 text-[10px]">Responsável</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          #root,
          #root * {
            visibility: visible;
          }
          .fixed {
            position: relative !important;
            overflow: visible !important;
          }
          @page {
            size: A4;
            margin: 5mm;
          }
        }
      `}</style>
    </div>
  );
};
