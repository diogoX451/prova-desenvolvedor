function No({ no, visao, aoEscolher }) {
  return (
    <li>
      {no.acessivel ? (
        <button
          type="button"
          className={`no${no.id === visao ? ' no--ativo' : ''}`}
          aria-pressed={no.id === visao}
          onClick={() => aoEscolher(no.id)}
        >
          {no.nome}
        </button>
      ) : (
        <span className="no no--contexto" title="Acima da sua empresa: aparece só como contexto, sem acesso">
          <span aria-hidden="true">🔒</span> {no.nome}
        </span>
      )}
      {no.filhas.length > 0 && (
        <ul>
          {no.filhas.map((f) => <No key={f.id} no={f} visao={visao} aoEscolher={aoEscolher} />)}
        </ul>
      )}
    </li>
  );
}

/** Árvore das empresas: clicar numa acessível escolhe a visão (ela e as de baixo). */
export function ArvoreEmpresas({ arvore, visao, aoEscolher }) {
  return (
    <nav className="cartao" aria-label="Empresas">
      <h2>Empresas</h2>
      <ul className="arvore">
        {arvore.map((no) => <No key={no.id} no={no} visao={visao} aoEscolher={aoEscolher} />)}
      </ul>
      <p className="dica">Clique numa empresa para ver as tarefas dela e das de baixo.</p>
    </nav>
  );
}
