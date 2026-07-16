const { customAlphabet, nanoid } = require('nanoid')
const { FodinhaGame } = require('./game/engine')

// Sem caracteres ambíguos (0/O, 1/I).
const gerarCodigo = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 5)

// Token estável de sessão do jogador, independente do socket.id (que muda a
// cada reconexão). Guardado pelo cliente para poder voltar à partida.
function gerarTokenJogador () {
  return nanoid()
}

const salas = new Map()

function criarSala () {
  let codigo
  do {
    codigo = gerarCodigo()
  } while (salas.has(codigo))

  const game = new FodinhaGame(codigo)
  salas.set(codigo, game)
  return game
}

function obterSala (codigo) {
  if (!codigo) return undefined
  return salas.get(String(codigo).toUpperCase())
}

function removerSala (codigo) {
  salas.delete(codigo)
}

// Remove a sala se ninguém mais estiver conectado a ela.
function limparSalaSeVazia (codigo) {
  const game = salas.get(codigo)
  if (!game) return
  const alguemConectado = game.players.some((p) => p.connected)
  if (!alguemConectado) removerSala(codigo)
}

module.exports = { criarSala, obterSala, removerSala, limparSalaSeVazia, gerarTokenJogador }
