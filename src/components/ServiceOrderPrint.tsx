import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';

interface ServiceOrderPrintProps {
  orderId: string;
  onClose: () => void;
}

interface OrderData {
  os_number: number;
  entry_date: string;
  client_name: string;
  client_cpf: string | null;
  client_address: string | null;
  contact: string | null;
  other_contacts: string | null;
  device_model: string;
  device_password: string | null;
  device_pattern: string | null;
  reported_defect: string;
  value: number | null;
  tracking_token: string;
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

export const ServiceOrderPrint = ({ orderId, onClose }: ServiceOrderPrintProps) => {
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
            .from('service_orders')
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
            .eq('key', 'print_qr_code_enabled')
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
    ? `${window.location.origin}/acompanhar/${orderData.tracking_token}`
    : '';

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background z-[100] overflow-auto">
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
              <p className="text-lg font-bold text-red-600">Nº {orderData.os_number}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="p-2 border-b border-black text-xs">
            <p><strong>Cliente:</strong> {orderData.client_name} | <strong>CPF:</strong> {orderData.client_cpf || '___________'} | <strong>Tel:</strong> {orderData.contact || orderData.other_contacts || '___________'}</p>
            {orderData.client_address && <p><strong>Endereço:</strong> {orderData.client_address}</p>}
            <p><strong>Aparelho:</strong> {orderData.device_model}</p>
          </div>

          {/* Checklist - Compact 3 columns */}
          <div className="p-2 border-b border-black">
            <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>Houve queda?</span>
                <span>({orderData.checklist_houve_queda ? 'X' : ' '}) S ({!orderData.checklist_houve_queda && orderData.checklist_houve_queda !== null ? 'X' : ' '}) N</span>
              </div>
              <div className="flex justify-between">
                <span>Carrega</span>
                <span>({orderData.checklist_carrega ? 'X' : ' '}) S ({!orderData.checklist_carrega && orderData.checklist_carrega !== null ? 'X' : ' '}) N</span>
              </div>
              <div className="flex justify-between">
                <span>Tela quebrada</span>
                <span>({orderData.checklist_tela_quebrada ? 'X' : ' '}) S ({!orderData.checklist_tela_quebrada && orderData.checklist_tela_quebrada !== null ? 'X' : ' '}) N</span>
              </div>
              <div className="flex justify-between">
                <span>Vidro trincado</span>
                <span>({orderData.checklist_vidro_trincado ? 'X' : ' '}) S ({!orderData.checklist_vidro_trincado && orderData.checklist_vidro_trincado !== null ? 'X' : ' '}) N</span>
              </div>
              <div className="flex justify-between">
                <span>Manchas tela</span>
                <span>({orderData.checklist_manchas_tela ? 'X' : ' '}) S ({!orderData.checklist_manchas_tela && orderData.checklist_manchas_tela !== null ? 'X' : ' '}) N</span>
              </div>
              <div className="flex justify-between">
                <span>Carcaça torta</span>
                <span>({orderData.checklist_carcaca_torta ? 'X' : ' '}) S ({!orderData.checklist_carcaca_torta && orderData.checklist_carcaca_torta !== null ? 'X' : ' '}) N</span>
              </div>
              <div className="flex justify-between">
                <span>Riscos tampa</span>
                <span>({orderData.checklist_riscos_tampa ? 'X' : ' '}) S ({!orderData.checklist_riscos_tampa && orderData.checklist_riscos_tampa !== null ? 'X' : ' '}) N</span>
              </div>
              <div className="flex justify-between">
                <span>Riscos laterais</span>
                <span>({orderData.checklist_riscos_laterais ? 'X' : ' '}) S ({!orderData.checklist_riscos_laterais && orderData.checklist_riscos_laterais !== null ? 'X' : ' '}) N</span>
              </div>
              <div className="flex justify-between">
                <span>Vidro câmera</span>
                <span>({orderData.checklist_vidro_camera ? 'X' : ' '}) S ({!orderData.checklist_vidro_camera && orderData.checklist_vidro_camera !== null ? 'X' : ' '}) N</span>
              </div>
              <div className="flex justify-between">
                <span>Face ID</span>
                <span>({orderData.checklist_face_id ? 'X' : ' '}) On ({!orderData.checklist_face_id && orderData.checklist_face_id !== null ? 'X' : ' '}) Off</span>
              </div>
              <div className="flex justify-between">
                <span>Está ligado</span>
                <span>({orderData.checklist_esta_ligado ? 'X' : ' '}) S ({!orderData.checklist_esta_ligado && orderData.checklist_esta_ligado !== null ? 'X' : ' '}) N</span>
              </div>
              <div className="flex justify-between">
                <span>Acessórios</span>
                <span>({orderData.checklist_acompanha_chip ? 'X' : ' '}) Chip ({orderData.checklist_acompanha_sd ? 'X' : ' '}) SD ({orderData.checklist_acompanha_capa ? 'X' : ' '}) Capa</span>
              </div>
            </div>
          </div>

          {/* Defect - Compact */}
          <div className="p-2 border-b border-black text-xs">
            <p><strong>DEFEITO:</strong> {orderData.reported_defect}</p>
          </div>

          {/* Password, Pattern and Value - Compact row */}
          <div className="p-2 border-b border-black flex justify-between items-center text-xs">
            <div className="flex items-center gap-4">
              <p><strong>SENHA:</strong> {orderData.device_password || '______'}</p>
              <div className="flex items-center gap-1">
                <p><strong>PADRÃO:</strong></p>
                {orderData.device_pattern ? (
                  <svg width="50" height="50" viewBox="0 0 80 80" className="border border-black rounded">
                    {(() => {
                      const points = orderData.device_pattern.split(',').map(Number);
                      const getPos = (n: number) => ({ x: (n % 3) * 25 + 15, y: Math.floor(n / 3) * 25 + 15 });
                      return points.slice(0, -1).map((point, idx) => {
                        const from = getPos(point);
                        const to = getPos(points[idx + 1]);
                        return (
                          <line key={`line-${idx}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="black" strokeWidth="2" />
                        );
                      });
                    })()}
                    {[0,1,2,3,4,5,6,7,8].map(n => {
                      const x = (n % 3) * 25 + 15;
                      const y = Math.floor(n / 3) * 25 + 15;
                      const isSelected = orderData.device_pattern?.split(',').includes(n.toString());
                      const order = orderData.device_pattern?.split(',').indexOf(n.toString());
                      return (
                        <g key={n}>
                          <circle cx={x} cy={y} r="7" fill={isSelected ? 'black' : 'white'} stroke="black" strokeWidth="1" />
                          {isSelected && order !== undefined && order >= 0 && (
                            <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="7" fontWeight="bold" fill="white">
                              {order + 1}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                ) : <span>-</span>}
              </div>
            </div>
            <p><strong>Orçamento R$</strong> {orderData.value?.toFixed(2) || '_______'}</p>
          </div>

          {/* Approval - Compact */}
          <div className="p-2 border-b border-black">
            <div className="flex gap-6 mb-1 text-xs">
              <p>APROVADO ( )</p>
              <p>NÃO APROVADO ( )</p>
            </div>
            <div className="text-[8px] space-y-0 leading-tight">
              <p><strong>I:</strong> O aparelho não poderá ser retirado por terceiros sem aviso prévio do proprietário ou 2ª via da OS.</p>
              <p><strong>II:</strong> Garantia de 90 dias das peças trocadas. Não cobre danos por mal uso, quedas ou líquidos.</p>
              <p><strong>III:</strong> O cliente é responsável pela procedência do aparelho.</p>
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
              <div className="w-12" />
            )}
            <div className="flex gap-8">
              <div className="text-center">
                <div className="h-8" />
                <div className="border-t border-black w-32 pt-0.5 text-[10px]">Cliente</div>
              </div>
              <div className="text-center">
                <div className="h-8" />
                <div className="border-t border-black w-32 pt-0.5 text-[10px]">Empresa</div>
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="p-1 text-center border-t border-black text-[10px]">
            Entrada: {format(new Date(orderData.entry_date), "dd/MM/yyyy", { locale: ptBR })}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          #root {
            visibility: visible;
          }
          .fixed {
            position: relative;
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
