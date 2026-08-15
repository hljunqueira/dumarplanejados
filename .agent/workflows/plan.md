# 📋 Workflow: Planejamento Detalhado (Plan)

Este workflow estabelece o protocolo padrão para elaboração e aprovação de planos de implementação para tarefas de média e alta complexidade no projeto **Dumar Móveis Planejados**.

---

## 🎯 Quando Acionar
- Criação de novas tabelas ou alteração em colunas existentes no PostgreSQL via Drizzle.
- Modificações na integração com Evolution API, Typebot ou webhooks do WhatsApp.
- Criação de novas telas ou módulos dentro do CRM (ex.: relatórios, novas visualizações do funil).
- Refatoração de lógica de cálculo de orçamentos, contratos ou plano de corte.

---

## 🔍 Etapas do Workflow

### 1. Pesquisa & Análise Inicial (Read-Only)
- Inspecione `shared/schema.ts` para entender as entidades envolvidas.
- Inspecione `server/routes.ts` e `server/storage.ts` para verificar contratos de API existentes.
- Inspecione componentes em `client/src/components/crm/` ou páginas correspondentes.
- **Regra**: Não realize alterações em código durante a fase de pesquisa.

### 2. Elaboração do Plano de Implementação
Estruture o plano contendo:
- **Objetivo**: O que a funcionalidade/refatoração visa resolver.
- **Impacto no Banco de Dados**: Modificações no schema Drizzle e compatibilidade com dados legados.
- **Alterações de Backend**: Novos endpoints REST, middlewares ou integrações.
- **Alterações de Frontend**: Novos componentes, gerenciamento de estado e feedback visual.
- **Plano de Validação**: Testes manuais, verificação de tipos e compilação.

### 3. Validação com o Usuário
- Apresente o plano estruturado e solicite alinhamento ou tire eventuais dúvidas de regras de negócio antes de iniciar a escrita de código.
