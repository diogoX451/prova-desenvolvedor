# Status da entrega

**Nome:** Diogo Almeida
**Tempo total gasto (aprox.):** _[preencher]_

## Ordem em que trabalhei

**3 → 1 → 2 → 5 → 4**

1. **Tarefa 3**: era vazamento de dados entre clientes, um incidente de segurança (e de LGPD). É a única marcada como urgente, e cada hora aberta é mais exposição.
2. **Tarefa 1**: a tela estava inteira quebrada para quem escolhe o Grupo Aurora. A correção é rápida, e as Tarefas 4 e 5 acontecem nessa mesma tela.
3. **Tarefa 2**: um número financeiro errado, que alguém pode estar usando para decidir.
4. **Tarefa 5**: um pedido funcional que escondia uma falha de segurança (fórmula executada no Excel).
5. **Tarefa 4**: era a única feature nova, com dependência externa (API de feriados) e uma dúvida de regra (Carnaval). Deixei por último para não travar o resto.

**Como conduzi cada tarefa:**
- Primeiro reproduzi o problema e registrei os números da `main`.
- Depois escrevi testes que falham, corrigi e mostrei o antes e depois.
- Os commits estão separados nessa ordem (teste vermelho, depois correção), para que dê para rodar o teste contra o código antigo.
- Cada PR tem: problema, causa raiz, correção, como provei e o que ficou fora.

## Arquitetura

Organizei o código **por funcionalidade**, separando em cada uma o **domínio** (regra pura) dos **adaptadores** (formatos, APIs, navegador, banco). As regras estão em [`ARQUITETURA.md`](ARQUITETURA.md).

```
src/
├── empresas/dominio/arvore.js          T1  descendentes()
├── tarefas/
│   ├── dominio/listar.js               T1  listarTarefas()
│   ├── dominio/prazo.js                T4  prazoSLA()
│   └── adaptadores/csv-excel.js        T5  gerarCSV(): formato Excel pt-BR
├── vendas/
│   ├── dominio/relatorio.js            T2  totalDoDia(), ticketMedio()
│   └── adaptadores/moeda.js                formatarBRL()
├── feriados/
│   ├── dominio/feriados.js             T4  quais são feriados nacionais
│   └── adaptadores/brasilapi.js        T4  busca e traduz a resposta da BrasilAPI
├── banco/adaptadores/pglite.js         T3  Postgres em memória (npm run db e testes)
├── ui/
│   ├── App.jsx                             a tela
│   ├── fontes.js                           único lugar que sabe de onde vêm os dados
│   └── adaptadores/download.js         T5  texto → arquivo baixado
└── tarefas.js · prazo.js · exportar.js · relatorio.js
                                            fachadas: o contrato da prova nos caminhos originais
scripts/                                    comandos npm run: montam as peças e fazem I/O
sql/schema.sql                          T3  RLS
```

**Como ficou a entrega:**
- **A reestruturação é um commit só na `main`**, que move código sem mudar comportamento. Os bugs continuam lá, e cada correção vem na sua PR.
- **Conferido:** depois do commit, o relatório ainda dá R$ 4.501,00, o banco ainda mostra 15 tarefas para a Vértice e a tela não mudou.
- **As 5 branches saem dessa `main`**, e cada PR mostra só a própria correção.
- **Contrato da prova:** nomes e parâmetros de `listarTarefas`, `totalDoDia`, `ticketMedio`, `formatarBRL`, `prazoSLA` e `gerarCSV` continuam nos caminhos originais, como fachadas. O `test/contrato.test.js` garante isso.

**A regra de dependência é verificada por teste**, não só por convenção:
- o `test/arquitetura.test.js` falha se algum arquivo de `dominio/` importar adaptador, tela, módulo do Node, JSON ou biblioteca;
- ele também falha se o domínio usar `fetch`, `document`, `window` ou `import.meta`;
- conferi injetando de propósito um import proibido: o teste acusou.

**O que essa separação compra na prática:**
- trocar a BrasilAPI por outro provedor muda só `feriados/adaptadores/`;
- trocar de onde a tela lê os dados muda só `ui/fontes.js`;
- todo o domínio é testado sem rede, banco ou navegador.

## Tarefa 1 — Tela de tarefas

- **Situação:** pronta.
- **Qual era o problema:** dois bugs em `listarTarefas`.
  - **Filtrava pela empresa exata**, ignorando as empresas abaixo dela. O Grupo Aurora não tem nenhuma tarefa própria (estão todas nas filhas), então a tela ficava vazia.
  - **Comparava as datas com `>` e `<`**, e assim as tarefas do primeiro e do último dia do filtro sumiam.
  - Corrigi com `descendentes()` (`src/empresas/dominio/arvore.js`, protegida contra ciclo no cadastro) e com `>=`/`<=`. Também passei a tratar data apagada no campo como período aberto e a desempatar a ordem por id.
