const test = require('node:test')
const assert = require('node:assert/strict')
const { palpiteProibido } = require('../src/game/bids')

test('proíbe o valor que fecha a soma no tamanho da mão', () => {
  // rodada com 3 cartas, alguém já palpitou 2 -> próximo (último) não pode palpitar 1
  assert.equal(palpiteProibido(3, 2), 1)
})

test('não proíbe nada se o valor proibido estiver fora do intervalo válido', () => {
  // soma dos outros já é maior que o tamanho da mão -> nenhum valor válido chegaria a fechar
  assert.equal(palpiteProibido(3, 5), null)
})

test('permite todos os valores quando ainda não há restrição relevante', () => {
  assert.equal(palpiteProibido(3, 0), 3)
  assert.equal(palpiteProibido(1, 0), 1)
  assert.equal(palpiteProibido(1, 1), 0)
})
