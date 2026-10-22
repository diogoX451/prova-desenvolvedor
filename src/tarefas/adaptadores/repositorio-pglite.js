// Adaptador de persistência das tarefas: SQL rodando como a pessoa logada.
// Não filtra por empresa em lugar nenhum: quem decide o que cada pessoa vê,
// cria, altera e exclui é o RLS do banco.
import { comoPessoa } from '../../banco/adaptadores/pglite.js';
import { AcessoNegado } from '../../acesso/dominio/erros.js';

const CAMPOS = 'id, empresa_id, titulo, status, criada_em';
const PERMISSAO_NEGADA = '42501';

// o banco devolve `date` como Date; o domínio trabalha com 'YYYY-MM-DD'
const paraDominio = (linha) => ({
  ...linha,
  criada_em: linha.criada_em instanceof Date ? linha.criada_em.toISOString().slice(0, 10) : linha.criada_em,
});

export function criarRepositorio(db) {
  const como = (empresaLogada, fn) =>
    comoPessoa(db, empresaLogada, fn).catch((e) => {
      if (e.code === PERMISSAO_NEGADA) {
        throw new AcessoNegado('O banco recusou: essa empresa está fora do que você acessa.');
      }
      throw e;
    });

  return {
    /** Empresas que a pessoa enxerga e, entre elas, as que ela acessa. */
    empresas: (logada) => como(logada, async (tx) => {
      const acessiveis = (await tx.query('select empresas_visiveis() as id')).rows.map((r) => r.id);
      const { rows } = await tx.query('select id, nome, pai_id from empresas order by id');
      return { empresas: rows, acessiveis: new Set(acessiveis) };
    }),

    listar: (logada) => como(logada, async (tx) =>
      (await tx.query(`select ${CAMPOS} from tarefas order by criada_em, id`)).rows.map(paraDominio)),

    criar: (logada, t) => como(logada, async (tx) => {
      const { rows } = await tx.query(
        `insert into tarefas (id, empresa_id, titulo, status, criada_em)
         values (nextval('tarefas_id_seq'), $1, $2, $3, $4) returning ${CAMPOS}`,
        [t.empresa_id, t.titulo, t.status, t.criada_em]);
      return paraDominio(rows[0]);
    }),

    /** A tarefa atualizada, ou null se ela não existe para essa pessoa. */
    atualizar: (logada, id, t) => como(logada, async (tx) => {
      const { rows } = await tx.query(
        `update tarefas set empresa_id = $2, titulo = $3, status = $4, criada_em = $5
          where id = $1 returning ${CAMPOS}`,
        [id, t.empresa_id, t.titulo, t.status, t.criada_em]);
      return rows[0] ? paraDominio(rows[0]) : null;
    }),

    /** true se excluiu; false se a tarefa não existe para essa pessoa. */
    excluir: (logada, id) => como(logada, async (tx) =>
      (await tx.query('delete from tarefas where id = $1 returning id', [id])).rows.length > 0),
  };
}

/** Lista para a simulação de login: em produção, a empresa vem da sessão. */
export async function empresasParaLogin(db) {
  return (await db.query('select id, nome from empresas order by id')).rows;
}
