## Tarefa Atual
- [x] Atualização da Razão Social oficial de `42.588.140 PAULO CESAR BATICKOSKI DE VARGAS – ME` para `Dumar Móveis Planejados Ltda` em todo o sistema.
- [x] Persistência em disco e endpoints REST (`GET/POST /api/company-config`) para os Dados da Empresa.
- [x] Vinculação dinâmica dos Dados da Empresa (Razão Social, Nome Fantasia, CNPJ, Telefone, Endereço, Sede) com minutas, cabeçalhos timbrados e cláusulas de contratos.
- [x] Sanitização automática de contratos legados no visualizador e gerador de contratos.
- [x] Lançamentos financeiros totalmente editáveis: clique em qualquer linha da tabela para abrir o modal de edição (valores, datas de vencimento, pagamentos e detalhes).
- [x] Ajuste de layout da tabela financeira: colunas redimensionadas para que Status e Ações fiquem sempre visíveis sem corte lateral.
- [x] Edição de parcelas individuais (`subTx`) dentro de grupos de custos fixos / recorrentes.
- [x] Validação estática de tipos (`npm run check` -> 0 erros) e build de produção (`npm run build` -> Sucesso).
- [x] Deploy executado com sucesso via `deploy-dumar.ps1` na VPS (`184.107.88.189`), com reinicialização dos contêineres Docker (`backend` e `caddy`).

## Log de Modificações Recentes
- Criados endpoints `/api/company-config` (GET e POST) em `server/routes.ts` com persistência em `data/company-config.json`.
- Integrada a aba "Dados da Empresa" em `client/src/components/crm/crm-configuracoes.tsx` com a nova API e despacho de eventos.
- Atualizado gerador de contratos em `client/src/lib/contract-generator.ts` e visualizador em `client/src/components/crm/crm-contracts-view.tsx` para refletir `Dumar Móveis Planejados Ltda` e `45.890.123/0001-90`.
- Atualizado `client/src/components/crm/crm-financeiro.tsx` com linhas clicáveis, botões visíveis de edição, dicas e larguras de coluna otimizadas.
- Atualizado `MANUAL_DO_SISTEMA_DUMAR.md` com a nova razão social e CNPJ.
- Deploy concluído: pacotes transferidos via SCP e contêineres reiniciados na VPS de produção.

