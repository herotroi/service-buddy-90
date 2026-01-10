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
    const printContent = document.getElementById('print-content-informatica');
    if (!printContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.left = '-9999px';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      return;
    }

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OS ${orderData?.os_number}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              background: white;
              color: black;
              font-size: 11px;
            }
            @page {
              size: A4;
              margin: 8mm;
            }
            table { font-size: 10px; }
            h1 { font-size: 16px; }
            h2 { font-size: 13px; }
            p, span, td, th { font-size: 10px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    iframeDoc.close();

    let printed = false;
    const doPrint = () => {
      if (printed) return;
      printed = true;
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    };

    iframe.onload = () => setTimeout(doPrint, 100);
    setTimeout(doPrint, 500);
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
        id="print-content-informatica"
        className="max-w-[210mm] mx-auto p-8"
        style={{ fontFamily: 'Arial, sans-serif', backgroundColor: 'white', color: 'black' }}
      >
        {/* Header */}
        <div style={{ border: '2px solid black' }}>
          {/* Logo and Company Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px', borderBottom: '2px solid black' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              {profile?.logo_url && (
                <img 
                  src={profile.logo_url} 
                  alt="Logo" 
                  style={{ width: '144px', height: '144px', objectFit: 'contain' }}
                />
              )}
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'black' }}>{profile?.full_name || 'Empresa'}</h1>
                {profile?.phone && <p style={{ fontSize: '14px', color: 'black' }}>Fone: {profile.phone}</p>}
                {getAddress() && <p style={{ fontSize: '14px', color: 'black' }}>{getAddress()}</p>}
                {profile?.cnpj && <p style={{ fontSize: '14px', color: 'black' }}>CNPJ: {profile.cnpj}</p>}
                <p style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '8px', color: 'black' }}>
                  Muito obrigado por escolher a Tecnocenter! Sua confiança é nossa maior motivação. Estaremos sempre a disposição para qualquer dúvida!!
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right', border: '2px solid black', padding: '8px' }}>
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'black' }}>ORDEM DE SERVIÇO</p>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>INFORMÁTICA</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>Nº {orderData.os_number}</p>
            </div>
          </div>

          {/* Client Info */}
          <div style={{ padding: '16px', borderBottom: '2px solid black' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ color: 'black' }}><strong>Nome do Cliente:</strong> {orderData.client_name}</p>
              <div style={{ display: 'flex', gap: '32px' }}>
                <p style={{ color: 'black' }}><strong>Telefone p/ contato:</strong> {orderData.contact || '_________________'}</p>
                {orderData.other_contacts && (
                  <p style={{ color: 'black' }}><strong>Outro contato:</strong> {orderData.other_contacts}</p>
                )}
              </div>
              <p style={{ color: 'black' }}><strong>Data de Entrada:</strong> {format(new Date(orderData.entry_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
          </div>

          {/* Equipment Info */}
          <div style={{ padding: '16px', borderBottom: '2px solid black' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: 'black' }}><strong>Equipamento:</strong> {orderData.equipment}</p>
              <p style={{ color: 'black' }}><strong>Acessórios:</strong> {orderData.accessories || 'Nenhum'}</p>
              <p style={{ color: 'black' }}><strong>Senha:</strong> {orderData.senha || '_____________'}</p>
            </div>
          </div>

          {/* Defect */}
          <div style={{ padding: '16px', borderBottom: '2px solid black' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '8px', color: 'black' }}>DEFEITO RELATADO:</p>
            <p style={{ minHeight: '60px', borderBottom: '1px solid #9ca3af', paddingBottom: '8px', color: 'black' }}>
              {orderData.defect}
            </p>
          </div>

          {/* More Details */}
          {orderData.more_details && (
            <div style={{ padding: '16px', borderBottom: '2px solid black' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '8px', color: 'black' }}>MAIS DETALHES:</p>
              <p style={{ minHeight: '40px', borderBottom: '1px solid #9ca3af', paddingBottom: '8px', color: 'black' }}>
                {orderData.more_details}
              </p>
            </div>
          )}

          {/* Observations */}
          {orderData.observations && (
            <div style={{ padding: '16px', borderBottom: '2px solid black' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '8px', color: 'black' }}>OBSERVAÇÕES:</p>
              <p style={{ minHeight: '40px', borderBottom: '1px solid #9ca3af', paddingBottom: '8px', color: 'black' }}>
                {orderData.observations}
              </p>
            </div>
          )}

          {/* Value */}
          <div style={{ padding: '16px', borderBottom: '2px solid black', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: 'black' }}><strong>Orçamento R$</strong> {orderData.value?.toFixed(2) || '_____________'}</p>
          </div>

          {/* Approval */}
          <div style={{ padding: '16px', borderBottom: '2px solid black' }}>
            <div style={{ display: 'flex', gap: '32px', marginBottom: '16px' }}>
              <p style={{ color: 'black' }}>APROVADO PELO CLIENTE ( )</p>
              <p style={{ color: 'black' }}>NÃO APROVADO ( )</p>
            </div>
            <div style={{ fontSize: '10px', color: 'black' }}>
              <p style={{ marginBottom: '4px' }}>Item I: O equipamento aprovado ou não aprovado o serviço pelo cliente não poderá ser retirado por terceiros sem aviso prévio do proprietário ou sem a 2ª via da ordem do serviço.</p>
              <p style={{ marginBottom: '4px' }}>Item II: A assistência técnica oferece 90 dias de garantia das peças trocadas após a entrega do equipamento, mas não poderá haver violação do lacre de segurança. A garantia não cobre danos causados por ação física (mal uso) quedas ou contato com líquido.</p>
              <p style={{ marginBottom: '4px' }}>Item III: O cliente é total responsável pela procedência do equipamento, estando a assistência técnica isenta de qualquer responsabilidade da origem da mesma.</p>
              <p style={{ marginBottom: '4px' }}>Item IV: A assistência técnica não é responsável pelos arquivos contidos no equipamento (fotos, vídeos, documentos), pois os arquivos podem ser removidos em algum serviço e, o backup deve ser realizado pelo cliente.</p>
              <p style={{ marginBottom: '4px' }}>Item V: Após a confirmação do conserto ou reparo do equipamento, o cliente terá 30 dias para retirada do mesmo, caso contrário, será removido a peça colocada, para sanar as despesas da assistência técnica.</p>
              <p>Item VI: Declaro estar de acordo com os itens acima e concordo com as descrições listadas pelo atendente e condições do equipamento.</p>
            </div>
          </div>

          {/* QR Code and Signatures */}
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
              {printQrCodeEnabled && (
                <div style={{ textAlign: 'center' }}>
                  <QRCodeSVG value={trackingUrl} size={80} />
                  <p style={{ fontSize: '10px', marginTop: '4px', color: 'black' }}>Acompanhe seu serviço</p>
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <QRCodeSVG value="https://www.instagram.com/tecnocenter.oficial/" size={80} />
                <p style={{ fontSize: '10px', marginTop: '4px', color: 'black' }}>Nos siga no Instagram</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'black' }}>Confirmação de Retirada!</p>
              <div style={{ display: 'flex', gap: '32px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: '64px' }} />
                  <div style={{ width: '192px', borderTop: '1px solid black', paddingTop: '4px' }}>
                    <p style={{ fontSize: '12px', color: 'black' }}>Cliente</p>
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: '64px' }} />
                  <div style={{ width: '192px', borderTop: '1px solid black', paddingTop: '4px' }}>
                    <p style={{ fontSize: '12px', color: 'black' }}>Responsável</p>
                  </div>
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
