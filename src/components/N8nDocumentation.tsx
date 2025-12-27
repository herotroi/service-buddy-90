import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Copy, Check, FileText, Code, Database, Users, Package, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import jsPDF from 'jspdf';

const N8nDocumentation = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
    toast({
      title: 'Copiado!',
      description: 'Código copiado para a área de transferência',
    });
  };

  const generatePdfDoc = () => {
    setIsGeneratingPdf(true);
    const userId = user?.id || 'SEU_USER_ID';
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const maxWidth = pageWidth - margin * 2;
      let y = 20;

      const addTitle = (text: string, size: number = 16) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(size);
        doc.setFont('helvetica', 'bold');
        doc.text(text, margin, y);
        y += size * 0.5 + 3;
      };

      const addText = (text: string, size: number = 10) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, margin, y);
          y += size * 0.4 + 1;
        });
      };

      const addCode = (code: string) => {
        doc.setFontSize(8);
        doc.setFont('courier', 'normal');
        const lines = code.split('\n');
        lines.forEach((line: string) => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line.substring(0, 90), margin + 2, y);
          y += 4;
        });
        y += 2;
      };

      const addSpace = (space: number = 5) => {
        y += space;
      };

      // Title
      addTitle('Documentação da API n8n - Ordens de Serviço', 18);
      addSpace(10);

      // General Info
      addTitle('Informações Gerais', 14);
      addText('URL da Edge Function:');
      addCode('https://rpssrnpgogwqwijksygq.supabase.co/functions/v1/n8n-service-orders');
      addSpace(3);
      addText('Método: POST');
      addSpace(3);
      addText('Headers Obrigatórios:');
      addCode(`{
  "Content-Type": "application/json",
  "x-api-key": "SUA_N8N_API_KEY"
}`);
      addSpace(3);
      addText(`Seu User ID: ${userId}`);
      addSpace(10);

      // Tables
      addTitle('Tabelas Disponíveis', 14);
      addText('• service_orders - Ordens de serviço do setor Celulares');
      addText('• service_orders_informatica - Ordens de serviço do setor Informática');
      addSpace(10);

      // Actions
      addTitle('Ações Disponíveis', 14);
      addText('• list - Listar ordens de serviço com filtros');
      addText('• get - Obter uma ordem específica por ID');
      addText('• create - Criar nova ordem de serviço');
      addText('• update - Atualizar ordem existente');
      addText('• delete - Excluir ordem (soft delete)');
      addText('• get_situations - Listar situações disponíveis');
      addText('• get_withdrawal_situations - Listar situações de retirada');
      addText('• get_employees - Listar funcionários');
      addText('• get_equipment_locations - Listar locais de equipamento (Informática)');
      addSpace(10);

      // List Action
      doc.addPage();
      y = 20;
      addTitle('1. LISTAR ORDENS DE SERVIÇO', 14);
      addText('Requisição Básica:');
      addCode(`{
  "action": "list",
  "table": "service_orders",
  "filters": {
    "user_id": "${userId}"
  }
}`);
      addSpace(5);
      addText('Com Filtros Avançados:');
      addCode(`{
  "action": "list",
  "table": "service_orders",
  "filters": {
    "user_id": "${userId}",
    "situation_id": "uuid-da-situacao",
    "date_from": "2024-01-01T00:00:00Z",
    "date_to": "2024-12-31T23:59:59Z",
    "client_name": "João",
    "os_number": 123,
    "limit": 50
  }
}`);
      addSpace(5);
      addText('Filtros Disponíveis:');
      addText('• user_id (obrigatório) - ID do usuário');
      addText('• situation_id - Filtrar por situação');
      addText('• withdrawal_situation_id - Situação de retirada');
      addText('• date_from - Data inicial (ISO 8601)');
      addText('• date_to - Data final (ISO 8601)');
      addText('• client_name - Busca parcial por nome');
      addText('• os_number - Número exato da OS');
      addText('• limit - Limite de resultados');
      addSpace(10);

      // Get Action
      addTitle('2. OBTER ORDEM ESPECÍFICA', 14);
      addCode(`{
  "action": "get",
  "table": "service_orders",
  "id": "uuid-da-ordem"
}`);
      addSpace(10);

      // Create Action - Celulares
      doc.addPage();
      y = 20;
      addTitle('3. CRIAR ORDEM DE SERVIÇO', 14);
      addText('Celulares (service_orders) - Campos obrigatórios: user_id, client_name, device_model, reported_defect');
      addSpace(3);
      addCode(`{
  "action": "create",
  "table": "service_orders",
  "data": {
    "user_id": "${userId}",
    "client_name": "Maria Santos",
    "contact": "(11) 98765-4321",
    "device_model": "Samsung Galaxy S24",
    "device_password": "1234",
    "reported_defect": "Não carrega e tela com manchas",
    "situation_id": "uuid-da-situacao",
    "received_by_id": "uuid-do-funcionario",
    "value": 250.00
  }
}`);
      addSpace(5);

      // Create Action - Informatica
      addText('Informática (service_orders_informatica) - Campos obrigatórios: user_id, client_name, equipment, defect');
      addSpace(3);
      addCode(`{
  "action": "create",
  "table": "service_orders_informatica",
  "data": {
    "user_id": "${userId}",
    "client_name": "Empresa XYZ",
    "contact": "(11) 3333-4444",
    "equipment": "Notebook Dell Inspiron 15",
    "defect": "Não liga",
    "accessories": "Carregador original",
    "situation_id": "uuid-da-situacao",
    "value": 450.00
  }
}`);
      addSpace(10);

      // Update Action
      doc.addPage();
      y = 20;
      addTitle('4. ATUALIZAR ORDEM DE SERVIÇO', 14);
      addCode(`{
  "action": "update",
  "table": "service_orders",
  "id": "uuid-da-ordem",
  "data": {
    "situation_id": "novo-uuid-situacao",
    "value": 400.00,
    "technician_id": "uuid-do-tecnico"
  }
}`);
      addSpace(10);

      // Delete Action
      addTitle('5. EXCLUIR ORDEM DE SERVIÇO', 14);
      addCode(`{
  "action": "delete",
  "table": "service_orders",
  "id": "uuid-da-ordem"
}`);
      addText('Nota: A exclusão é do tipo "soft delete" - o registro é apenas marcado como deleted: true.');
      addSpace(10);

      // Auxiliary Actions
      addTitle('6. AÇÕES AUXILIARES', 14);
      addSpace(3);
      addText('Listar Situações:');
      addCode(`{
  "action": "get_situations",
  "table": "service_orders",
  "filters": { "user_id": "${userId}" }
}`);
      addSpace(3);
      addText('Listar Situações de Retirada:');
      addCode(`{
  "action": "get_withdrawal_situations",
  "table": "service_orders",
  "filters": { "user_id": "${userId}" }
}`);
      addSpace(3);
      addText('Listar Funcionários:');
      addCode(`{
  "action": "get_employees",
  "filters": { "user_id": "${userId}" }
}`);
      addSpace(3);
      addText('Listar Locais de Equipamento (Informática):');
      addCode(`{
  "action": "get_equipment_locations",
  "filters": { "user_id": "${userId}" }
}`);
      addSpace(10);

      // Error Codes
      doc.addPage();
      y = 20;
      addTitle('CÓDIGOS DE ERRO', 14);
      addText('• 400 - Requisição inválida (campos faltando, ação inválida)');
      addText('• 401 - Não autorizado (x-api-key inválido ou ausente)');
      addText('• 404 - Recurso não encontrado');
      addText('• 405 - Método não permitido (use POST)');
      addText('• 500 - Erro interno do servidor');
      addSpace(10);

      // N8N Configuration
      addTitle('CONFIGURAÇÃO NO N8N', 14);
      addText('1. Adicione um nó HTTP Request');
      addText('2. Configure o método como POST');
      addText('3. Adicione a URL da Edge Function');
      addText('4. Em Headers, adicione Content-Type: application/json e x-api-key: SUA_CHAVE');
      addText('5. Em Body, selecione JSON e adicione o payload desejado');
      addText('6. Para usar dados dinâmicos, use expressões como {{ $json.campo }}');

      // Save PDF
      doc.save('documentacao-api-n8n.pdf');
      
      toast({
        title: 'PDF Gerado!',
        description: 'O documento foi baixado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Ocorreu um erro ao gerar o documento',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const generateMarkdownDoc = () => {
    const userId = user?.id || 'SEU_USER_ID';
    return `# Documentação da API n8n - Ordens de Serviço

## Informações Gerais

**URL da Edge Function:**
\`\`\`
https://rpssrnpgogwqwijksygq.supabase.co/functions/v1/n8n-service-orders
\`\`\`

**Método:** POST

**Headers Obrigatórios:**
\`\`\`json
{
  "Content-Type": "application/json",
  "x-api-key": "SUA_N8N_API_KEY"
}
\`\`\`

**Seu User ID:** ${userId}

---

## Tabelas Disponíveis

| Tabela | Descrição |
|--------|-----------|
| \`service_orders\` | Ordens de serviço do setor Celulares |
| \`service_orders_informatica\` | Ordens de serviço do setor Informática |

---

## Ações Disponíveis

| Ação | Descrição |
|------|-----------|
| \`list\` | Listar ordens de serviço com filtros |
| \`get\` | Obter uma ordem específica por ID |
| \`create\` | Criar nova ordem de serviço |
| \`update\` | Atualizar ordem existente |
| \`delete\` | Excluir ordem (soft delete) |
| \`get_situations\` | Listar situações disponíveis |
| \`get_withdrawal_situations\` | Listar situações de retirada |
| \`get_employees\` | Listar funcionários |
| \`get_equipment_locations\` | Listar locais de equipamento (Informática) |

---

## 1. LISTAR ORDENS DE SERVIÇO

### Requisição Básica
\`\`\`json
{
  "action": "list",
  "table": "service_orders",
  "filters": {
    "user_id": "${userId}"
  }
}
\`\`\`

### Com Filtros Avançados
\`\`\`json
{
  "action": "list",
  "table": "service_orders",
  "filters": {
    "user_id": "${userId}",
    "situation_id": "uuid-da-situacao",
    "withdrawal_situation_id": "uuid-da-retirada",
    "date_from": "2024-01-01T00:00:00Z",
    "date_to": "2024-12-31T23:59:59Z",
    "client_name": "João",
    "os_number": 123,
    "limit": 50
  }
}
\`\`\`

### Filtros Disponíveis

| Filtro | Tipo | Descrição |
|--------|------|-----------|
| \`user_id\` | string (UUID) | **Obrigatório** - ID do usuário |
| \`situation_id\` | string (UUID) | Filtrar por situação |
| \`withdrawal_situation_id\` | string (UUID) | Filtrar por situação de retirada |
| \`date_from\` | string (ISO 8601) | Data inicial |
| \`date_to\` | string (ISO 8601) | Data final |
| \`client_name\` | string | Busca parcial por nome do cliente |
| \`os_number\` | number | Número exato da OS |
| \`limit\` | number | Limite de resultados (padrão: 1000) |

### Resposta de Sucesso
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "os_number": 123,
      "client_name": "João Silva",
      "device_model": "iPhone 15",
      "reported_defect": "Tela quebrada",
      "entry_date": "2024-01-15T10:30:00Z",
      "situation": {
        "id": "uuid",
        "name": "Em Bancada",
        "color": "#F97316"
      },
      "withdrawal_situation": {
        "id": "uuid",
        "name": "Aguardando Retirada",
        "color": "#EAB308"
      },
      "received_by": {
        "id": "uuid",
        "name": "Maria"
      },
      "technician": {
        "id": "uuid",
        "name": "Carlos"
      }
    }
  ],
  "count": 1
}
\`\`\`

---

## 2. OBTER ORDEM ESPECÍFICA

### Requisição
\`\`\`json
{
  "action": "get",
  "table": "service_orders",
  "id": "uuid-da-ordem"
}
\`\`\`

### Resposta
\`\`\`json
{
  "success": true,
  "data": {
    "id": "uuid",
    "os_number": 123,
    "client_name": "João Silva",
    "contact": "(11) 99999-9999",
    "device_model": "iPhone 15",
    "device_password": "1234",
    "reported_defect": "Tela quebrada",
    "entry_date": "2024-01-15T10:30:00Z",
    "value": 350.00,
    "situation": { "id": "uuid", "name": "Finalizado", "color": "#22C55E" },
    "withdrawal_situation": { "id": "uuid", "name": "Aguardando Retirada", "color": "#EAB308" }
  }
}
\`\`\`

---

## 3. CRIAR ORDEM DE SERVIÇO

### Celulares (service_orders)

**Campos Obrigatórios:**
- \`user_id\` - ID do usuário
- \`client_name\` - Nome do cliente
- \`device_model\` - Modelo do dispositivo
- \`reported_defect\` - Defeito relatado

\`\`\`json
{
  "action": "create",
  "table": "service_orders",
  "data": {
    "user_id": "${userId}",
    "client_name": "Maria Santos",
    "contact": "(11) 98765-4321",
    "other_contacts": "(11) 91234-5678",
    "client_cpf": "123.456.789-00",
    "client_address": "Rua das Flores, 123",
    "device_model": "Samsung Galaxy S24",
    "device_password": "1234",
    "device_pattern": "1,2,3,6,9",
    "reported_defect": "Não carrega e tela com manchas",
    "client_message": "Mensagem personalizada para o cliente",
    "situation_id": "uuid-da-situacao",
    "received_by_id": "uuid-do-funcionario",
    "technician_id": "uuid-do-tecnico",
    "value": 250.00,
    "checklist_houve_queda": true,
    "checklist_tela_quebrada": false,
    "checklist_carrega": false,
    "checklist_acompanha_capa": true,
    "checklist_acompanha_chip": true
  }
}
\`\`\`

### Todos os Campos - Celulares

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| \`user_id\` | UUID | ✅ | ID do usuário proprietário |
| \`client_name\` | string | ✅ | Nome do cliente |
| \`device_model\` | string | ✅ | Modelo do dispositivo |
| \`reported_defect\` | string | ✅ | Defeito relatado |
| \`contact\` | string | ❌ | Telefone principal |
| \`other_contacts\` | string | ❌ | Outros contatos |
| \`client_cpf\` | string | ❌ | CPF do cliente |
| \`client_address\` | string | ❌ | Endereço do cliente |
| \`device_password\` | string | ❌ | Senha do dispositivo |
| \`device_pattern\` | string | ❌ | Padrão de desbloqueio |
| \`client_message\` | string | ❌ | Mensagem para o cliente |
| \`situation_id\` | UUID | ❌ | ID da situação |
| \`received_by_id\` | UUID | ❌ | ID de quem recebeu |
| \`technician_id\` | UUID | ❌ | ID do técnico |
| \`value\` | number | ❌ | Valor do serviço |
| \`service_date\` | datetime | ❌ | Data do serviço |
| \`exit_date\` | datetime | ❌ | Data de saída |
| \`part_order_date\` | datetime | ❌ | Data do pedido de peça |
| \`withdrawal_situation_id\` | UUID | ❌ | ID da situação de retirada |
| \`withdrawn_by\` | string | ❌ | Nome de quem retirou |
| \`mensagem_finalizada\` | boolean | ❌ | Mensagem de finalização enviada |
| \`mensagem_entregue\` | boolean | ❌ | Mensagem de entrega enviada |

### Campos do Checklist - Celulares

| Campo | Tipo | Descrição |
|-------|------|-----------|
| \`checklist_houve_queda\` | boolean | Houve queda? |
| \`checklist_face_id\` | boolean | Face ID funciona? |
| \`checklist_carrega\` | boolean | Carrega? |
| \`checklist_tela_quebrada\` | boolean | Tela quebrada? |
| \`checklist_vidro_trincado\` | boolean | Vidro trincado? |
| \`checklist_manchas_tela\` | boolean | Manchas na tela? |
| \`checklist_carcaca_torta\` | boolean | Carcaça torta? |
| \`checklist_riscos_tampa\` | boolean | Riscos na tampa? |
| \`checklist_riscos_laterais\` | boolean | Riscos laterais? |
| \`checklist_vidro_camera\` | boolean | Vidro da câmera ok? |
| \`checklist_acompanha_chip\` | boolean | Acompanha chip? |
| \`checklist_acompanha_sd\` | boolean | Acompanha SD? |
| \`checklist_acompanha_capa\` | boolean | Acompanha capa? |
| \`checklist_esta_ligado\` | boolean | Está ligado? |

---

### Informática (service_orders_informatica)

**Campos Obrigatórios:**
- \`user_id\` - ID do usuário
- \`client_name\` - Nome do cliente
- \`equipment\` - Equipamento
- \`defect\` - Defeito

\`\`\`json
{
  "action": "create",
  "table": "service_orders_informatica",
  "data": {
    "user_id": "${userId}",
    "client_name": "Empresa XYZ",
    "contact": "(11) 3333-4444",
    "other_contacts": "(11) 98888-7777",
    "equipment": "Notebook Dell Inspiron 15",
    "defect": "Não liga, ventoinhas não funcionam",
    "accessories": "Carregador original, mouse",
    "more_details": "Cliente relata que parou após queda de energia",
    "observations": "Verificar fonte de alimentação",
    "senha": "admin123",
    "situation_id": "uuid-da-situacao",
    "received_by_id": "uuid-do-funcionario",
    "equipment_location_id": "uuid-do-local",
    "value": 450.00
  }
}
\`\`\`

### Todos os Campos - Informática

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| \`user_id\` | UUID | ✅ | ID do usuário proprietário |
| \`client_name\` | string | ✅ | Nome do cliente |
| \`equipment\` | string | ✅ | Descrição do equipamento |
| \`defect\` | string | ✅ | Defeito relatado |
| \`contact\` | string | ❌ | Telefone principal |
| \`other_contacts\` | string | ❌ | Outros contatos |
| \`accessories\` | string | ❌ | Acessórios que acompanham |
| \`more_details\` | string | ❌ | Mais detalhes |
| \`observations\` | string | ❌ | Observações |
| \`senha\` | string | ❌ | Senha do equipamento |
| \`situation_id\` | UUID | ❌ | ID da situação |
| \`received_by_id\` | UUID | ❌ | ID de quem recebeu |
| \`equipment_location_id\` | UUID | ❌ | ID do local do equipamento |
| \`value\` | number | ❌ | Valor do serviço |
| \`service_date\` | datetime | ❌ | Data do serviço |
| \`exit_date\` | datetime | ❌ | Data de saída |
| \`withdrawal_situation_id\` | UUID | ❌ | ID da situação de retirada |
| \`withdrawn_by\` | string | ❌ | Nome de quem retirou |
| \`client_notified\` | boolean | ❌ | Cliente foi notificado |

### Resposta de Sucesso (Create)
\`\`\`json
{
  "success": true,
  "data": {
    "id": "uuid-gerado",
    "os_number": 124,
    "client_name": "Maria Santos",
    "device_model": "Samsung Galaxy S24",
    "reported_defect": "Não carrega e tela com manchas",
    "entry_date": "2024-01-20T14:30:00Z",
    "tracking_token": "uuid-do-token"
  }
}
\`\`\`

---

## 4. ATUALIZAR ORDEM DE SERVIÇO

### Requisição
\`\`\`json
{
  "action": "update",
  "table": "service_orders",
  "id": "uuid-da-ordem",
  "data": {
    "situation_id": "novo-uuid-situacao",
    "value": 400.00,
    "technician_id": "uuid-do-tecnico",
    "service_date": "2024-01-21T09:00:00Z"
  }
}
\`\`\`

### Atualizar para Finalizado
\`\`\`json
{
  "action": "update",
  "table": "service_orders",
  "id": "uuid-da-ordem",
  "data": {
    "situation_id": "uuid-situacao-finalizado",
    "exit_date": "2024-01-22T16:00:00Z",
    "withdrawal_situation_id": "uuid-aguardando-retirada",
    "mensagem_finalizada": true
  }
}
\`\`\`

### Registrar Retirada
\`\`\`json
{
  "action": "update",
  "table": "service_orders",
  "id": "uuid-da-ordem",
  "data": {
    "withdrawal_situation_id": "uuid-retirado-cliente",
    "withdrawn_by": "João Silva",
    "mensagem_entregue": true
  }
}
\`\`\`

---

## 5. EXCLUIR ORDEM DE SERVIÇO

### Requisição
\`\`\`json
{
  "action": "delete",
  "table": "service_orders",
  "id": "uuid-da-ordem"
}
\`\`\`

> **Nota:** A exclusão é do tipo "soft delete" - o registro não é removido, apenas marcado como \`deleted: true\`.

---

## 6. LISTAR SITUAÇÕES

### Celulares
\`\`\`json
{
  "action": "get_situations",
  "table": "service_orders",
  "filters": {
    "user_id": "${userId}"
  }
}
\`\`\`

### Informática
\`\`\`json
{
  "action": "get_situations",
  "table": "service_orders_informatica",
  "filters": {
    "user_id": "${userId}"
  }
}
\`\`\`

### Resposta
\`\`\`json
{
  "success": true,
  "data": [
    { "id": "uuid-1", "name": "Em Fila", "color": "#9CA3AF" },
    { "id": "uuid-2", "name": "Em Bancada", "color": "#F97316" },
    { "id": "uuid-3", "name": "Finalizado", "color": "#22C55E" }
  ]
}
\`\`\`

---

## 7. LISTAR SITUAÇÕES DE RETIRADA

### Celulares
\`\`\`json
{
  "action": "get_withdrawal_situations",
  "table": "service_orders",
  "filters": {
    "user_id": "${userId}"
  }
}
\`\`\`

### Informática
\`\`\`json
{
  "action": "get_withdrawal_situations",
  "table": "service_orders_informatica",
  "filters": {
    "user_id": "${userId}"
  }
}
\`\`\`

---

## 8. LISTAR FUNCIONÁRIOS

\`\`\`json
{
  "action": "get_employees",
  "filters": {
    "user_id": "${userId}"
  }
}
\`\`\`

### Filtrar por Tipo
\`\`\`json
{
  "action": "get_employees",
  "filters": {
    "user_id": "${userId}",
    "type": "Técnico"
  }
}
\`\`\`

### Tipos de Funcionários
- \`Técnico\`
- \`Atendente\`
- \`Gerente\`
- (outros conforme cadastrado)

---

## 9. LISTAR LOCAIS DE EQUIPAMENTO

\`\`\`json
{
  "action": "get_equipment_locations",
  "filters": {
    "user_id": "${userId}"
  }
}
\`\`\`

### Resposta
\`\`\`json
{
  "success": true,
  "data": [
    { "id": "uuid-1", "name": "Bancada", "color": "#3B82F6" },
    { "id": "uuid-2", "name": "Prateleira", "color": "#22C55E" }
  ]
}
\`\`\`

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Requisição inválida (campos obrigatórios faltando, ação inválida) |
| 401 | Não autorizado (API key inválida ou ausente) |
| 429 | Muitas requisições (rate limit excedido) |
| 500 | Erro interno do servidor |

### Exemplo de Resposta de Erro
\`\`\`json
{
  "error": "Required fields missing: client_name, device_model, reported_defect, user_id"
}
\`\`\`

---

## Configuração no n8n

### 1. Adicionar Node HTTP Request

1. Adicione um node **HTTP Request**
2. Configure:
   - **Method:** POST
   - **URL:** \`https://rpssrnpgogwqwijksygq.supabase.co/functions/v1/n8n-service-orders\`

### 2. Configurar Headers

Em **Headers**, adicione:
| Nome | Valor |
|------|-------|
| Content-Type | application/json |
| x-api-key | SUA_N8N_API_KEY |

### 3. Configurar Body

Em **Body**, selecione **JSON** e adicione o payload conforme a ação desejada.

---

## Exemplos de Workflows n8n

### Workflow 1: Criar OS a partir de Formulário

1. **Trigger:** Webhook ou Form
2. **HTTP Request:** Criar ordem
3. **IF:** Verificar sucesso
4. **Responder:** Retornar número da OS

### Workflow 2: Listar OS Pendentes e Enviar Notificação

1. **Trigger:** Schedule (diário)
2. **HTTP Request:** Listar ordens com filtro de situação
3. **Loop:** Para cada ordem
4. **HTTP Request:** Enviar notificação (WhatsApp, Email, etc.)

### Workflow 3: Atualizar Situação via Webhook

1. **Trigger:** Webhook
2. **HTTP Request:** Atualizar ordem com nova situação
3. **HTTP Request:** Enviar notificação ao cliente

---

## Boas Práticas

1. **Sempre inclua o \`user_id\`** nos filtros para garantir que você acesse apenas seus dados
2. **Valide os UUIDs** antes de enviar (situações, funcionários, etc.)
3. **Trate erros adequadamente** verificando o campo \`success\` na resposta
4. **Use o \`limit\`** para evitar carregar muitos dados de uma vez
5. **Mantenha sua API key segura** - nunca exponha em logs ou repositórios

---

## Suporte

Para dúvidas ou problemas, verifique:
1. Se a API key está correta
2. Se todos os campos obrigatórios estão preenchidos
3. Se os UUIDs são válidos
4. Se o \`user_id\` está correto

---

*Documentação gerada em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}*
`;
  };

  const downloadDocumentation = () => {
    generatePdfDoc();
  };

  const userId = user?.id || 'SEU_USER_ID';

  const CodeBlock = ({ code, section }: { code: string; section: string }) => (
    <div className="relative">
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2"
        onClick={() => copyToClipboard(code, section)}
      >
        {copiedSection === section ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentação da API n8n
            </CardTitle>
            <CardDescription>
              Guia completo para integração com n8n via Edge Function
            </CardDescription>
          </div>
          <Button onClick={downloadDocumentation} className="gap-2" disabled={isGeneratingPdf}>
            <Download className="h-4 w-4" />
            {isGeneratingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Informações de Conexão
          </h3>
          
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">URL da Edge Function</label>
              <CodeBlock 
                code="https://rpssrnpgogwqwijksygq.supabase.co/functions/v1/n8n-service-orders"
                section="url"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Seu User ID</label>
              <CodeBlock code={userId} section="userId" />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Headers Obrigatórios</label>
              <CodeBlock 
                code={`{
  "Content-Type": "application/json",
  "x-api-key": "SUA_N8N_API_KEY"
}`}
                section="headers"
              />
            </div>
          </div>
        </div>

        {/* Actions Tabs */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="list" className="gap-1">
              <Database className="h-3 w-3" />
              Listar
            </TabsTrigger>
            <TabsTrigger value="get" className="gap-1">
              <FileText className="h-3 w-3" />
              Obter
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-1">
              <Code className="h-3 w-3" />
              Criar
            </TabsTrigger>
            <TabsTrigger value="update" className="gap-1">
              <Code className="h-3 w-3" />
              Atualizar
            </TabsTrigger>
            <TabsTrigger value="auxiliary" className="gap-1">
              <Users className="h-3 w-3" />
              Auxiliares
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Badge>action: list</Badge>
              <span className="text-sm text-muted-foreground">Listar ordens de serviço com filtros</span>
            </div>

            <div>
              <h4 className="font-medium mb-2">Requisição Básica</h4>
              <CodeBlock 
                code={`{
  "action": "list",
  "table": "service_orders",
  "filters": {
    "user_id": "${userId}"
  }
}`}
                section="list-basic"
              />
            </div>

            <div>
              <h4 className="font-medium mb-2">Com Filtros Avançados</h4>
              <CodeBlock 
                code={`{
  "action": "list",
  "table": "service_orders",
  "filters": {
    "user_id": "${userId}",
    "situation_id": "uuid-da-situacao",
    "date_from": "2024-01-01T00:00:00Z",
    "date_to": "2024-12-31T23:59:59Z",
    "client_name": "João",
    "os_number": 123,
    "limit": 50
  }
}`}
                section="list-advanced"
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Filtros Disponíveis</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><code className="bg-muted px-1 rounded">user_id</code> - ID do usuário (obrigatório)</div>
                <div><code className="bg-muted px-1 rounded">situation_id</code> - Filtrar por situação</div>
                <div><code className="bg-muted px-1 rounded">withdrawal_situation_id</code> - Situação de retirada</div>
                <div><code className="bg-muted px-1 rounded">date_from</code> - Data inicial (ISO 8601)</div>
                <div><code className="bg-muted px-1 rounded">date_to</code> - Data final (ISO 8601)</div>
                <div><code className="bg-muted px-1 rounded">client_name</code> - Busca parcial por nome</div>
                <div><code className="bg-muted px-1 rounded">os_number</code> - Número exato da OS</div>
                <div><code className="bg-muted px-1 rounded">limit</code> - Limite de resultados</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="get" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Badge>action: get</Badge>
              <span className="text-sm text-muted-foreground">Obter uma ordem específica por ID</span>
            </div>

            <CodeBlock 
              code={`{
  "action": "get",
  "table": "service_orders",
  "id": "uuid-da-ordem"
}`}
              section="get"
            />
          </TabsContent>

          <TabsContent value="create" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Badge>action: create</Badge>
              <span className="text-sm text-muted-foreground">Criar nova ordem de serviço</span>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                📱 Celulares (service_orders)
              </h4>
              <div className="mb-2 text-sm">
                <span className="font-medium">Campos obrigatórios:</span>{' '}
                <code className="bg-muted px-1 rounded">user_id</code>,{' '}
                <code className="bg-muted px-1 rounded">client_name</code>,{' '}
                <code className="bg-muted px-1 rounded">device_model</code>,{' '}
                <code className="bg-muted px-1 rounded">reported_defect</code>
              </div>
              <CodeBlock 
                code={`{
  "action": "create",
  "table": "service_orders",
  "data": {
    "user_id": "${userId}",
    "client_name": "Maria Santos",
    "contact": "(11) 98765-4321",
    "device_model": "Samsung Galaxy S24",
    "device_password": "1234",
    "reported_defect": "Não carrega e tela com manchas",
    "situation_id": "uuid-da-situacao",
    "received_by_id": "uuid-do-funcionario",
    "technician_id": "uuid-do-tecnico",
    "value": 250.00,
    "checklist_houve_queda": true,
    "checklist_tela_quebrada": false,
    "checklist_acompanha_capa": true
  }
}`}
                section="create-celulares"
              />
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                💻 Informática (service_orders_informatica)
              </h4>
              <div className="mb-2 text-sm">
                <span className="font-medium">Campos obrigatórios:</span>{' '}
                <code className="bg-muted px-1 rounded">user_id</code>,{' '}
                <code className="bg-muted px-1 rounded">client_name</code>,{' '}
                <code className="bg-muted px-1 rounded">equipment</code>,{' '}
                <code className="bg-muted px-1 rounded">defect</code>
              </div>
              <CodeBlock 
                code={`{
  "action": "create",
  "table": "service_orders_informatica",
  "data": {
    "user_id": "${userId}",
    "client_name": "Empresa XYZ",
    "contact": "(11) 3333-4444",
    "equipment": "Notebook Dell Inspiron 15",
    "defect": "Não liga, ventoinhas não funcionam",
    "accessories": "Carregador original, mouse",
    "more_details": "Cliente relata que parou após queda de energia",
    "observations": "Verificar fonte de alimentação",
    "senha": "admin123",
    "situation_id": "uuid-da-situacao",
    "received_by_id": "uuid-do-funcionario",
    "equipment_location_id": "uuid-do-local",
    "value": 450.00
  }
}`}
                section="create-informatica"
              />
            </div>
          </TabsContent>

          <TabsContent value="update" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Badge>action: update</Badge>
              <span className="text-sm text-muted-foreground">Atualizar ordem existente</span>
            </div>

            <div>
              <h4 className="font-medium mb-2">Atualização Básica</h4>
              <CodeBlock 
                code={`{
  "action": "update",
  "table": "service_orders",
  "id": "uuid-da-ordem",
  "data": {
    "situation_id": "novo-uuid-situacao",
    "value": 400.00,
    "technician_id": "uuid-do-tecnico"
  }
}`}
                section="update-basic"
              />
            </div>

            <div>
              <h4 className="font-medium mb-2">Finalizar Ordem</h4>
              <CodeBlock 
                code={`{
  "action": "update",
  "table": "service_orders",
  "id": "uuid-da-ordem",
  "data": {
    "situation_id": "uuid-situacao-finalizado",
    "exit_date": "2024-01-22T16:00:00Z",
    "withdrawal_situation_id": "uuid-aguardando-retirada",
    "mensagem_finalizada": true
  }
}`}
                section="update-finalize"
              />
            </div>

            <div>
              <h4 className="font-medium mb-2">Registrar Retirada</h4>
              <CodeBlock 
                code={`{
  "action": "update",
  "table": "service_orders",
  "id": "uuid-da-ordem",
  "data": {
    "withdrawal_situation_id": "uuid-retirado-cliente",
    "withdrawn_by": "João Silva",
    "mensagem_entregue": true
  }
}`}
                section="update-withdrawal"
              />
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Badge variant="destructive">action: delete</Badge>
                Excluir Ordem (Soft Delete)
              </h4>
              <CodeBlock 
                code={`{
  "action": "delete",
  "table": "service_orders",
  "id": "uuid-da-ordem"
}`}
                section="delete"
              />
            </div>
          </TabsContent>

          <TabsContent value="auxiliary" className="space-y-4 mt-4">
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Listar Situações
                </h4>
                <CodeBlock 
                  code={`{
  "action": "get_situations",
  "table": "service_orders",
  "filters": {
    "user_id": "${userId}"
  }
}`}
                  section="get-situations"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Use <code className="bg-muted px-1 rounded">table: "service_orders_informatica"</code> para situações de Informática
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Listar Situações de Retirada
                </h4>
                <CodeBlock 
                  code={`{
  "action": "get_withdrawal_situations",
  "table": "service_orders",
  "filters": {
    "user_id": "${userId}"
  }
}`}
                  section="get-withdrawal-situations"
                />
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Listar Funcionários
                </h4>
                <CodeBlock 
                  code={`{
  "action": "get_employees",
  "filters": {
    "user_id": "${userId}",
    "type": "Técnico"
  }
}`}
                  section="get-employees"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  O filtro <code className="bg-muted px-1 rounded">type</code> é opcional (ex: "Técnico", "Atendente")
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Listar Locais de Equipamento
                </h4>
                <CodeBlock 
                  code={`{
  "action": "get_equipment_locations",
  "filters": {
    "user_id": "${userId}"
  }
}`}
                  section="get-locations"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Error Codes */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium">Códigos de Erro</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div><Badge variant="outline">400</Badge> Requisição inválida</div>
            <div><Badge variant="outline">401</Badge> API key inválida</div>
            <div><Badge variant="outline">429</Badge> Rate limit excedido</div>
            <div><Badge variant="outline">500</Badge> Erro interno</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default N8nDocumentation;
