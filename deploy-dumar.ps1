# PowerShell Deploy Script - Dumar Planejados

Write-Host "--- Iniciando deploy do projeto Dumar Planejados ---" -ForegroundColor Cyan

# 1. Compilar o projeto (Frontend e Backend Server)
Write-Host "Compilando assets de producao (npm run build)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao compilar o projeto com npm run build." -ForegroundColor Red
    exit 1
}

# 2. Compactar o Frontend (dist/public)
Write-Host "Compactando arquivos de frontend (dist/public)..." -ForegroundColor Yellow
if (Test-Path "dist.tar.gz") {
    Remove-Item "dist.tar.gz" -Force
}
tar -czf dist.tar.gz -C dist/public .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao compactar os arquivos de frontend." -ForegroundColor Red
    exit 1
}

# 3. Compactar o Backend Server (dist/index.js e package.json)
Write-Host "Compactando servidor backend Express..." -ForegroundColor Yellow
if (Test-Path "backend.tar.gz") {
    Remove-Item "backend.tar.gz" -Force
}
tar -czf backend.tar.gz -C dist index.js -C .. package.json
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao compactar o servidor backend." -ForegroundColor Red
    exit 1
}

# 4. Enviar os pacotes para a VPS via SCP
Write-Host "Enviando pacotes para a VPS via SCP..." -ForegroundColor Yellow
ssh -p 22 root@184.107.88.189 "mkdir -p /root/dumar-infra/backend"
scp -P 22 dist.tar.gz root@184.107.88.189:/root/dumar-infra/frontend/dist.tar.gz
scp -P 22 backend.tar.gz root@184.107.88.189:/root/dumar-infra/backend/backend.tar.gz
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao transferir arquivos para a VPS via SCP." -ForegroundColor Red
    exit 1
}

# 5. Extrair e reiniciar Caddy e Backend na VPS
Write-Host "Extraindo arquivos e reiniciando conteineres na VPS..." -ForegroundColor Yellow
ssh -p 22 root@184.107.88.189 "tar -xzf /root/dumar-infra/frontend/dist.tar.gz -C /root/dumar-infra/frontend/dist/ && rm /root/dumar-infra/frontend/dist.tar.gz && tar -xzf /root/dumar-infra/backend/backend.tar.gz -C /root/dumar-infra/backend/ && rm /root/dumar-infra/backend/backend.tar.gz && cd /root/dumar-infra && docker compose restart backend caddy"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao extrair arquivos ou reiniciar os conteineres na VPS." -ForegroundColor Red
    exit 1
}

# 6. Limpar arquivos temporarios locais
Write-Host "Limpando arquivos temporarios locais..." -ForegroundColor Yellow
if (Test-Path "dist.tar.gz") { Remove-Item "dist.tar.gz" -Force }
if (Test-Path "backend.tar.gz") { Remove-Item "backend.tar.gz" -Force }

Write-Host "Deploy finalizado com sucesso! Frontend e API Backend rodando na VPS." -ForegroundColor Green
