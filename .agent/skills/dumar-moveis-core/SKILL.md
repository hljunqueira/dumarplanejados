---
name: dumar-moveis-core
description: Conhecimento técnico e de domínio completo do ecossistema Dumar Móveis Planejados (React, Express, Drizzle ORM, Evolution API WhatsApp, Gestão de Marcenaria, Contratos e CRM).
---

# 🪵 Skill: Dumar Móveis Planejados Core

Esta skill fornece o mapa completo de arquitetura, componentes de interface, endpoints de backend, tabelas de banco de dados, regras de negócio do setor de móveis sob medida e rotinas de operação e deploy da **Dumar Móveis Planejados**.

---

## 💻 Seção 1: Frontend & Interface do Usuário

A interface é construída com **React 18**, **TypeScript**, **Tailwind CSS**, **Radix UI**, **Framer Motion** e roteamento via **Wouter**.

### 1.1. Estrutura de Rotas e Páginas (`client/src/pages/`)
- `/` (`home-page.tsx`): Página inicial institucional completa com seções:
  - `HeroSection`: Apresentação com CTA para orçamento e agendamento.
  - `AboutSection`: História, valores e posicionamento da marcenaria em Balneário Arroio do Silva/SC.
  - `ProcessSection`: As 5 etapas do projeto sob medida (Briefing, 3D, Corte/Fabrico, Montagem, Entrega).
  - `VideosSection`: Vídeos reais de projetos e bastidores da fábrica.
  - `PortfolioSection`: Galeria interativa filtrável com modal detalhado de ambientes (`portfolio-modal.tsx`).
  - `ContactSection`: Formulário com envio direto para o CRM e WhatsApp.
  - `Footer`: Dados de contato, CNPJ, localização e links rápidos.
  - `WhatsappButton`: Botão flutuante persistente de atendimento imediato.
- `/orcamento` (`budget-page.tsx`): Calculadora e formulário avançado de solicitação de orçamento por ambiente com upload de plantas.
- `/agendamento` (`appointment-page.tsx`): Sistema de agendamento de visita técnica para medição no local.
- `/contato` (`contact-page.tsx`): Página dedicada de contato e mapa.
- `/crm/:section?` (`crm-page.tsx`): Painel administrativo e operacional completo do CRM Dumar.

### 1.2. Módulos do CRM (`client/src/components/crm/`)
- `CRMLogin` (`crm-login.tsx`): Autenticação de administradores com hash SHA-256 e persistência em sessão.
- `CRMSidebar` (`crm-sidebar.tsx`): Barra lateral de navegação com contadores dinâmicos de leads e status de instâncias.
- `CRMDashboard` (`crm-dashboard.tsx`): Painel de KPIs (Total de leads ativos, valor em negociação, taxa de conversão, ticket médio).
- `CRMKanban` (`crm-kanban.tsx`): Funil visual de vendas e produção com suporte a drag-and-drop nativo e drag horizontal (grab-to-scroll).
- `CRMLeadDrawer` (`crm-lead-drawer.tsx`): Painel lateral profundo do lead com:
  - Histórico de mensagens do WhatsApp sincronizado via Evolution API.
  - Envio de mensagens de texto, áudios PTT gravados e upload de documentos/fotos.
  - Checklist técnico de marcenaria (medidas, pontos hidráulicos/elétricos, plano de corte).
  - Gestor de arquivos Promob e fotos de acompanhamento de obra.
  - Seletor de materiais e padrões de MDF (ex.: Carvalho Americano, Gianduia, Grafite Matt).
- `CRMContractsView` (`crm-contracts-view.tsx`): Módulo de elaboração, preview e impressão de contratos
- `CRMAgenda` (`crm-agenda.tsx`): Calendário mensal/semanal para agendamento de medições técnicas e montagens.
- `CRMFinanceiro` (`crm-financeiro.tsx`): Controle de receitas de contratos, parcelas a vencer, despesas operacionais, transações recorrentes e gerenciamento de fornecedores vinculados.
- `CRMSuppliersModal` (`crm-suppliers-modal.tsx`): Gestor completo de fornecedores e parceiros da marcenaria com busca, filtro por categorias de insumos e atalho para WhatsApp.
- `ConfirmDialog` (`confirm-dialog.tsx`): Sistema de modais de diálogo e confirmação com variantes (`danger`, `warning`, `info`, `success`) substituindo `window.alert` e `window.confirm`.
- `CRMMateriaisModal` (`crm-materiais-modal.tsx`): Catálogo de materiais de marcenaria (estrutura/caixaria, frentes, tamponamentos, vidros, puxadores, dobradiças, corrediças).
- `CRMConnections` (`crm-connections.tsx`): Gerenciador da instância da Evolution API com exibição de QR Code em tempo real e status de pareamento.
- `CRMSettings` (`crm-settings.tsx`): Configurações do Typebot, regras de IA e modelos de WhatsApp.
- `CRMPerfil` (`crm-perfil.tsx`): Gerenciamento do perfil de usuário e credenciais.

