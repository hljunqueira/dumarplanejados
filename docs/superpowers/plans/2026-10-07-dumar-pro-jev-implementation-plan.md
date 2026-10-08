# Plano de Implementação: IA JEV (Groq) & Sistema Dumar Pro

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o Copiloto de IA JEV (modelo System One da TypeSafe AI) combinado com GROQ para classificação de intenção, score de fechamento e sugestão de respostas em tempo real no atendimento manual do WhatsApp, além de integrar os módulos de alta performance inspirados no Planejados Pro (Simulador de Margem VPL "Olhinho", Radar de Prazos de 6 Marcos e DRE por Obra).

**Architecture:** Arquitetura em duas camadas de IA:
1. **JEV (TypeSafe AI - System 1):** Avaliação ultra-rápida de estado via decisões tipadas (Choice, Score, Noul) para calcular o Score de Fechamento do Lead (0-100) e selecionar a estratégia de próximo passo (`pedir_medidas`, `agendar_visita`, `quebrar_objecao`, `fechamento`).
2. **GROQ (System 2 / Linguagem Natural):** Redação instantânea (<1.5s) de 3 variações de respostas personalizadas de WhatsApp correspondentes à estratégia selecionada pelo Jev.
No frontend React/Tailwind, barra interativa de Smart Replies do Copiloto JEV no `crm-lead-drawer.tsx`, widget dinâmico de margem líquida na negociação e régua de SLA de 6 marcos no lead e no kanban.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Express, PostgreSQL, Drizzle ORM, TypeSafe AI (Jev System One API / SDK) + Groq API (Chat Completions & Whisper Audio).

**Spec:** Arquitetura mapeada a partir do benchmark do Planejados Pro (`https://www.planejadospro.com.br/#funcionalidades`) e das diretrizes de marcenaria fina da Dumar (`.agent/rules/GEMINI.md` e `AGENTS.md`).

---

## Global Constraints
- **Preservação de Dados:** Não resetar tabelas de banco nem sobrescrever `.env*`.
- **Tipagem Estrita:** TypeScript com 0 erros em `npm run check`.
- **Zero Latência no Chat:** O Copiloto JEV deve responder em menos de 2,5 segundos via Groq, com fallbacks contextuais em caso de timeout.
- **Controle Humano no Atendimento Manual (Human-in-the-Loop):** Quando o lead estiver em modo manual, a IA JEV **nunca** envia a mensagem diretamente para o WhatsApp do cliente sem que o operador clique no botão de envio. As sugestões apenas preenchem o input ou oferecem botões de aprovação.
- **Segurança de Preços:** A IA JEV não pode inventar valores monetários em R$ nas sugestões caso não constem expressamente na negociação autorizada.

## Review Focus
1. **Fallback Groq:** Se a chave da Groq atingir rate limit ou oscilar, o Copiloto JEV deve retornar templates inteligentes locais sem travar a interface do vendedor.
2. **Sanitização de Nome do Cliente:** Não usar nomes genéricos (ex: "WhatsApp", "Lead", número de telefone) nas sugestões de mensagem; se o nome for desconhecido, saudar cordialmente e perguntar o nome de forma natural.
3. **Persistência de Marcos do Radar:** O status dos 6 marcos do radar deve ser salvo no JSON `checklist` ou coluna específica do lead no PostgreSQL.
4. **Precisão da Margem VPL:** O cálculo deve considerar taxa real de parcelamento e custo de matéria-prima, emitindo alerta visual vermelho se a margem líquida for inferior a 25%.
5. **Responsividade Mobile:** Tanto o drawer com o Copiloto JEV quanto os novos módulos devem funcionar sem quebra de layout em telas de smartphones e tablets.

---

## Estrutura de Arquivos e Mapeamento de Modificações

### Arquivos a Modificar:
1. `server/routes.ts`:
   - Endpoint `/api/leads/:id/suggest-reply` (Geração de 3 sugestões de resposta via Groq com a persona JEV).
   - Atualização da persona e prompts da IA JEV (nome oficial "JEV - Copiloto Comercial Dumar").
   - Atualização do endpoint de atualização de lead para suportar os marcos do Radar de Prazos e custos de DRE da obra.
2. `client/src/components/crm/crm-lead-drawer.tsx`:
   - Componente do **Copiloto JEV** (Barra de sugestões rápidas acima do input de chat quando em atendimento manual).
   - Botão **"✨ Sugerir com JEV"** com estado de carregamento e inserção no input em 1 clique.
   - Widget do **Simulador de Margem & VPL ("Olhinho da Negociação")** na aba de negociação/valores.
   - Régua do **Radar de Prazos (6 Marcos com SLA)** na aba de status/produção da obra.
   - Painel do **DRE por Contrato / Obra** na aba financeira do lead.
