import { getStoredCompanyConfig } from "./contract-generator";

export interface ReceiptData {
  id?: number | string;
  receiptNumber: string;
  receiptDate: string;
  paymentDate?: string;
  
  // Dados da Empresa (Emitente)
  companyRazaoSocial: string;
  companyNomeFantasia: string;
  companyCnpj: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyCity: string;
  
  // Dados do Pagador (Cliente)
  clientName: string;
  clientCpfCnpj: string;
  clientPhone: string;
  clientAddress?: string;
  leadId?: number | null;
  clientId?: number | null;

  // Detalhes do Pagamento
  amount: number;
  amountExtenso: string;
  description: string;
  paymentMethod: string;
  notes?: string;

  // Relação com Financeiro
  financialTransactionId?: number | null;
  createdAt?: string;
}

export function formatDateExtenso(dateStr?: string): string {
  const targetDate = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  const day = targetDate.getDate();
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const month = months[targetDate.getMonth()];
  const year = targetDate.getFullYear();
  return `${day} de ${month} de ${year}`;
}

export function numberToExtensoBRL(val: number): string {
  if (!val || val === 0 || isNaN(val)) return "";
  const units = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const hundreds = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  function convertGroup(n: number): string {
    if (n === 0) return "";
    if (n === 100) return "cem";
    const res: string[] = [];
    const h = Math.floor(n / 100);
    const rem = n % 100;
    if (h > 0) res.push(hundreds[h]);
    if (rem >= 10 && rem <= 19) {
      res.push(teens[rem - 10]);
    } else {
      const t = Math.floor(rem / 10);
      const u = rem % 10;
      if (t > 0) res.push(tens[t]);
      if (u > 0) res.push(units[u]);
    }
    return res.join(" e ");
  }

  const parts = Number(val).toFixed(2).split(".");
  const integerPart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);

  const result: string[] = [];
  if (integerPart > 0) {
    const millions = Math.floor(integerPart / 1000000);
    const thousands = Math.floor((integerPart % 1000000) / 1000);
    const unitsGroup = integerPart % 1000;

    const intWords: string[] = [];
    if (millions > 0) {
      intWords.push(convertGroup(millions) + (millions === 1 ? " milhão" : " milhões"));
    }
    if (thousands > 0) {
      intWords.push(thousands === 1 ? "um mil" : convertGroup(thousands) + " mil");
    }
    if (unitsGroup > 0) {
      intWords.push(convertGroup(unitsGroup));
    }
    const realStr = integerPart === 1 
      ? "real" 
      : (integerPart % 1000000 === 0 && integerPart >= 1000000 ? "de reais" : "reais");
    result.push(intWords.join(" e ") + " " + realStr);
  }

  if (decimalPart > 0) {
    const centavosStr = decimalPart === 1 ? "centavo" : "centavos";
    result.push(convertGroup(decimalPart) + " " + centavosStr);
  }

  const finalStr = result.join(" e ");
  return finalStr.charAt(0).toUpperCase() + finalStr.slice(1);
}

export function getDefaultReceiptData(customCompany?: any): ReceiptData {
  const comp = customCompany || getStoredCompanyConfig();
  const today = new Date().toISOString().split("T")[0];

  return {
    receiptNumber: "",
    receiptDate: today,

    companyRazaoSocial: comp.razaoSocial || "Dumar Móveis Planejados Ltda",
    companyNomeFantasia: comp.nomeFantasia || "Dumar Móveis Planejados",
    companyCnpj: comp.cnpj || "42.588.140/0001-72",
    companyAddress: comp.address || "Av. Santa Catarina, 551 sala 205, Centro - Balneário Arroio do Silva - SC",
    companyPhone: comp.phone || "(48) 98848-6827",
    companyEmail: comp.email || "dumarmoveisplanejados@gmail.com",
    companyCity: comp.city || "Balneário Arroio do Silva - SC",

    clientName: "",
    clientCpfCnpj: "",
    clientPhone: "",
    clientAddress: "",
    leadId: null,
    clientId: null,

    amount: 0,
    amountExtenso: "",
    description: "",
    paymentMethod: "PIX",
    notes: "",

    financialTransactionId: null,
    createdAt: new Date().toISOString(),
  };
}

export function generateReceiptWhatsAppText(receipt: ReceiptData): string {
  const formattedAmount = Number(receipt.amount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const dataExtenso = formatDateExtenso(receipt.receiptDate);

  return `*RECIBO DE PAGAMENTO*
*${receipt.companyNomeFantasia.toUpperCase()}*
CNPJ: ${receipt.companyCnpj}
Telefone: ${receipt.companyPhone}
Endereço: ${receipt.companyAddress}
----------------------------------------
Recibo Nº: ${receipt.receiptNumber || "-"}
Data: ${new Date(receipt.receiptDate + "T00:00:00").toLocaleDateString("pt-BR")}
Recebemos de: ${receipt.clientName}
${receipt.clientCpfCnpj ? `CPF/CNPJ: ${receipt.clientCpfCnpj}\n` : ""}${receipt.clientPhone ? `Telefone: ${receipt.clientPhone}\n` : ""}Valor: ${formattedAmount}${receipt.amountExtenso ? ` (${receipt.amountExtenso})` : ""}
Forma de Pagamento: ${receipt.paymentMethod || "PIX"}

Referente a:
${receipt.description}
----------------------------------------
Dando plena e geral quitação da quantia discriminada acima.

${receipt.companyCity}, ${dataExtenso}
${receipt.companyNomeFantasia}`;
}
