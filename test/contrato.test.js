import { describe, it, expect } from 'vitest';
import * as tarefas from '../src/tarefas.js';
import * as prazo from '../src/prazo.js';
import * as exportar from '../src/exportar.js';
import * as relatorio from '../src/relatorio.js';

// A prova pede para manter nomes e parâmetros. Depois da separação em
// domínio/adaptadores, os caminhos originais viraram fachadas: este teste
// garante que continuam exportando exatamente o mesmo.
describe('contrato: caminhos e nomes originais continuam valendo', () => {
  it.each([
    ['src/tarefas.js', tarefas, ['listarTarefas']],
    ['src/prazo.js', prazo, ['prazoSLA']],
    ['src/exportar.js', exportar, ['gerarCSV']],
    ['src/relatorio.js', relatorio, ['formatarBRL', 'ticketMedio', 'totalDoDia']],
  ])('%s exporta %j', (_, modulo, nomes) => {
    expect(Object.keys(modulo).sort()).toEqual(nomes);
    for (const nome of nomes) expect(typeof modulo[nome]).toBe('function');
  });
});
