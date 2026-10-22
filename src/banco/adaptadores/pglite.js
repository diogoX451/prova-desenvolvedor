// Sobe o banco em memória (Postgres via PGlite) com sql/schema.sql e os dados
// de data/, já logado COMO uma pessoa de uma empresa. Usado pelo `npm run db`
// e pelos testes, para os dois enxergarem exatamente o mesmo banco.
// Adaptador de persistência: é o único lugar que monta o Postgres em memória.
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const ler = (p) => readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8');

export async function abrirBanco(empresaId) {
  const db = new PGlite();
  await db.exec(ler('sql/schema.sql'));

  for (const e of JSON.parse(ler('data/empresas.json'))) {
    await db.query('insert into empresas values ($1, $2, $3)', [e.id, e.nome, e.pai_id]);
  }
  for (const t of JSON.parse(ler('data/tarefas.json'))) {
    await db.query('insert into tarefas values ($1, $2, $3, $4, $5)',
      [t.id, t.empresa_id, t.titulo, t.status, t.criada_em]);
  }

  // a pessoa logada: papel sem privilégio + a empresa dela
  await db.exec(`
    create role app_user;
    grant select, insert, update, delete on all tables in schema public to app_user;
    grant execute on all functions in schema public to app_user;
  `);
  await db.query(`select set_config('app.empresa_id', $1, false)`, [String(Number(empresaId))]);
  await db.exec('set role app_user');

  return db;
}