---

## ⚙️ Seção 2: Backend & Serviços da API

O servidor backend é executado com **Express.js**, **TypeScript** e **Drizzle ORM** conectado ao PostgreSQL.

### 2.1. Endpoints de Autenticação e Leads
- `POST /api/login`: Validação de credenciais de administradores com hash seguro SHA-256.
- `GET /api/leads`: Retorna a listagem completa de leads com seus metadados.
- `POST /api/leads`: Cadastro de novo lead (origem manual, site, formulário ou webhook do Typebot/n8n).
- `PATCH /api/leads/:id`: Atualização de estágio no Kanban, valores, ambientes, checklist técnico, dados de montagem e histórico de chat.
- `DELETE /api/leads/:id`: Exclusão de lead do sistema.
- `POST /api/leads/revert-sync`: Reversão de contatos importados em massa.
- `GET /api/leads/export`: Exportação da base de leads em formato CSV estruturado.

### 2.2. Endpoints de Mensageria e Evolution API (WhatsApp)
- `GET /api/evolution/instances`: Consulta instâncias ativas do WhatsApp.
- `POST /api/evolution/connect`: Cria ou conecta à instância `dumar_comercial` e retorna o QR Code em Base64.
- `POST /api/evolution/logout`: Desconecta e limpa a sessão na Evolution API para geração de novo QR Code.
- `POST /api/evolution/sync-chats`: Sincroniza conversas recentes do WhatsApp diretamente no Funil do CRM.
- `POST /api/evolution/send-message`: Dispara mensagem de texto real para o cliente e registra no `chatHistory` do lead no PostgreSQL.
- `POST /api/evolution/send-media`: Envia imagens de projetos 3D, contratos em PDF ou fotos de obras.
- `POST /api/evolution/send-audio`: Envia áudios PTT nativos para o WhatsApp do cliente.
- `POST /api/evolution/webhook`: Webhook de recepção de mensagens (`messages.upsert`).

### 2.3. Endpoints Financeiros, Fornecedores e Contratos
- `GET /api/financial/transactions`: Lista todas as transações financeiras (com suporte a fornecedores e recorrência).
- `POST /api/financial/transactions`: Cria lançamento de receita ou despesa com sanitização monetária flexível (`sanitizeMonetaryAmount`).
- `POST /api/financial/transactions/recurring`: Cria lançamentos recorrentes em massa (ex: despesas fixas de 12 meses).
- `PATCH /api/financial/transactions/:id`: Atualiza status de pagamento (pago, pendente, atrasado) ou dados do fornecedor.
- `DELETE /api/financial/transactions/:id`: Exclui transação financeira.
- `GET /api/suppliers`: Lista fornecedores e parceiros cadastrados.
- `POST /api/suppliers`: Cadastra novo fornecedor com CNPJ/CPF, categoria de insumos e chave PIX.
- `PATCH /api/suppliers/:id`: Atualiza dados do fornecedor.
- `DELETE /api/suppliers/:id`: Remove fornecedor.
- `GET /api/contracts`: Lista contratos gerados.
- `POST /api/contracts`: Cria novo contrato com dados do cliente, valor total, entrada e JSON de cláusulas.
- `PUT /api/contracts/:id`: Atualiza dados do contrato.
- `DELETE /api/contracts/:id`: Remove contrato.

