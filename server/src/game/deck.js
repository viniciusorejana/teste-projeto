// Baralho de 52 cartas (baralho sujo: 13 ranks × 4 naipes) e regras de força/manilha.

const RANKS = ['4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', '3']
const SUITS = ['paus', 'copas', 'espadas', 'ouros'] // ordem de força crescente para manilha

function criarBaralho () {
  const baralho = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      baralho.push({ rank, suit })
    }
  }
  return baralho
}

function embaralhar (baralho) {
  const copia = baralho.slice()
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

function rankIndex (rank) {
  return RANKS.indexOf(rank)
}

function suitStrength (suit) {
  return SUITS.indexOf(suit)
}

// Dada a carta virada, retorna o rank que é manilha nesta rodada.
function manilhaRank (vira) {
  const proximoIndex = (rankIndex(vira.rank) + 1) % RANKS.length
  return RANKS[proximoIndex]
}

function ehManilha (carta, manilha) {
  return carta.rank === manilha
}

// Compara duas cartas dado o rank da manilha da rodada.
// Retorna > 0 se a > b, < 0 se b > a, 0 se empate (nunca empata entre manilhas).
function compararCartas (a, b, manilha) {
  const aManilha = ehManilha(a, manilha)
  const bManilha = ehManilha(b, manilha)

  if (aManilha && bManilha) {
    return suitStrength(a.suit) - suitStrength(b.suit)
  }
  if (aManilha) return 1
  if (bManilha) return -1

  return rankIndex(a.rank) - rankIndex(b.rank)
}

function cartaId (carta) {
  return `${carta.rank}-${carta.suit}`
}

module.exports = {
  RANKS,
  SUITS,
  criarBaralho,
  embaralhar,
  rankIndex,
  suitStrength,
  manilhaRank,
  ehManilha,
  compararCartas,
  cartaId,
}
