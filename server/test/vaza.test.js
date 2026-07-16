const test = require('node:test')
const assert = require('node:assert/strict')
const { cartasElegiveis } = require('../src/game/vaza')

function j (seat, rank, suit) {
  return { seat, carta: { rank, suit } }
}

test('exemplo do usuário: 5 jogadores, dois pares de 5 se anulam, sobra o 4', () => {
  const manilha = '3' // nada aqui é manilha
  const jogadas = [
    j(0, '5', 'paus'),
    j(1, '4', 'paus'),
    j(2, '5', 'copas'),
    j(3, '5', 'espadas'),
    j(4, '5', 'ouros'),
  ]

  const elegiveis = cartasElegiveis(jogadas, manilha)
  assert.equal(elegiveis.length, 1)
  assert.equal(elegiveis[0].seat, 1)
  assert.equal(elegiveis[0].carta.rank, '4')
})

test('sem repetição, todas as cartas ficam elegíveis', () => {
  const manilha = '3'
  const jogadas = [j(0, '4', 'paus'), j(1, '5', 'paus'), j(2, '6', 'paus')]
  const elegiveis = cartasElegiveis(jogadas, manilha)
  assert.equal(elegiveis.length, 3)
})

test('par simples se anula por completo (ninguém fica elegível)', () => {
  const manilha = '3'
  const jogadas = [j(0, '7', 'paus'), j(1, '7', 'ouros')]
  const elegiveis = cartasElegiveis(jogadas, manilha)
  assert.equal(elegiveis.length, 0)
})

test('manilhas nunca se anulam, mesmo com o mesmo rank de manilhas repetido não é possível, mas manilha nunca cancela não-manilha', () => {
  const manilha = '5' // manilha é rank 5
  const jogadas = [j(0, '5', 'paus'), j(1, '5', 'ouros'), j(2, '4', 'copas')]
  const elegiveis = cartasElegiveis(jogadas, manilha)
  // as duas manilhas continuam elegíveis (nunca se anulam) + o 4 comum
  assert.equal(elegiveis.length, 3)
})

test('três cartas do mesmo rank: a terceira sobrevive', () => {
  const manilha = '3'
  const jogadas = [j(0, '6', 'paus'), j(1, '6', 'ouros'), j(2, '6', 'copas')]
  const elegiveis = cartasElegiveis(jogadas, manilha)
  assert.equal(elegiveis.length, 1)
  assert.equal(elegiveis[0].seat, 2)
})
