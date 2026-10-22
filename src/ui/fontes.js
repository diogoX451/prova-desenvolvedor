// Única parte da tela que sabe de onde vêm os dados: agora, a API. Antes eram
// os JSON de data/; a troca mudou só este arquivo.
async function chamar(metodo, caminho, { logada, corpo } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  // login simulado: em produção a empresa vem da sessão, não de um cabeçalho
  if (logada) headers['X-Empresa-Logada'] = String(logada);
  const resposta = await fetch(caminho, {
    method: metodo,
    headers,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  if (resposta.status === 204) return null;
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const erro = new Error(dados.erro ?? `Erro ${resposta.status}`);
    erro.status = resposta.status;
    erro.erros = dados.erros;
    throw erro;
  }
  return dados;
}

export const empresasParaLogin = () => chamar('GET', '/api/simulacao/empresas');

export function criarFonte(logada) {
  return {
    logada,
    sessao: () => chamar('GET', '/api/sessao', { logada }),
    tarefas: ({ visao, de, ate }) =>
      chamar('GET', `/api/tarefas?${new URLSearchParams({ visao, de, ate })}`, { logada }),
    criar: (tarefa) => chamar('POST', '/api/tarefas', { logada, corpo: tarefa }),
    atualizar: (id, tarefa) => chamar('PUT', `/api/tarefas/${id}`, { logada, corpo: tarefa }),
    excluir: (id) => chamar('DELETE', `/api/tarefas/${id}`, { logada }),
  };
}
