import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { abrirBanco } from '../../src/banco/adaptadores/pglite.js';

// Quem escolhe uma empresa vê ela e todas abaixo dela na árvore:
// Grupo Aurora (1) ─┬─ Aurora Serviços (2) ── Aurora Campo (4)
//                   └─ Vértice Finanças (3)
// Outra Empresa S.A. (5), fora do grupo.
const CASOS = [
  { empresa: 1, ve: [2, 3, 4], tarefas: [101, 102, 103, 104, 105, 106, 108, 109, 110, 112, 113, 114, 115], alheia: 107, fora: 5 },
  { empresa: 2, ve: [2, 4], tarefas: [101, 102, 103, 104, 108, 109, 112, 113, 115], alheia: 105, fora: 3 },
  { empresa: 3, ve: [3], tarefas: [105, 106, 110, 114], alheia: 101, fora: 1 },
  { empresa: 4, ve: [4], tarefas: [103, 104, 109, 113], alheia: 101, fora: 2 },
  { empresa: 5, ve: [5], tarefas: [107, 111], alheia: 101, fora: 1 },
];

const ids = async (db) =>
  (await db.query('select id from tarefas order by id')).rows.map((r) => r.id);

describe.each(CASOS)('logado na empresa $empresa', ({ empresa, ve, tarefas, alheia, fora }) => {
  let db;
  beforeAll(async () => { db = await abrirBanco(empresa); await db.exec('begin'); });
  afterEach(async () => { await db.exec('rollback; begin'); });

  it('lê só as tarefas da empresa e das de baixo', async () => {
    expect(await ids(db)).toEqual(tarefas);
  });

  it.each(ve)('cria tarefa na empresa %i (dela ou abaixo)', async (alvo) => {
    await db.query(`insert into tarefas values (900, $1, 'nova', 'aberta', '2026-10-20')`, [alvo]);
    expect(await ids(db)).toContain(900);
  });

  it('não cria tarefa em empresa fora da árvore', async () => {
    await expect(
      db.query(`insert into tarefas values (900, $1, 'intrusa', 'aberta', '2026-10-20')`, [fora]),
    ).rejects.toThrow(/row-level security/);
  });

  it('não altera nem apaga tarefa de outra empresa', async () => {
    const upd = await db.query(`update tarefas set titulo = 'hackeada' where id = $1`, [alheia]);
    const del = await db.query('delete from tarefas where id = $1', [alheia]);
    expect(upd.affectedRows).toBe(0);
    expect(del.affectedRows).toBe(0);
  });

  it('altera e apaga tarefa da própria árvore', async () => {
    const [minha] = tarefas;
    const upd = await db.query(`update tarefas set status = 'concluida' where id = $1`, [minha]);
    const del = await db.query('delete from tarefas where id = $1', [minha]);
    expect(upd.affectedRows).toBe(1);
    expect(del.affectedRows).toBe(1);
  });

  it('não move tarefa própria para empresa fora da árvore', async () => {
    await expect(
      db.query('update tarefas set empresa_id = $1 where id = $2', [fora, tarefas[0]]),
    ).rejects.toThrow(/row-level security/);
  });
});

describe('sem empresa válida no contexto', () => {
  it('empresa inexistente não vê nada', async () => {
    const db = await abrirBanco(99);
    expect(await ids(db)).toEqual([]);
  });

  it('app.empresa_id vazio não vê nada (fail-closed)', async () => {
    const db = await abrirBanco(3);
    await db.query(`select set_config('app.empresa_id', '', false)`);
    expect(await ids(db)).toEqual([]);
  });
});
