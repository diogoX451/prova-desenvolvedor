const SABADO = 6;
const DOMINGO = 0;

/**
 * Prazo de atendimento (SLA) de uma tarefa, em dias úteis: começa a contar no
 * dia seguinte à criação e pula sábados, domingos e feriados.
 * Prazo de 0 dias é o próprio dia da criação.
 *
 * @param {string}   criadaEm   data de criação, 'YYYY-MM-DD'
 * @param {number}   dias       quantos dias úteis o cliente contratou
 * @param {string[]} feriados   datas 'YYYY-MM-DD' que não contam
 * @returns {string} data do prazo, 'YYYY-MM-DD'
 */
export function prazoSLA(criadaEm, dias, feriados = []) {
  const naoUteis = new Set(feriados);
  // Tudo em UTC: é só aritmética de calendário, sem hora. Misturar a data em
  // UTC com getDate/setDate (hora local) dava o dia errado conforme o fuso.
  const d = new Date(`${criadaEm}T00:00:00Z`);
  let faltam = dias;
  while (faltam > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const semana = d.getUTCDay();
    const util = semana !== SABADO && semana !== DOMINGO && !naoUteis.has(d.toISOString().slice(0, 10));
    if (util) faltam--;
  }
  return d.toISOString().slice(0, 10);
}