### 2.4. Endpoints de Catálogo de Materiais e Agenda
- `GET /api/materials-catalog`: Lista itens do catálogo de materiais de marcenaria.
- `POST /api/materials-catalog`: Cadastra novo material.
- `PATCH /api/materials-catalog/:id`: Edita material existente.
- `DELETE /api/materials-catalog/:id`: Remove item do catálogo.
- `GET /api/calendar-events`: Lista compromissos, visitas de medição e montagens.
- `POST /api/calendar-events`: Cria novo evento vinculado a um lead.
- `PATCH /api/calendar-events/:id`: Atualiza data, horário ou status de conclusão.
- `DELETE /api/calendar-events/:id`: Remove evento da agenda.

---

## 🗄️ Seção 3: Modelo de Dados (Schema PostgreSQL / Drizzle)

As entidades estão declaradas em `shared/schema.ts` e migradas via `initDbTables()` no `server/db.ts`:

### 3.1. Tabela `suppliers` (Fornecedores & Parceiros)
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | serial (PK) | Identificador único do fornecedor |
| `name` | text (NN) | Razão Social ou Nome do Fornecedor |
| `tradeName` | text | Nome Fantasia / Apelido |
| `cnpjCpf` | text | CNPJ ou CPF |
| `category` | text | Categoria: `mdf_chapas`, `ferragens_perfis`, `vidros_espelhos`, `iluminacao_led`, `servicos_terceiros`, `ferramentas_insumos`, `geral` |
| `phone` | text | Telefone / WhatsApp comercial |
| `email` | text | E-mail de compras/financeiro |
| `contactPerson` | text | Nome do vendedor ou representante |
| `pixKey` | text | Chave PIX para pagamentos |
| `notes` | text | Prazos de faturamento, dados bancários |
| `active` | boolean | Status de atividade do fornecedor |
| `createdAt` | text | Data de cadastro |

### 3.2. Tabela `financial_transactions`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | serial (PK) | Identificador da transação |
| `description` | text (NN) | Descrição do lançamento financeiro |
| `type` | text (Default: "receita") | Tipo: `"receita"` ou `"despesa"` |
| `amount` | integer (NN) | Valor em reais (arredondado em inteiros) |
| `category` | text | Categoria (`"venda_marcenaria"`, `"fornecedor_mdf"`, `"ferragens"`, `"pro_labore"`, `"aluguel"`) |
| `status` | text (Default: "pago") | Status: `"pago"`, `"pendente"`, `"atrasado"` |
| `dueDate` | text | Data de vencimento (YYYY-MM-DD) |
| `paymentDate` | text | Data de liquidação |
| `paymentMethod` | text | Método de pagamento (PIX, Cartão, Boleto, Dinheiro) |
| `leadId` | integer (FK) | Vínculo com cliente/lead |
| `supplierId` | integer (FK) | Vínculo com fornecedor cadastrado |
| `supplierName` | text | Nome do fornecedor (para histórico e relatórios rápidos) |
| `isRecurring` | boolean | Flag de lançamento recorrente |
| `recurrenceGroup` | text | Identificador do lote de parcelas |
| `installmentIndex` | integer | Índice da parcela (ex: 1 de 12) |
| `notes` | text | Observações financeiras |
| `createdAt` | text | Data de criação do registro |

### 3.3. Tabela `leads`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | serial (PK) | Identificador do Lead |
| `name` | text (NN) | Nome completo do cliente |
| `phone` | text (NN) | Telefone formatado com DDI/DDD |
| `email` | text | E-mail do cliente |
| `stage` | text (Default: "entrada") | Estágio atual no Funil Operacional (13 etapas) |
| `value` | integer (Default: 0) | Valor estimado ou fechado do projeto (R$) |
| `utmSource` | text | Origem do tráfego (Google Ads, Meta, Orgânico) |
| `utmCampaign` | text | Nome da campanha publicitária |
| `rooms` | text (JSON String) | Array de ambientes desejados (`["Cozinha", "Closet"]`) |
| `promobFiles` | text (JSON String) | Lista de arquivos de projeto Promob anexados |
| `checklist` | text (JSON String) | Checklist técnico de fabricação e montagem |
| `chatHistory` | text (JSON String) | Histórico de mensagens do WhatsApp |
| `constructionPhotos` | text (JSON String) | URLs/Base64 de fotos de acompanhamento da obra |
| `materials` | text (JSON String) | Especificação de padrões de MDF e ferragens |
| `lastCustomerMessageAt` | text | Timestamp da última mensagem enviada pelo cliente |
| `aiPaused` | boolean | Flag de pausa da Inteligência Artificial |

