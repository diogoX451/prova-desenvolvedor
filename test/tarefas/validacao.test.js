import { describe, it, expect } from 'vitest';
import { validarTarefa } from '../../src/tarefas/dominio/validacao.js';

const valida = { empresa_id: 2, titulo: '  Revisar contrato  ', status: 'aberta', criada_em: '2026-10-20' };

describe('validarTarefa', () => {
  it('aceita tarefa válida e limpa o título', () => {
    expect(validarTarefa(valida)).toEqual({
      ok: true,
      tarefa: { empresa_id: 2, titulo: 'Revisar contrato', status: 'aberta', criada_em: '2026-10-20' },
    });
  });

  it('aceita o id da empresa como texto (vem de formulário)', () => {
    expect(validarTarefa({ ...valida, empresa_id: '2' }).tarefa.empresa_id).toBe(2);
  });

  it.each([
    ['empresa_id', { empresa_id: '' }],
    ['empresa_id', { empresa_id: 'abc' }],
    ['titulo', { titulo: '   ' }],
    ['titulo', { titulo: 'x'.repeat(201) }],
    ['status', { status: 'pendente' }],
    ['criada_em', { criada_em: '20/10/2026' }],
    ['criada_em', { criada_em: '2026-02-30' }],
  ])('recusa %s inválido (%j)', (campo, troca) => {
    const r = validarTarefa({ ...valida, ...troca });
    expect(r.ok).toBe(false);
    expect(Object.keys(r.erros)).toEqual([campo]);
  });

  it('junta todos os erros de uma vez', () => {
    expect(Object.keys(validarTarefa({}).erros).sort()).toEqual(['criada_em', 'empresa_id', 'status', 'titulo']);
  });
});
