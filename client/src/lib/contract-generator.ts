export type PaymentPlanType = 
  | "a_vista"             // À Vista (PIX / Dinheiro / TED)
  | "entrada_saldo"       // 1+1 (Entrada + Saldo na Montagem)
  | "entrada_parcelado"   // Entrada + Saldo Parcelado no Cartão de Crédito
  | "tres_etapas"         // 3 Etapas (Sinal / Entrega na Obra / Conclusão da Montagem)
  | "parcelado_cartao"    // 100% Parcelado no Cartão
  | "personalizado";      // Condições Personalizadas

export interface MemorialData {
  instrucoesProjeto: string;
  estruturaMdf: string;
  frentesMdf: string;
  tamponamentosMdf: string;
  vidros: string; // Novo: Vidros & Perfis de Alumínio
  puxadores: string;
  dobradicas: string;
  corredicas: string;
  itensExtras: string;
  projectImages: string[]; // Array de URLs ou DataURIs base64 das imagens 3D do projeto
}

export interface NotaAtencaoData {
  instrucoesGerais: string;
  antesEntrega: string[];
  duranteMontagem: string[];
  aoTerminoMontagem: string[];
  cidadeData: string;
}

export interface ContractData {
  id?: number | string;
  contractNumber: string;
  contractDate: string;
  status: "rascunho" | "aguardando_assinatura" | "assinado" | "concluido";
  signatureLocation: "per_section" | "end_only"; // Assinatura no final de cada parte ou apenas no fim do contrato
  
  // Dados da Contratada (Dumar Planejados)
  companyName: string;
  companyRazaoSocial: string;
  companyCnpj: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;

  // Dados do Contratante (Cliente)
  leadId?: number | string | null;
  clientName: string;
  clientCpfCnpj: string;
  clientRg: string;
  clientAddress: string;
  clientBairro: string;
  clientCidadeUf: string;
  clientPhone: string;
  clientEmail: string;

  // Dados do Projeto e Valores
  rooms: string[];
  materialsDescription: string;
  totalValue: number;
  
  // Modalidade e Calculadora de Pagamento
  paymentPlanType: PaymentPlanType;
  
  // Entrada / Sinal
  downPayment: number;
  downPaymentDate: string;
  downPaymentMethod: string; // ex: "PIX", "Dinheiro", "TED"
  
  // Complemento (Para plano em 3 etapas)
  downPaymentComplement: number;
  downPaymentComplementDate: string;
  
  // Saldo Restante
  remainingBalance: number;
  assemblyPayment: number; // Saldo na montagem
  remainingPaymentMethod: string; // ex: "PIX na conclusão da montagem", "Cartão de Crédito"
  
  // Parcelamento no Cartão
  cardInstallmentsCount: number;
  cardInstallmentValue: number;
  
  installmentsCount: number;
  paymentMethod: string;
  paymentTermsDetails: string;

  // Prazos
  productionDays: number;

  // Cláusulas Contratuais (1 a 10)
  clause1Object: string;
  clause2Deadlines: string;
  clause3Payment: string;
  clause4CompanyDuties: string;
  clause5ClientDuties: string;
  clause6DeliveryAssembly: string;
  clause7Warranty: string;
  clause8TechnicalSupport: string;
  clause9Cancellation: string;
  clause10General: string;

  // Parte 2: Memorial Descritivo & Aprovação do Projeto 3D
  memorial: MemorialData;

  // Parte 3: Nota de Atenção & Recomendações
  notaAtencao: NotaAtencaoData;

  additionalNotes: string;
}

/**
 * Constrói dinamicamente o texto legal da Cláusula 3 com base no valor e modalidade de pagamento configurada
 */
