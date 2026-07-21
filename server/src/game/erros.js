// Erros de jogo carregam um código estável além da mensagem. O cliente traduz
// o código para o idioma escolhido pelo jogador (src/locales/*.js: chaves em
// `erros`); a mensagem em português continua aqui como fallback — é o que
// aparece se um cliente antigo (ou um código novo ainda não traduzido) chegar
// no lugar. Os textos são mantidos idênticos aos originais de propósito: os
// testes do servidor casam com eles por regex.
function erroDeJogo (codigo, mensagem, params = {}) {
  const erro = new Error(mensagem)
  erro.codigo = codigo
  erro.params = params
  return erro
}

module.exports = { erroDeJogo }
