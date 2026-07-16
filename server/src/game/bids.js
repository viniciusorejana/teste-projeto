// Regra do "fecha a conta": o último jogador a palpitar em uma rodada não
// pode escolher um valor que faça a soma de todos os palpites da rodada ser
// igual ao tamanho da mão — isso garante que sempre alguém vai errar o
// palpite. Jogadores que não são o último podem palpitar livremente.
function palpiteProibido (tamanhoMao, somaDosOutrosPalpites) {
  const proibido = tamanhoMao - somaDosOutrosPalpites
  return proibido >= 0 && proibido <= tamanhoMao ? proibido : null
}

module.exports = { palpiteProibido }
