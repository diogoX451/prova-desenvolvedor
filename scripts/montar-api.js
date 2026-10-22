// Raiz de composição da API: junta banco, repositório, feriados e o handler
// HTTP. Usada pelo `npm run api` e pelo `npm run dev` (plugin do Vite).
import { criarBanco } from '../src/banco/adaptadores/pglite.js';
import { criarRepositorio, empresasParaLogin } from '../src/tarefas/adaptadores/repositorio-pglite.js';
import { lerFeriados } from '../src/feriados/adaptadores/arquivos.js';
import { criarApi } from '../src/api/http.js';

export async function montarApi() {
  const db = await criarBanco();
  return criarApi({
    repositorio: criarRepositorio(db),
    empresasLogin: await empresasParaLogin(db),
    feriados: lerFeriados(),
    slaDiasUteis: 3,
  });
}
