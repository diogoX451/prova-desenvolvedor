import { useEffect, useMemo, useState } from 'react';
import { criarFonte, empresasParaLogin } from './fontes.js';
import { gerarCSV } from '../tarefas/adaptadores/csv-excel.js';
import { baixarArquivo } from './adaptadores/download.js';
import { LoginSimulado } from './componentes/LoginSimulado.jsx';
import { ArvoreEmpresas } from './componentes/ArvoreEmpresas.jsx';
import { PainelPermissoes } from './componentes/PainelPermissoes.jsx';
import { FormTarefa } from './componentes/FormTarefa.jsx';
import { TabelaTarefas } from './componentes/TabelaTarefas.jsx';

export function App() {
  const [opcoesLogin, setOpcoesLogin] = useState([]);
  const [logada, setLogada] = useState(1);
  const [sessao, setSessao] = useState(null);
  const [visao, setVisao] = useState(1);
  const [de, setDe] = useState('2026-09-01');
  const [ate, setAte] = useState('2026-10-31');
  const [tarefas, setTarefas] = useState([]);
  const [editando, setEditando] = useState(null); // null, 'nova' ou a tarefa
  const [errosCampo, setErrosCampo] = useState({});
  const [aviso, setAviso] = useState(null);
  const [demonstracao, setDemonstracao] = useState(false);
  const [versao, setVersao] = useState(0);

  const fonte = useMemo(() => criarFonte(logada), [logada]);
  const mostrarErro = (e) => setAviso({ tipo: 'erro', texto: `${e.status ? `${e.status} — ` : ''}${e.message}` });

  useEffect(() => {
    empresasParaLogin().then(setOpcoesLogin).catch(mostrarErro);
  }, []);

  // trocou o login: nova sessão (árvore e permissões) e a visão volta para a empresa da pessoa
  useEffect(() => {
    let valido = true;
    setEditando(null);
    setAviso(null);
    fonte.sessao()
      .then((s) => { if (valido) { setSessao(s); setVisao(fonte.logada); } })
      .catch(mostrarErro);
    return () => { valido = false; };
  }, [fonte]);

  const sessaoAtual = sessao?.permissoes.empresaLogada.id === logada ? sessao : null;

  useEffect(() => {
    if (!sessaoAtual) return undefined;
    let valido = true;
    fonte.tarefas({ visao, de, ate })
      .then((lista) => { if (valido) setTarefas(lista); })
      .catch(mostrarErro);
    return () => { valido = false; };
  }, [fonte, sessaoAtual, visao, de, ate, versao]);

  if (!sessaoAtual) return <main className="pagina"><p>Carregando…</p></main>;
  const { permissoes, arvore, slaDiasUteis } = sessaoAtual;

  const opcoesEmpresa = [
    ...permissoes.acessiveis,
    ...(demonstracao ? permissoes.contexto.map((e) => ({ ...e, semAcesso: true })) : []),
  ];

  async function salvar(dados) {
    setErrosCampo({});
    try {
      if (editando === 'nova') await fonte.criar(dados);
      else await fonte.atualizar(editando.id, dados);
      setAviso({ tipo: 'ok', texto: editando === 'nova' ? 'Tarefa criada.' : 'Tarefa atualizada.' });
      setEditando(null);
      setVersao((v) => v + 1);
    } catch (e) {
      setErrosCampo(e.erros ?? {});
      mostrarErro(e);
    }
  }

  async function excluir(tarefa) {
    if (!window.confirm(`Excluir a tarefa "${tarefa.titulo}"?`)) return;
    try {
      await fonte.excluir(tarefa.id);
      setAviso({ tipo: 'ok', texto: 'Tarefa excluída.' });
      setVersao((v) => v + 1);
    } catch (e) {
      mostrarErro(e);
    }
  }

  return (
    <div className="app">
      <header className="topo">
        <h1>Tarefas</h1>
        <LoginSimulado empresas={opcoesLogin} valor={logada} aoMudar={setLogada} />
      </header>

      <div className="pagina">
        <aside className="lateral">
          <ArvoreEmpresas arvore={arvore} visao={visao} aoEscolher={setVisao} />
          <PainelPermissoes permissoes={permissoes} />
        </aside>

        <main className="conteudo">
          {aviso && (
            <div className={`aviso aviso--${aviso.tipo}`} role={aviso.tipo === 'erro' ? 'alert' : 'status'}>
              {aviso.texto}
              <button type="button" className="fechar" aria-label="Fechar aviso" onClick={() => setAviso(null)}>×</button>
            </div>
          )}

          <div className="filtros">
            <label>De <input type="date" value={de} onChange={(e) => setDe(e.target.value)} /></label>
            <label>Até <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} /></label>
            <button type="button" className="primario" onClick={() => { setErrosCampo({}); setEditando('nova'); }}>
              Nova tarefa
            </button>
            <button
              type="button"
              onClick={() => baixarArquivo('tarefas.csv', gerarCSV(tarefas), 'text/csv;charset=utf-8')}
              disabled={tarefas.length === 0}
            >
              Exportar CSV
            </button>
            <label className="demo">
              <input type="checkbox" checked={demonstracao} onChange={(e) => setDemonstracao(e.target.checked)} />
              Modo demonstração: deixar escolher empresa sem acesso
            </label>
          </div>

          {editando && (
            <FormTarefa
              key={editando === 'nova' ? 'nova' : editando.id}
              empresas={opcoesEmpresa}
              inicial={editando === 'nova' ? undefined : editando}
              erros={errosCampo}
              aoSalvar={salvar}
              aoCancelar={() => setEditando(null)}
            />
          )}

          <TabelaTarefas
            tarefas={tarefas}
            slaDiasUteis={slaDiasUteis}
            aoEditar={(t) => { setErrosCampo({}); setEditando(t); }}
            aoExcluir={excluir}
          />
        </main>
      </div>
    </div>
  );
}
