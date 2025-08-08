# 🎥 Guia para Configurar Vídeos Reais da Dumar

## 📋 Passo a Passo para Substituir os IDs

### **1. Acessar o Canal do YouTube**
- Vá para: https://www.youtube.com/@DumarM%C3%B3veisPlanejados
- Clique em "Vídeos" para ver todos os vídeos do canal

### **2. Obter o ID de Cada Vídeo**
Para cada vídeo que você quer adicionar ao site:

1. **Clique no vídeo** para abrir
2. **Copie a URL** do vídeo (exemplo: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
3. **Extraia o ID** - é a parte após `v=` (exemplo: `dQw4w9WgXcQ`)

### **3. Substituir no Arquivo**
Edite o arquivo `client/src/lib/videos-data.ts` e substitua os IDs:

```typescript
// ANTES (exemplo):
youtubeId: 'dQw4w9WgXcQ', // ⚠️ SUBSTITUIR: Acesse o vídeo no YouTube e copie o ID da URL

// DEPOIS (com ID real):
youtubeId: 'SEU_ID_REAL_AQUI', // ID real do vídeo da Dumar
```

### **4. Atualizar Thumbnails**
Para cada vídeo, você pode:

**Opção A: Usar thumbnails do YouTube**
```typescript
thumbnail: `https://img.youtube.com/vi/SEU_ID_REAL_AQUI/maxresdefault.jpg`,
```

**Opção B: Usar imagens locais**
```typescript
thumbnail: '/src/assets/cozinha-real.jpeg', // Imagem do projeto real
```

### **5. Atualizar Estatísticas Reais**
Para cada vídeo, atualize:
- `duration`: Duração real do vídeo
- `views`: Número real de visualizações
- `publishedAt`: Data real de publicação

## 📝 Exemplo Completo

```typescript
{
  id: '1',
  title: 'Cozinha Moderna - Projeto Dumar',
  description: 'Veja como transformamos esta cozinha com móveis planejados sob medida.',
  youtubeId: 'SEU_ID_REAL_AQUI', // ← Substitua pelo ID real
  thumbnail: 'https://img.youtube.com/vi/SEU_ID_REAL_AQUI/maxresdefault.jpg',
  category: 'projetos',
  duration: '4:32', // Duração real
  views: '2.5k', // Visualizações reais
  publishedAt: '2024-01-20' // Data real
}
```

## 🎯 Tipos de Vídeos Recomendados

### **Para a Categoria "Projetos"**
- ✅ Antes e depois de cozinhas
- ✅ Projetos de closets
- ✅ Salas planejadas
- ✅ Banheiros com móveis

### **Para a Categoria "Depoimentos"**
- ✅ Clientes satisfeitos
- ✅ Agradecimentos
- ✅ Testimonials em vídeo

### **Para a Categoria "Processo"**
- ✅ Instalação de móveis
- ✅ Medição do ambiente
- ✅ Fabricação dos móveis
- ✅ Visita técnica

### **Para a Categoria "Institucional"**
- ✅ Apresentação da empresa
- ✅ Dicas de decoração
- ✅ Valores da Dumar

## 🔧 Como Testar

1. **Substitua um ID** por um real
2. **Execute o projeto**: `npm run dev`
3. **Acesse a seção Vídeos**
4. **Clique no botão "Assistir no YouTube"**
5. **Verifique se abre o vídeo correto**

## ⚠️ Importante

- **IDs do YouTube** têm sempre 11 caracteres
- **URLs de vídeos** seguem o padrão: `https://www.youtube.com/watch?v=ID_DO_VIDEO`
- **Thumbnails do YouTube** podem ser acessadas via: `https://img.youtube.com/vi/ID_DO_VIDEO/maxresdefault.jpg`

## 📞 Precisa de Ajuda?

Se tiver dificuldade para encontrar os IDs ou configurar, me avise! Posso ajudar com:
- ✅ Extração de IDs dos vídeos
- ✅ Configuração das thumbnails
- ✅ Atualização das estatísticas
- ✅ Teste da funcionalidade

---

**Canal da Dumar**: https://www.youtube.com/@DumarM%C3%B3veisPlanejados
