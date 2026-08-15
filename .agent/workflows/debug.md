# 🐛 Workflow: Diagnóstico e Depuração Sistemática (Debug)

Este workflow estabelece o método para investigar, isolar e solucionar falhas em qualquer camada da plataforma Dumar Móveis.

---

## 🎯 Protocolo de Investigação em 4 Etapas

```
1. Coleta de Evidências ➔ 2. Isolamento de Camada ➔ 3. Reprodução & Correção ➔ 4. Verificação de Regressão
```

---

## 🔬 Guia por Camada

### 1. Falhas no Banco de Dados / Drizzle ORM
- **Sintomas**: Erro 500 em rotas de leads/transações, campos JSON não salvando ou erro de migração.
- **Investigação**:
  - Verifique se a variável `DATABASE_URL` está definida no `.env`.
  - Inspecione se os campos armazenados como JSON string (`rooms`, `checklist`, `chatHistory`, `dataJson`) estão sendo serializados com `JSON.stringify` antes do insert/update.
  - Ao ler do banco, assegure que o parse trate casos onde o campo já é retornado como objeto ou string nula (`try { JSON.parse(...) } catch { ... }`).
  - Execute `npm run db:push` para alinhar as tabelas com o PostgreSQL.

### 2. Falhas na Integração com Evolution API (WhatsApp)
- **Sintomas**: QR Code não carrega, mensagens não são enviadas ou webhook não responde.
- **Investigação**:
  - Verifique `EVOLUTION_URL` e `EVOLUTION_APIKEY` no ambiente.
  - Teste a rota `GET /api/evolution/instances` para checar conectividade com o serviço na VPS/Docker.
  - No envio de mídias/documentos (`POST /api/evolution/send-media`), verifique se o Base64 foi limpo do cabeçalho `data:...;base64,`.
  - No webhook (`POST /api/evolution/webhook`), valide a normalização do número de telefone com DDI (55) e DDD para matching correto com o lead.

### 3. Falhas no Frontend / React / Vite
- **Sintomas**: Tela branca, erros de renderização, falhas no drag-and-drop do Kanban ou travamentos.
- **Investigação**:
  - Abra o console do navegador e inspecione logs de erro de execução.
  - Execute `npm run check` no terminal para detectar erros de tipo ou propriedades inexistentes.
  - Verifique se o estado inicial de arrays (`leads`, `chatHistory`, `promobFiles`) possui fallback `[]` para evitar erros de `.map()` em valores `undefined`.

### 4. Falhas de Deploy e Produção
- **Sintomas**: Erro no script `deploy-dumar.ps1`, falha ao extrair tar.gz ou contêiner reiniciando em loop.
- **Investigação**:
  - Execute `npm run build` localmente para garantir que o bundle foi gerado em `dist/`.
  - Verifique a conectividade SSH com a VPS (`ssh -p 22 root@184.107.88.189`).
  - Inspecione logs do Caddy e do contêiner Express via Docker Compose na VPS (`docker compose logs -f backend`).
