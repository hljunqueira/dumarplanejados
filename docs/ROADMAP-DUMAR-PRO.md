# 🧭 Roadmap Técnico Dumar Pro — Módulos Verticais & Copiloto JEV (TypeSafe AI + Groq)

> **Documento de Especificação & Arquitetura Futura**  
> **Status:** Planejado & Documentado para Execução Futura  
> **Base de Referência:** Benchmark do Planejados Pro (`planejadospro.com.br`) + Motor Híbrido JEV (TypeSafe AI) & Groq

---

## 🏛️ 1. Visão Geral Estratégica

Este documento reúne todas as especificações técnicas, schemas de dados, contratos de API e interfaces dos novos módulos planejados para o ecossistema **Dumar Móveis Planejados**.

O objetivo da evolução é transformar o CRM operacional da Dumar em um ERP vertical completo para marcenaria de alto padrão, combinando:
1. **Inteligência Artificial de Decisão Rápida (JEV - TypeSafe AI)** para score de fechamento (0–100) e classificação de intenções.
2. **Inteligência Artificial Generativa (GROQ)** para redação ultra-rápida (<1.5s) de respostas humanizadas no atendimento manual do WhatsApp.
3. **Controle Financeiro e Fabril Rigoroso (Inspirado no Planejados Pro)** com cálculo de margem líquida ao vivo ("Olhinho VPL"), esteira de 6 marcos de prazos (SLA) e DRE isolado por contrato.

---

## 🧠 2. Módulo de IA: Copiloto JEV (TypeSafe AI) + GROQ

### 2.1. O que é o Jev (TypeSafe AI)
O **Jev** é o primeiro modelo **System One** desenvolvido pela **TypeSafe AI** (`typesafe.ai` / cadastro via `typesafeai.typeform.com`), fundado por ex-pesquisadores da OpenAI.
- **Diferencial:** Não gera texto livre (prosa); avalia o estado da conversa e retorna **decisões estruturadas, tipadas e calibradas em menos de 100ms**.
- **Primitivas do Jev aplicadas à Marcenaria:**
  - **`Score` (`closing_probability`):** Retorna uma pontuação de 0 a 100 indicando a probabilidade de fechamento daquele lead (idêntico ao score de fechamento do Planejados Pro).
  - **`Choice` (`next_action`):** Seleciona matematicamente a ação mais adequada para o momento:
    - `pedir_medidas_fotos`: cliente demonstrou interesse, mas não enviou dimensões.
    - `agendar_visita_tecnica`: cliente possui ambiente definido e quer medição no imóvel.
    - `convidar_escritorio`: cliente tem dúvidas sobre acabamentos/padrões e prefere atendimento presencial.
    - `esclarecer_duvida_tecnica`: cliente levantou objeção sobre umidade, garantia ou ferragens.
    - `negociar_fechamento`: proposta já apresentada, momento de ajuste de condições.
  - **`Noul` (`has_urgency`):** Probabilidade de o cliente estar em fase final de acabamento da obra ou mudança próxima.

### 2.2. O Papel do GROQ (System Two)
- O GROQ atua como o **motor de redação em linguagem natural**.
- Ao receber a decisão tipada do Jev (`next_action`), o Groq consulta o histórico do cliente e redige em menos de 1,5s **3 variações de mensagens curtas de WhatsApp**, elegantes e no tom consultivo da Dumar.

### 2.3. Copiloto no Chat Manual (`crm-lead-drawer.tsx`)
- **Gatilho:** Quando o atendimento automático estiver pausado (`selectedLead.aiPaused === true`) ou sob demanda.
- **Interface:** Barra horizontal suspensa `✨ Sugestões JEV (TypeSafe + Groq)` logo acima do campo de digitação:
  - Exibe o badge de probabilidade: `🎯 85% Fechamento • Recomendado: Propor Medição`.
  - Exibe 3 pílulas clicáveis com as respostas sugeridas.
  - **Interação:** 1 clique na pílula transfere o texto para o `chatInput` do WhatsApp para o operador revisar, editar e disparar (**Human-in-the-Loop absoluto**).

