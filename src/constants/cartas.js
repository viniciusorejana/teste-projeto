// Espelha as regras de força/manilha de `server/src/game/deck.js`.
// Qualquer mudança nas regras do servidor deve ser replicada aqui manualmente.

export const RANKS = ['4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', '3']
export const SUITS = ['paus', 'copas', 'espadas', 'ouros'] // ordem de força crescente para manilha

function rankIndex (rank) {
  return RANKS.indexOf(rank)
}

// Dado o vira (objeto { rank, suit } ou apenas o rank em string),
// retorna o rank que é manilha nesta rodada (próximo rank na sequência, com wraparound).
export function manilhaRank (vira) {
  const rank = typeof vira === 'string' ? vira : (vira && vira.rank)
  const proximoIndex = (rankIndex(rank) + 1) % RANKS.length
  return RANKS[proximoIndex]
}
