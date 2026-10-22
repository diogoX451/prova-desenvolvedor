import { describe, it, expect } from 'vitest';
import empresas from '../../data/empresas.json';
import { descendentes, montarArvore } from '../../src/empresas/dominio/arvore.js';

const ordenado = (s) => [...s].sort((a, b) => a - b);

describe('descendentes', () => {
  it('inclui a própria empresa e todas abaixo, em qualquer profundidade', () => {
    expect(ordenado(descendentes(empresas, 1))).toEqual([1, 2, 3, 4]);
    expect(ordenado(descendentes(empresas, 2))).toEqual([2, 4]);
    expect(ordenado(descendentes(empresas, 4))).toEqual([4]);
    expect(ordenado(descendentes(empresas, 5))).toEqual([5]);
  });

  it('empresa inexistente não tem ninguém', () => {
    expect(ordenado(descendentes(empresas, 99))).toEqual([]);
  });

  it('não entra em loop se o cadastro tiver um ciclo', () => {
    const ciclo = [
      { id: 1, pai_id: 3 },
      { id: 2, pai_id: 1 },
      { id: 3, pai_id: 2 },
    ];
    expect(ordenado(descendentes(ciclo, 1))).toEqual([1, 2, 3]);
  });
});

describe('montarArvore', () => {
  it('monta a árvore inteira para quem acessa o grupo', () => {
    const [grupo, outra] = montarArvore(empresas, new Set([1, 2, 3, 4]));
    expect(grupo).toMatchObject({ id: 1, acessivel: true });
    expect(grupo.filhas.map((f) => f.id)).toEqual([2, 3]);
    expect(grupo.filhas[0].filhas.map((f) => f.id)).toEqual([4]);
    expect(outra).toMatchObject({ id: 5, acessivel: false, filhas: [] });
  });

  it('marca como só contexto a empresa acima de quem está logado', () => {
    // logado na Aurora Serviços: o banco devolve Grupo (acima), Serviços e Campo
    const visiveis = empresas.filter((e) => [1, 2, 4].includes(e.id));
    const [grupo] = montarArvore(visiveis, new Set([2, 4]));
    expect(grupo).toMatchObject({ id: 1, acessivel: false });
    expect(grupo.filhas).toHaveLength(1);
    expect(grupo.filhas[0]).toMatchObject({ id: 2, acessivel: true });
    expect(grupo.filhas[0].filhas[0]).toMatchObject({ id: 4, acessivel: true, filhas: [] });
  });

  it('empresa cujo pai não está na lista vira raiz', () => {
    const [raiz] = montarArvore(empresas.filter((e) => e.id === 4), new Set([4]));
    expect(raiz).toMatchObject({ id: 4, acessivel: true, filhas: [] });
  });

  it('empresas num ciclo do cadastro (sem raiz) ficam de fora, sem travar', () => {
    const cadastro = [
      { id: 1, nome: 'Raiz', pai_id: null },
      { id: 2, nome: 'Filha', pai_id: 1 },
      { id: 7, nome: 'A', pai_id: 9 },
      { id: 8, nome: 'B', pai_id: 7 },
      { id: 9, nome: 'C', pai_id: 8 },
    ];
    const arvore = montarArvore(cadastro, new Set([1, 2, 7, 8, 9]));
    expect(arvore.map((r) => r.id)).toEqual([1]);
    expect(arvore[0].filhas.map((f) => f.id)).toEqual([2]);
  });
});
