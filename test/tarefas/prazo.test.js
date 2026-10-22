import { describe, it, expect } from 'vitest';
import feriados from '../../data/feriados-2026.json';
import { prazoSLA } from '../../src/tarefas/dominio/prazo.js';

describe('prazoSLA em dias úteis', () => {
  it('tarefa de sexta com 1 dia vence na segunda, não no sábado', () => {
    expect(prazoSLA('2026-10-02', 1, [])).toBe('2026-10-05');
  });

  it('começa a contar no dia seguinte à criação', () => {
    expect(prazoSLA('2026-10-05', 1, [])).toBe('2026-10-06');
  });

  it('pula o fim de semana no meio do prazo', () => {
    expect(prazoSLA('2026-10-01', 3, [])).toBe('2026-10-06');
  });

  it('pula feriado em dia de semana', () => {
    // sex 09/10 → (seg 12/10 é feriado) → ter 13/10
    expect(prazoSLA('2026-10-09', 1, ['2026-10-12'])).toBe('2026-10-13');
  });

  it('tarefa criada no sábado começa a contar na segunda', () => {
    // sáb 10/10 → seg 12/10 feriado → ter 13, qua 14, qui 15
    expect(prazoSLA('2026-10-10', 3, ['2026-10-12'])).toBe('2026-10-15');
  });

  it('feriado no fim de semana não desconta nada a mais', () => {
    // dom 15/11 é feriado, mas já não era dia útil
    expect(prazoSLA('2026-11-13', 1, ['2026-11-15'])).toBe('2026-11-16');
  });

  it('feriados seguidos de fim de semana', () => {
    // qui 24/12 → sex 25/12 Natal, fim de semana → seg 28/12
    expect(prazoSLA('2026-12-24', 1, ['2026-12-25'])).toBe('2026-12-28');
  });

  it('atravessa a virada do ano', () => {
    // qua 30/12 → qui 31/12, (sex 01/01 feriado), seg 04/01, ter 05/01
    expect(prazoSLA('2026-12-30', 3, ['2027-01-01'])).toBe('2027-01-05');
  });

  it('prazo de 0 dias é o próprio dia da criação', () => {
    expect(prazoSLA('2026-10-02', 0, [])).toBe('2026-10-02');
  });

  it.each([1.5, -1, Number.NaN, '3'])('recusa prazo inválido (dias = %s)', (dias) => {
    expect(() => prazoSLA('2026-10-02', dias, [])).toThrow(RangeError);
  });

  it('sem lista de feriados, conta só os fins de semana', () => {
    expect(prazoSLA('2026-10-02', 1)).toBe('2026-10-05');
  });

  it('não depende do fuso horário da máquina', () => {
    const fusoOriginal = process.env.TZ;
    try {
      for (const fuso of ['America/Sao_Paulo', 'Asia/Tokyo', 'Pacific/Kiritimati', 'Pacific/Pago_Pago']) {
        process.env.TZ = fuso;
        expect(prazoSLA('2026-10-02', 1, [])).toBe('2026-10-05');
      }
    } finally {
      process.env.TZ = fusoOriginal;
    }
  });

  describe('com os feriados de 2026 baixados da BrasilAPI', () => {
    it.each([
      ['2026-09-05', '2026-09-10', 'sáb; 07/09 Independência'],
      ['2026-10-08', '2026-10-14', 'qui; 12/10 Nossa Senhora Aparecida'],
      ['2026-10-10', '2026-10-15', 'sáb; 12/10'],
      ['2026-11-18', '2026-11-24', 'qua; 20/11 Consciência Negra'],
      ['2026-02-13', '2026-02-18', 'sex; Carnaval (16 e 17/02) é dia útil'],
    ])('criada em %s vence em %s (%s)', (criada, prazo) => {
      expect(prazoSLA(criada, 3, feriados)).toBe(prazo);
    });
  });
});
