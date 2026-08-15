# 🚀 Workflow: Pré-Deploy e Publicação em Produção (Deploy)

Este workflow define as etapas mandatórias para compilação, validação de integridade e deploy da plataforma **Dumar Móveis Planejados** em ambiente de produção (VPS Docker + Caddy).

---

## 📋 Checklist de Pré-Deploy

Antes de executar a publicação para o servidor de produção, valide cada item:

- [ ] **Validação Estática de Tipos**: `npm run check` executado com zero erros de compilação.
- [ ] **Sincronização de Banco de Dados**: Schema `shared/schema.ts` validado contra o PostgreSQL com `npm run db:push`.
- [ ] **Build de Produção**: `npm run build` gerando com sucesso `dist/public` (Frontend) e `dist/index.js` (Backend Node).
- [ ] **Variáveis de Ambiente**: Arquivo `.env` configurado com `DATABASE_URL`, `EVOLUTION_URL`, `EVOLUTION_APIKEY` e segredos de sessão.

---

## 🛠️ Procedimento de Execução do Deploy

O deploy automatizado da Dumar Móveis é orquestrado pelo script PowerShell `deploy-dumar.ps1`:

```powershell
# Execução na raiz do projeto:
.\deploy-dumar.ps1
```

### O que o script realiza automaticamente:
1. **Compilação**: Executa `npm run build` para gerar os bundles otimizados.
2. **Empacotamento Frontend**: Compacta `dist/public` em `dist.tar.gz`.
3. **Empacotamento Backend**: Compacta `dist/index.js` e `package.json` em `backend.tar.gz`.
4. **Transferência Segura**: Envia os arquivos compactados para a VPS via SCP (`root@184.107.88.189:/root/dumar-infra/`).
5. **Extração & Reinicialização**: Descompacta nos diretórios do frontend e backend e reinicia os contêineres `backend` e `caddy` via Docker Compose.
6. **Limpeza**: Remove os arquivos temporários compactados locais.

---

## 🔍 Validação Pós-Deploy

1. Acesse o domínio oficial da Dumar Móveis no navegador (`https://dumarplanejados.com.br` ou IP da VPS).
2. Verifique o carregamento da Landing Page e o botão de WhatsApp.
3. Acesse `/crm` e realize login administrativo (`admin` ou `paulo@dumarplanejados.com.br`).
4. Verifique o status da instância na aba Conexões do WhatsApp e teste a abertura do Kanban e emissão de contratos.