### 2.4. Contrato de API Previsto
- **Rota:** `POST /api/leads/:id/suggest-reply`
- **Payload de Resposta:**
```json
{
  "success": true,
  "closingScore": 82,
  "suggestedAction": "agendar_visita_tecnica",
  "urgency": 0.75,
  "suggestions": [
    {
      "type": "visita_obra",
      "label": "Propor medição técnica gratuita na obra",
      "text": "Olá, Carlos! Tudo bem? Como seu espaço já está no contrapiso, podemos agendar nossa visita técnica gratuita para conferir as medidas exatas da cozinha. Qual período fica melhor para você nesta quinta ou sexta?"
    },
    {
      "type": "escritorio",
      "label": "Convidar para um café no escritório",
      "text": "Olá, Carlos! Seria ótimo nos conhecermos aqui no nosso escritório em Balneário Arroio do Silva para você ver os mostruários de MDF e puxadores. Que tal um café amanhã?"
    },
    {
      "type": "fotos",
      "label": "Pedir fotos atuais da parede/espaço",
      "text": "Carlos, você teria fotos atuais de como está o espaço da cozinha hoje? Assim nossa equipe de projetos já adianta uma prévia do layout!"
    }
  ]
}
```

### 2.5. Resiliência de Credenciais
- Se `process.env.TYPESAFE_API_KEY` estiver configurada, chama `https://api.typesafe.ai/v1/systemone` com o modelo `jev-latest`.
- Caso o cadastro ainda esteja na fila de aprovação do Typeform (`typesafeai.typeform.com`), o backend possui **fallback espelhado via Groq (`openai/gpt-oss-120b`)** estruturado com schema Zod, garantindo funcionamento ininterrupto.

---

## 💰 3. Módulo de Margem Líquida: Simulador VPL ("Olhinho da Negociação")

### 3.1. Problema Resolvido
No modelo tradicional, o vendedor aplica descontos e parcelamentos sem saber quanto restará de lucro líquido após custos de matéria-prima, comissão e taxas de maquininha.

### 3.2. Fórmula Matemática do VPL / Margem Líquida
$$\text{Receita Líquida} = \text{Valor Venda} - (\text{Valor Venda} \times \text{Taxa Cartão}) - (\text{Valor Venda} \times \text{Imposto})$$
$$\text{Custos Diretos} = \text{Custo MDF/Ferragens} + \text{Custo Montador} + \text{Frete} + (\text{Valor Venda} \times \text{Comissão})$$
$$\text{Margem Líquida R\$} = \text{Receita Líquida} - \text{Custos Diretos}$$
$$\text{Margem Líquida \%} = \left(\frac{\text{Margem Líquida R\$}}{\text{Valor Venda}}\right) \times 100$$

### 3.3. Travas de Alerta Visual no CRM
- **Margem $\ge 35\%$:** Badge Verde Nobre (`bg-emerald-500/20 text-emerald-400`) — *Margem Excelente*.
- **Margem entre $25\%$ e $34\%$:** Badge Âmbar Dourado (`bg-amber-500/20 text-amber-400`) — *Margem Padrão*.
- **Margem $< 25\%$:** Badge Vermelho Alerta (`bg-red-500/20 text-red-400 animate-pulse`) — *Atenção: Margem Abaixo do Piso Mínimo*.

---

## ⏱️ 4. Módulo de Produção: Radar de Prazos (Linha do Tempo de 6 Marcos com SLA)

### 4.1. Os 6 Marcos Verticais da Marcenaria Dumar
Inspirado na esteira do Planejados Pro, a obra percorre 6 marcos conectados ao contrato:

1. **Marco 1: Medição Fina**
   - Medição in-loco no imóvel com laser, conferência de tomadas, pontos de esgoto e gás.
2. **Marco 2: Projeto Executivo**
   - Ajustes milimétricos no Promob pós-medição e aprovação técnica de furação.
3. **Marco 3: Pedido de Fábrica & Corte**
   - Envio da lista de peças para corte, tamponamento e usinagem.
4. **Marco 4: Chegada de Chapas & Ferragens**
   - Conferência de materiais na marcenaria (MDF Duratex/Arauco, dobradiças com amortecedor, corrediças telescópicas/ocultas).
5. **Marco 5: Montagem na Obra**
   - Entrada do montador com rotas e checklist digital de instalação.
6. **Marco 6: Vistoria & Termo de Aceite**
   - Inspeção final de alinhamento de portas, limpeza de peças e emissão do certificado de garantia de 5 anos.

### 4.2. Estrutura de Armazenamento no Banco de Dados
Os marcos são armazenados no JSON `checklist` ou coluna dedicada `production_milestones` em `leads`:
```json
{
  "milestones": [
    { "id": 1, "name": "Medição Fina", "status": "completed", "completedAt": "2026-10-10", "responsible": "Paulo" },
    { "id": 2, "name": "Projeto Executivo", "status": "in_progress", "dueDate": "2026-10-14", "responsible": "Projetista" },
    { "id": 3, "name": "Pedido de Fábrica", "status": "pending", "dueDate": "2026-10-18" },
    { "id": 4, "name": "Chegada Material", "status": "pending", "dueDate": "2026-10-28" },
    { "id": 5, "name": "Montagem", "status": "pending", "dueDate": "2026-11-05" },
    { "id": 6, "name": "Vistoria & Entrega", "status": "pending", "dueDate": "2026-11-10" }
  ]
}
```

