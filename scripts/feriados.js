// Baixa os feriados nacionais de um ano e salva em data/feriados-<ano>.json,
// no formato [{ "data": "YYYY-MM-DD", "nome": "..." }].
//
// Uso: npm run feriados -- 2026
import { writeFileSync } from 'node:fs';
import { buscarFeriados } from '../src/feriados/adaptadores/brasilapi.js';
import { feriadosNacionais } from '../src/feriados/dominio/feriados.js';

const ano = process.argv[2];
if (!/^\d{4}$/.test(ano ?? '')) {
  console.error('Informe o ano: npm run feriados -- 2026');
  process.exit(1);
}

try {
  const { feriados, descartados } = feriadosNacionais(await buscarFeriados(ano), Number(ano));
  const destino = new URL(`../data/feriados-${ano}.json`, import.meta.url);
  writeFileSync(destino, `${JSON.stringify(feriados, null, 2)}\n`);

  console.log(`${feriados.length} feriados nacionais de ${ano} salvos em data/feriados-${ano}.json`);
  for (const f of descartados) {
    console.log(`  ignorado (ponto facultativo, não é feriado nacional): ${f.data} ${f.nome}`);
  }
} catch (e) {
  console.error(`Não consegui baixar os feriados de ${ano}: ${e.message}`);
  process.exit(1);
}
