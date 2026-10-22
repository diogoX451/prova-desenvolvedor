/** A pessoa logada tentou ver ou mudar algo fora do que ela acessa. */
export class AcessoNegado extends Error {
  constructor(mensagem = 'Você não tem acesso a essa empresa.') {
    super(mensagem);
    this.name = 'AcessoNegado';
  }
}
