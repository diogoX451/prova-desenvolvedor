-- Banco das tarefas. Cada pessoa logada pertence a UMA empresa, que o
-- servidor grava em app.empresa_id antes de cada consulta.
-- A pessoa vê a própria empresa e as empresas abaixo dela na árvore.

create table empresas (
  id     int primary key,
  nome   text not null,
  pai_id int references empresas(id)
);

create table tarefas (
  id         int primary key,
  empresa_id int not null references empresas(id),
  titulo     text not null,
  status     text not null default 'aberta',
  criada_em  date not null
);

-- Empresa da pessoa logada + todas abaixo dela na árvore.
-- Sem app.empresa_id (ou vazio) não devolve nada: na dúvida, ninguém vê.
-- `union` (e não `union all`) descarta repetidos, então um ciclo acidental em
-- pai_id não vira recursão infinita.
-- security definer: a árvore é lida com o dono da função, então continua certa
-- mesmo se `empresas` ganhar RLS no futuro.
create function empresas_visiveis() returns setof int
  language sql stable security definer
  set search_path = public, pg_temp
as $$
  with recursive arvore(id) as (
    select id from empresas
     where id = nullif(current_setting('app.empresa_id', true), '')::int
    union
    select e.id from empresas e join arvore a on e.pai_id = a.id
  )
  select id from arvore
$$;

alter table tarefas enable row level security;

-- Uma policy por operação. Não existe mais policy liberando tudo: policies
-- permissivas se somam com OR, então um `using (true)` anula todas as outras.
-- A importação inicial roda como dono da tabela, que já não passa por RLS.
create policy tarefas_leitura on tarefas
  for select
  using (empresa_id in (select empresas_visiveis()));

create policy tarefas_criacao on tarefas
  for insert
  with check (empresa_id in (select empresas_visiveis()));

-- using: quais linhas pode alterar; with check: como a linha pode ficar
-- (impede mover a tarefa para uma empresa fora da árvore).
create policy tarefas_alteracao on tarefas
  for update
  using (empresa_id in (select empresas_visiveis()))
  with check (empresa_id in (select empresas_visiveis()));

create policy tarefas_exclusao on tarefas
  for delete
  using (empresa_id in (select empresas_visiveis()));
