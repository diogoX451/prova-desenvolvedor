import { describe, it, expect } from 'vitest';
// Cópia do data/vendas.json de 01/10/2026, o dia que o financeiro conferiu.
// O arquivo real é trocado todo dia pela sincronização; o teste não pode
// depender dele.
import vendasReais from '../fixtures/vendas-2026-10-01.json';
import { totalDoDia, ticketMedio } from '../../src/vendas/dominio/relatorio.js';

const venda = (id, valor, criada_em, status = 'paga') => ({ id, valor, status, criada_em });

describe('totalDoDia', () => {
  it('bate com o conferido pelo financeiro em 01/10/2026', () => {
    expect(totalDoDia(vendasReais, '2026-10-01')).toBe(3400.5);
  });

  describe('dia no horário de Brasília (UTC−3)', () => {
    it('venda às 23h de Brasília conta no dia, mesmo já sendo o dia seguinte em UTC', () => {
      const vendas = [venda('A', 100, '2026-10-02T02:59:59Z')];
      expect(totalDoDia(vendas, '2026-10-01')).toBe(100);
      expect(totalDoDia(vendas, '2026-10-02')).toBe(0);
    });

    it('venda à meia-noite de Brasília já é do dia seguinte', () => {
      const vendas = [venda('A', 100, '2026-10-02T03:00:00Z')];
      expect(totalDoDia(vendas, '2026-10-01')).toBe(0);
      expect(totalDoDia(vendas, '2026-10-02')).toBe(100);
    });
  });

  it('venda repetida pela sincronização conta uma vez só', () => {
    const vendas = [
      venda('A', 100, '2026-10-05T15:00:00Z'),
      venda('A', 100, '2026-10-05T15:00:00Z'),
      venda('B', 30, '2026-10-05T16:00:00Z'),
    ];
    expect(totalDoDia(vendas, '2026-10-05')).toBe(130);
  });

  it('soma centavos sem erro de ponto flutuante', () => {
    const vendas = [venda('A', 0.1, '2026-10-05T15:00:00Z'), venda('B', 0.2, '2026-10-05T15:00:00Z')];
    expect(totalDoDia(vendas, '2026-10-05')).toBe(0.3);
  });

  it('dia sem venda dá zero', () => {
    expect(totalDoDia(vendasReais, '2026-12-25')).toBe(0);
  });
});

describe('ticketMedio', () => {
  it('é o total pago ÷ número de vendas pagas, em 01/10/2026', () => {
    // 3.400,50 ÷ 5 vendas pagas e únicas (V-0991, V-0992, V-0994, V-0995, V-0996)
    expect(ticketMedio(vendasReais, '2026-10-01')).toBe(680.1);
  });

  it('não conta venda cancelada nem repetida no divisor', () => {
    const vendas = [
      venda('A', 100, '2026-10-05T15:00:00Z'),
      venda('A', 100, '2026-10-05T15:00:00Z'),
      venda('B', 50, '2026-10-05T16:00:00Z', 'cancelada'),
    ];
    expect(ticketMedio(vendas, '2026-10-05')).toBe(100);
  });

  it('arredonda para o centavo', () => {
    const vendas = [
      venda('A', 10, '2026-10-05T15:00:00Z'),
      venda('B', 10, '2026-10-05T15:00:00Z'),
      venda('C', 0.01, '2026-10-05T15:00:00Z'),
    ];
    expect(ticketMedio(vendas, '2026-10-05')).toBe(6.67);
  });

  it('dia sem venda paga dá zero', () => {
    const vendas = [venda('B', 50, '2026-10-05T16:00:00Z', 'cancelada')];
    expect(ticketMedio(vendas, '2026-10-05')).toBe(0);
  });
});
