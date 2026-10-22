import { describe, it, expect } from 'vitest';
import empresas from '../../data/empresas.json';
import { descendentes } from '../../src/empresas/dominio/arvore.js';

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
