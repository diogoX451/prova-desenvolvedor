import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Regra de dependência: o domínio é regra pura. Ele recebe dados e devolve
// dados; quem fala com rede, disco, navegador ou formato externo é adaptador.
const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const arquivosDoDominio = readdirSync(SRC, { recursive: true })
  .filter((f) => /(^|\/)dominio\/[^/]+\.jsx?$/.test(f));

const PROIBIDO = [
  [/from\s+['"][^'"]*\/(adaptadores|ui)\//, 'importa adaptador ou tela'],
  [/from\s+['"]node:/, 'importa módulo do Node'],
  [/from\s+['"][^'"]+\.json['"]/, 'importa dado direto do arquivo'],
  [/from\s+['"](?!\.)[^'"]+['"]/, 'importa biblioteca externa'],
  [/\bfetch\s*\(/, 'faz chamada de rede'],
  [/\b(document|window|localStorage)\b/, 'usa o navegador'],
  [/import\.meta/, 'depende do bundler'],
];

describe('arquitetura: domínio não depende de adaptadores', () => {
  it('existe código de domínio para verificar', () => {
    expect(arquivosDoDominio.length).toBeGreaterThan(0);
  });

  it.each(arquivosDoDominio)('src/%s só tem regra pura', (arquivo) => {
    const codigo = readFileSync(join(SRC, arquivo), 'utf8');
    const violacoes = PROIBIDO.filter(([regra]) => regra.test(codigo)).map(([, motivo]) => motivo);
    expect(violacoes).toEqual([]);
  });
});
