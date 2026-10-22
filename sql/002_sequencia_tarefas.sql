-- Evolução (CRUD): o id das tarefas novas vem de uma sequência. A tabela não
-- muda; quem cria passa nextval('tarefas_id_seq') no insert.
--
-- Por que não max(id) + 1: como a pessoa logada, o RLS esconde as tarefas das
-- outras empresas, então o maior id visível não é o maior id da tabela, e duas
-- empresas gerariam o mesmo id.
create sequence tarefas_id_seq;
