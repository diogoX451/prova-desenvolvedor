import { describe, it, expect } from 'vitest';
import empresas from '../../data/empresas.json';
import { permissoesDe, ACOES } from '../../src/acesso/dominio/permissoes.js';

describe('permissoesDe', () => {
  it('logado na Aurora Serviços: acessa ela e a Campo; o Grupo aparece só como contexto', () => {
    const visiveis = empresas.filter((e) => [1, 2, 4].includes(e.id));
    const p = permissoesDe(visiveis, 2, new Set([2, 4]));
    expect(p.empresaLogada).toEqual({ id: 2, nome: 'Aurora Serviços' });
    expect(p.acoes).toEqual(ACOES);
    expect(p.acessiveis.map((e) => e.id)).toEqual([2, 4]);
    expect(p.contexto.map((e) => e.id)).toEqual([1]);
  });

  it('empresa que o banco não devolveu fica sem empresa logada e sem acesso', () => {
    const p = permissoesDe([], 99, new Set());
    expect(p).toMatchObject({ empresaLogada: null, acessiveis: [], contexto: [] });
  });
});
