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

/**
 * Árvore das empresas para a tela. Cada nó diz se quem está logado acessa a
 * empresa (pode ver e mexer nas tarefas dela) ou se ela aparece só como
 * contexto, por estar acima da empresa da pessoa.
 *
 * @param {Array}       empresas   empresas que a pessoa enxerga
 * @param {Set<number>} acessiveis ids que a pessoa acessa
 * @returns {Array<{id: number, nome: string, acessivel: boolean, filhas: Array}>}
 *          raízes (empresas sem pai na lista), na ordem do cadastro. Como cada
 *          empresa tem um pai só, um ciclo no cadastro nunca é alcançado a
 *          partir de uma raiz: as empresas dele ficam de fora, sem travar.
 */
export function montarArvore(empresas, acessiveis) {
  const ids = new Set(empresas.map((e) => e.id));
  const no = (empresa) => ({
    id: empresa.id,
    nome: empresa.nome,
    acessivel: acessiveis.has(empresa.id),
    filhas: empresas.filter((f) => f.pai_id === empresa.id).map(no),
  });
  return empresas.filter((e) => e.pai_id == null || !ids.has(e.pai_id)).map(no);
}
