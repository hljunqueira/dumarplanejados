export interface PromobParsedData {
  clientName: string;
  rooms: string[];
  estimatedValue: number;
  fileName: string;
  fileBase64: string;
  rawText?: string;
}

/**
 * Utilitário inteligente para leitura e parser de arquivos do Promob
 * Suporta: .promob, .xml, .csv, .txt, .pdf e análise por nome de arquivo
 */
export async function parsePromobFile(file: File): Promise<PromobParsedData> {
  const fileName = file.name;
  let clientName = "";
  let rooms: string[] = [];
  let estimatedValue = 0;
  let rawText = "";

  // Converter arquivo para Base64
  const fileBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  try {
    // Ler o conteúdo de texto do arquivo (se for XML, CSV, TXT ou JSON)
    const textContent = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string || "");
      reader.onerror = () => resolve("");
      reader.readAsText(file);
    });

    rawText = textContent;

    if (textContent) {
      // 1. Extração de Nome do Cliente via XML / Tags
      const clientMatch = textContent.match(/<CLIENTE[^>]*>(.*?)<\/CLIENTE>/i) ||
                          textContent.match(/<NOME[^>]*>(.*?)<\/NOME>/i) ||
                          textContent.match(/CLIENTE:\s*([^\r\n,;]+)/i) ||
                          textContent.match(/NOME:\s*([^\r\n,;]+)/i);
      if (clientMatch && clientMatch[1]) {
        clientName = clientMatch[1].trim();
      }

      // 2. Extração de Ambientes (Cozinha, Quarto, Banheiro, Sala, Closet, etc.)
      const roomKeywords = [
        "Cozinha", "Cozinha Planejada", "Dormitório", "Quarto", "Quarto Casal", 
        "Quarto Solteiro", "Suíte", "Banheiro", "Sala", "Sala de Estar", 
        "Home Theater", "Closet", "Lavanderia", "Área de Serviço", "Gourmet", "Escritório"
      ];

      roomKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, "i");
        if (regex.test(textContent) && !rooms.some(r => r.toLowerCase() === keyword.toLowerCase())) {
          rooms.push(keyword);
        }
      });

      // 3. Extração de Valores no XML / Orçamento
      const valueMatches = textContent.match(/(?:VALOR|PRECO|TOTAL|ORCAMENTO)[^0-9]*([0-9]+[.,][0-9]{2})/gi) ||
                           textContent.match(/R\$\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)/gi);
      
      if (valueMatches && valueMatches.length > 0) {
        // Encontrar o maior valor numérico no arquivo
        let maxValue = 0;
        valueMatches.forEach(match => {
          const cleanVal = match.replace(/[^0-9,.]/g, "").replace(".", "").replace(",", ".");
          const num = parseFloat(cleanVal);
          if (!isNaN(num) && num > maxValue && num < 1000000) {
            maxValue = num;
          }
        });
        if (maxValue > 0) {
          estimatedValue = maxValue;
        }
      }
    }
  } catch (err) {
    console.warn("Erro ao fazer parse textual do Promob, aplicando fallback por nome de arquivo:", err);
  }

  // FALLBACK POR NOME DO ARQUIVO (ex: Promob_Cozinha_e_Quarto_Cliente_Joao_Silva_15000.xml)
  if (!clientName) {
    const cleanFileName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    
    // Tentar extrair nome após a palavra "Cliente" ou palavras iniciais
    const nameMatch = cleanFileName.match(/cliente\s+([a-zA-Z\s]+)/i);
    if (nameMatch && nameMatch[1]) {
      clientName = nameMatch[1].trim();
    } else {
      // Usar o nome do arquivo sem extensões como sugestão de nome
      const nameParts = cleanFileName.split(" ");
      if (nameParts.length >= 2) {
        clientName = nameParts.slice(0, 3).join(" ");
      }
    }
  }

  // Fallback de Ambientes se não detectou nenhum
  if (rooms.length === 0) {
    const fnLower = fileName.toLowerCase();
    if (fnLower.includes("cozinha")) rooms.push("Cozinha Planejada");
    if (fnLower.includes("quarto") || fnLower.includes("dormitorio") || fnLower.includes("suite")) rooms.push("Dormitório");
    if (fnLower.includes("sala")) rooms.push("Sala / Home");
    if (fnLower.includes("banheiro")) rooms.push("Banheiro");
    if (rooms.length === 0) rooms.push("Projeto Completo Marcenaria");
  }

  // Fallback de valor se não detectou nenhum
  if (estimatedValue === 0) {
    const valMatch = fileName.match(/(\d{4,6})/);
    if (valMatch && valMatch[1]) {
      const num = parseInt(valMatch[1], 10);
      if (num >= 1000 && num <= 500000) {
        estimatedValue = num;
      }
    }
  }

  return {
    clientName,
    rooms,
    estimatedValue,
    fileName,
    fileBase64,
    rawText
  };
}
