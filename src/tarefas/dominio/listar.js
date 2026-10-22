import { descendentes } from '../../empresas/dominio/arvore.js';

/**
 * Lista as tarefas que a pessoa vê quando escolhe uma empresa no seletor:
 * as da empresa e de todas abaixo dela, criadas entre `de` e `ate`
 * (os dois dias inclusos). Data vazia deixa aquela ponta do período aberta.
 *
 * @param {object}   p
 * @param {Array}    p.tarefas   lista de tarefas (data/tarefas.json)
 * @param {Array}    p.empresas  lista de empresas (data/empresas.json)
 * @param {number}   p.empresaId empresa escolhida no seletor
 * @param {string}   p.de        data inicial, 'YYYY-MM-DD'
 * @param {string}   p.ate       data final, 'YYYY-MM-DD'
 * @returns {Array} tarefas ordenadas pela data de criação (e id, no empate)
 */
export function listarTarefas({ tarefas, empresas, empresaId, de, ate }) {
  // o id pode chegar como texto (valor de <select>, parâmetro de URL)
  const visiveis = descendentes(empresas, Number(empresaId));
  // 'YYYY-MM-DD' em ordem de texto é a mesma ordem de data
  return tarefas
    .filter((t) => visiveis.has(t.empresa_id))
    .filter((t) => (!de || t.criada_em >= de) && (!ate || t.criada_em <= ate))
    .sort((a, b) => a.criada_em.localeCompare(b.criada_em) || a.id - b.id);
}
