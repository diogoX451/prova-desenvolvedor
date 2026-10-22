import { describe, it, expect } from 'vitest';
import empresas from '../../data/empresas.json';
import { abrirBanco } from '../../src/banco/adaptadores/pglite.js';
import { descendentes } from '../../src/empresas/dominio/arvore.js';

const ids = async (db, sql) => (await db.query(sql)).rows.map((r) => r.id).sort((a, b) => a - b);

// Grupo Aurora (1) ─┬─ Aurora Serviços (2) ── Aurora Campo (4)
//                   └─ Vértice Finanças (3)
// Outra Empresa S.A. (5), fora do grupo.
describe.each([
  { empresa: 1, acessa: [1, 2, 3, 4], ve: [1, 2, 3, 4] },
  { empresa: 2, acessa: [2, 4], ve: [1, 2, 4] },
  { empresa: 3, acessa: [3], ve: [1, 3] },
  { empresa: 4, acessa: [4], ve: [1, 2, 4] },
  { empresa: 5, acessa: [5], ve: [5] },
])('logado na empresa $empresa', ({ empresa, acessa, ve }) => {
  it('acessa a empresa dela e as de baixo', async () => {
    const db = await abrirBanco(empresa);
    expect(await ids(db, 'select empresas_visiveis() as id')).toEqual(acessa);
  });

  it('a regra do banco e a da tela (descendentes) dão o mesmo resultado', () => {
    expect([...descendentes(empresas, empresa)].sort((a, b) => a - b)).toEqual(acessa);
  });

  it('enxerga na tabela empresas só as que acessa e as acima, nunca irmãs nem outros clientes', async () => {
    const db = await abrirBanco(empresa);
    expect(await ids(db, 'select id from empresas')).toEqual(ve);
  });
});

it('ids novos vêm da sequência, sem colidir entre empresas que não se enxergam', async () => {
  const db = await abrirBanco(3);
  const a = (await db.query(`select nextval('tarefas_id_seq')::int as id`)).rows[0].id;
  await db.query(`select set_config('app.empresa_id', '5', false)`);
  const b = (await db.query(`select nextval('tarefas_id_seq')::int as id`)).rows[0].id;
  expect(a).toBe(116);
  expect(b).toBe(117);
});
