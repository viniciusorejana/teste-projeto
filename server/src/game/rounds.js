// Sequência do número de cartas por rodada: cresce 1, 2, 3... até o baralho
// não comportar mais (jogadores * cartas + 1 vira <= 40), depois decresce até
// 1 e volta a crescer, oscilando enquanto o jogo durar.

const TAMANHO_BARALHO = 40

function maxCartasPorMao (numJogadores) {
  return Math.max(1, Math.floor((TAMANHO_BARALHO - 1) / numJogadores))
}

// estado = { cartas, direcao } | null (null = ainda não houve rodada)
function proximoTamanhoDeMao (estadoAnterior, numJogadores) {
  const max = maxCartasPorMao(numJogadores)

  if (!estadoAnterior) {
    return { cartas: 1, direcao: 1 }
  }

  let { cartas, direcao } = estadoAnterior
  let proximo = cartas + direcao

  if (proximo > max) {
    direcao = -1
    proximo = cartas - 1
  } else if (proximo < 1) {
    direcao = 1
    proximo = cartas + 1
  }

  // Se a quantidade de jogadores mudou (eliminação) e o novo máximo é menor
  // que o valor calculado, arredonda para baixo para caber no baralho.
  proximo = Math.min(proximo, max)
  proximo = Math.max(proximo, 1)

  return { cartas: proximo, direcao }
}

module.exports = {
  TAMANHO_BARALHO,
  maxCartasPorMao,
  proximoTamanhoDeMao,
}