- **Como provei que funciona:**
  - 14 testes novos, em `test/tarefas/listar.test.js` e `test/empresas/arvore.test.js`. Na `main`, 7 dos 11 casos de `listarTarefas` falham.
  - O teste original (`test/tarefas.test.js`) continua passando sem alteração.
  - Grupo Aurora: de 0 para 13 tarefas, sem as da Outra Empresa.
  - Aurora Serviços: de 4 para 9, porque passa a incluir a Aurora Campo.
  - Conferido na tela com o navegador: a tarefa do dia "Até" aparece.
- **PR:** _[link]_ (branch `tarefa-1`)

## Tarefa 2 — Relatório de vendas

- **Situação:** pronta.
- **Qual era o problema:** a diferença de R$ 1.100,50 vem de dois bugs somados.
  - **O dia era o dia UTC**, e não o de Brasília. A V-0990 (600), feita em 30/09 às 23h de Brasília, entrava em 01/10. A V-0995 (800) e a V-0996 (150), feitas na noite de 01/10, ficavam de fora.
  - **A sincronização repete vendas**: a V-0992 (250,50) e a V-0994 (1.200) eram somadas duas vezes.
  - A conta fecha: +600 + 1.450,50 − 950 = 1.100,50.
  - Além disso, corrigi a soma, que era em ponto flutuante e passou a ser em centavos, e o **ticket médio**, que dividia por todas as vendas do dia, inclusive canceladas e repetidas. Em 01/10 ele mostrava R$ 643,00; o certo é R$ 680,10.
- **Como provei que funciona:**
  - 10 testes novos em `test/vendas/relatorio.test.js`; na `main`, 7 de 10 falham.
  - `npm run relatorio -- 2026-10-01` → **R$ 3.400,50**.
  - Somando de 30/09 a 03/10, nenhuma venda se perdeu: 10.971,00 − 2.350,50 de duplicatas = 8.620,50 depois da correção.
  - O resultado é o mesmo com a máquina em outro fuso.
- **PR:** _[link]_ (branch `tarefa-2`)

## Tarefa 3 — Cliente vendo dado de outra empresa

- **Situação:** pronta.
- **Qual era o problema:** três falhas nas regras de acesso do banco (RLS).
  - **A policy `tarefas_importacao` liberava tudo** (`for all using (true)`). Policies permissivas se somam com OR, então ela anulava as outras e deixava qualquer empresa ler, criar, alterar e apagar tarefas de qualquer outra.
  - **A leitura ignorava a árvore de empresas.**
  - **Não havia regra para escrita**, então dava até para mover uma tarefa para outro cliente.
  - Corrigi com a função `empresas_visiveis()` (consulta recursiva; sem empresa definida, ninguém vê nada) e uma regra por operação. O `with check` impede mover uma tarefa para fora da árvore.
  - A importação inicial nunca precisou daquela regra: ela roda como dono da tabela, que não passa por RLS.
  - Tabelas e colunas não mudaram.
- **Como provei que funciona:**
  - `test/banco/rls.test.js` tem 35 casos: 5 empresas × leitura, criação, alteração, exclusão e mudança de empresa, mais o caso sem empresa. Na `main`, 22 falham.
  - O teste sobe o mesmo banco do `npm run db`, pelo adaptador `src/banco/adaptadores/pglite.js`.
  - Pelo `npm run db`, a Vértice passou de 15 tarefas (de todas as empresas) para 4, só as dela.
  - Mover ou criar tarefa fora da árvore dá erro de RLS. Alterar ou apagar tarefa alheia afeta 0 linhas.
- **PR:** _[link]_ (branch `tarefa-3`)

## Tarefa 4 — Prazo em dias úteis

- **Situação:** pronta.
- **Qual API de feriados usei e por quê:** a **BrasilAPI** (`https://brasilapi.com.br/api/feriados/v1/{ano}`).
  - É brasileira, pública e não pede token.
  - Calcula os feriados móveis.
  - Já traz o 20/11, feriado nacional desde a Lei 14.759/2023.
  - Ela fica isolada no adaptador `src/feriados/adaptadores/brasilapi.js`, que traduz a resposta para o formato do domínio. Trocar de provedor muda só esse arquivo.
  - **Decisão:** a API marca Carnaval e Corpus Christi como `national`, mas a portaria federal do calendário de feriados lista os dois como **ponto facultativo**. Como a regra é "exceto feriados nacionais", eles contam como dia útil.
  - Essa regra fica no domínio (`src/feriados/dominio/feriados.js`), com o motivo comentado. O comando `npm run feriados` mostra no terminal o que descartou.
  - O `prazoSLA` somava dias corridos, ignorava os feriados e misturava UTC com hora local. Agora conta dias úteis a partir do dia seguinte, com a conta toda em UTC.
  - A tela tem a coluna "Prazo (3 dias úteis)". O `ui/fontes.js` carrega todo `data/feriados-*.json` que existir.
- **Como provei que funciona:**
  - 27 testes novos: 16 em `test/tarefas/prazo.test.js` (na `main`, 14 falham), 4 do domínio de feriados e 7 do adaptador, este com um `fetch` falso, sem rede.
  - Cobrem sexta → segunda, fim de semana, feriado, criação no sábado, feriado no domingo, virada do ano, quatro fusos e prazos reais com os feriados baixados.
  - Na tela, conferi por exemplo a tarefa 115: criada no sábado 10/10, com o feriado de 12/10, vence em 15/10.
