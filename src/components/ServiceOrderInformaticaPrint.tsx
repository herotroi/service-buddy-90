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
        className="max-w-[210mm] mx-auto bg-white text-black p-8 print:p-4 print:max-w-none"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="border-2 border-black">
          {/* Logo and Company Info */}
          <div className="flex justify-between items-start p-4 border-b-2 border-black">
            <div className="flex items-start gap-4">
              {profile?.logo_url && (
                <img 
                  src={profile.logo_url} 
                  alt="Logo" 
                  className="w-36 h-36 object-contain"
                />
              )}
              <div>
                <h1 className="text-xl font-bold">{profile?.full_name || 'Empresa'}</h1>
                {profile?.phone && <p className="text-sm">Fone: {profile.phone}</p>}
                {getAddress() && <p className="text-sm">{getAddress()}</p>}
                {profile?.cnpj && <p className="text-sm">CNPJ: {profile.cnpj}</p>}
                <p className="text-xs font-bold mt-2">
                  Muito obrigado por escolher a Tecnocenter! Sua confiança é nossa maior motivação. Estaremos sempre a disposição para qualquer dúvida!!
                </p>
              </div>
            </div>
            <div className="text-right border-2 border-black p-2">
              <p className="text-sm font-bold">ORDEM DE SERVIÇO</p>
              <p className="text-xs text-gray-600">INFORMÁTICA</p>
              <p className="text-2xl font-bold text-blue-600">Nº {orderData.os_number}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="p-4 space-y-2 border-b-2 border-black">
            <div className="grid grid-cols-1 gap-1">
              <p><strong>Nome do Cliente:</strong> {orderData.client_name}</p>
              <div className="flex gap-8">
                <p><strong>Telefone p/ contato:</strong> {orderData.contact || '_________________'}</p>
                {orderData.other_contacts && (
                  <p><strong>Outro contato:</strong> {orderData.other_contacts}</p>
                )}
              </div>
              <p><strong>Data de Entrada:</strong> {format(new Date(orderData.entry_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
          </div>

          {/* Equipment Info */}
          <div className="p-4 border-b-2 border-black">
            <div className="grid grid-cols-1 gap-2">
              <p><strong>Equipamento:</strong> {orderData.equipment}</p>
              <p><strong>Acessórios:</strong> {orderData.accessories || 'Nenhum'}</p>
              <p><strong>Senha:</strong> {orderData.senha || '_____________'}</p>
            </div>
          </div>

          {/* Defect */}
          <div className="p-4 border-b-2 border-black">
            <p className="font-bold mb-2">DEFEITO RELATADO:</p>
            <p className="min-h-[60px] border-b border-gray-400 pb-2">
              {orderData.defect}
            </p>
          </div>

          {/* More Details */}
          {orderData.more_details && (
            <div className="p-4 border-b-2 border-black">
              <p className="font-bold mb-2">MAIS DETALHES:</p>
              <p className="min-h-[40px] border-b border-gray-400 pb-2">
                {orderData.more_details}
              </p>
            </div>
          )}

          {/* Observations */}
          {orderData.observations && (
            <div className="p-4 border-b-2 border-black">
              <p className="font-bold mb-2">OBSERVAÇÕES:</p>
              <p className="min-h-[40px] border-b border-gray-400 pb-2">
                {orderData.observations}
              </p>
            </div>
          )}

          {/* Value */}
          <div className="p-4 border-b-2 border-black flex justify-between items-center">
            <p><strong>Orçamento R$</strong> {orderData.value?.toFixed(2) || '_____________'}</p>
          </div>

          {/* Approval */}
          <div className="p-4 border-b-2 border-black">
            <div className="flex gap-8 mb-4">
              <p>APROVADO PELO CLIENTE ( )</p>
              <p>NÃO APROVADO ( )</p>
            </div>
            <div className="text-xs space-y-1">
              <p>Item I: O equipamento aprovado ou não aprovado o serviço pelo cliente não poderá ser retirado por terceiros sem aviso prévio do proprietário ou sem a 2ª via da ordem do serviço.</p>
              <p>Item II: A assistência técnica oferece 90 dias de garantia das peças trocadas após a entrega do equipamento, mas não poderá haver violação do lacre de segurança. A garantia não cobre danos causados por ação física (mal uso) quedas ou contato com líquido.</p>
              <p>Item III: O cliente é total responsável pela procedência do equipamento, estando a assistência técnica isenta de qualquer responsabilidade da origem da mesma.</p>
              <p>Item IV: A assistência técnica não é responsável pelos arquivos contidos no equipamento (fotos, vídeos, documentos), pois os arquivos podem ser removidos em algum serviço e, o backup deve ser realizado pelo cliente.</p>
              <p>Item V: Após a confirmação do conserto ou reparo do equipamento, o cliente terá 30 dias para retirada do mesmo, caso contrário, será removido a peça colocada, para sanar as despesas da assistência técnica.</p>
              <p>Item VI: Declaro estar de acordo com os itens acima e concordo com as descrições listadas pelo atendente e condições do equipamento.</p>
            </div>
          </div>

          {/* QR Code and Signatures */}
          <div className="p-4 flex justify-between items-end">
            <div className="flex gap-6 items-end">
              {printQrCodeEnabled && (
                <div className="text-center">
                  <QRCodeSVG value={trackingUrl} size={80} />
                  <p className="text-xs mt-1">Acompanhe seu serviço</p>
                </div>
              )}
              <div className="text-center">
                <QRCodeSVG value="https://www.instagram.com/tecnocenter.oficial/" size={80} />
                <p className="text-xs mt-1">Nos siga no Instagram</p>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <div className="w-48 border-t border-black pt-1">
                  <p className="text-sm">Cliente</p>
                </div>
              </div>
              <div className="text-center">
                <div className="w-48 border-t border-black pt-1">
                  <p className="text-sm">Responsável</p>
                </div>
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
          #root {
            visibility: visible;
          }
          .fixed {
            position: relative !important;
            overflow: visible !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-4 {
            padding: 1rem !important;
          }
          .print\\:max-w-none {
            max-width: none !important;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
};
