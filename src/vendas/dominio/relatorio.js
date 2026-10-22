// O dia do relatório é o dia em Brasília. Pelo fuso nomeado (e não um -3 fixo)
// a conta continua certa se o horário de verão voltar.
const diaEmBrasilia = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
});

const emCentavos = (valor) => Math.round(valor * 100);

/**
 * Vendas pagas de um dia 'YYYY-MM-DD' (Brasília), uma vez cada.
 * A sincronização às vezes repete a mesma venda; vale a última ocorrência do
 * id no arquivo, por ser o estado mais recente que chegou.
 */
function pagasDoDia(vendas, dia) {
  const porId = new Map(vendas.map((v) => [v.id, v]));
  return [...porId.values()]
    .filter((v) => v.status === 'paga')
    .filter((v) => diaEmBrasilia.format(new Date(v.criada_em)) === dia);
}

/** Total vendido (só vendas pagas) em um dia 'YYYY-MM-DD'. */
export function totalDoDia(vendas, dia) {
  // soma em centavos inteiros: em float, 0.1 + 0.2 não dá 0.3
  const centavos = pagasDoDia(vendas, dia).reduce((soma, v) => soma + emCentavos(v.valor), 0);
  return centavos / 100;
}

/** Ticket médio do dia: total vendido ÷ número de vendas pagas, ao centavo. */
export function ticketMedio(vendas, dia) {
  const pagas = pagasDoDia(vendas, dia);
  if (pagas.length === 0) return 0;
  return Math.round(emCentavos(totalDoDia(vendas, dia)) / pagas.length) / 100;
}
