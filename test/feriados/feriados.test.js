import { describe, it, expect } from 'vitest';
import { feriadosNacionais } from '../../src/feriados/dominio/feriados.js';

// já no formato do domínio: o adaptador da fonte é quem traduz
const feriados2026 = [
  { data: '2026-01-01', nome: 'Confraternização mundial', tipo: 'nacional' },
  { data: '2026-02-16', nome: 'Carnaval', tipo: 'nacional' },
  { data: '2026-02-17', nome: 'Carnaval', tipo: 'nacional' },
  { data: '2026-04-03', nome: 'Sexta-feira Santa', tipo: 'nacional' },
  { data: '2026-06-04', nome: 'Corpus Christi', tipo: 'nacional' },
  { data: '2026-11-20', nome: 'Dia da consciência negra', tipo: 'nacional' },
  { data: '2026-12-25', nome: 'Natal', tipo: 'nacional' },
];

describe('feriadosNacionais', () => {
  it('fica com os feriados e tira os pontos facultativos (Carnaval e Corpus Christi)', () => {
    const { feriados, descartados } = feriadosNacionais(feriados2026, 2026);
    expect(feriados.map((f) => f.data)).toEqual([
      '2026-01-01', '2026-04-03', '2026-11-20', '2026-12-25',
    ]);
    expect(descartados.map((f) => f.data)).toEqual(['2026-02-16', '2026-02-17', '2026-06-04']);
  });

  it('devolve { data, nome }, ordenado e sem repetição', () => {
    const { feriados } = feriadosNacionais([feriados2026[6], feriados2026[0], feriados2026[0]], 2026);
    expect(feriados).toEqual([
      { data: '2026-01-01', nome: 'Confraternização mundial' },
      { data: '2026-12-25', nome: 'Natal' },
    ]);
  });

  it('ignora o que não é nacional', () => {
    const { feriados } = feriadosNacionais(
      [...feriados2026, { data: '2026-01-25', nome: 'Aniversário de SP', tipo: 'municipal' }], 2026);
    expect(feriados.map((f) => f.data)).not.toContain('2026-01-25');
  });

  it('recusa feriado de outro ano', () => {
    expect(() => feriadosNacionais([{ data: '2027-01-01', nome: 'x', tipo: 'nacional' }], 2026)).toThrow();
  });
});
