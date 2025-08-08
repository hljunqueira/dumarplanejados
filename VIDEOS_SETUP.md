# Configuração dos Vídeos do YouTube - Dumar Móveis Planejados

## 📹 Como Configurar os Vídeos

### 1. **Obter IDs dos Vídeos do YouTube**

Para cada vídeo do canal da Dumar, você precisa obter o ID do vídeo:

1. Acesse o vídeo no YouTube
2. O ID está na URL: `https://www.youtube.com/watch?v=**ID_DO_VIDEO**`
3. Copie apenas o ID (exemplo: `dQw4w9WgXcQ`)

### 2. **Atualizar os Dados dos Vídeos**

Edite o arquivo `client/src/lib/videos-data.ts` e substitua os `VIDEO_ID_X` pelos IDs reais:

```typescript
export const videosData: VideoItem[] = [
  {
    id: '1',
    title: 'Projeto Cozinha Completa - Antes e Depois',
    description: 'Veja como transformamos uma cozinha simples em um ambiente funcional e elegante com móveis planejados sob medida.',
    youtubeId: 'dQw4w9WgXcQ', // ← Substitua pelo ID real
    thumbnail: '/src/assets/cozinha.jpeg',
    category: 'projetos',
    duration: '3:45',
    views: '1.2k',
    publishedAt: '2024-01-15'
  },
  // ... outros vídeos
];
```

### 3. **Tipos de Vídeos Recomendados**

#### **Categoria: Projetos**
- Antes e depois de cozinhas
- Projetos de closets
- Salas planejadas
- Banheiros com móveis sob medida

#### **Categoria: Depoimentos**
- Clientes satisfeitos
- Testimonials em vídeo
- Agradecimentos de clientes

#### **Categoria: Processo**
- Instalação de móveis
- Processo de medição
- Fabricação dos móveis
- Visita técnica

#### **Categoria: Institucional**
- Apresentação da empresa
- Dicas de decoração
- Tendências do mercado
- Valores da empresa

### 4. **Estrutura da Seção de Vídeos**

A seção de vídeos está localizada entre o **Portfólio** e o **Contato** e inclui:

- ✅ Grid responsivo de vídeos
- ✅ Thumbnails com overlay de play
- ✅ Categorização dos vídeos
- ✅ Estatísticas (duração e visualizações)
- ✅ Links diretos para o YouTube
- ✅ Call-to-action para o canal

### 5. **Navegação**

A seção "Vídeos" foi adicionada ao menu de navegação:
- Desktop: Menu horizontal
- Mobile: Menu hambúrguer

### 6. **Personalização**

#### **Cores e Estilo**
- Cores do YouTube (vermelho) para elementos de vídeo
- Mantém a identidade visual da Dumar
- Design responsivo e moderno

#### **Conteúdo**
- Títulos atrativos
- Descrições detalhadas
- Categorização clara
- Call-to-action para inscrição no canal

### 7. **Benefícios para o Negócio**

✅ **Credibilidade**: Vídeos mostram trabalho real
✅ **Engajamento**: Conteúdo visual atrai mais atenção
✅ **Conversão**: Clientes veem resultados antes/depois
✅ **SEO**: Conteúdo rico melhora posicionamento
✅ **Confiança**: Depoimentos em vídeo aumentam confiança

### 8. **Próximos Passos**

1. **Substituir IDs**: Atualizar com IDs reais dos vídeos
2. **Adicionar Thumbnails**: Usar imagens dos próprios vídeos
3. **Atualizar Estatísticas**: Dados reais de visualizações
4. **Criar Conteúdo**: Produzir vídeos específicos para cada categoria

### 9. **Manutenção**

- Atualizar vídeos mensalmente
- Manter estatísticas atualizadas
- Adicionar novos vídeos conforme produção
- Monitorar engajamento dos vídeos

---

**Canal do YouTube**: https://www.youtube.com/@DumarM%C3%B3veisPlanejados
**Instagram**: https://www.instagram.com/dumar_moveis_planejados/
