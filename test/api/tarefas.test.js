import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from 'node:http';
import { criarBanco } from '../../src/banco/adaptadores/pglite.js';
import { criarRepositorio, empresasParaLogin } from '../../src/tarefas/adaptadores/repositorio-pglite.js';
import { criarApi } from '../../src/api/http.js';
import feriados from '../../data/feriados-2026.json';

// Grupo Aurora (1) ─┬─ Aurora Serviços (2) ── Aurora Campo (4)
//                   └─ Vértice Finanças (3)
// Outra Empresa S.A. (5), fora do grupo.
let servidor;
let base;

beforeEach(async () => {
  const db = await criarBanco();
  const api = criarApi({
    repositorio: criarRepositorio(db),
    empresasLogin: await empresasParaLogin(db),
    feriados,
    slaDiasUteis: 3,
  });
  servidor = createServer((req, res) => api(req, res));
  await new Promise((ok) => servidor.listen(0, ok));
  base = `http://localhost:${servidor.address().port}`;
});

afterEach(() => new Promise((ok) => servidor.close(ok)));

async function pedir(logada, metodo, caminho, corpo) {
  const headers = { 'Content-Type': 'application/json' };
  if (logada) headers['X-Empresa-Logada'] = String(logada);
  const r = await fetch(base + caminho, { method: metodo, headers, body: corpo && JSON.stringify(corpo) });
  return { status: r.status, corpo: r.status === 204 ? null : await r.json() };
}

const ids = (tarefas) => tarefas.map((t) => t.id);
const nova = (empresa_id, extra = {}) =>
  ({ empresa_id, titulo: 'Nova tarefa', status: 'aberta', criada_em: '2026-10-20', ...extra });

