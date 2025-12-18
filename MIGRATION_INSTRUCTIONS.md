# 🚀 Guia de Migração para Supabase Externo

## Pré-requisitos

- Conta no [supabase.com](https://supabase.com)
- Acesso ao Lovable Cloud atual (para baixar arquivos de mídia)

---

## Passo 1: Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login (ou crie uma conta)
2. Clique em **"New Project"**
3. Preencha:
   - **Organization**: Selecione ou crie uma
   - **Name**: Ex: `os-system`
   - **Database Password**: Crie uma senha forte (anote!)
   - **Region**: Escolha a mais próxima (ex: São Paulo)
4. Clique em **"Create new project"**
5. Aguarde ~2 minutos para o projeto inicializar

---

## Passo 2: Anotar Credenciais

Após o projeto ser criado, vá em **Settings → API** e anote:

| Variável | Onde encontrar |
|----------|----------------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (para n8n!) |

---

## Passo 3: Executar Script de Estrutura

1. No dashboard do Supabase, vá em **SQL Editor**
2. Clique em **"New query"**
3. Copie TODO o conteúdo do arquivo `MIGRATION_SCRIPT.sql`
4. Cole no editor e clique em **"Run"**
5. Verifique se não há erros

---

## Passo 4: Registrar Usuário

1. Vá em **Authentication → Users**
2. Clique em **"Add user"**
3. Preencha:
   - Email: `treuherzeduardoo@gmail.com`
   - Password: Sua nova senha
4. Clique em **"Create user"**
5. Anote o **User ID** gerado (você vai precisar)

---

## Passo 5: Importar Dados

1. Volte ao **SQL Editor**
2. Clique em **"New query"**
3. Copie TODO o conteúdo do arquivo `MIGRATION_DATA.sql`
4. Cole no editor e clique em **"Run"**
5. Verifique se não há erros

---

## Passo 6: Migrar Arquivos de Mídia

### 6.1 Baixar do Lovable Cloud

Os arquivos estão armazenados em:
- Bucket `logos`: Logo da empresa
- Bucket `service-orders-media`: Fotos e vídeos das OS

**Para o logo:**
- URL atual: `https://rpssrnpgogwqwijksygq.supabase.co/storage/v1/object/public/logos/7a31fa53-5f3e-4d27-997a-156b59743f69/logo.jpg`
- Baixe este arquivo

**Para mídias de OS:**
- Você precisará baixar cada arquivo usando URLs assinadas
- Ou acessar diretamente pelo painel do Lovable Cloud

### 6.2 Upload para Supabase Externo

1. No dashboard, vá em **Storage**
2. Você verá os buckets `logos` e `service-orders-media`
3. Faça upload dos arquivos:
   - Para `logos`: crie pasta com seu novo `user_id` e faça upload do logo
   - Para `service-orders-media`: organize por `order_id/arquivo`

---

## Passo 7: Atualizar Configuração do Lovable

Após confirmar que tudo funciona no Supabase externo:

1. Edite o arquivo `.env` no Lovable:

```env
VITE_SUPABASE_PROJECT_ID="SEU_NOVO_PROJECT_ID"
VITE_SUPABASE_PUBLISHABLE_KEY="SUA_NOVA_ANON_KEY"
VITE_SUPABASE_URL="https://SEU_PROJETO.supabase.co"
```

2. Atualize também o `src/integrations/supabase/client.ts` se necessário

---

## Passo 8: Configurar n8n

Agora você tem acesso ao `service_role key`! 🎉

No n8n, configure as credenciais Supabase:

| Campo | Valor |
|-------|-------|
| Host | `https://SEU_PROJETO.supabase.co` |
| Service Role Secret | Sua `service_role key` |

---

## ⚠️ Considerações Importantes

### Sobre Usuários
- O usuário precisa se registrar novamente no novo Supabase
- As senhas não são migradas (são criptografadas)

### Sobre Arquivos de Mídia
- As URLs antigas não funcionarão mais
- Os campos `media_files` nas OS precisam ser atualizados com as novas URLs
- Considere fazer isso gradualmente

### Sobre Tracking de OS
- Os tokens de tracking (`tracking_token`) são mantidos
- Os links de acompanhamento funcionarão após atualizar a URL base

### Backup
- Mantenha o Lovable Cloud ativo até confirmar que tudo funciona
- Faça backup dos arquivos de mídia antes de qualquer alteração

---

## Verificação Final

Após a migração, verifique:

- [ ] Login funcionando
- [ ] Listagem de OS aparece corretamente
- [ ] Criação de nova OS funciona
- [ ] Upload de mídia funciona
- [ ] Página de tracking funciona
- [ ] n8n consegue conectar e ler dados

---

## Suporte

Se encontrar problemas durante a migração, os erros mais comuns são:

1. **Erro de RLS**: Certifique-se de estar logado com o usuário correto
2. **Erro de foreign key**: Execute os scripts na ordem correta
3. **Arquivos não aparecem**: Verifique as políticas do storage

---

Boa migração! 🚀
