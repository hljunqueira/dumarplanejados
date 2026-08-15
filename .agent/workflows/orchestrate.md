# 🎼 Workflow: Orquestração e Coordenação Multi-Agente (Orchestrate)

Este workflow define as diretrizes para coordenação de tarefas de desenvolvimento no ecossistema Dumar Móveis, distribuindo responsabilidades entre as personas especializadas.

---

## 👥 Matriz de Especialização e Responsabilidades

```
                    ┌─────────────────────────┐
                    │    Orchestrator Agent   │
                    └────────────┬────────────┘
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Database Arch   │    │  Backend Eng     │    │  Frontend UI/UX  │
│  (Drizzle/PG)    │    │  (Express/APIs)  │    │  (React/Tailwind)│
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │ Marcenaria Domain Expert│
                    │ (Validação de Negócio)  │
                    └─────────────────────────┘
```

---

## 🔄 Protocolo de Execução Sequencial

1. **Definição de Contratos e Dados (Database Architect)**:
   - Modifica `shared/schema.ts` com tipagem estrita e validação `drizzle-zod`.
   - Gera e executa push no banco com `npm run db:push`.

2. **Implementação de Serviços e Rotas (Backend Engineer)**:
   - Atualiza `server/storage.ts` com métodos da interface `IStorage`.
   - Implementa endpoints em `server/routes.ts` com tratamento robusto de erros e logs claros.

3. **Desenvolvimento de Interface e Estado (Frontend Specialist)**:
   - Constrói ou ajusta componentes em `client/src/components/crm/` ou `client/src/pages/`.
   - Conecta a interface às rotas usando React Query ou chamadas fetch nativas.
   - Aplica micro-animações, estados de loading, feedback de erro e design responsivo.

4. **Validação de Domínio (Marcenaria Expert & QA)**:
   - Valida se o comportamento reflete as regras reais de fabricação, medição, cálculo financeiro e geração de contratos.

5. **Consolidação & Verificação Final (Orchestrator)**:
   - Executa `npm run check` para garantir ausência de erros de TypeScript.
   - Executa `npm run build` para garantir que o bundle de produção está íntegro.