3. `client/src/components/crm/crm-kanban.tsx`:
   - Exibição de badge com indicador de margem líquida e alerta visual de SLA do Radar de Prazos no card do Kanban.
4. `client/src/components/crm/crm-settings.tsx`:
   - Atualização das configurações para refletir a marca **JEV** e parâmetros de criatividade/temperatura do Groq.

---

## Tarefas de Implementação

### Tarefa 1: Backend — Motor Jev (TypeSafe AI) + Groq (`POST /api/leads/:id/suggest-reply`)
**Objetivo:** Integrar o modelo Jev da TypeSafe AI para decisão rápida/score de fechamento e o Groq para redação das sugestões de resposta para o atendente.

- [ ] **Passo 1.1: Camada de Decisão com Jev (System One):**
  - O Jev avalia o estado do lead e retorna decisões tipadas:
    - **Choice (`next_action`):** Escolhe a melhor ação entre:
      - `pedir_medidas_fotos`: cliente ainda não informou dimensões do espaço.
      - `agendar_visita_tecnica`: cliente tem interesse e precisa de medição na obra.
      - `convidar_escritorio`: cliente prefere conhecer materiais e ver projetos no escritório da Dumar.
      - `esclarecer_duvida_tecnica`: cliente tem receio sobre umidade, ferragens ou prazos.
      - `negociar_fechamento`: cliente já tem proposta e está na fase de decisão.
    - **Score (`closing_probability`):** Pontuação de 0 a 100 de probabilidade de fechamento (o exato recurso do Planejados Pro).
    - **Noul (`has_urgency`):** Probabilidade de o cliente estar com prazo curto de obra/mudança.
  - *Resiliência de Integração:* Suporte à `TYPESAFE_API_KEY` (`https://api.typesafe.ai/v1/systemone`) e fallback automático e transparente via Groq estruturado com Zod caso a chave da TypeSafe ainda esteja pendente de liberação da waitlist (`typesafeai.typeform.com`).
- [ ] **Passo 1.2: Camada de Redação com Groq (System Two):**
  - Com a decisão do Jev em mãos, o Groq redige em <1.5s as **3 variações de mensagens curtas de WhatsApp**, adaptadas ao perfil do cliente e no tom humanizado da Dumar.
- [ ] **Passo 1.3: Exposição da Rota `POST /api/leads/:id/suggest-reply`:**
  - Retorno JSON:
    ```json
    {
      "success": true,
      "closingScore": 85,
      "suggestedAction": "agendar_visita_tecnica",
      "urgency": 0.72,
      "suggestions": [
        { "type": "consultiva", "label": "Propor medição na obra", "text": "..." },
        { "type": "escritorio", "label": "Convidar para um café no escritório", "text": "..." },
        { "type": "fotos", "label": "Pedir fotos do ambiente atual", "text": "..." }
      ]
    }
    ```
- [ ] **Passo 1.4:** Testar a rota via script interno e validar o tempo de resposta (<2s) e qualidade das respostas geradas.

---

### Tarefa 2: Frontend — Barra de Sugestões do Copiloto JEV no Chat Manual (`crm-lead-drawer.tsx`)
**Objetivo:** Permitir ao vendedor visualizar as sugestões inteligentes da IA JEV e aplicá-las com 1 clique no WhatsApp.

- [ ] **Passo 2.1:** Adicionar estado no componente `crm-lead-drawer.tsx`:
  - `jevSuggestions`: array de sugestões recebidas da API.
  - `loadingSuggestions`: booleano indicando geração em andamento.
  - `fetchJevSuggestions`: função assíncrona que chama `/api/leads/:id/suggest-reply`.
- [ ] **Passo 2.2:** Renderizar a barra flutuante do **Copiloto JEV** logo acima da caixa de digitação:
  - Exibir quando `selectedLead.aiPaused === true` (atendimento manual) ou sob demanda.
  - Botão com ícone de brilho: `✨ Sugestões JEV (Groq)` com badge de modelo ultrarrápido.
  - Pílulas interativas com texto preview: ao clicar em uma pílula, o texto completo é transferido para o `chatInput` e o foco vai para o campo de digitação para o operador revisar.
  - Botão de recarregar novas sugestões caso o operador queira outras opções.
- [ ] **Passo 2.3:** Integrar atalho rápido para gerar resposta ao pressionar botão ou abrir a aba de chat.

---

### Tarefa 3: Identidade JEV & Persona no Robô Comercial
**Objetivo:** Padronizar a persona JEV em todo o ecossistema (atendimento automático e copiloto manual).

- [ ] **Passo 3.1:** Em `server/routes.ts`, atualizar `assistantName` padrão para `"JEV - Inteligência da Dumar"`.
- [ ] **Passo 3.2:** Em `client/src/components/crm/crm-settings.tsx`, atualizar a interface de configuração para exibir "JEV Copiloto & Automação Comercial (Powered by Groq Ultra-Fast)".

