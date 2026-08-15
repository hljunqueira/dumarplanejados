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
- `CRMContractsView` (`crm-contracts-view.tsx`): Módulo de elaboração, preview e impressão de contratos de marcenaria com cláusulas jurídicas completas e cálculo de parcelas.
- `CRMAgenda` (`crm-agenda.tsx`): Calendário mensal/semanal para agendamento de medições técnicas e montagens.
- `CRMFinanceiro` (`crm-financeiro.tsx`): Controle de receitas de contratos, parcelas a vencer, despesas operacionais e transações PIX.
- `CRMConnections` (`crm-connections.tsx`): Gerenciador da instância da Evolution API com exibição de QR Code em tempo real e status de pareamento.
- `CRMSettings` (`crm-settings.tsx`): Configurações do Typebot (bot de boas-vindas, palavras-chave de reinício `#bot`, hand-off de atendente) e Webhooks.
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
- `GET /api/leads/export`: Exportação da base de leads em formato CSV estruturado.

### 2.2. Endpoints de Mensageria e Evolution API (WhatsApp)
- `GET /api/evolution/instances`: Consulta instâncias ativas do WhatsApp.
- `POST /api/evolution/connect`: Cria ou conecta à instância `dumar_comercial` e retorna o QR Code em Base64.
- `POST /api/evolution/logout`: Desconecta e limpa a sessão na Evolution API para geração de novo QR Code.
- `POST /api/evolution/send-message`: Dispara mensagem de texto real para o cliente e registra no `chatHistory` do lead no PostgreSQL.
- `POST /api/evolution/send-media`: Envia imagens de projetos 3D, contratos em PDF ou fotos de obras.
- `POST /api/evolution/send-audio`: Envia áudios PTT nativos para o WhatsApp do cliente.
- `POST /api/evolution/webhook`: Webhook de recepção de mensagens (`messages.upsert`). Cria novos leads automaticamente ou anexa mensagens ao histórico existente, com suporte a extração automática de ambientes e disparo do bot de atendimento.

### 2.3. Endpoints Financeiros e Contratos
- `GET /api/financial/transactions`: Lista todas as transações financeiras.
- `POST /api/financial/transactions`: Cria lançamento de receita ou despesa.
- `PATCH /api/financial/transactions/:id`: Atualiza status de pagamento (pago, pendente, atrasado).
- `DELETE /api/financial/transactions/:id`: Exclui transação financeira.
- `GET /api/contracts`: Lista contratos gerados.
- `POST /api/contracts`: Cria novo contrato com dados do cliente, valor total, entrada e JSON de cláusulas.
- `PUT /api/contracts/:id`: Atualiza dados do contrato.
- `DELETE /api/contracts/:id`: Remove contrato.

### 2.4. Endpoints de Agenda e Calendário
- `GET /api/calendar-events`: Lista compromissos, visitas de medição e montagens.
- `POST /api/calendar-events`: Cria novo evento vinculado a um lead.
- `PATCH /api/calendar-events/:id`: Atualiza data, horário ou status de conclusão.
- `DELETE /api/calendar-events/:id`: Remove evento da agenda.

### 2.5. Utilitários e Parsers Especiais
- `parsePromobFile` (`client/src/lib/promob-parser.ts`): Processa arquivos de projeto do Promob (listagem de módulos, ferragens, medidas e acabamentos).
- `captureAndStoreUtms` (`client/src/lib/utm-tracker.ts`): Captura dinâmica de parâmetros de campanha (`gclid`, `utm_source`, `utm_campaign`, `gad_source`) no carregamento da página e armazena em `sessionStorage` para atribuição em formulários.

---

## 🗄️ Seção 3: Modelo de Dados (Schema PostgreSQL / Drizzle)

As entidades estão declaradas em `shared/schema.ts`:

### 3.1. Tabela `users`
| Campo | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | serial | PK | Identificador único |
| `username` | text | Not Null, Unique | Nome de usuário ou e-mail de login |
| `password` | text | Not Null | Hash SHA-256 da senha |

### 3.2. Tabela `leads`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | serial (PK) | Identificador do Lead |
| `name` | text (NN) | Nome completo do cliente |
| `phone` | text (NN) | Telefone formatado com DDI/DDD |
| `email` | text | E-mail do cliente |
| `stage` | text (Default: "entrada") | Estágio atual no Funil Operacional |
| `value` | integer (Default: 0) | Valor estimado ou fechado do projeto (R$) |
| `utmSource` | text | Origem do tráfego (Google Ads, Meta, Orgânico) |
| `utmCampaign` | text | Nome da campanha publicitária |
| `rooms` | text (JSON String) | Array de ambientes desejados (`["Cozinha", "Closet"]`) |
| `promobFiles` | text (JSON String) | Lista de arquivos de projeto Promob anexados |
| `paymentMethod` | text | Forma de pagamento acordada (PIX, Boleto, Cartão) |
| `installments` | integer | Quantidade de parcelas |
| `downPayment` | integer | Valor pago como entrada |
| `deliveryDate` | text | Previsão de entrega da marcenaria |
| `assembler` | text | Marceneiro/Montador responsável |
| `checklist` | text (JSON String) | Checklist técnico de fabricação e montagem |
| `chatHistory` | text (JSON String) | Histórico de mensagens do WhatsApp |
| `constructionPhotos` | text (JSON String) | URLs/Base64 de fotos de acompanhamento da obra |
| `materials` | text (JSON String) | Especificação de padrões de MDF e ferragens |
| `lastCustomerMessageAt` | text | Timestamp da última mensagem enviada pelo cliente |

