// Adaptador do navegador: transforma um texto em arquivo baixado. A tela só
// diz o nome e o conteúdo; como o navegador baixa fica aqui.
export function baixarArquivo(nome, conteudo, tipo) {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  link.click();
  // libera o arquivo da memória depois que o navegador começou o download
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
