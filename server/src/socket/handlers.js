const { criarSala, obterSala, limparSalaSeVazia, gerarTokenJogador } = require('../rooms')

const TEMPO_ESPERA_VAZA_MS_PADRAO = 2500

function broadcastState (io, game, overrides) {
  game.players.forEach((jogador) => {
    if (!jogador.socketId) return
    const estado = game.getStateFor(jogador.id)
    io.to(jogador.socketId).emit('game:state', overrides ? { ...estado, ...overrides } : estado)
  })
}

function ack (callback, payload) {
  if (typeof callback === 'function') callback(payload)
}

function registerSocketHandlers (io, { tempoEsperaVazaMs = TEMPO_ESPERA_VAZA_MS_PADRAO } = {}) {
  io.on('connection', (socket) => {
    socket.on('room:create', ({ name, color } = {}, callback) => {
      if (!name || !name.trim()) {
        return ack(callback, { ok: false, error: 'Informe um nome.' })
      }
      const game = criarSala()
      const playerToken = gerarTokenJogador()
      game.adicionarJogador({ id: playerToken, name: name.trim(), color, socketId: socket.id })
      socket.join(game.roomCode)
      socket.data.roomCode = game.roomCode
      socket.data.playerToken = playerToken

      ack(callback, { ok: true, roomCode: game.roomCode, playerToken })
      broadcastState(io, game)
    })

    socket.on('room:join', ({ roomCode, name, color } = {}, callback) => {
      const game = obterSala(roomCode)
      if (!game) return ack(callback, { ok: false, error: 'Sala não encontrada.' })
      if (!name || !name.trim()) return ack(callback, { ok: false, error: 'Informe um nome.' })

      const playerToken = gerarTokenJogador()
      try {
        game.adicionarJogador({ id: playerToken, name: name.trim(), color, socketId: socket.id })
      } catch (err) {
        return ack(callback, { ok: false, error: err.message })
      }

      socket.join(game.roomCode)
      socket.data.roomCode = game.roomCode
      socket.data.playerToken = playerToken

      ack(callback, { ok: true, roomCode: game.roomCode, playerToken })
      broadcastState(io, game)
    })

    socket.on('room:rejoin', ({ roomCode, playerToken } = {}, callback) => {
      const game = obterSala(roomCode)
      if (!game) return ack(callback, { ok: false, error: 'Sala não encontrada.' })

      try {
        game.reconectarJogador(playerToken, socket.id)
      } catch (err) {
        return ack(callback, { ok: false, error: err.message })
      }

      socket.join(game.roomCode)
      socket.data.roomCode = game.roomCode
      socket.data.playerToken = playerToken

      ack(callback, { ok: true, roomCode: game.roomCode })
      broadcastState(io, game)
    })

    function comAcaoDeJogo (executar) {
      return (payload, callback) => {
        const game = obterSala(socket.data.roomCode)
        if (!game) return ack(callback, { ok: false, error: 'Sala não encontrada.' })

        try {
          executar(game, payload || {})
        } catch (err) {
          return ack(callback, { ok: false, error: err.message })
        }

        ack(callback, { ok: true })
        broadcastState(io, game)
      }
    }

    socket.on('game:start', comAcaoDeJogo((game) => {
      game.iniciarPartida(socket.data.playerToken)
    }))

    socket.on('round:deal', comAcaoDeJogo((game) => {
      game.distribuirCartas(socket.data.playerToken)
    }))

    socket.on('bid:submit', comAcaoDeJogo((game, { valor }) => {
      game.registrarPalpite(socket.data.playerToken, valor)
    }))

    socket.on('card:play', (payload, callback) => {
      const game = obterSala(socket.data.roomCode)
      if (!game) return ack(callback, { ok: false, error: 'Sala não encontrada.' })

      let vazaResolvida
      try {
        vazaResolvida = game.jogarCarta(socket.data.playerToken, (payload || {}).cartaId)
      } catch (err) {
        return ack(callback, { ok: false, error: err.message })
      }

      ack(callback, { ok: true })

      if (vazaResolvida) {
        // Mostra a mesa completa (a vaza recém-jogada) por alguns segundos
        // antes de seguir pra próxima vaza ou pro resultado da rodada, pra
        // todo mundo ter tempo de ver as cartas jogadas. Congela fase/
        // resultado/vencedor na visão "ainda jogando" durante a espera, já
        // que internamente o motor já pode ter avançado a rodada/partida.
        broadcastState(io, game, {
          mesaAtual: game.ultimaVaza.cartas,
          turnoSeat: null,
          fase: 'jogando',
          ultimoResultado: null,
          vencedor: null,
        })
        setTimeout(() => broadcastState(io, game), tempoEsperaVazaMs)
      } else {
        broadcastState(io, game)
      }
    })

    socket.on('disconnect', () => {
      const roomCode = socket.data.roomCode
      const game = obterSala(roomCode)
      if (!game) return

      game.desconectarSocket(socket.id)
      broadcastState(io, game)
      limparSalaSeVazia(roomCode)
    })
  })
}

module.exports = { registerSocketHandlers }
