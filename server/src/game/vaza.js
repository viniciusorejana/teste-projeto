const { ehManilha } = require('./deck')

// Cartas de mesmo rank que não sejam manilha se anulam em pares, na ordem em
// que foram jogadas: a segunda carta de um rank cancela a primeira ainda
// "pendente" daquele rank; se uma terceira do mesmo rank aparecer, ela vira a
// nova pendente; e assim por diante. Ao final, cada rank não-manilha tem no
// máximo uma jogada sobrevivente (a que "sobrou" quando a contagem é ímpar).
// Manilhas nunca se anulam entre si nem com outras cartas.
function cartasElegiveis (jogadas, manilha) {
  const pendentePorRank = new Map()
  const elegiveis = []

  for (const jogada of jogadas) {
    if (ehManilha(jogada.carta, manilha)) {
      elegiveis.push(jogada)
      continue
    }

    const rank = jogada.carta.rank
    if (pendentePorRank.has(rank)) {
      const pendente = pendentePorRank.get(rank)
      const indice = elegiveis.indexOf(pendente)
      if (indice !== -1) elegiveis.splice(indice, 1)
      pendentePorRank.delete(rank)
    } else {
      elegiveis.push(jogada)
      pendentePorRank.set(rank, jogada)
    }
  }

  return elegiveis
}

module.exports = { cartasElegiveis }
