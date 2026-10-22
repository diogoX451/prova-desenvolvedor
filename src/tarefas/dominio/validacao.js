export const STATUS = ['aberta', 'concluida'];
const TITULO_MAX = 200;
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

// '2026-02-30' tem o formato certo, mas não existe
function dataExiste(texto) {
  if (typeof texto !== 'string' || !DATA_ISO.test(texto)) return false;
  const d = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto;
}

/**
 * Confere os dados de uma tarefa vinda de fora (formulário, API).
 *
 * @returns {{ ok: true, tarefa: {empresa_id, titulo, status, criada_em} }
 *         | { ok: false, erros: Record<string, string> }}
 *          a tarefa limpa, ou uma mensagem por campo com problema
 */
export function validarTarefa(dados = {}) {
  const erros = {};
  const titulo = typeof dados.titulo === 'string' ? dados.titulo.trim() : '';
  const empresaId = Number(dados.empresa_id);

  if (!Number.isInteger(empresaId) || empresaId <= 0) erros.empresa_id = 'Escolha a empresa.';
  if (!titulo) erros.titulo = 'Informe o título.';
  else if (titulo.length > TITULO_MAX) erros.titulo = `Use no máximo ${TITULO_MAX} caracteres.`;
  if (!STATUS.includes(dados.status)) erros.status = `Use um destes: ${STATUS.join(', ')}.`;
  if (!dataExiste(dados.criada_em)) erros.criada_em = 'Use uma data válida, no formato AAAA-MM-DD.';

  if (Object.keys(erros).length > 0) return { ok: false, erros };
  return {
    ok: true,
    tarefa: { empresa_id: empresaId, titulo, status: dados.status, criada_em: dados.criada_em },
  };
}
