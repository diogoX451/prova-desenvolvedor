import { describe, it, expect } from 'vitest';
import { traduzirResposta, buscarFeriados } from '../../src/feriados/adaptadores/brasilapi.js';

// formato da resposta de https://brasilapi.com.br/api/feriados/v1/2026
const respostaApi = [
  { date: '2026-01-01', name: 'Confraternização mundial', type: 'national', weekday: 'quinta-feira' },
  { date: '2026-02-16', name: 'Carnaval', type: 'national', weekday: 'segunda-feira' },
];

const fetchFalso = (status, corpo, chamadas = []) => async (url) => {
  chamadas.push(url);
  return { ok: status >= 200 && status < 300, status, json: async () => corpo };
};

describe('adaptador da BrasilAPI', () => {
  it('traduz { date, name, type } para o formato do domínio', () => {
    expect(traduzirResposta(respostaApi)).toEqual([
      { data: '2026-01-01', nome: 'Confraternização mundial', tipo: 'nacional' },
      { data: '2026-02-16', nome: 'Carnaval', tipo: 'nacional' },
    ]);
  });

  it('tipo que ele não conhece passa como veio, para o domínio ignorar', () => {
    const [f] = traduzirResposta([{ date: '2026-03-01', name: 'x', type: 'optional' }]);
    expect(f.tipo).toBe('optional');
  });

  it.each([
    ['resposta que não é lista', { message: 'erro' }],
    ['lista vazia', []],
    ['data em formato estranho', [{ date: '01/01/2026', name: 'x', type: 'national' }]],
  ])('recusa %s', (_, resposta) => {
    expect(() => traduzirResposta(resposta)).toThrow();
  });

  it('busca o ano pedido e devolve no formato do domínio', async () => {
    const chamadas = [];
    const feriados = await buscarFeriados(2026, fetchFalso(200, respostaApi, chamadas));
    expect(chamadas).toEqual(['https://brasilapi.com.br/api/feriados/v1/2026']);
    expect(feriados[0]).toEqual({ data: '2026-01-01', nome: 'Confraternização mundial', tipo: 'nacional' });
  });

  it('erro HTTP vira erro com o status', async () => {
    await expect(buscarFeriados(2026, fetchFalso(500, {}))).rejects.toThrow(/500/);
  });
});
