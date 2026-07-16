const test = require('node:test')
const assert = require('node:assert/strict')
const { proximoTamanhoDeMao, maxCartasPorMao } = require('../src/game/rounds')

test('primeira rodada sempre começa com 1 carta', () => {
  const estado = proximoTamanhoDeMao(null, 4)
  assert.deepEqual(estado, { cartas: 1, direcao: 1 })
})

test('cresce até o máximo e depois decresce até 1', () => {
  const numJogadores = 8 // max = floor(51/8) = 6
  assert.equal(maxCartasPorMao(numJogadores), 6)

  let estado = proximoTamanhoDeMao(null, numJogadores)
  const sequencia = [estado.cartas]
  for (let i = 0; i < 10; i++) {
    estado = proximoTamanhoDeMao(estado, numJogadores)
    sequencia.push(estado.cartas)
  }

  assert.deepEqual(sequencia, [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1])
})

test('recalcula o máximo se o número de jogadores ativos mudar', () => {
  let estado = proximoTamanhoDeMao(null, 2) // max = floor(51/2) = 25
  for (let i = 0; i < 5; i++) estado = proximoTamanhoDeMao(estado, 2)
  assert.equal(estado.cartas, 6)

  // um jogador foi eliminado no meio do caminho, restando 2 jogadores com um baralho menor relativo
  estado = proximoTamanhoDeMao(estado, 6) // max = floor(51/6) = 8, ok cabe
  assert.ok(estado.cartas <= maxCartasPorMao(6))
})