---

### Tarefa 4: Simulador de Margem Líquida & VPL ("Olhinho da Negociação")
**Objetivo:** Proteger a lucratividade da Dumar recalculando a margem líquida ao vivo na proposta.

- [ ] **Passo 4.1:** Adicionar no drawer do lead (`crm-lead-drawer.tsx`) a seção/popover **"Olhinho da Negociação (Margem & VPL)"**:
  - Campos de entrada:
    - Valor da Venda ($V$)
    - Custo Estimado de Chapas e Ferragens ($C_{mat}$)
    - Custo de Frete e Diárias de Montagem ($C_{mont}$)
    - Número de parcelas no cartão e taxa da maquininha ($T_{cartao}$)
    - Percentual de impostos ($I$) e comissão ($C_{comiss}$)
  - Cálculo ao vivo:
    $$\text{Margem Líquida R\$} = V - C_{mat} - C_{mont} - (V \times T_{cartao}) - (V \times I) - (V \times C_{comiss})$$
    $$\text{Margem Líquida \%} = \frac{\text{Margem Líquida R\$}}{V} \times 100$$
- [ ] **Passo 4.2:** Trava de Alerta Visual:
  - Margem $\ge 35\%$: Badge Verde Escuro ("Excelente Margem").
  - Margem $25\% - 34\%$: Badge Âmbar ("Margem Padrão").
  - Margem $< 25\%$: Badge Vermelho Pulsante ("Atenção: Margem Abaixo do Padrão").
- [ ] **Passo 4.3:** Salvar os parâmetros de custo no objeto do lead (`leads.materials` ou novo campo JSON).

---

### Tarefa 5: Radar de Prazos (Linha do Tempo de 6 Marcos com SLA)
**Objetivo:** Evitar atrasos em obras e centralizar os prazos da marcenaria em uma esteira visual clara.

- [ ] **Passo 5.1:** Definir os 6 marcos padrão da marcenaria Dumar:
  1. `1. Medição Fina` (Visita no imóvel para conferir medidas reais de paredes, pontos de hidráulica e elétrica).
  2. `2. Projeto Executivo` (Ajuste técnico fino no Promob e detalhamento construtivo).
  3. `3. Pedido de Fábrica` (Envio de corte para fornecedores de MDF/Arauco e ferragens).
  4. `4. Chegada de Materiais` (Conferência de chapas, fitas de borda e ferragens na loja).
  5. `5. Montagem na Obra` (Montador executando na casa do cliente).
  6. `6. Vistoria & Aceite` (Inspeção final e termo de garantia de 5 anos).
- [ ] **Passo 5.2:** Implementar o componente visual do **Radar de Prazos** no `crm-lead-drawer.tsx`:
  - Stepper horizontal/vertical interativo com checkmarks, data de conclusão e responsável.
  - Alerta de dias restantes para a data de entrega prometida (`deliveryDate`).
- [ ] **Passo 5.3:** Exibir indicador resumido do marco atual no card do lead em `crm-kanban.tsx`.

---

### Tarefa 6: DRE por Contrato / Obra
**Objetivo:** Permitir ao gestor visualizar a lucratividade líquida de um contrato individualmente sem planilhas paralelas.

- [ ] **Passo 6.1:** Criar aba ou seção "DRE desta Obra" no Drawer e em `crm-contracts-view.tsx`.
- [ ] **Passo 6.2:** Montar a tabela demonstrativa estruturada:
  - (+) Receita Bruta Contratada
  - (-) Deduções Financeiras (Taxas de Cartão / Financiamento)
  - (=) Receita Líquida Real
  - (-) Custo de Materiais (MDF, Tamponamentos, Dobradiças, Corrediças)
  - (-) Custo Operacional de Montagem e Frete
  - (-) Comissões e RT de Arquiteto
  - (=) **Resultado Líquido da Obra (R$ e %)**
- [ ] **Passo 6.3:** Vinculação com transações do financeiro (`financialTransactions`) filtradas por `leadId`.

---

### Tarefa 7: Validação Técnica, Testes e Verificação
**Objetivo:** Garantir estabilidade total do sistema antes do deploy.

- [ ] **Passo 7.1:** Rodar `npm run check` para validação de tipagem estrita no TypeScript.
- [ ] **Passo 7.2:** Rodar `npm run build` para validação de empacotamento sem erros.
- [ ] **Passo 7.3:** Testar a geração de sugestões com a IA JEV em conversas reais simuladas.
- [ ] **Passo 7.4:** Atualizar `SCRATCHPAD.md` e apresentar evidências técnicas de funcionamento.
