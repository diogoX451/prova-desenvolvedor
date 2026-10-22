import { useState } from 'react';
import { STATUS } from '../../tarefas/dominio/validacao.js';

const VAZIA = { titulo: '', status: 'aberta', criada_em: '' };

/**
 * Criar ou editar tarefa. `empresas` são as opções de empresa; no modo
 * demonstração vêm também as sem acesso, para ver o banco recusando.
 * Tarefa nova começa na empresa da visão atual, se ela estiver nas opções.
 */
export function FormTarefa({ empresas, empresaPadrao, inicial, erros = {}, aoSalvar, aoCancelar }) {
  const [dados, setDados] = useState(() => ({
    ...VAZIA,
    empresa_id: empresas.some((e) => e.id === empresaPadrao) ? empresaPadrao : (empresas[0]?.id ?? ''),
    ...inicial,
  }));
  const campo = (nome) => (e) => setDados({ ...dados, [nome]: e.target.value });
  const editando = Boolean(inicial?.id);

  return (
    <form
      className="cartao form"
      onSubmit={(e) => {
        e.preventDefault();
        aoSalvar({ ...dados, empresa_id: Number(dados.empresa_id) });
      }}
    >
      <h2>{editando ? `Editar tarefa ${inicial.id}` : 'Nova tarefa'}</h2>
      <label>
        Empresa
        <select value={dados.empresa_id} onChange={campo('empresa_id')}>
          {empresas.map((e) => (
            <option key={e.id} value={e.id}>{e.nome}{e.semAcesso ? ' (sem acesso)' : ''}</option>
          ))}
        </select>
        {erros.empresa_id && <span className="erro-campo">{erros.empresa_id}</span>}
      </label>
      <label>
        Título
        <input value={dados.titulo} onChange={campo('titulo')} maxLength={200} />
        {erros.titulo && <span className="erro-campo">{erros.titulo}</span>}
      </label>
      <label>
        Status
        <select value={dados.status} onChange={campo('status')}>
          {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {erros.status && <span className="erro-campo">{erros.status}</span>}
      </label>
      <label>
        Criada em
        <input type="date" value={dados.criada_em} onChange={campo('criada_em')} />
        {erros.criada_em && <span className="erro-campo">{erros.criada_em}</span>}
      </label>
      <div className="acoes">
        <button type="submit" className="primario">{editando ? 'Salvar alterações' : 'Criar tarefa'}</button>
        <button type="button" onClick={aoCancelar}>Cancelar</button>
      </div>
    </form>
  );
}
