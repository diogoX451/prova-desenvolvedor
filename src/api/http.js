// Adaptador HTTP: traduz requisições em chamadas ao domínio e ao repositório,
// e erros em status. Não sabe de banco nem de React.
//
// Login simulado: a empresa da pessoa chega no cabeçalho X-Empresa-Logada. Em
// produção ela viria da sessão autenticada; nunca de um dado que a tela manda.
import { listarTarefas } from '../tarefas/dominio/listar.js';
import { validarTarefa } from '../tarefas/dominio/validacao.js';
import { prazoSLA } from '../tarefas/dominio/prazo.js';
import { montarArvore } from '../empresas/dominio/arvore.js';
import { permissoesDe } from '../acesso/dominio/permissoes.js';
import { AcessoNegado } from '../acesso/dominio/erros.js';

const LIMITE_CORPO = 10_000;

function responder(res, status, corpo) {
  res.statusCode = status;
  if (corpo === undefined) return res.end();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(corpo));
}

class RequisicaoInvalida extends Error {}

async function lerJson(req) {
  let texto = '';
  for await (const pedaco of req) {
    texto += pedaco;
    if (texto.length > LIMITE_CORPO) throw new RequisicaoInvalida('Corpo grande demais.');
  }
  try {
    return JSON.parse(texto || '{}');
  } catch {
    throw new RequisicaoInvalida('O corpo precisa ser JSON.');
  }
}

/**
 * @param {object} deps
 * @param {object} deps.repositorio   criarRepositorio(db)
 * @param {Array}  deps.empresasLogin lista para a simulação de login
 * @param {string[]} deps.feriados    datas 'YYYY-MM-DD'
 * @param {number} deps.slaDiasUteis  prazo contratado, em dias úteis
 * @returns {(req, res, next?) => Promise<void>} handler para node:http ou middleware do Vite
 */
export function criarApi({ repositorio, empresasLogin, feriados = [], slaDiasUteis = 3 }) {
  const comPrazo = (t) => ({ ...t, prazo: prazoSLA(t.criada_em, slaDiasUteis, feriados) });

  const rotas = {
    'GET /api/simulacao/empresas': async () => [200, empresasLogin],

    'GET /api/sessao': async ({ logada }) => {
      const { empresas, acessiveis } = await repositorio.empresas(logada);
      if (acessiveis.size === 0) return [401, { erro: 'Empresa não encontrada.' }];
      return [200, {
        permissoes: permissoesDe(empresas, logada, acessiveis),
        arvore: montarArvore(empresas, acessiveis),
        slaDiasUteis,
      }];
    },

    'GET /api/tarefas': async ({ logada, url }) => {
      const visao = Number(url.searchParams.get('visao') ?? logada);
      const { empresas, acessiveis } = await repositorio.empresas(logada);
      // a visão filtra dentro do permitido; nunca amplia
      if (!acessiveis.has(visao)) throw new AcessoNegado('Você não tem acesso a essa visão.');
      const tarefas = listarTarefas({
        tarefas: await repositorio.listar(logada),
        empresas,
        empresaId: visao,
        de: url.searchParams.get('de') ?? '',
        ate: url.searchParams.get('ate') ?? '',
      });
      const nomes = new Map(empresas.map((e) => [e.id, e.nome]));
      return [200, tarefas.map((t) => ({ ...comPrazo(t), empresa: nomes.get(t.empresa_id) }))];
    },

    'POST /api/tarefas': async ({ logada, req }) => {
      const r = validarTarefa(await lerJson(req));
      if (!r.ok) return [400, { erro: 'Confira os campos.', erros: r.erros }];
      return [201, comPrazo(await repositorio.criar(logada, r.tarefa))];
    },

    'PUT /api/tarefas/:id': async ({ logada, req, id }) => {
      const r = validarTarefa(await lerJson(req));
      if (!r.ok) return [400, { erro: 'Confira os campos.', erros: r.erros }];
      const tarefa = await repositorio.atualizar(logada, id, r.tarefa);
      // inexistente e invisível respondem igual: não revela o que existe
      return tarefa ? [200, comPrazo(tarefa)] : [404, { erro: 'Tarefa não encontrada.' }];
    },

    'DELETE /api/tarefas/:id': async ({ logada, id }) =>
      (await repositorio.excluir(logada, id)) ? [204] : [404, { erro: 'Tarefa não encontrada.' }],
  };

  return async function api(req, res, next) {
    const url = new URL(req.url, 'http://api.local');
    if (!url.pathname.startsWith('/api/')) return next ? next() : responder(res, 404, { erro: 'Não encontrado.' });

    const casaId = url.pathname.match(/^\/api\/tarefas\/(\d+)$/);
    const chave = `${req.method} ${casaId ? '/api/tarefas/:id' : url.pathname}`;
    const rota = rotas[chave];
    if (!rota) return responder(res, 404, { erro: 'Rota não encontrada.' });

    try {
      const publica = chave === 'GET /api/simulacao/empresas';
      const logada = Number(req.headers['x-empresa-logada']);
      if (!publica && (!Number.isInteger(logada) || logada <= 0)) {
        return responder(res, 401, { erro: 'Faça login (cabeçalho X-Empresa-Logada).' });
      }
      const [status, corpo] = await rota({ req, url, logada, id: casaId && Number(casaId[1]) });
      return responder(res, status, corpo);
    } catch (e) {
      if (e instanceof AcessoNegado) return responder(res, 403, { erro: e.message });
      if (e instanceof RequisicaoInvalida) return responder(res, 400, { erro: e.message });
      console.error(e);
      return responder(res, 500, { erro: 'Erro inesperado.' });
    }
  };
}
