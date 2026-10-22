// O que a pessoa logada pode fazer. A regra em si mora no banco (RLS); aqui só
// se descreve o resultado para a tela, a partir das empresas que o banco
// devolveu como acessíveis.
export const ACOES = ['ver', 'criar', 'editar', 'excluir'];

/**
 * @param {Array}       empresas   empresas que a pessoa enxerga
 * @param {number}      empresaId  empresa da pessoa logada
 * @param {Set<number>} acessiveis ids que a pessoa acessa
 * @returns {{ empresaLogada: {id, nome} | null, acoes: string[],
 *            acessiveis: Array<{id, nome}>, contexto: Array<{id, nome}> }}
 *          `contexto` são as empresas que aparecem na árvore sem acesso
 */
export function permissoesDe(empresas, empresaId, acessiveis) {
  const resumo = (e) => ({ id: e.id, nome: e.nome });
  const logada = empresas.find((e) => e.id === empresaId);
  return {
    empresaLogada: logada ? resumo(logada) : null,
    acoes: ACOES,
    acessiveis: empresas.filter((e) => acessiveis.has(e.id)).map(resumo),
    contexto: empresas.filter((e) => !acessiveis.has(e.id)).map(resumo),
  };
}
