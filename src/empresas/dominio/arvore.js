/**
 * Empresas que quem escolheu `empresaId` enxerga: ela e todas abaixo dela.
 * Mesma regra da função empresas_visiveis() do banco.
 *
 * @param {Array}  empresas  lista de empresas (data/empresas.json)
 * @param {number} empresaId empresa escolhida
 * @returns {Set<number>} ids visíveis; vazio se a empresa não existe
 */
export function descendentes(empresas, empresaId) {
  if (!empresas.some((e) => e.id === empresaId)) return new Set();

  const visiveis = new Set([empresaId]);
  const fila = [empresaId];
  while (fila.length > 0) {
    const pai = fila.shift();
    for (const e of empresas) {
      // o `has` também protege de ciclo no cadastro (A → B → A)
      if (e.pai_id === pai && !visiveis.has(e.id)) {
        visiveis.add(e.id);
        fila.push(e.id);
      }
    }
  }
  return visiveis;
}
