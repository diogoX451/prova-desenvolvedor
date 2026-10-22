// Sem o BOM, o Excel abre o arquivo como ANSI e estraga os acentos.
const BOM = '﻿';
// `;` é o separador do Excel em português.
const SEPARADOR = ';';

// '2026-10-03' → '03/10/2026', sem passar por Date (e por fuso nenhum)
const dataBR = (iso) => iso.split('-').reverse().join('/');

/**
 * Prepara um valor para uma célula do CSV:
 * - texto que começa com = + - @ (ou tab/CR) ganha um ' na frente, para o
 *   Excel não executar como fórmula (CSV injection, recomendação da OWASP);
 * - campo com ; " ou quebra de linha vai entre aspas, com " virando "",
 *   para continuar numa coluna só (RFC 4180).
 */
function celula(valor) {
  let texto = String(valor ?? '');
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  if (/[;"\r\n]/.test(texto)) texto = `"${texto.replaceAll('"', '""')}"`;
  return texto;
}

/** Gera o CSV das tarefas para o financeiro abrir no Excel. */
export function gerarCSV(tarefas) {
  const linhas = tarefas.map((t) =>
    [t.id, t.titulo, t.status, dataBR(t.criada_em)].map(celula).join(SEPARADOR));
  return BOM + ['id;titulo;status;criada_em', ...linhas].join('\n');
}