describe('sessão', () => {
  it('sem login responde 401', async () => {
    expect((await pedir(null, 'GET', '/api/sessao')).status).toBe(401);
    expect((await pedir(null, 'GET', '/api/tarefas')).status).toBe(401);
  });

  it('empresa que não existe responde 401', async () => {
    expect((await pedir(99, 'GET', '/api/sessao')).status).toBe(401);
  });

  it('a simulação de login lista as empresas sem precisar de login', async () => {
    const r = await pedir(null, 'GET', '/api/simulacao/empresas');
    expect(r.status).toBe(200);
    expect(r.corpo.map((e) => e.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('Aurora Serviços: árvore com o Grupo só como contexto, sem Vértice nem Outra Empresa', async () => {
    const { corpo } = await pedir(2, 'GET', '/api/sessao');
    const [grupo] = corpo.arvore;
    expect(corpo.arvore).toHaveLength(1);
    expect(grupo).toMatchObject({ id: 1, acessivel: false });
    expect(grupo.filhas.map((f) => f.id)).toEqual([2]);
    expect(grupo.filhas[0].filhas[0]).toMatchObject({ id: 4, acessivel: true });
    expect(corpo.permissoes.acessiveis.map((e) => e.nome)).toEqual(['Aurora Serviços', 'Aurora Campo']);
    expect(corpo.permissoes.contexto.map((e) => e.nome)).toEqual(['Grupo Aurora']);
  });

  it('Grupo Aurora: árvore do grupo inteiro, sem a Outra Empresa', async () => {
    const { corpo } = await pedir(1, 'GET', '/api/sessao');
    expect(corpo.arvore.map((r) => r.id)).toEqual([1]);
    expect(corpo.permissoes.contexto).toEqual([]);
  });
});

describe('listar', () => {
  it.each([
    [1, 1, [101, 102, 103, 104, 105, 106, 108, 109, 110, 112, 113, 114, 115]],
    [1, 2, [101, 102, 103, 104, 108, 109, 112, 113, 115]],
    [2, 4, [103, 104, 109, 113]],
    [3, 3, [105, 106, 110, 114]],
    [5, 5, [107, 111]],
  ])('logado em %i, visão %i', async (logada, visao, esperado) => {
    const r = await pedir(logada, 'GET', `/api/tarefas?visao=${visao}&de=2026-09-01&ate=2026-10-31`);
    expect(r.status).toBe(200);
    expect(ids(r.corpo)).toEqual(esperado);
  });

  it('a visão não amplia o acesso: Aurora Serviços pedindo a visão do Grupo recebe 403', async () => {
    expect((await pedir(2, 'GET', '/api/tarefas?visao=1')).status).toBe(403);
    expect((await pedir(3, 'GET', '/api/tarefas?visao=5')).status).toBe(403);
  });

  it('cada tarefa vem com o nome da empresa e o prazo em dias úteis', async () => {
    const { corpo } = await pedir(2, 'GET', '/api/tarefas?visao=2&de=2026-10-10&ate=2026-10-10');
    expect(corpo).toEqual([expect.objectContaining({ id: 115, empresa: 'Aurora Serviços', prazo: '2026-10-15' })]);
  });
});

describe('criar', () => {
  it('cria na própria empresa e numa abaixo, com id da sequência', async () => {
    const a = await pedir(2, 'POST', '/api/tarefas', nova(2));
    const b = await pedir(2, 'POST', '/api/tarefas', nova(4, { titulo: 'Na Campo' }));
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(a.corpo).toMatchObject({ id: 116, empresa_id: 2, prazo: '2026-10-23' });
    expect(b.corpo.id).toBe(117);
    const lista = await pedir(4, 'GET', '/api/tarefas?visao=4');
    expect(ids(lista.corpo)).toContain(117);
  });

  it('empresas que não se enxergam não geram o mesmo id', async () => {
    const a = await pedir(3, 'POST', '/api/tarefas', nova(3));
    const b = await pedir(5, 'POST', '/api/tarefas', nova(5));
    expect(a.corpo.id).not.toBe(b.corpo.id);
  });

  it('o banco recusa criar fora da árvore (403) e nada é gravado', async () => {
    const r = await pedir(3, 'POST', '/api/tarefas', nova(2, { titulo: 'Intrusa' }));
    expect(r.status).toBe(403);
    expect(r.corpo.erro).toMatch(/banco recusou/);
    const doDono = await pedir(2, 'GET', '/api/tarefas?visao=2');
    expect(doDono.corpo.map((t) => t.titulo)).not.toContain('Intrusa');
  });

  it('dados inválidos respondem 400 com o erro de cada campo', async () => {
    const r = await pedir(2, 'POST', '/api/tarefas', { empresa_id: 2, titulo: ' ', status: 'x', criada_em: '2026-02-30' });
    expect(r.status).toBe(400);
    expect(Object.keys(r.corpo.erros).sort()).toEqual(['criada_em', 'status', 'titulo']);
  });

  it('corpo que não é JSON responde 400', async () => {
    const r = await fetch(`${base}/api/tarefas`, { method: 'POST', headers: { 'X-Empresa-Logada': '2' }, body: '{quebrado' });
    expect(r.status).toBe(400);
  });
});

describe('editar', () => {
  it('edita tarefa da própria árvore', async () => {
    const r = await pedir(1, 'PUT', '/api/tarefas/103', nova(4, { titulo: 'Visita reagendada', status: 'concluida', criada_em: '2026-09-10' }));
    expect(r.status).toBe(200);
    expect(r.corpo).toMatchObject({ id: 103, titulo: 'Visita reagendada', status: 'concluida' });
  });

  it('tarefa de outra empresa responde 404, igual a uma que não existe', async () => {
    const alheia = await pedir(3, 'PUT', '/api/tarefas/101', nova(3));
    const inexistente = await pedir(3, 'PUT', '/api/tarefas/9999', nova(3));
    expect(alheia).toEqual(inexistente);
    expect(alheia.status).toBe(404);
  });

  it('o banco recusa mover tarefa para fora da árvore (403) e ela fica como estava', async () => {
    const r = await pedir(3, 'PUT', '/api/tarefas/105', nova(5, { criada_em: '2026-09-15' }));
    expect(r.status).toBe(403);
    const lista = await pedir(3, 'GET', '/api/tarefas?visao=3');
    expect(lista.corpo.find((t) => t.id === 105)).toMatchObject({ empresa_id: 3, titulo: 'Conciliar extrato de agosto' });
  });
});

describe('excluir', () => {
  it('exclui tarefa da própria árvore; depois ela não existe mais', async () => {
    expect((await pedir(2, 'DELETE', '/api/tarefas/113')).status).toBe(204);
    expect((await pedir(2, 'DELETE', '/api/tarefas/113')).status).toBe(404);
  });

  it('tarefa de outra empresa responde 404 e continua existindo', async () => {
    expect((await pedir(3, 'DELETE', '/api/tarefas/107')).status).toBe(404);
    const lista = await pedir(5, 'GET', '/api/tarefas?visao=5');
    expect(ids(lista.corpo)).toContain(107);
  });
});

it('rota desconhecida responde 404', async () => {
  expect((await pedir(1, 'PATCH', '/api/tarefas/101')).status).toBe(404);
  expect((await pedir(1, 'GET', '/api/nada')).status).toBe(404);
});
