import { describe, it, expect } from 'vitest';
import tarefas from '../../data/tarefas.json';
import { gerarCSV } from '../../src/tarefas/adaptadores/csv-excel.js';

const BOM = '﻿';
const tarefa = (titulo, extra = {}) =>
  ({ id: 1, empresa_id: 2, titulo, status: 'aberta', criada_em: '2026-10-03', ...extra });

// Lê o CSV como o Excel em português: `;` separa, aspas protegem, "" é uma aspa.
function lerCSV(texto) {
  const linhas = [];
  let linha = [];
  let campo = '';
  let entreAspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreAspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') entreAspas = false;
      else campo += c;
    } else if (c === '"') entreAspas = true;
    else if (c === ';') { linha.push(campo); campo = ''; }
    else if (c === '\n') { linha.push(campo.replace(/\r$/, '')); linhas.push(linha); linha = []; campo = ''; }
    else campo += c;
  }
  linha.push(campo);
  linhas.push(linha);
  return linhas;
}

const semBOM = (csv) => csv.replace(/^﻿/, '');

describe('gerarCSV', () => {
  it('começa com o BOM do UTF-8, para o Excel reconhecer os acentos', () => {
    const csv = gerarCSV([tarefa('Visita técnica')]);
    expect(csv.startsWith(BOM)).toBe(true);
    expect([...Buffer.from(csv, 'utf8').subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(csv).toContain('Visita técnica');
  });

  it('primeira linha é o cabeçalho separado por ;', () => {
    expect(lerCSV(semBOM(gerarCSV([])))).toEqual([['id', 'titulo', 'status', 'criada_em']]);
  });

  it('data no formato DD/MM/AAAA', () => {
    const [, linha] = lerCSV(semBOM(gerarCSV([tarefa('x', { criada_em: '2026-09-01' })])));
    expect(linha[3]).toBe('01/09/2026');
  });

  it.each([
    ['vírgula', 'Visita técnica — Rua das Flores, 42'],
    ['ponto e vírgula e aspas', 'Treinamento "Vendas 2026"; turma 1'],
    ['quebra de linha', 'Primeira linha\nsegunda linha'],
    ['só aspas', '"'],
  ])('título com %s fica inteiro na sua coluna', (_, titulo) => {
    const linhas = lerCSV(semBOM(gerarCSV([tarefa(titulo)])));
    expect(linhas).toHaveLength(2);
    expect(linhas[1]).toEqual(['1', titulo, 'aberta', '03/10/2026']);
  });

  it.each(['=SOMA(despesas) conferir na auditoria', '+5511999999999', '-2 dias', '@usuario'])(
    'título começando com fórmula (%s) não é executado pelo Excel',
    (titulo) => {
      const [, linha] = lerCSV(semBOM(gerarCSV([tarefa(titulo)])));
      expect(linha[1]).toBe(`'${titulo}`);
    },
  );

  it('todas as tarefas reais saem com 4 colunas, na ordem recebida', () => {
    const linhas = lerCSV(semBOM(gerarCSV(tarefas)));
    expect(linhas).toHaveLength(tarefas.length + 1);
    for (const l of linhas) expect(l).toHaveLength(4);
    expect(linhas.slice(1).map((l) => Number(l[0]))).toEqual(tarefas.map((t) => t.id));
  });
});
