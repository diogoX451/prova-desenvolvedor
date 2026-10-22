export function TabelaTarefas({ tarefas, slaDiasUteis, aoEditar, aoExcluir }) {
  if (tarefas.length === 0) return <p className="vazio">Nenhuma tarefa no período.</p>;
  return (
    <div className="tabela-rolagem">
      <table>
        <thead>
          <tr>
            <th>Data</th><th>Empresa</th><th>Tarefa</th><th>Status</th>
            <th>Prazo ({slaDiasUteis} dias úteis)</th><th><span className="sr">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {tarefas.map((t) => (
            <tr key={t.id}>
              <td>{t.criada_em}</td>
              <td>{t.empresa}</td>
              <td>{t.titulo}</td>
              <td><span className={`selo selo--${t.status}`}>{t.status}</span></td>
              <td>{t.prazo}</td>
              <td className="acoes-linha">
                <button type="button" onClick={() => aoEditar(t)}>Editar</button>
                <button type="button" className="perigo" onClick={() => aoExcluir(t)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