- **PR:** _[link]_ (branch `tarefa-4`)

## Tarefa 5 — Exportar para o Excel

- **Situação:** pronta.
- **Qual era o problema:**
  - **Separador `,`** em vez de `;`, que é o do Excel em português.
  - **Sem a marca de UTF-8 (BOM)** no início do arquivo, o Excel abre como ANSI e estraga os acentos.
  - **Campos sem aspas**: a 103 tem vírgula e a 112 tem `;` e `"`, e as duas quebravam as colunas.
  - **Data em formato ISO.**
  - **Injeção de fórmula**: a 114 começa com `=SOMA(...)` e seria executada pelo Excel.
  - Corrigi com `;`, BOM, aspas no padrão RFC 4180, `DD/MM/AAAA` e `'` na frente de célula que começa com `= + - @`. O formato fica no adaptador `src/tarefas/adaptadores/csv-excel.js`.
  - O botão "Exportar CSV" baixa a lista que está na tela. O download do navegador fica em `src/ui/adaptadores/download.js`.
- **Como provei que funciona:**
  - 12 testes novos em `test/tarefas/csv-excel.test.js`, e todos falham na `main`. Eles leem o CSV de volta e conferem célula por célula, inclusive título com quebra de linha e as 15 tarefas reais.
  - No navegador, interceptei o arquivo baixado: começa com os bytes `EF BB BF` e tem as mesmas linhas da tabela.
  - **Não abri no Excel de verdade**, porque não tinha Excel disponível.
- **PR:** _[link]_ (branch `tarefa-5`)

## As cinco juntas

Juntei as 5 branches numa branch local temporária, que apaguei depois, para conferir que funcionam em conjunto:
- Merges limpos, exceto **um conflito**: os imports no topo de `src/ui/App.jsx`, entre as Tarefas 4 e 5. A solução é manter os dois.
- Com as 5 juntas:
  - **110 testes passam**;
  - o relatório de 01/10 dá R$ 3.400,50;
  - a Vértice vê só as 4 tarefas dela;
  - na tela, o Grupo Aurora mostra 13 tarefas, com a coluna de prazo;
  - o CSV exportado tem as mesmas 13 linhas.

## Encontrei também

**Segurança**
- **A tabela `empresas` não tem RLS.** Qualquer pessoa lista o nome de todas as empresas, inclusive as de outros clientes. Não mexi para não sair do escopo da Tarefa 3, mas recomendo aplicar a mesma regra.
- **O `app.empresa_id` precisa vir só do servidor.** Um `app_user` com SQL livre consegue trocar o próprio valor com `set_config`. No sistema real, isso pede garantir que nenhum endpoint repasse SQL ou configuração vinda do cliente.
- **O seletor da tela mostra todas as empresas para qualquer pessoa**, inclusive a Outra Empresa junto do grupo. Com login, deveria mostrar só a empresa da pessoa e as abaixo dela.
- **O `scripts/db.js` montava o SQL colando o `empresa_id` no texto.** O `Number()` protegia, mas passei a usar parâmetro (Tarefa 3).
- **A injeção de fórmula no CSV** (tarefa 114) não estava no pedido; tratei na Tarefa 5.

**Dados e regras**
- **A sincronização de vendas entrega duplicatas.** Deduplicar no relatório resolve o número, mas é paliativo: a causa está na origem. Assumi que vale a última ocorrência do id.
- **A BrasilAPI chama de "nacional" o que é ponto facultativo** (Carnaval e Corpus Christi). Quem usar a API sem olhar vai contar prazo errado.
- **O `ticketMedio` contava canceladas e repetidas no divisor**, um bug além do que o financeiro relatou.

**Projeto**
- **Os testes que já existiam passavam com todos os bugs.** Cada um cobria só um caso que já funcionava.
- **As Tarefas 4 e 5 saem da `main` sem a Tarefa 1**, então nas branches delas o Grupo Aurora ainda aparece vazio. Juntas, funcionam (veja acima).
- **`npm install` altera o `package-lock.json`** (remove marcações `"peer": true`), provavelmente por diferença de versão do npm. É cosmético, e não commitei.

## O que ficou faltando / o que eu faria com mais tempo

- **Abrir o CSV no Excel de verdade.** A prova foi pelos bytes e pelo formato.
- **Feriados de 2027 em diante**: só 2026 foi baixado. O ideal é um job anual rodando `npm run feriados -- <próximo ano>`; a tela já carrega o arquivo novo sozinha.
- **Feriados estaduais e municipais**, se o atendimento for presencial. O pedido foi só dos nacionais.
- **RLS na tabela `empresas`** e o seletor da tela restrito à árvore de quem está logado.
- **Integração contínua** (GitHub Actions) rodando `npm test` em cada PR.
- **Confirmar com o financeiro e o cliente** duas decisões que tomei e documentei: a regra de desempate das vendas duplicadas e se Carnaval e Corpus Christi contam no SLA do contrato.
