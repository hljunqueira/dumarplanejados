# 🏠 Dumar Móveis Planejados

Site profissional para a Dumar Móveis Planejados, especializada em móveis sob medida em Balneário Arroio do Silva, SC.

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática para JavaScript
- **Vite** - Build tool rápida e moderna
- **Tailwind CSS** - Framework CSS utilitário
- **Radix UI** - Componentes acessíveis
- **Wouter** - Roteamento client-side
- **React Query** - Gerenciamento de estado e cache

### Backend
- **Express.js** - Framework Node.js
- **TypeScript** - Tipagem estática
- **Drizzle ORM** - ORM moderno para PostgreSQL
- **Google Cloud Vision** - API para análise de imagens

### Deploy & Infraestrutura
- **PostgreSQL** - Banco de dados relacional
- **GitHub** - Controle de versão
- **Vercel/Netlify** - Deploy automático (recomendado)

## 📁 Estrutura do Projeto

```
DumarPlanejados/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── assets/        # Imagens e recursos
│   │   ├── lib/           # Utilitários e configurações
│   │   └── hooks/         # Custom hooks
│   └── public/            # Arquivos públicos
├── server/                # Backend Express
│   ├── routes/            # Rotas da API
│   └── storage/           # Configurações de storage
├── shared/                # Schemas compartilhados
└── docs/                  # Documentação
```

## 🎨 Páginas Implementadas

### ✅ Páginas Principais
- **Home** (`/`) - Página inicial com Hero, About, Portfolio, Contact
- **404** (`/*`) - Página de erro animada
- **Desenvolvimento** (`/desenvolvimento`) - Página em construção

### 🎯 Seções da Home
- **Hero Section** - Banner principal com CTA
- **About Section** - Sobre a empresa
- **Process Section** - Processo de trabalho
- **Portfolio Section** - Galeria de projetos
- **Contact Section** - Formulário de contato
- **Footer** - Informações da empresa

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- PostgreSQL (para produção)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/hljunqueira/DumarPlanejados.git
cd DumarPlanejados
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
# Crie um arquivo .env na raiz do projeto
cp .env.example .env
```

4. **Execute o projeto**
```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 🎨 Características do Design

### 🎯 Design System
- **Cores**: Gradientes azul/roxo/índigo
- **Tipografia**: Inter (Google Fonts)
- **Ícones**: Lucide React
- **Animações**: CSS customizadas + Framer Motion

### 📱 Responsividade
- **Mobile First** - Design otimizado para mobile
- **Breakpoints**: xs, sm, md, lg, xl
- **Touch Friendly** - Elementos otimizados para toque

### ⚡ Performance
- **Lazy Loading** - Carregamento sob demanda
- **Image Optimization** - Imagens otimizadas
- **Code Splitting** - Divisão automática do código
- **Caching** - Cache inteligente com React Query

## 🔧 Funcionalidades

### ✅ Implementadas
- ✅ **Design responsivo** e moderno
- ✅ **Navegação suave** entre seções
- ✅ **Formulário de contato** funcional
- ✅ **Galeria de portfólio** interativa
- ✅ **Botão WhatsApp** flutuante
- ✅ **Animações CSS** personalizadas
- ✅ **SEO otimizado** com meta tags
- ✅ **Acessibilidade** (WCAG 2.1)

### 🚧 Em Desenvolvimento
- 🔄 **Sistema de admin** para gerenciar portfólio
- 🔄 **Blog integrado** com artigos sobre móveis
- 🔄 **Calculadora de orçamento** online
- 🔄 **Chat integrado** para atendimento

## 📊 SEO & Analytics

### Meta Tags Implementadas
- **Title**: "Dumar Móveis Planejados - Móveis Sob Medida"
- **Description**: Descrição otimizada para busca
- **Keywords**: Palavras-chave relevantes
- **Open Graph**: Compartilhamento em redes sociais
- **Twitter Cards**: Cards para Twitter

### Estrutura de URLs
- `/` - Página inicial
- `/#inicio` - Seção Hero
- `/#sobre` - Seção About
- `/#portfolio` - Seção Portfolio
- `/#contato` - Seção Contact
- `/desenvolvimento` - Página em construção

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Gera build de produção
npm run preview      # Preview da build
npm run check        # Verifica tipos TypeScript

# Banco de dados
npm run db:push      # Sincroniza schema com banco
```

## 📱 Páginas Especiais

### 🚧 Página de Desenvolvimento
- **URL**: `/desenvolvimento`
- **Características**: 
  - Barra de progresso animada
  - Texto rotativo
  - Partículas flutuantes
  - Botões de ação

### ❌ Página 404
- **URL**: Qualquer rota não encontrada
- **Características**:
  - Número 404 animado
  - Contador regressivo
  - Sugestões de navegação
  - Links para seções principais

## 🔒 Segurança

### Implementado
- ✅ **Arquivos sensíveis** no .gitignore
- ✅ **Credenciais** não expostas
- ✅ **HTTPS** obrigatório em produção
- ✅ **Validação** de formulários

### Recomendações
- 🔐 **Rate limiting** para APIs
- 🔐 **CORS** configurado adequadamente
- 🔐 **Helmet.js** para headers de segurança

## 📈 Deploy

### Opções Recomendadas

#### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

#### Netlify
```bash
npm run build
# Upload da pasta dist/
```

#### Railway
```bash
railway login
railway init
railway up
```

## 🤝 Contribuição

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

## 📞 Contato

- **WhatsApp**: (48) 98848-6827
- **Localização**: Av. Santa Catarina, 551 sala 205 - Centro, Balneário Arroio do Silva - SC
- **Email**: dumarmoveisplanejados@gmail.com

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Desenvolvido com ❤️ para Dumar Móveis Planejados** 