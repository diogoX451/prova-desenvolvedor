// Adaptador da BrasilAPI: busca os feriados de um ano e traduz a resposta
// ({ date, name, type }) para o formato do domínio ({ data, nome, tipo }).
// Trocar de provedor é trocar este arquivo; a regra de negócio não muda.
const URL_BASE = 'https://brasilapi.com.br/api/feriados/v1';
const TIPOS = { national: 'nacional', state: 'estadual', municipal: 'municipal' };
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Converte a resposta da BrasilAPI; recusa o que vier fora do formato. */
export function traduzirResposta(resposta) {
  if (!Array.isArray(resposta) || resposta.length === 0) {
    throw new Error('A BrasilAPI não devolveu uma lista de feriados.');
  }
  return resposta.map(({ date, name, type }) => {
    if (!DATA_ISO.test(date ?? '')) {
      throw new Error(`Data inesperada na resposta da BrasilAPI: ${JSON.stringify(date)}`);
    }
    return { data: date, nome: String(name ?? ''), tipo: TIPOS[type] ?? type };
  });
}

/**
 * Feriados de um ano, já no formato do domínio.
 * `buscar` é o fetch; os testes passam um falso, para rodar sem rede.
 */
export async function buscarFeriados(ano, buscar = fetch) {
  const url = `${URL_BASE}/${ano}`;
  const resposta = await buscar(url, { signal: AbortSignal.timeout(15_000) });
  if (!resposta.ok) throw new Error(`a BrasilAPI respondeu ${resposta.status} (${url})`);
  return traduzirResposta(await resposta.json());
}
