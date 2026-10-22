# Arquitetura

O código é separado **por funcionalidade** e, dentro de cada uma, em
**domínio** e **adaptadores**:

```
src/
├── <funcionalidade>/
│   ├── dominio/       regra de negócio pura: recebe dados, devolve dados
│   └── adaptadores/   tudo que fala com o mundo de fora: formatos, APIs, navegador, banco
├── ui/                a tela (React) e o que é só dela
└── tarefas.js · prazo.js · exportar.js · relatorio.js
                       fachadas: o contrato da prova, nos caminhos originais
scripts/               comandos (npm run …): montam as peças e fazem o I/O
sql/schema.sql         banco e regras de acesso (RLS)
```

## Regras

1. **O domínio não depende de nada de fora.** Nada em `dominio/` importa
   adaptador, tela, módulo do Node, arquivo JSON ou biblioteca, nem usa
   `fetch`, `document`, `window` ou `import.meta`. O
   `test/arquitetura.test.js` verifica isso em todo arquivo de `dominio/`.
2. **Adaptador traduz, não decide.** Ele converte o formato de fora (resposta
   de API, CSV do Excel, download do navegador) para o formato do domínio, ou
   o contrário. A regra de negócio fica no domínio.
3. **A tela não sabe de onde vêm os dados.** Só `src/ui/fontes.js` conhece os
   JSON de `data/`.
4. **Os caminhos originais são fachadas.** `src/tarefas.js`, `src/prazo.js`,
   `src/exportar.js` e `src/relatorio.js` só reexportam, mantendo os nomes e
   os parâmetros pedidos. O `test/contrato.test.js` garante isso.
5. **Os comandos são a raiz de composição.** Cada arquivo de `scripts/` junta
   domínio e adaptadores e é o único lugar que lê e grava arquivo.

## Por que assim

- **Testar sem mock**: o domínio é função pura, então os testes passam dados e
  conferem o resultado, sem rede, banco ou navegador.
- **Trocar a fonte sem mexer na regra**: trocar a API de feriados, o formato de
  exportação ou de onde a tela lê os dados muda só o adaptador.
- **Segurança fica no banco**: o filtro por empresa na tela é conveniência; quem
  impede o acesso a dados de outra empresa é o RLS do `sql/schema.sql`.