export function buildClause3PaymentText(contract: Partial<ContractData>): string {
  const total = Number(contract.totalValue) || 0;
  const formattedTotal = total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const plan = contract.paymentPlanType || "entrada_saldo";
  const downPayment = Number(contract.downPayment) || 0;
  const formattedDown = downPayment.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const downMethod = contract.downPaymentMethod || "PIX / Transferência";
  const remaining = Math.max(0, total - downPayment);
  const formattedRemaining = remaining.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const remainingMethod = contract.remainingPaymentMethod || "PIX no término da montagem";

  let detailText = "";

  switch (plan) {
    case "a_vista":
      detailText = `O valor total de ${formattedTotal} será pago à vista via ${contract.paymentMethod || "PIX / Transferência Bancária"} na assinatura deste contrato / confirmação do projeto.`;
      break;

    case "entrada_saldo":
      detailText = `Pagamento em 2 etapas: Entrada de ${formattedDown} via ${downMethod} no ato da assinatura deste contrato, e o Saldo restante de ${formattedRemaining} a ser pago via ${remainingMethod}.`;
      break;

    case "entrada_parcelado":
      const cardCount = Number(contract.cardInstallmentsCount) || 1;
      const cardVal = (Number(contract.cardInstallmentValue) || (cardCount > 0 ? remaining / cardCount : remaining)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      detailText = `Pagamento misto: Entrada de ${formattedDown} via ${downMethod} no ato da assinatura deste contrato, e o Saldo de ${formattedRemaining} parcelado em ${cardCount}x de ${cardVal} no Cartão de Crédito.`;
      break;

    case "tres_etapas":
      const comp = Number(contract.downPaymentComplement) || 0;
      const formattedComp = comp.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const saldoFinal = Math.max(0, total - (downPayment + comp)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      detailText = `Pagamento em 3 etapas: Sinal de ${formattedDown} no ato da assinatura; Complemento de ${formattedComp} na entrega dos módulos na obra; e Saldo de ${saldoFinal} no término da montagem e vistoria final.`;
      break;

    case "parcelado_cartao":
      const totalCardCount = Number(contract.cardInstallmentsCount) || Number(contract.installmentsCount) || 1;
      const totalCardVal = (total / totalCardCount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      detailText = `Pagamento 100% parcelado no valor de ${formattedTotal}, dividido em ${totalCardCount} parcelas de ${totalCardVal} no Cartão de Crédito / Financiamento.`;
      break;

    case "personalizado":
    default:
      detailText = contract.paymentTermsDetails || `Valor Total: ${formattedTotal}. Forma de pagamento ajustada nas condições deste instrumento.`;
      break;
  }

  return `Valor Total Contratado: ${formattedTotal}. ${detailText} Em caso de atraso em qualquer uma das parcelas acordadas, incidirá multa moratória de 2% (dois por cento), acrescida de juros legais de 1% (um por cento) ao mês e correção monetária até a data da efetiva quitação.`;
}

export function getDefaultContractData(lead?: any): ContractData {
  const today = new Date().toLocaleDateString("pt-BR");
  const contractNum = `CTR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const roomsText = lead?.rooms 
    ? (Array.isArray(lead.rooms) ? lead.rooms.join(", ") : lead.rooms) 
    : "Cozinha Planejada, Dormitório Casal";
  
  const val = Number(lead?.value) || 24000;
  const downPaymentVal = Math.round(val * 0.4); // 40%
  const complementVal = Math.round(val * 0.1); // 10%
  const remainingBal = val - downPaymentVal;
  const assemblyVal = val - (downPaymentVal + complementVal);

  const baseContract: Partial<ContractData> = {
    contractNumber: contractNum,
    contractDate: today,
    status: "rascunho",
    signatureLocation: "end_only",

    // Contratada (Dumar Móveis Planejados)
    companyName: "Dumar Móveis Planejados",
    companyRazaoSocial: "42.588.140 PAULO CESAR BATICKOSKI DE VARGAS – ME",
    companyCnpj: "42.588.140/0001-72",
    companyAddress: "Av. Santa Catarina, 551 sala 205, Centro - Balneário Arroio do Silva - SC",
    companyPhone: "(48) 98848-6827",
    companyEmail: "dumarmoveisplanejados@gmail.com",

    // Contratante (puxado do Lead se existir)
    leadId: lead?.id || null,
    clientName: lead?.name || "Nome do Cliente",
    clientCpfCnpj: "111.222.333-44",
    clientRg: "00.000.000-0",
    clientAddress: "Av. Principal, 001",
    clientBairro: "Centro",
    clientCidadeUf: "Balneário Arroio do Silva - SC",
    clientPhone: lead?.phone || "(48) 99999-9999",
    clientEmail: lead?.email || "cliente@exemplo.com",

    // Valores e Pagamento
    rooms: typeof roomsText === "string" ? roomsText.split(",").map(r => r.trim()) : roomsText,
    materialsDescription: "Estrutura interna em MDF BP Branco, frentes e tamponamentos em MDF BP Fendi de primeira linha.",
    totalValue: val,
    paymentPlanType: "entrada_saldo",
    downPayment: downPaymentVal,
    downPaymentDate: today,
    downPaymentMethod: "PIX",
    downPaymentComplement: complementVal,
    downPaymentComplementDate: today,
    remainingBalance: remainingBal,
    assemblyPayment: remainingBal,
    remainingPaymentMethod: "PIX na entrega da montagem",
    cardInstallmentsCount: 10,
    cardInstallmentValue: remainingBal > 0 ? Math.round(remainingBal / 10) : 0,
    installmentsCount: 2,
    paymentMethod: lead?.paymentMethod || "PIX / Dinheiro / Cartão",
    paymentTermsDetails: `Entrada de R$ ${downPaymentVal.toLocaleString('pt-BR')} no ato da assinatura + Saldo de R$ ${remainingBal.toLocaleString('pt-BR')} na conclusão da montagem.`,

    // Prazos
    productionDays: 45,

    // Cláusulas Contratuais (1 a 10)
    clause1Object: "Fabricação, entrega e montagem de móveis planejados conforme projeto e memorial descritivo aprovados.",
    clause2Deadlines: "Prazo de 45 dias úteis a contar da assinatura e aprovação do projeto executivo, suspenso por atraso do cliente, alterações de projeto, obra inacabada, força maior ou impedimentos no local.",
    clause4CompanyDuties: "Fabricar conforme projeto aprovado, entregar e montar os móveis e prestar assistência técnica se necessário for durante o período de garantia legal e contratual.",
    clause5ClientDuties: "Aprovar projeto executivo, manter ambiente apto (piso, pintura, elétrica e hidráulica concluídos), permitir acesso dos montadores nas datas ajustadas e cumprir as condições de pagamento.",
    clause6DeliveryAssembly: "Entrega e montagem mediante agendamento prévio. Remarcação injustificada ou impedimento de acesso por culpa do contratante poderá gerar novo custo de frete e deslocamento.",
    clause7Warranty: "12 meses para móveis, montagem e ferragens. Não cobre danos por mau uso, umidade/infiltrações de alvenaria, vazamentos hidráulicos, alagamentos, incêndio, modificações por terceiros e limpeza com produtos abrasivos.",
    clause8TechnicalSupport: "Solicitação de assistência técnica via WhatsApp (48) 98848-6827 ou e-mail dumarmoveisplanejados@gmail.com. A vistoria de avaliação ocorrerá em até 30 dias após comunicação formal.",
    clause9Cancellation: "O cliente poderá rescindir se a entrega ultrapassar 90 dias sem justificativa contratual válida. Após iniciada a fabricação e corte de materiais, a desistência imotivada obriga ao ressarcimento integral dos custos comprovados já incorridos pela contratada.",
    clause10General: "Comunicações por WhatsApp e e-mail são plenamente válidas entre as partes. Dados pessoais tratados com sigilo conforme LGPD. Fica eleito o Foro da Comarca de Araranguá/SC para dirimir quaisquer dúvidas deste contrato. O presente instrumento, assinado pelas partes e testemunhas, constitui título executivo extrajudicial nos termos do art. 784 do CPC.",

    // Parte 2: Memorial Descritivo & Projeto 3D
    memorial: {
      instrucoesProjeto: "Este projeto cancela e substitui qualquer projeto anterior a este. Todos os eletrodomésticos, eletro-portáteis, folhagens, pias, cubas, artigos de decoração e iluminação apresentados neste projeto são meramente ilustrativos exceto quando especificados no campo itens extras. O prestador de serviços de montagem não está autorizado a fazer qualquer instalação elétrica ou de algum eletrodoméstico sob responsabilidade da loja Dumar Móveis Planejados. Se houver interesse por parte do cliente neste tipo de instalação, fica de responsabilidade do mesmo o acordo com prestador de serviços de montagem. O cliente deve fornecer plantas hidráulicas, elétricas e de gás. A Dumar Móveis Planejados e seus prestadores de serviços não se responsabilizam por furos em instalações elétricas, gás ou danos na parte elétrica. O cliente deve autorizar a retirada de molduras, rodapés ou rodatetos existentes que venham prejudicar a instalação dos móveis.",
      estruturaMdf: "Estrutura do móvel em MDF 15mm, revestimento melamínico BP cor branco, fita de borda reta em polipropileno 0,4mm.",
      frentesMdf: "Frentes de portas, gavetas, gavetões e articulados (se existir no projeto) em MDF 15mm, revestimento melamínico BP padrão Fendi, fita de borda reta em poliestireno 0,4mm.",
      tamponamentosMdf: "Tamponamentos, prateleiras externas e painéis lineares em MDF, revestimento melamínico BP padrão Fendi, fita de borda reta em poliestireno 0,4mm.",
      vidros: "Portas em vidro Reflecta Fumê 4mm com moldura em perfil de alumínio Slim anodizado preto fosco.",
      puxadores: "Vancouver 128mm, material alumínio, acabamento anodizado natural.",
      dobradicas: "Inox com amortecimento, para portas de giro. E sistema de giro normal Hettich para portas basculantes.",
      corredicas: "Com rolamento esférico, 450mm, sem sistema de amortecimento.",
      itensExtras: "Fita led nas laterais internas da cristaleira",
      projectImages: []
    },

    // Parte 3: Nota de Atenção & Recomendações
    notaAtencao: {
      instrucoesGerais: "Para evitar atrasos e prejuízos nos processos de instalação e montagem do material adquirido, leia atentamente o Contrato / Proposta de Compra Dumar Móveis Planejados e siga as instruções abaixo. Em caso de atraso da obra e impedimento da instalação do produto, a montagem será reprogramada de acordo com a agenda da empresa Dumar Móveis Planejados, em até 30 dias.",
      antesEntrega: [
        "Estar limpo e vazio;",
        "Ter condições de armazenar as mercadorias com segurança;",
        "Possuir infraestrutura adequada (água, sanitários, iluminação, energia elétrica, etc.);",
        "Não possuir circulação de pessoas estranhas à montagem;",
        "Ter um responsável para receber as mercadorias e apresentar as plantas hidráulica, elétrica e de gás - não havendo responsável na obra, favor entregar as chaves e as plantas com 2 (dois) dias de antecedência na Loja;",
        "Possuir as medidas corretas dos eletrodomésticos que serão adquiridos posteriormente à montagem dos móveis junto ao vendedor / projetista."
      ],
      duranteMontagem: [
        "Sugerimos que o acabamento do imóvel (pintura final, gesso, rodapés, etc.) seja realizado após a finalização da montagem dos móveis;",
        "Para a realização de modificação elétricas em tomadas e fiações de telefonia / audiovisual, será necessária a presença de um eletricista e/ou técnico responsável, pois a equipe de montagem de produtos Dumar não possui autorização para intervenção técnica neste segmento;",
        "Caso o projeto hidráulico não seja fornecido, ou esteja em desacordo com as instalações existentes, possíveis danos nas tubulações ficarão a encargo do cliente, estando este ciente que é encarregado de arcar com os prejuízos e consertos necessários;",
        "Projetos que possuem recortes ou ajustes poderão causar excesso de pó durante a montagem."
      ],
      aoTerminoMontagem: [
        "É de extrema importância que o cliente, ou pessoa autorizada pelo mesmo, realize uma vistoria nos móveis instalados juntamente com a equipe de montagem e preencha o CHECK-LIST, possibilitando à Assistência Técnica adotar medidas corretivas quando necessário."
      ],
      cidadeData: `Balneário Arroio do Silva - SC, ${today}`
    },

    additionalNotes: "Observações especiais: Projeto conferido com o cliente. Vistoria final e entrega técnica mediante agendamento."
  };

  // Cláusula 3 gerada dinamicamente
  baseContract.clause3Payment = buildClause3PaymentText(baseContract as ContractData);

  return baseContract as ContractData;
}
