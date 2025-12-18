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
              </div>
            </div>
            <div className="text-right border-2 border-black p-2">
              <p className="text-sm font-bold">ORDEM DE SERVIÇO</p>
              <p className="text-2xl font-bold text-red-600">Nº {orderData.os_number}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="p-4 space-y-2 border-b-2 border-black">
            <div className="grid grid-cols-1 gap-1">
              <p><strong>Nome do Cliente:</strong> {orderData.client_name}</p>
              <div className="flex gap-8">
                <p><strong>CPF:</strong> {orderData.client_cpf || '_________________'}</p>
                <p><strong>Telefone p/ contato:</strong> {orderData.contact || orderData.other_contacts || '_________________'}</p>
              </div>
              {orderData.client_address && (
                <p><strong>Endereço:</strong> {orderData.client_address}</p>
              )}
              <p><strong>Aparelho:</strong> {orderData.device_model}</p>
            </div>
          </div>

          {/* Checklist */}
          <div className="p-4 border-b-2 border-black">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
              <div className="flex justify-between">
                <span>Houve queda?</span>
                <span>
                  (<span className="text-orange-500">{orderData.checklist_houve_queda === true ? 'X' : ' '}</span>) SIM 
                  (<span className="text-orange-500">{orderData.checklist_houve_queda === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
              <div className="flex justify-between">
                <span>Carrega</span>
                <span>
                  (<span className="text-orange-500">{orderData.checklist_carrega === true ? 'X' : ' '}</span>) SIM 
                  (<span className="text-orange-500">{orderData.checklist_carrega === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tela quebrada</span>
                <span>
                  (<span className="text-orange-500">{orderData.checklist_tela_quebrada === true ? 'X' : ' '}</span>) SIM 
                  (<span className="text-orange-500">{orderData.checklist_tela_quebrada === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
              <div className="flex justify-between">
                <span>Vidro trincado</span>
                <span>
                  (<span className="text-orange-500">{orderData.checklist_vidro_trincado === true ? 'X' : ' '}</span>) SIM 
                  (<span className="text-orange-500">{orderData.checklist_vidro_trincado === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
              <div className="flex justify-between">
                <span>Manchas na tela</span>
                <span>
                  (<span className="text-orange-500">{orderData.checklist_manchas_tela === true ? 'X' : ' '}</span>) SIM 
                  (<span className="text-orange-500">{orderData.checklist_manchas_tela === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
              <div className="flex justify-between">
                <span>Carcaça torta</span>
                <span>
                  (<span className="text-orange-500">{orderData.checklist_carcaca_torta === true ? 'X' : ' '}</span>) SIM 
                  (<span className="text-orange-500">{orderData.checklist_carcaca_torta === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
              <div className="flex justify-between">
                <span>Riscos na tampa traseira</span>
                <span>
                  (<span className="text-orange-500">{orderData.checklist_riscos_tampa === true ? 'X' : ' '}</span>) SIM 
                  (<span className="text-orange-500">{orderData.checklist_riscos_tampa === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
              <div className="flex justify-between">
                <span>Riscos nas laterais</span>
                <span>
                  (<span className="text-orange-500">{orderData.checklist_riscos_laterais === true ? 'X' : ' '}</span>) SIM 
                  (<span className="text-orange-500">{orderData.checklist_riscos_laterais === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
              <div className="flex justify-between">
                <span>Vidro da câmera trincado/quebrado</span>
                <span>
                  (<span className="text-orange-500">{orderData.checklist_vidro_camera === true ? 'X' : ' '}</span>) SIM 
                  (<span className="text-orange-500">{orderData.checklist_vidro_camera === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
              <div className="flex justify-between">
                <span>Face ID (IPHONE)</span>
                <span>
                  (<span className="text-orange-500">{orderData.checklist_face_id === true ? 'X' : ' '}</span>) On 
                  (<span className="text-orange-500">{orderData.checklist_face_id === false ? 'X' : ' '}</span>) Off
                </span>
              </div>
              <div className="flex justify-between col-span-2">
                <span>Acompanha acessórios</span>
                <span>
                  (<span className="text-orange-500">{orderData.checklist_acompanha_chip === true ? 'X' : ' '}</span>) Chip 
                  (<span className="text-orange-500">{orderData.checklist_acompanha_sd === true ? 'X' : ' '}</span>) SD 
                  (<span className="text-orange-500">{orderData.checklist_acompanha_capa === true ? 'X' : ' '}</span>) Capa
                </span>
              </div>
              <div className="flex justify-between">
                <span>Está ligado</span>
                <span>
                  (<span className="text-orange-500">{orderData.checklist_esta_ligado === true ? 'X' : ' '}</span>) SIM 
                  (<span className="text-orange-500">{orderData.checklist_esta_ligado === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
            </div>
          </div>

          {/* Defect */}
          <div className="p-4 border-b-2 border-black">
            <p className="font-bold mb-2">DEFEITOS RELATADOS PELO CLIENTE:</p>
            <p className="min-h-[60px] border-b border-gray-400 pb-2">
              {orderData.reported_defect}
            </p>
          </div>

          {/* Password and Value */}
          <div className="p-4 border-b-2 border-black flex justify-between items-center">
            <div className="flex items-center gap-8">
              <p><strong>SENHA TEXTO:</strong> {orderData.device_password || '_____________'}</p>
              {/* Pattern Lock visual representation */}
              <div className="flex items-center gap-3">
                <p><strong>PADRÃO:</strong></p>
                {orderData.device_pattern ? (
                  <svg width="80" height="80" viewBox="0 0 80 80" className="border border-black rounded">
                    {/* Grid lines for reference */}
                    {[20, 40, 60].map(pos => (
                      <g key={pos}>
                        <line x1={pos} y1="5" x2={pos} y2="75" stroke="#ddd" strokeWidth="0.5" />
                        <line x1="5" y1={pos} x2="75" y2={pos} stroke="#ddd" strokeWidth="0.5" />
                      </g>
                    ))}
                    {/* Connection lines */}
                    {(() => {
                      const points = orderData.device_pattern.split(',').map(Number);
                      const getPos = (n: number) => ({ x: (n % 3) * 25 + 15, y: Math.floor(n / 3) * 25 + 15 });
                      return points.slice(0, -1).map((point, idx) => {
                        const from = getPos(point);
                        const to = getPos(points[idx + 1]);
                        return (
                          <line
                            key={`line-${idx}`}
                            x1={from.x}
                            y1={from.y}
                            x2={to.x}
                            y2={to.y}
                            stroke="black"
                            strokeWidth="2"
                          />
                        );
                      });
                    })()}
                    {/* Dots with numbers */}
                    {[0,1,2,3,4,5,6,7,8].map(n => {
                      const x = (n % 3) * 25 + 15;
                      const y = Math.floor(n / 3) * 25 + 15;
                      const isSelected = orderData.device_pattern?.split(',').includes(n.toString());
                      const order = orderData.device_pattern?.split(',').indexOf(n.toString());
                      return (
                        <g key={n}>
                          <circle
                            cx={x}
                            cy={y}
                            r="8"
                            fill={isSelected ? 'black' : 'white'}
                            stroke="black"
                            strokeWidth="1.5"
                          />
                          <text
                            x={x}
                            y={y + 1}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="8"
                            fontWeight="bold"
                            fill={isSelected ? 'white' : 'black'}
                          >
                            {isSelected && order !== undefined && order >= 0 ? order + 1 : ''}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                ) : (
                  <span className="text-gray-500">Não definido</span>
                )}
              </div>
            </div>
            <p><strong>Orçamento R$</strong> {orderData.value?.toFixed(2) || '_____________'}</p>
          </div>

          {/* Approval */}
          <div className="p-4 border-b-2 border-black">
            <div className="flex gap-8 mb-4">
              <p>APROVADO PELO CLIENTE ( )</p>
              <p>NÃO APROVADO ( )</p>
            </div>
            <div className="text-xs space-y-1">
              <p>Item I: O aparelho aprovado ou não aprovado o serviço pelo cliente não poderá ser retirado por terceiros sem aviso prévio do proprietário ou sem a 2ª via da ordem do serviço.</p>
              <p>Item II: A assistência técnica oferece 90 dias de garantia das peças trocadas após a entrega do aparelho, mas não poderá haver violação do lacre de segurança. A garantia não cobre danos causados por ação física (mal uso) quedas ou contato com líquido.</p>
              <p>Item III: O cliente é total responsável pela procedência do aparelho, estando a assistência técnica isenta de qualquer responsabilidade da origem da mesma.</p>
              <p>Item IV: A assistência técnica não é responsável pelos arquivos contidos no aparelho (fotos, vídeos, contatos), pois os arquivos podem ser removidos em algum serviço e, o backup deve ser realizado pelo cliente.</p>
              <p>Item V: Após A confirmação do conserto ou reparo do aparelho, o cliente terá 30 dias para retirada do mesmo, caso contrário, será removido a peça colocada, para sanar as despesas da assistência técnica.</p>
              <p>Item VI: Declaro estar de acordo com os itens acima e concordo com as descrições listadas pelo atendente e condições do aparelho.</p>
            </div>
          </div>

          {/* QR Code and Signatures */}
          <div className="p-4 flex justify-between items-end">
            {printQrCodeEnabled ? (
              <div className="text-center">
                <QRCodeSVG value={trackingUrl} size={80} />
                <p className="text-xs mt-1">Acompanhe seu serviço</p>
              </div>
            ) : (
              <div className="w-20" />
            )}
            <div className="flex gap-16">
              <div className="text-center">
                <div className="h-16" />
                <div className="border-t border-black w-48 pt-1">
                  Cliente
                </div>
              </div>
              <div className="text-center">
                <div className="h-16" />
                <div className="border-t border-black w-48 pt-1">
                  Empresa
                </div>
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="p-2 text-center border-t-2 border-black text-sm">
            Data de Entrada: {format(new Date(orderData.entry_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
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
