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
    const printContent = document.getElementById('print-content');
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
          <title>OS ${orderData.os_number}</title>
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
    <div className="fixed inset-0 z-[100] overflow-auto print-container" style={{ backgroundColor: 'white' }}>
      {/* Print Controls - Hidden when printing */}
      <div className="print-controls sticky top-0 border-b p-4 flex justify-between items-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
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
        id="print-content"
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
              </div>
            </div>
            <div style={{ textAlign: 'right', border: '2px solid black', padding: '8px' }}>
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'black' }}>ORDEM DE SERVIÇO</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>Nº {orderData.os_number}</p>
            </div>
          </div>

          {/* Client Info */}
          <div style={{ padding: '16px', borderBottom: '2px solid black' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ color: 'black' }}><strong>Nome do Cliente:</strong> {orderData.client_name}</p>
              <div style={{ display: 'flex', gap: '32px' }}>
                <p style={{ color: 'black' }}><strong>CPF:</strong> {orderData.client_cpf || '_________________'}</p>
                <p style={{ color: 'black' }}><strong>Telefone p/ contato:</strong> {orderData.contact || orderData.other_contacts || '_________________'}</p>
              </div>
              {orderData.client_address && (
                <p style={{ color: 'black' }}><strong>Endereço:</strong> {orderData.client_address}</p>
              )}
              <p style={{ color: 'black' }}><strong>Aparelho:</strong> {orderData.device_model}</p>
            </div>
          </div>

          {/* Checklist */}
          <div style={{ padding: '16px', borderBottom: '2px solid black' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '32px', rowGap: '4px', fontSize: '14px', color: 'black' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Houve queda?</span>
                <span>
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_houve_queda === true ? 'X' : ' '}</span>) SIM 
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_houve_queda === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Carrega</span>
                <span>
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_carrega === true ? 'X' : ' '}</span>) SIM 
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_carrega === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tela quebrada</span>
                <span>
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_tela_quebrada === true ? 'X' : ' '}</span>) SIM 
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_tela_quebrada === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Vidro trincado</span>
                <span>
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_vidro_trincado === true ? 'X' : ' '}</span>) SIM 
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_vidro_trincado === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Manchas na tela</span>
                <span>
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_manchas_tela === true ? 'X' : ' '}</span>) SIM 
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_manchas_tela === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Carcaça torta</span>
                <span>
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_carcaca_torta === true ? 'X' : ' '}</span>) SIM 
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_carcaca_torta === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Riscos na tampa traseira</span>
                <span>
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_riscos_tampa === true ? 'X' : ' '}</span>) SIM 
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_riscos_tampa === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Riscos nas laterais</span>
                <span>
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_riscos_laterais === true ? 'X' : ' '}</span>) SIM 
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_riscos_laterais === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Vidro da câmera trincado/quebrado</span>
                <span>
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_vidro_camera === true ? 'X' : ' '}</span>) SIM 
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_vidro_camera === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Face ID (IPHONE)</span>
                <span>
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_face_id === true ? 'X' : ' '}</span>) On 
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_face_id === false ? 'X' : ' '}</span>) Off
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: 'span 2' }}>
                <span>Acompanha acessórios</span>
                <span>
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_acompanha_chip === true ? 'X' : ' '}</span>) Chip 
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_acompanha_sd === true ? 'X' : ' '}</span>) SD 
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_acompanha_capa === true ? 'X' : ' '}</span>) Capa
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Está ligado</span>
                <span>
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_esta_ligado === true ? 'X' : ' '}</span>) SIM 
                  (<span style={{ color: '#f97316' }}>{orderData.checklist_esta_ligado === false ? 'X' : ' '}</span>) Não
                </span>
              </div>
            </div>
          </div>

          {/* Defect */}
          <div style={{ padding: '16px', borderBottom: '2px solid black' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '8px', color: 'black' }}>DEFEITOS RELATADOS PELO CLIENTE:</p>
            <p style={{ minHeight: '60px', borderBottom: '1px solid #9ca3af', paddingBottom: '8px', color: 'black' }}>
              {orderData.reported_defect}
            </p>
          </div>

          {/* Password and Value */}
          <div style={{ padding: '16px', borderBottom: '2px solid black', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <p style={{ color: 'black' }}><strong>SENHA TEXTO:</strong> {orderData.device_password || '_____________'}</p>
              {/* Pattern Lock visual representation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <p style={{ color: 'black' }}><strong>PADRÃO:</strong></p>
                {orderData.device_pattern ? (
                  <svg width="80" height="80" viewBox="0 0 80 80" style={{ border: '1px solid black', borderRadius: '4px' }}>
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
                  <span style={{ color: '#6b7280' }}>Não definido</span>
                )}
              </div>
            </div>
            <p style={{ color: 'black' }}><strong>Orçamento R$</strong> {orderData.value?.toFixed(2) || '_____________'}</p>
          </div>

          {/* Approval */}
          <div style={{ padding: '16px', borderBottom: '2px solid black' }}>
            <div style={{ display: 'flex', gap: '32px', marginBottom: '16px', color: 'black' }}>
              <p>APROVADO PELO CLIENTE ( )</p>
              <p>NÃO APROVADO ( )</p>
            </div>
            <div style={{ fontSize: '12px', color: 'black' }}>
              <p style={{ marginBottom: '4px' }}>Item I: O aparelho aprovado ou não aprovado o serviço pelo cliente não poderá ser retirado por terceiros sem aviso prévio do proprietário ou sem a 2ª via da ordem do serviço.</p>
              <p style={{ marginBottom: '4px' }}>Item II: A assistência técnica oferece 90 dias de garantia das peças trocadas após a entrega do aparelho, mas não poderá haver violação do lacre de segurança. A garantia não cobre danos causados por ação física (mal uso) quedas ou contato com líquido.</p>
              <p style={{ marginBottom: '4px' }}>Item III: O cliente é total responsável pela procedência do aparelho, estando a assistência técnica isenta de qualquer responsabilidade da origem da mesma.</p>
              <p style={{ marginBottom: '4px' }}>Item IV: A assistência técnica não é responsável pelos arquivos contidos no aparelho (fotos, vídeos, contatos), pois os arquivos podem ser removidos em algum serviço e, o backup deve ser realizado pelo cliente.</p>
              <p style={{ marginBottom: '4px' }}>Item V: Após A confirmação do conserto ou reparo do aparelho, o cliente terá 30 dias para retirada do mesmo, caso contrário, será removido a peça colocada, para sanar as despesas da assistência técnica.</p>
              <p>Item VI: Declaro estar de acordo com os itens acima e concordo com as descrições listadas pelo atendente e condições do aparelho.</p>
            </div>
          </div>

          {/* QR Code and Signatures */}
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
              {printQrCodeEnabled && (
                <div style={{ textAlign: 'center' }}>
                  <QRCodeSVG value={trackingUrl} size={80} />
                  <p style={{ fontSize: '12px', marginTop: '4px', color: 'black' }}>Acompanhe seu serviço</p>
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <QRCodeSVG value="https://www.instagram.com/tecnocenter.oficial/" size={80} />
                <p style={{ fontSize: '12px', marginTop: '4px', color: 'black' }}>Nos siga no Instagram</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '64px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '64px' }} />
                <div style={{ borderTop: '1px solid black', width: '192px', paddingTop: '4px', color: 'black' }}>
                  Cliente
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '64px' }} />
                <div style={{ borderTop: '1px solid black', width: '192px', paddingTop: '4px', color: 'black' }}>
                  Empresa
                </div>
              </div>
            </div>
          </div>

          {/* Date */}
          <div style={{ padding: '8px', textAlign: 'center', borderTop: '2px solid black', fontSize: '14px', color: 'black' }}>
            Data de Entrada: {format(new Date(orderData.entry_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
        </div>
      </div>

      {/* No print styles needed - we use a separate print window */}
    </div>
  );
};
