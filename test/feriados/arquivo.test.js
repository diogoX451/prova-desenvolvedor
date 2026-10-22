import { describe, it, expect } from 'vitest';
import feriados from '../../data/feriados-2026.json';
import { prazoSLA } from '../../src/prazo.js';

// O arquivo gerado por `npm run feriados -- 2026` tem que servir direto no
// prazoSLA, que recebe datas 'YYYY-MM-DD'.
describe('data/feriados-2026.json', () => {
  it('é uma lista de datas de 2026', () => {
    expect(Array.isArray(feriados)).toBe(true);
    for (const f of feriados) expect(f).toMatch(/^2026-\d{2}-\d{2}$/);
  });

  it('tem os feriados nacionais e não tem os pontos facultativos', () => {
    expect(feriados).toEqual(expect.arrayContaining(['2026-10-12', '2026-11-20', '2026-12-25']));
    expect(feriados).not.toContain('2026-02-16'); // Carnaval
    expect(feriados).not.toContain('2026-06-04'); // Corpus Christi
  });

  it('passado direto ao prazoSLA, os feriados contam', () => {
    // sáb 10/10 → seg 12/10 é feriado → ter 13, qua 14, qui 15
    expect(prazoSLA('2026-10-10', 3, feriados)).toBe('2026-10-15');
  });
});
