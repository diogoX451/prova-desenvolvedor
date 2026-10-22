// A BrasilAPI (e outras fontes) marca Carnaval e Corpus Christi como nacionais,
// mas eles não são feriados nacionais: a portaria anual do governo federal com
// o calendário de feriados lista os dois como ponto facultativo. Como o SLA
// conta "dias úteis, exceto feriados nacionais", eles contam como dia útil.
const PONTO_FACULTATIVO = /carnaval|corpus christi|cinzas/i;

/**
 * Separa os feriados nacionais de um ano.
 *
 * @param {Array<{data: string, nome: string, tipo: string}>} feriados
 *        feriados no formato do domínio (quem traduz a fonte é o adaptador)
 * @param {number} ano ano pedido
 * @returns {{ feriados: Array<{data: string, nome: string}>, descartados: Array<{data: string, nome: string}> }}
 *          feriados nacionais ordenados e sem repetição, e os pontos facultativos deixados de fora
 */
export function feriadosNacionais(feriados, ano) {
  const porData = new Map();
  const descartados = [];
  for (const { data, nome, tipo } of feriados) {
    if (!data.startsWith(`${ano}-`)) throw new Error(`Feriado fora de ${ano}: ${data}`);
    if (tipo !== 'nacional') continue;
    const feriado = { data, nome };
    if (PONTO_FACULTATIVO.test(nome)) descartados.push(feriado);
    else porData.set(data, feriado);
  }

  const nacionais = [...porData.values()].sort((a, b) => a.data.localeCompare(b.data));
  return { feriados: nacionais, descartados };
}
