## Tarefa Atual: Correção de Contratos & Cadastro de Clientes no Financeiro
- [x] Correção do CNPJ Dumar no gerador de contratos e nas configurações (`42.588.140/0001-72`).
- [x] Edição completa dos dados da contratada no modal do contrato (Razão Social, Fantasia, CNPJ, Telefone, Email, Endereço).
- [x] Botões para puxar dados das configurações ou salvar como padrão permanente da Dumar.
- [x] Correção das condições de pagamento (Entrada PIX + Saldo Cartão no mesmo dia):
  - Saldo do cartão exibido como Complemento (campo do meio).
  - Saldo de montagem zerado / quitado no contrato.
  - Cláusula 3 e cards de impressão ajustados.
- [x] Módulo centralizado de Cadastro de Clientes no Financeiro:
  - Tabela `clients` no banco PostgreSQL com Drizzle ORM.
  - Endpoints `/api/clients` (CRUD completo e sincronização).
  - Modal `CRMClientsModal` com busca, atalho para WhatsApp e sincronização automática com contratos/leads.
  - Botão no cabeçalho do Financeiro e vinculação rápida de clientes no modal de contratos.
- [x] Verificação completa de TypeScript (`npm run check`) e Build (`npm run build`).
- [x] Git add, commit, push e execução do script de deploy.

## Tarefa Anterior: Planejamento & Evolução do CRM Dumar Pro (Documentado para Futuro)
- [x] Raspagem completa de `https://www.planejadospro.com.br/#funcionalidades` (16 módulos mapeados e comparados).
- [x] Elaboração do plano mestre de implementação: `docs/superpowers/plans/2026-10-07-dumar-pro-jev-implementation-plan.md`.
- [x] Elaboração do documento de especificação e roadmap técnico futuro: `docs/ROADMAP-DUMAR-PRO.md`.
- [x] Atualização da arquitetura global do sistema com a seção de roadmap: `.agent/ARCHITECTURE.md`.



