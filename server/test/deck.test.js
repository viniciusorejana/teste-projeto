const test = require('node:test')
const assert = require('node:assert/strict')
const { criarBaralho, manilhaRank, compararCartas } = require('../src/game/deck')

test('baralho tem 40 cartas únicas', () => {
  const baralho = criarBaralho()
  assert.equal(baralho.length, 40)
  const ids = new Set(baralho.map((c) => `${c.rank}-${c.suit}`))
  assert.equal(ids.size, 40)
})

test('manilha é o próximo rank após a vira, com rotação', () => {
  assert.equal(manilhaRank({ rank: '4', suit: 'paus' }), '5')
  assert.equal(manilhaRank({ rank: '7', suit: 'paus' }), 'Q')
  assert.equal(manilhaRank({ rank: '3', suit: 'paus' }), '4')
})

test('manilha vence qualquer carta comum', () => {
  const manilha = '5'
  const r = compararCartas({ rank: '5', suit: 'paus' }, { rank: '3', suit: 'ouros' }, manilha)
  assert.ok(r > 0)
})

test('entre manilhas, naipe decide (ouros > espadas > copas > paus)', () => {
  const manilha = '5'
  const r = compararCartas({ rank: '5', suit: 'ouros' }, { rank: '5', suit: 'paus' }, manilha)
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
