export function LoginSimulado({ empresas, valor, aoMudar }) {
  return (
    <label className="login">
      <span className="login__rotulo">Logado como</span>
      <select value={valor} onChange={(e) => aoMudar(Number(e.target.value))}>
        {empresas.map((e) => (
          <option key={e.id} value={e.id}>{e.nome}</option>
        ))}
      </select>
      <span className="login__nota">login simulado</span>
    </label>
  );
}
