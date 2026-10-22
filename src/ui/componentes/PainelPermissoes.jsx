const nomes = (lista) => lista.map((e) => e.nome).join(', ');

export function PainelPermissoes({ permissoes }) {
  const { empresaLogada, acoes, acessiveis, contexto } = permissoes;
  return (
    <section className="cartao" aria-label="Permissões">
      <h2>Permissões</h2>
      <p>Logado em <strong>{empresaLogada.nome}</strong>.</p>
      <p>
        Pode <strong>{acoes.join(', ')}</strong> tarefas de: {nomes(acessiveis)}.
      </p>
      {contexto.length > 0 && (
        <p>Aparece só como contexto, sem acesso: {nomes(contexto)}.</p>
      )}
      <p className="dica">
        Quem garante é o banco: a API grava a sua empresa na transação e o RLS do
        Postgres recusa o resto. A tela só escolhe a visão.
      </p>
    </section>
  );
}