### 3.3. Tabela `financial_transactions`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | serial (PK) | Identificador da transação |
| `description` | text (NN) | Descrição do lançamento financeiro |
| `type` | text (Default: "receita") | Tipo: `"receita"` ou `"despesa"` |
| `amount` | integer (NN) | Valor em reais |
| `category` | text | Categoria (`"venda_marcenaria"`, `"fornecedor_mdf"`, `"ferragens"`) |
| `status` | text (Default: "pago") | Status: `"pago"`, `"pendente"`, `"atrasado"` |
| `dueDate` | text | Data de vencimento (YYYY-MM-DD) |
| `paymentDate` | text | Data de liquidação |
| `paymentMethod` | text | Método de pagamento (PIX, Cartão, Boleto) |
| `leadId` | integer (FK) | Vínculo opcional com o cliente/lead |
| `notes` | text | Observações financeiras |
| `createdAt` | text | Data de criação do registro |

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

### 3.5. Tabela `calendar_events` & `whatsapp_templates`
- `calendar_events`: Eventos de medição no local, visitas de alinhamento e montagem final com flags de prioridade e conclusão.
- `whatsapp_templates`: Modelos pré-definidos de mensagens rápidas para envio pelo WhatsApp (ex: confirmação de visita, envio de projeto 3D, solicitação de medição).

---

## 📐 Seção 4: Regras de Negócio do Setor de Marcenaria Fina

### 4.1. Funil Operacional e Estágios do Kanban:
1. **`entrada` (Leads de Entrada)**: Novo contato via anúncio, site ou WhatsApp aguardando primeiro contato.
2. **`nao_responde` (Não Responde)**: Tentativas de contato sem retorno imediato do cliente.
3. **`briefing` (Briefing & Medição)**: Agendamento ou realização da visita técnica para medição a laser in loco e coleta de necessidades (ambientes, preferências de acabamento).
4. **`3d` (Projeto 3D Promob)**: Desenvolvimento da modulação técnica e renderização no software Promob.
5. **`apresentacao` (Apresentação & Orçamento)**: Apresentação do render 3D e proposta comercial detalhada ao cliente.
6. **`contrato` (Fechamento / Contrato)**: Emissão e assinatura do contrato com definição de entrada e parcelamento.
7. **`fabrica` (Pedido de Fábrica)**: Geração do plano de corte (Corte Certo/Promob Cut), compra de chapas de MDF, fitas de borda e ferragens.
8. **`montagem` (Entrega & Montagem)**: Transporte dos módulos e montagem executada pela equipe de marceneiros.
9. **`posvenda` (Pós-Venda & Assistência)**: Vistoria final de entrega, termo de garantia de 5 anos e solicitação de avaliação.
10. **`freezer` (Leads Frios)**: Clientes que postergaram a obra para o próximo semestre.
11. **`cancelado` (Cancelados / Perdidos)**: Oportunidades descartadas com registro de motivo.

### 4.2. Checklist Técnico Obrigatório de Obra:
- [ ] Conferência de medidas em milímetros no local.
- [ ] Mapeamento de pontos hidráulicos (água e esgoto) e saída de gás.
- [ ] Mapeamento de pontos elétricos e tomadas para eletrodomésticos embutidos.
- [ ] Verificação de prumo e esquadro de paredes e forro de gesso.
- [ ] Conferência de plano de corte e fitamento de borda.
- [ ] Envio para produção e separação de ferragens (corrediças telescópicas, dobradiças com amortecedor).
- [ ] Início de montagem e alinhamento de frentes de gavetas e portas.
- [ ] Vistoria final e termo de entrega assinado.

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
| `npm run n8n:deploy` | Faz deploy de automações e fluxos n8n via script de gerenciamento. |
| `npm run n8n:status` | Verifica a conectividade e status dos fluxos n8n configurados. |
| `deploy-dumar.ps1` | Script automatizado em PowerShell que compila o projeto, compacta os pacotes e transfere via SSH/SCP para a VPS com recarga de contêineres Docker (Caddy + Backend Express). |
