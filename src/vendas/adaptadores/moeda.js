/** Valor em reais no formato brasileiro, ex.: R$ 3.400,50. */
export function formatarBRL(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