### 3.4. Tabela `contracts`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | serial (PK) | Identificador do contrato |
| `contractNumber` | text (NN) | Número formatado do contrato (ex: `CTR-2026/089`) |
| `contractDate` | text (NN) | Data de emissão do contrato |
| `status` | text (Default: "rascunho") | Status: `"rascunho"`, `"assinado"`, `"finalizado"` |
| `leadId` | integer (FK) | Lead associado |
| `clientName` | text (NN) | Nome do contratante |
| `clientCpfCnpj` | text | CPF ou CNPJ |
| `clientAddress` | text | Endereço completo de instalação da obra |
| `clientPhone` | text | Telefone de contato |
| `totalValue` | integer (NN) | Valor total do contrato de marcenaria |
| `downPayment` | integer | Valor de entrada |
| `dataJson` | text (JSON String) | Cláusulas detalhadas, especificações de MDF e prazos |
| `createdAt` | text | Data de registro |

### 3.5. Tabelas Adicionais
- `materials_catalog`: Cadastro de materiais e componentes padrão da fábrica.
- `calendar_events`: Eventos de medição no local, visitas de alinhamento e montagem final.
- `users`: Usuários administrativos do sistema CRM.
- `ai_config`: Parâmetros de prompt, presets e regras do agente virtual de vendas.
- `whatsapp_templates`: Modelos de mensagens rápidas.

---

## 📐 Seção 4: Regras de Negócio do Setor de Marcenaria Fina

### 4.1. Funil Operacional e Estágios do Kanban (13 Etapas):
1. **`entrada` (Leads de Entrada)**: Novo contato via anúncio, site ou WhatsApp aguardando primeiro contato.
2. **`em_atendimento` (Em Atendimento)**: Cliente em conversa inicial e triagem ativa com vendedor ou IA.
3. **`nao_responde` (Não Responde)**: Tentativas de contato sem retorno imediato do cliente.
4. **`briefing` (Briefing & Medição)**: Agendamento ou realização da visita técnica para medição a laser in loco e coleta de necessidades.
5. **`3d` (Projeto 3D Promob)**: Desenvolvimento da modulação técnica e renderização no software Promob.
6. **`apresentacao` (Apresentação & Orçamento)**: Apresentação do render 3D e proposta comercial detalhada ao cliente.
7. **`contrato` (Fechamento / Contrato)**: Emissão e assinatura do contrato com definição de entrada e parcelamento.
8. **`fabrica` (Pedido de Fábrica)**: Geração do plano de corte (Corte Certo/Promob Cut), compra de chapas de MDF, fitas de borda e ferragens.
9. **`montagem` (Entrega & Montagem)**: Transporte dos módulos e montagem executada pela equipe de marceneiros.
10. **`posvenda` (Pós-Venda & Assistência)**: Vistoria final de entrega, termo de garantia de 5 anos e solicitação de avaliação.
11. **`freezer` (Leads Frios)**: Clientes que postergaram a obra para o próximo semestre.
12. **`cancelado` (Cancelados / Perdidos)**: Oportunidades descartadas com registro de motivo.
13. **`contato_futuro` (Contato Futuro)**: Leads para follow-up de longo prazo (ex: entrega da chave do imóvel em 6+ meses).

---

## 🚀 Seção 5: Scripts de Execução, Testes e Deploy

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento Express + Vite com reload a quente via `tsx`. |
| `npm run build` | Compila os assets do Frontend (`vite build`) e empacota o backend Node (`esbuild server/index.ts`). |
| `npm run build:client` | Compila apenas o Frontend React para a pasta `dist/public`. |
| `npm run check` | Executa o compilador TypeScript (`tsc`) para validação estática rigorosa de tipos. |
| `npm run db:push` | Sincroniza as definições do Drizzle ORM com o banco PostgreSQL via `drizzle-kit push`. |
| `npm run start` | Inicia a aplicação compilada em modo de produção (`node dist/index.js`). |
| `deploy-dumar.ps1` | Script automatizado em PowerShell que compila o projeto, compacta os pacotes e transfere via SSH/SCP para a VPS com recarga de contêineres Docker (Caddy + Backend Express). |
| `npm run n8n:status` | Verifica a conectividade e status dos fluxos n8n configurados. |
