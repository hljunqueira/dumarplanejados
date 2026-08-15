# 🧭 Diretrizes Gerais e Sistema de Governança de IA — Dumar Móveis Planejados

Este documento estabelece os padrões arquiteturais, operacionais, comportamentais e de design para qualquer agente de IA ou desenvolvedor atuando no repositório da **Dumar Móveis Planejados**.

---

## 🏛️ 1. Hierarquia de Precedência Normativa

Para dirimir ambiguidades ou conflitos de contexto, a seguinte hierarquia deve ser rigorosamente obedecida:

```
┌────────────────────────────────────────────────────────┐
│  P0: Regras Globais e de Governança (.agent/rules/GEMINI.md) │
├────────────────────────────────────────────────────────┤
│  P1: Contexto e Especialização dos Agentes (ARCHITECTURE.md) │
├────────────────────────────────────────────────────────┤
│  P2: Skills e Domínio Específico (.agent/skills/*)      │
└────────────────────────────────────────────────────────┘
```

- **P0 (.agent/rules/GEMINI.md)**: Governança mandatória de código, segurança, tipagem, UX/UI e classificação de tarefas.
- **P1 (.agent/ARCHITECTURE.md)**: Papéis e atribuições dos agentes de arquitetura, frontend, backend e dados.
- **P2 (.agent/skills/*)**: Regras técnicas especializadas de módulos e regras de negócio de marcenaria.

---

## 🎯 2. Request Classifier (Matriz de Classificação de Pedidos)

Todo comando ou requisição de usuário deve ser classificado previamente em uma das 5 categorias abaixo:

| Categoria | Descrição | Protocolo de Ação Obrigatório |
|---|---|---|
| **Question** | Dúvidas conceituais, consultas de rotas, schemas ou regras de negócio. | Responder de forma direta, técnica, precisa e com links de arquivos (`file:///...`). Sem alterações de código. |
| **Survey / Research** | Mapeamento de dependências, investigação de fluxos, análise de performance ou auditoria. | Inspecionar arquivos com ferramentas de leitura (`view_file`, `grep_search`), sintetizar descobertas estruturadas e apontar soluções. |
| **Simple Code** | Correção pontual de bugs (ex: ajuste de estilo, correção de rota, sanitização de entrada, tipo TypeScript). | Implementar diretamente utilizando `replace_file_content` com validação de tipagem imediata (`npm run check`). |
| **Complex Code / Refactor** | Novos módulos do CRM, criação de tabelas no Drizzle, fluxos de WhatsApp/Evolution API, gerador de contratos ou alteração de pipeline. | Criar plano de implementação estruturado, mapear impacto no banco/rotas/telas, executar por etapas e validar build. |
| **Design & UI** | Criação ou refinamento de telas da Landing Page ou CRM (Landing, Kanban, Drawer, Financeiro, Agenda). | Aplicar o Design System Premium de Marcenaria Fina (madeira, grafite, dourado/âmbar, Radix UI, Framer Motion, Tailwind). |

---

## 🤖 3. Intelligent Agent Routing (Roteamento de Especialistas)

| Especialista | Gatilho / Responsabilidade |
|---|---|
| **Orchestrator Agent** | Coordenação geral de tarefas multi-escopo, planejamento e validação final. |
| **Frontend UI/UX Specialist** | Desenvolvimento React 18, Tailwind CSS, Radix UI, Wouter, Framer Motion e consistência visual. |
| **Backend & API Engineer** | Endpoints Express, autenticação segura, Webhooks de WhatsApp (Evolution API), Typebot e n8n. |
| **Database Architect** | Schema Drizzle ORM, migrações PostgreSQL, tipagem `drizzle-zod` e integridade referencial. |
| **Marcenaria Domain Expert** | Regras de negócio de móveis planejados, checklist de montagem, corte, integração Promob e contratos. |

---

## 🛡️ 4. Socratic Gate & Clean Code Protocols

### Protocolo Pré-Codificação (Socratic Gate):
1. **Compreensão Completa**: Nunca assuma suposições cegas sobre schemas do Drizzle ou estado do React. Inspecione `shared/schema.ts`, `server/routes.ts` e componentes antes de alterar.
2. **Preservação de Integridade**: Mantenha o código existente limpo, preservando comentários de negócio e assinaturas de APIs públicas.
3. **Tipagem Estrita**: TypeScript em modo estrito. Não utilize `any` sem justificativa técnica plausível. Use schemas Zod compartilhados.
4. **Resiliência de Estado**: Ao manipular campos em formato JSON armazenados em colunas de texto do PostgreSQL (`rooms`, `promobFiles`, `checklist`, `chatHistory`), garanta sempre tratamento com `try/catch` e fallbacks de parse.

---

## 🎨 5. Diretrizes de Design & UI — Nicho Móveis Planejados & Marcenaria Fina

A Dumar Móveis Planejados atende clientes de alto padrão em móveis sob medida. O design de todas as telas (públicas e administrativas) deve refletir:

### Paleta de Cores e Materiais:
- **Tons Base**: Grafite profundo (`#0f172a`, `#1e293b`), Ardósia e Preto Nobre para ambientação sofisticada no CRM e Dark Mode.
- **Tons de Acento & Madeira**: Âmbar / Carvalho Dourado (`#d97706`, `#b45309`), Dourado Nobre (`#eab308`), Azul Profundo (`#2563eb`, `#1d4ed8`).
- **Estados Operacionais no Funil**:
  - *Leads Entrada*: Azul Cobalto
  - *Briefing & Medição*: Roxo Ametista
  - *Projeto 3D Promob*: Branco / Prata
  - *Apresentação & Orçamento*: Cinza Metálico
  - *Fechamento / Contrato*: Teal / Esmeralda
  - *Fábrica & Corte*: Laranja Queimado
  - *Entrega & Montagem*: Rosa Magenta / Terracota
  - *Pós-Venda*: Verde Oliva / Esmeralda

### Tipografia & Elementos Visuais:
- **Tipografia**: Família `Inter` com pesos balanceados (400, 500, 600, 700).
- **Ícones**: `lucide-react` com espessura uniforme (`strokeWidth={1.75}`).
- **Animações**: Micro-interações táteis com `framer-motion` (fade-in, slide-up, drag-and-drop suave no Kanban).
- **Acessibilidade & Responsividade**: Layouts Mobile-First com suporte a drag horizontal com grab-to-scroll e botões de toque confortáveis.