---

## 📊 5. Módulo Contábil: DRE por Contrato / Obra

### 5.1. Conceito
Demonstração de Resultado isolada por cliente. Enquanto o módulo `crm-financeiro.tsx` mede a saúde geral da empresa, o **DRE por Contrato** audita se aquele contrato específico gerou lucro ou prejuízo.

### 5.2. Estrutura do DRE
```
(+) RECEITA BRUTA CONTRATADA .................... R$ 45.000,00 (100,0%)
(-) Deduções Financeiras (Taxa Cartão 12x) ..... -R$  3.600,00 ( -8,0%)
(-) Impostos sobre a Nota ....................... -R$  2.700,00 ( -6,0%)
(=) RECEITA LÍQUIDA REAL ........................ R$ 38.700,00 ( 86,0%)
(-) Custos de MDF e Tamponamentos .............. -R$ 11.250,00 (-25,0%)
(-) Custos de Ferragens e Puxadores ............ -R$  4.500,00 (-10,0%)
(-) Vidraçaria, Iluminação e Fitas LED ......... -R$  1.800,00 ( -4,0%)
(-) Diárias de Montagem e Frete ................ -R$  3.600,00 ( -8,0%)
(-) Comissão Venda / RT Arquiteto .............. -R$  2.250,00 ( -5,0%)
-----------------------------------------------------------------------
(=) LUCRO LÍQUIDO DA OBRA ....................... R$ 15.300,00 ( 34,0%)
```

---

## 📲 6. Módulo de Campo: Portal Web do Montador (Mobile / PWA)

### 6.1. Funcionalidades
- Rota acessível sem necessidade de login complexo via token de segurança: `/montador/:token`.
- **Botão Waze / Google Maps:** Abre a rota diretamente com o endereço cadastrado do cliente.
- **Checklist Inicial de Paredes e Pisos:** O montador fotografa o estado do cômodo antes de começar a montagem (protegendo a Dumar contra acusações de danos em pisos ou tintas).
- **Checklist de Peças Montadas:** Marcação por ambiente (módulos inferiores, aéreos, gaveteiros, tamponamentos, ajustes de rodapé).
- **Fotos da Obra Concluída:** Envio de fotos em alta resolução direto da câmera do celular para o CRM.
- **Assinatura Touch do Cliente:** Termo de vistoria assinado com o dedo na tela do celular do montador.

---

## 🔧 7. Módulo Pós-Venda: Assistência Técnica & Garantia

### 7.1. Funcionalidades
- Pipeline no CRM exclusivo para chamados de garantia pós-instalação.
- Cadastro rápido:
  - Tipo de assistência: regulagem de dobradiças, substituição de amortecedor, substituição de peça danificada por água/uso, ajuste de gavetas.
  - Fotos da peça com problema.
  - SLA de atendimento: máximo de 5 dias úteis para contato e 15 dias úteis para troca da peça.

---

## 📑 8. Guia de Implementação Futura (Checklist de Execução)

Quando o desenvolvedor for iniciar a codificação dessas funcionalidades, seguir os passos abaixo:

### Fase 1: Copiloto JEV + Groq
1. Editar `server/routes.ts` adicionando a rota `POST /api/leads/:id/suggest-reply` com chamada ao Groq (`openai/gpt-oss-120b`) e suporte ao SDK da TypeSafe AI.
2. Editar `client/src/components/crm/crm-lead-drawer.tsx` inserindo a barra de sugestões e o botão `✨ Sugerir com JEV`.
3. Validar tempo de resposta e testar em `npm run check`.

### Fase 2: Olhinho VPL & Radar de Prazos
1. Adicionar componente de cálculo de margem líquida na aba de valores de `crm-lead-drawer.tsx`.
2. Adicionar o componente visual do Radar de 6 Marcos em `crm-lead-drawer.tsx` e o badge de status em `crm-kanban.tsx`.
3. Validar persistência no banco de dados (`leads.checklist` e `leads.materials`).

### Fase 3: DRE por Contrato & Portal do Montador
1. Adicionar visualização do DRE individual no lead e no contrato (`crm-contracts-view.tsx`).
2. Criar a rota pública tokenizada do montador `/montador/:token` no Wouter.
3. Testar compilação com `npm run build` e executar deploy com `deploy-dumar.ps1`.
