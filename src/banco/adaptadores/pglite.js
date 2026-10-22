// Sobe o banco em memória (Postgres via PGlite) com os arquivos de sql/ e os
// dados de data/. Usado pela API, pelo `npm run db` e pelos testes, para todos
// enxergarem exatamente o mesmo banco.
// Adaptador de persistência: é o único lugar que monta o Postgres em memória.
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const ler = (p) => readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8');

const MIGRACOES = ['sql/schema.sql', 'sql/002_sequencia_tarefas.sql', 'sql/003_rls_empresas.sql'];

/** Banco com schema, dados e o papel sem privilégio app_user, conectado como dono. */
export async function criarBanco() {
  const db = new PGlite();
  for (const arquivo of MIGRACOES) await db.exec(ler(arquivo));

  for (const e of JSON.parse(ler('data/empresas.json'))) {
    await db.query('insert into empresas values ($1, $2, $3)', [e.id, e.nome, e.pai_id]);
  }
  for (const t of JSON.parse(ler('data/tarefas.json'))) {
    await db.query('insert into tarefas values ($1, $2, $3, $4, $5)',
      [t.id, t.empresa_id, t.titulo, t.status, t.criada_em]);
  }
  await db.query(`select setval('tarefas_id_seq', (select max(id) from tarefas))`);

  // a pessoa logada: papel sem privilégio
  await db.exec(`
    create role app_user;
    grant select, insert, update, delete on all tables in schema public to app_user;
    grant usage, select on all sequences in schema public to app_user;
    grant execute on all functions in schema public to app_user;
  `);
  return db;
}

/**
 * Roda `fn` como uma pessoa logada numa empresa: uma transação com o papel
 * app_user e o app.empresa_id gravados só para ela. Quem decide o que a pessoa
 * pode ver e mudar é o RLS do banco, não quem chama.
 */
export function comoPessoa(db, empresaId, fn) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role app_user');
    await tx.query(`select set_config('app.empresa_id', $1, true)`, [String(Number(empresaId))]);
    return fn(tx);
  });
}

/** Banco logado como uma pessoa na sessão inteira (npm run db e testes de RLS). */
export async function abrirBanco(empresaId) {
  const db = await criarBanco();
  await db.query(`select set_config('app.empresa_id', $1, false)`, [String(Number(empresaId))]);
  await db.exec('set role app_user');
  return db;
}
