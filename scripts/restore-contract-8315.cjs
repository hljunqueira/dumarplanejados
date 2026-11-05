const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const contractData = {
    contractNumber: "CTR-2026-8315",
    contractDate: "03/11/2026",
    status: "aguardando_assinatura",
    signatureLocation: "end_only",
    companyName: "Dumar Móveis Planejados",
    companyRazaoSocial: "Dumar Móveis Planejados Ltda",
    companyCnpj: "42.588.140/0001-72",
    companyAddress: "Av. Santa Catarina, 551 sala 205, Centro - Balneário Arroio do Silva - SC",
    companyPhone: "(48) 98848-6827",
    companyEmail: "dumarmoveisplanejados@gmail.com",
    leadId: 839,
    clientName: "Patricia Marques Ramos",
    clientCpfCnpj: "509.603.260-49",
    clientRg: "509.603.260-49",
    clientAddress: "Rua Primavera, 645 casa 01",
    clientBairro: "Paiquerê",
    clientCidadeUf: "Balneário Arroio do Silva - SC",
    clientPhone: "(51) 98228-1618",
    clientEmail: "Pattymarquesrs@hotmail.com",
    rooms: ["Cozinha Quiosque", "Churrasqueira"],
    materialsDescription: "Estrutura interna em MDF BP Branco, frentes e tamponamentos em MDF BP Floripa e Cinza Urbe, detalhes em Nogueira Nativa, metalon industrial preto e puxadores cobre.",
    totalValue: 11059.92,
    paymentPlanType: "entrada_parcelado",
    downPayment: 3000,
    downPaymentDate: "03/11/2026",
    downPaymentMethod: "PIX",
    remainingBalance: 8059.92,
    assemblyPayment: 1059.92,
    cardInstallmentsCount: 12,
    cardInstallmentValue: 583.33,
    installmentsCount: 12,
    paymentMethod: "PIX + Cartão de Crédito + Saldo na Entrega",
    paymentTermsDetails: "Entrada de R$ 3.000,00 via PIX + R$ 7.000,00 parcelados em 12x no cartão de crédito na assinatura + R$ 1.059,92 em dinheiro/PIX na conclusão da montagem.",
    productionDays: 30,
    clause1Object: "Fabricação, entrega e montagem de móveis planejados para Cozinha Quiosque e Churrasqueira, conforme projeto 3D e memorial descritivo aprovados.",
    clause2Deadlines: "Prazo de 30 dias úteis a contar da assinatura e conferência das medidas finais.",
    clause3Payment: "O valor total do presente contrato é de R$ 11.059,92 (onze mil e cinquenta e nove reais e noventa e dois centavos), a ser pago da seguinte forma: Entrada de R$ 3.000,00 (três mil reais) pagos via PIX no ato do fechamento; R$ 7.000,00 (sete mil reais) parcelados em até 12x no cartão de crédito na assinatura deste instrumento; e Saldo de R$ 1.059,92 (mil e cinquenta e nove reais e noventa e dois centavos) a ser quitado na entrega e conclusão da montagem.",
    clause4CompanyDuties: "Fabricar conforme projeto aprovado, entregar e montar os móveis e prestar assistência técnica se necessário for durante o período de garantia legal e contratual.",
    clause5ClientDuties: "Aprovar projeto executivo, manter ambiente apto (piso, pintura, elétrica e hidráulica concluídos), permitir acesso dos montadores nas datas ajustadas e cumprir as condições de pagamento.",
    clause6DeliveryAssembly: "Entrega e montagem mediante agendamento prévio. Remarcação injustificada ou impedimento de acesso por culpa do contratante poderá gerar novo custo de frete e deslocamento.",
    clause7Warranty: "12 meses para móveis, montagem e ferragens. Não cobre danos por mau uso, umidade/infiltrações de alvenaria, vazamentos hidráulicos, alagamentos, incêndio, modificações por terceiros e limpeza com produtos abrasivos.",
    clause8TechnicalSupport: "Solicitação de assistência técnica via WhatsApp (48) 98848-6827 ou e-mail dumarmoveisplanejados@gmail.com. A vistoria de avaliação ocorrerá em até 30 dias após comunicação formal.",
    clause9Cancellation: "O cliente poderá rescindir se a entrega ultrapassar 90 dias sem justificativa contratual válida. Após iniciada a fabricação e corte de materiais, a desistência imotivada obriga ao ressarcimento integral dos custos comprovados já incorridos pela contratada.",
    clause10General: "Comunicações por WhatsApp e e-mail são plenamente válidas entre as partes. Dados pessoais tratados com sigilo conforme LGPD. Fica eleito o Foro da Comarca de Araranguá/SC para dirimir quaisquer dúvidas deste contrato.",
    memorial: {
      instrucoesProjeto: "Projeto executivo para cozinha do quiosque e churrasqueira com bancada e moldura.",
      estruturaMdf: "Estrutura interna em MDF 15mm BP Branco.",
      frentesMdf: "Frentes em MDF BP Floripa / Cinza Urbe.",
      tamponamentosMdf: "Tamponamentos em MDF padrão Cinza Urbe e Nogueira Nativa.",
      vidros: "N/A",
      puxadores: "Puxadores acabamento Cobre.",
      dobradicas: "Dobradiças em aço inox com amortecedor.",
      corredicas: "Telescópicas reforçadas.",
      itensExtras: "Fita LED na parte inferior da cozinha; moldura de acabamento para pedra da churrasqueira.",
      projectImages: []
    },
    notaAtencao: {
      instrucoesGerais: "Recomendações técnicas para conservação e cuidados com os móveis.",
      antesEntrega: ["Paredes secas e piso concluído", "Pontos de elétrica e gás prontos"],
      duranteMontagem: ["Acesso livre ao quiosque", "Evitar circulação de pessoas não autorizadas"],
      aoTerminoMontagem: ["Vistoria e conferência do termo de entrega"],
      cidadeData: "Balneário Arroio do Silva - SC, 03 de novembro de 2026"
    },
    additionalNotes: "Sinal de R$ 3.000,00 já quitado via PIX em 03/11/2026."
  };

  const jsonStr = JSON.stringify(contractData);

  // Deletar duplicado se houver
  await pool.query('DELETE FROM contracts WHERE contract_number = $1', [contractData.contractNumber]);

  const insertQuery = `
    INSERT INTO contracts (
      contract_number, contract_date, status, lead_id, client_name,
      client_cpf_cnpj, client_address, client_phone, total_value,
      down_payment, data_json, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id, contract_number, client_name, total_value, down_payment, status
  `;

  const values = [
    contractData.contractNumber,
    contractData.contractDate,
    contractData.status,
    contractData.leadId,
    contractData.clientName,
    contractData.clientCpfCnpj,
    contractData.clientAddress,
    contractData.clientPhone,
    contractData.totalValue,
    contractData.downPayment,
    jsonStr,
    new Date("2026-11-03T12:23:10.000Z").toISOString()
  ];

  const res = await pool.query(insertQuery, values);
  console.log("CONTRATO RESTAURADO COM SUCESSO NO POSTGRESQL:", JSON.stringify(res.rows[0], null, 2));

  // Atualizar Lead 839 no funil
  await pool.query("UPDATE leads SET stage = $1, value = $2 WHERE id = $3", ["contrato", contractData.totalValue, contractData.leadId]);
  console.log("LEAD 839 ATUALIZADO PARA ESTÁGIO 'CONTRATO'!");

  process.exit(0);
}

run().catch(e => {
  console.error("ERRO AO RESTAURAR CONTRATO:", e);
  process.exit(1);
});
