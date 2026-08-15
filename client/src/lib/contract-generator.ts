export interface MemorialData {
  instrucoesProjeto: string;
  estruturaMdf: string;
  frentesMdf: string;
  tamponamentosMdf: string;
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
  downPayment: number;
  downPaymentDate: string;
  downPaymentComplement: number;
  downPaymentComplementDate: string;
  assemblyPayment: number;
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

export function getDefaultContractData(lead?: any): ContractData {
  const today = new Date().toLocaleDateString("pt-BR");
  const contractNum = `CTR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const roomsText = lead?.rooms 
    ? (Array.isArray(lead.rooms) ? lead.rooms.join(", ") : lead.rooms) 
    : "Cozinha Planejada, Dormitório Casal";
  
  const val = Number(lead?.value) || 15000;
  const downPaymentVal = Math.round(val * 0.4);
  const complementVal = Math.round(val * 0.1);
  const assemblyVal = val - (downPaymentVal + complementVal);

  return {
    contractNumber: contractNum,
    contractDate: today,
    status: "rascunho",
    signatureLocation: "end_only", // Padrão: Assinatura unificada no final do contrato

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
    downPayment: downPaymentVal,
    downPaymentDate: today,
    downPaymentComplement: complementVal,
    downPaymentComplementDate: today,
    assemblyPayment: assemblyVal,
    installmentsCount: 1,
    paymentMethod: lead?.paymentMethod || "PIX / Dinheiro / Cartão",
    paymentTermsDetails: `Entrada de R$ ${downPaymentVal.toLocaleString('pt-BR')} no ato da assinatura + Complemento de R$ ${complementVal.toLocaleString('pt-BR')} + Saldo de R$ ${assemblyVal.toLocaleString('pt-BR')} na data da montagem.`,

    // Prazos
    productionDays: 45,

    // Cláusulas Contratuais (1 a 10)
    clause1Object: "Fabricação, entrega e montagem de móveis planejados conforme projeto e memorial descritivo aprovados.",
    clause2Deadlines: "Prazo de 45 dias úteis a contar da assinatura, suspenso por atraso do cliente, alterações, obra inacabada, força maior ou impedimentos.",
    clause3Payment: `Valor Total: R$ ${val.toLocaleString('pt-BR')}. Forma de pagamento ajustada nas condições deste contrato. Atraso ensejará multa de 2%, juros de 1% ao mês e correção monetária.`,
    clause4CompanyDuties: "Fabricar conforme projeto aprovado, entregar e montar os móveis e prestar assistência técnica se necessário for durante a garantia.",
    clause5ClientDuties: "Aprovar projeto, manter ambiente apto (piso, pintura, elétrica e hidráulica concluídos), permitir acesso e pagar nas datas ajustadas.",
    clause6DeliveryAssembly: "Entrega e montagem mediante agendamento. Remarcação ou impossibilidade por culpa do cliente poderá gerar novo custo de deslocamento.",
    clause7Warranty: "12 meses para móveis, montagem e ferragens. Não cobre mau uso, infiltrações, vazamentos, alagamentos, incêndio, modificações por terceiros e limpeza inadequada.",
    clause8TechnicalSupport: "Solicitação por WhatsApp (48) 98848-6827, telefone ou e-mail dumarmoveisplanejados@gmail.com. A avaliação deve ocorrer em até 30 dias após o cliente informar a empresa. Defeito de fabricação sem custo adicional; mau uso gera cobrança.",
    clause9Cancellation: "Cliente poderá rescindir se a entrega ultrapassar 90 dias sem justificativa contratual. Após iniciada a fabricação, desistência imotivada obriga o pagamento dos custos comprovados já incorridos.",
    clause10General: "Comunicações por WhatsApp e e-mail são válidas. Dados tratados conforme LGPD. Foro de Araranguá/SC, ressalvado o foro do consumidor quando aplicável. O contrato, assinado por duas testemunhas, constitui título executivo extrajudicial nos termos da lei.",

    // Parte 2: Memorial Descritivo & Projeto 3D
    memorial: {
      instrucoesProjeto: "Este projeto cancela e substitui qualquer projeto anterior a este. Todos os eletrodomésticos, eletro-portáteis, folhagens, pias, cubas, artigos de decoração e iluminação apresentados neste projeto são meramente ilustrativos exceto quando especificados no campo itens extras. O prestador de serviços de montagem não está autorizado a fazer qualquer instalação elétrica ou de algum eletrodoméstico sob responsabilidade da loja Dumar Móveis Planejados. Se houver interesse por parte do cliente neste tipo de instalação, fica de responsabilidade do mesmo o acordo com prestador de serviços de montagem. O cliente deve fornecer plantas hidráulicas, elétricas e de gás. A Dumar Móveis Planejados e seus prestadores de serviços não se responsabilizam por furos em instalações elétricas, gás ou danos na parte elétrica. O cliente deve autorizar a retirada de molduras, rodapés ou rodatetos existentes que venham prejudicar a instalação dos móveis.",
      estruturaMdf: "Estrutura do móvel em MDF, revestimento melamínico BP cor branco, fita de borda reta em polipropileno 0,4mm.",
      frentesMdf: "Frentes de portas, gavetas, gavetões e articulados (se existir no projeto) em MDF, revestimento melamínico BP padrão Fendi, fita de borda reta em poliestireno 0,4mm.",
      tamponamentosMdf: "Tamponamentos, prateleiras externas e painéis lineares em MDF, revestimento melamínico BP padrão Fendi, fita de borda reta em poliestireno 0,4mm.",
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
        "Ter condições de armazenar as mercadorias;",
        "Possuir infraestrutura adequada (água, sanitários, iluminação, energia elétrica, etc.);",
        "Não possuir circulação de pessoas;",
        "Ter um responsável para receber as mercadorias e apresentar as plantas hidráulica, elétrica e de gás - não havendo responsável na obra, favor entregar as chaves e as plantas com 2 (dois) dias de antecedência na Loja;",
        "Possuir as medidas corretas dos eletrodomésticos que serão adquiridos posteriormente à montagem dos móveis junto ao vendedor / projetista."
      ],
      duranteMontagem: [
        "Sugerimos que o acabamento do imóvel (pintura, gesso, rodapés, etc.) seja realizado após a finalização da montagem;",
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
}
