-- Evolução: a tabela empresas também passa a ter RLS.
--
-- Cada pessoa vê as empresas que acessa (a dela e as abaixo, empresas_visiveis())
-- e as acima da dela, só como contexto para a árvore da tela. Empresas irmãs e
-- outros clientes não aparecem: o Grupo Aurora não vê a Outra Empresa S.A. e a
-- Aurora Serviços não vê a Vértice Finanças.

-- Empresas acima da empresa logada (sem incluir ela).
create function empresas_acima() returns setof int
  language sql stable security definer
  set search_path = public, pg_temp
as $$
  with recursive acima(id) as (
    select pai_id from empresas
     where id = nullif(current_setting('app.empresa_id', true), '')::int
       and pai_id is not null
    union
    select e.pai_id from empresas e join acima a on e.id = a.id
     where e.pai_id is not null
  )
  select id from acima
$$;

alter table empresas enable row level security;

create policy empresas_leitura on empresas
  for select
  using (id in (select empresas_visiveis()) or id in (select empresas_acima()));
