import { describe, it, expect } from 'vitest';
import empresas from '../../data/empresas.json';
import tarefas from '../../data/tarefas.json';
import { listarTarefas } from '../../src/tarefas/dominio/listar.js';

const ids = (empresaId, de = '2026-09-01', ate = '2026-10-31') =>
  listarTarefas({ tarefas, empresas, empresaId, de, ate }).map((t) => t.id);

describe('listarTarefas', () => {
  describe('árvore de empresas', () => {
    it('Grupo Aurora vê todas as empresas do grupo, e não a Outra Empresa', () => {
      expect(ids(1)).toEqual([101, 102, 103, 104, 105, 106, 108, 109, 110, 112, 113, 114, 115]);
    });

    it('Aurora Serviços vê ela e a Aurora Campo', () => {
      expect(ids(2)).toEqual([101, 102, 103, 104, 108, 109, 112, 113, 115]);
    });

    it('Aurora Campo, que não tem filhas, vê só ela', () => {
      expect(ids(4)).toEqual([103, 104, 109, 113]);
    });

    it('Outra Empresa vê só ela', () => {
      expect(ids(5)).toEqual([107, 111]);
    });

    it('empresa inexistente não vê nada', () => {
      expect(ids(99)).toEqual([]);
    });

    it('aceita o id da empresa como texto (valor de <select> ou de URL)', () => {
      expect(ids('2')).toEqual(ids(2));
      expect(ids('2')).toHaveLength(9);
    });
  });

  describe('período', () => {
    it('inclui tarefa criada no dia "de"', () => {
      expect(ids(2, '2026-09-01', '2026-09-04')).toEqual([101]);
    });

    it('inclui tarefa criada no dia "até"', () => {
      expect(ids(2, '2026-10-05', '2026-10-10')).toEqual([113, 115]);
    });

    it('de e até no mesmo dia trazem as tarefas daquele dia', () => {
      expect(ids(1, '2026-10-01', '2026-10-01')).toEqual([109, 110]);
    });

    it('"de" depois de "até" não traz nada', () => {
      expect(ids(1, '2026-10-31', '2026-09-01')).toEqual([]);
    });

    it('data apagada no campo vira período aberto naquela ponta', () => {
      expect(ids(3, '', '2026-09-30')).toEqual([105, 106]);
      expect(ids(3, '2026-10-01', '')).toEqual([110, 114]);
    });
  });

  it('tarefas do mesmo dia saem em ordem de id, sempre na mesma ordem', () => {
    const embaralhadas = [...tarefas].reverse();
    const r = listarTarefas({ tarefas: embaralhadas, empresas, empresaId: 1, de: '2026-09-15', ate: '2026-09-15' });
    expect(r.map((t) => t.id)).toEqual([104, 105]);
  });
});
