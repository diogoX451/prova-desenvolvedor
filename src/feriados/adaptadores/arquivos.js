// Lê os feriados já baixados (data/feriados-<ano>.json) para quem roda no
// servidor. Na tela, quem faz esse papel era o import.meta.glob do Vite.
import { readdirSync, readFileSync } from 'node:fs';

export function lerFeriados(pasta = new URL('../../../data/', import.meta.url)) {
  return readdirSync(pasta)
    .filter((nome) => /^feriados-\d{4}\.json$/.test(nome))
    .flatMap((nome) => JSON.parse(readFileSync(new URL(nome, pasta), 'utf8')))
    .sort();
}
