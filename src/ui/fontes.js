// Única parte da tela que sabe de onde vêm os dados. Hoje são os JSON de data/;
// trocar por uma API muda só este arquivo.
import empresas from '../../data/empresas.json';
import tarefas from '../../data/tarefas.json';

// Todo ano baixado com `npm run feriados -- <ano>` entra aqui sozinho, para o
// prazo de uma tarefa de dezembro já enxergar os feriados de janeiro.
const feriados = Object.values(
  import.meta.glob('../../data/feriados-*.json', { eager: true, import: 'default' }),
).flat().map((f) => f.data);

export { empresas, tarefas, feriados };
