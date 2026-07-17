const test = require('node:test')
const assert = require('node:assert/strict')
const { criarBaralho, manilhaRank, compararCartas } = require('../src/game/deck')

test('baralho tem 52 cartas únicas (baralho sujo)', () => {
  const baralho = criarBaralho()
  assert.equal(baralho.length, 52)
  const ids = new Set(baralho.map((c) => `${c.rank}-${c.suit}`))
  assert.equal(ids.size, 52)
})

test('manilha é o próximo rank após a vira, com rotação', () => {
  // Com 13 ranks: 4,5,6,7,8,9,10,J,Q,K,A,2,3
  assert.equal(manilhaRank({ rank: '4', suit: 'paus' }), '5')
  assert.equal(manilhaRank({ rank: '7', suit: 'paus' }), '8')
  assert.equal(manilhaRank({ rank: '3', suit: 'paus' }), '4')
})

test('manilha vence qualquer carta comum', () => {
  const manilha = '5'
  const r = compararCartas({ rank: '5', suit: 'paus' }, { rank: '3', suit: 'ouros' }, manilha)
  assert.ok(r > 0)
})

test('entre manilhas, naipe decide (paus > copas > espadas > ouros)', () => {
  const manilha = '5'
  const r = compararCartas({ rank: '5', suit: 'paus' }, { rank: '5', suit: 'ouros' }, manilha)
  assert.ok(r > 0)
})

test('cartas comuns de mesmo rank empatam', () => {
  const manilha = '5'
  const r = compararCartas({ rank: '7', suit: 'ouros' }, { rank: '7', suit: 'paus' }, manilha)
  assert.equal(r, 0)
})

test('ordem normal de ranks é respeitada', () => {
  const manilha = '3' // ninguém é manilha nesse teste
  const r = compararCartas({ rank: 'A', suit: 'paus' }, { rank: 'K', suit: 'paus' }, manilha)
  assert.ok(r > 0)
})
