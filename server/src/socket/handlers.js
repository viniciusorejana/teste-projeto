const { criarSala, obterSala, limparSalaSeVazia, gerarTokenJogador } = require('../rooms')

const TEMPO_ESPERA_VAZA_MS_PADRAO = 2500
const TEMPO_LIMITE_TURNO_MS_PADRAO = 45000
const TEMPO_AUTO_DISTRIBUIR_MS_PADRAO = 3000
const TEMPO_ENTRE_JOGADAS_CEGAS_MS_PADRAO = 700

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

function registerSocketHandlers (io, {
  tempoEsperaVazaMs = TEMPO_ESPERA_VAZA_MS_PADRAO,
  tempoLimiteTurnoMs = TEMPO_LIMITE_TURNO_MS_PADRAO,
  tempoAutoDistribuirMs = TEMPO_AUTO_DISTRIBUIR_MS_PADRAO,
  tempoEntreJogadasCegasMs = TEMPO_ENTRE_JOGADAS_CEGAS_MS_PADRAO,
} = {}) {
  // Um timer "de automação" por sala por vez: turno expirando, distribuição
  // automática da próxima rodada, ou a próxima jogada da rodada às cegas.
  // Sempre que o estado muda de verdade, o timer anterior é cancelado e um
  // novo é decidido a partir do estado atual (ver agendarAutomacoes). Um
  // timer que dispare atrasado (ex.: ação manual aconteceu enquanto ele
  // ainda estava armado) é inofensivo: o callback sempre reconfere fase e
  // assento antes de agir.
  const timersPorSala = new Map()

  function cancelarTimer (roomCode) {
    const atual = timersPorSala.get(roomCode)
    if (atual) {
      clearTimeout(atual)
      timersPorSala.delete(roomCode)
    }
  }

  function agendarTimer (roomCode, ms, fn) {
    cancelarTimer(roomCode)
    const handle = setTimeout(fn, ms)
    // Nunca deve, sozinho, impedir o processo de encerrar (ex.: servidor de
    // teste fechando com timers de automação ainda armados).
    if (typeof handle.unref === 'function') handle.unref()
    timersPorSala.set(roomCode, handle)
  }

  // Decide o que automatizar a seguir a partir do estado "real" do jogo
  // (nunca chamado durante a pausa congelada de fim de vaza, que é só uma
  // foto temporária pro cliente): agenda o timer de turno, a distribuição
  // automática da próxima rodada, ou o encadeamento de jogadas da rodada às
  // cegas.
  function agendarAutomacoes (game) {
    const roomCode = game.roomCode

    if (game.fase === 'aguardando_distribuir') {
      game.turnoExpiraEm = null
      const dealer = game.players.find((p) => p.seat === game.dealerSeat)
      if (!dealer) return
      agendarTimer(roomCode, tempoAutoDistribuirMs, () => {
        const sala = obterSala(roomCode)
        if (!sala || sala.fase !== 'aguardando_distribuir') return
        try {
          sala.distribuirCartas(dealer.id)
        } catch (err) {
          return
        }
        broadcastEstadoReal(sala)
      })
      return
    }

    const emTurno = (game.fase === 'palpite' || game.fase === 'jogando') && game.turnoSeat !== null
    if (!emTurno) {
      game.turnoExpiraEm = null
      cancelarTimer(roomCode)
      return
    }

    const rodadaCega = !!game.tamanhoMaoEstado && game.tamanhoMaoEstado.cartas === 1
    if (game.fase === 'jogando' && rodadaCega) {
      // Só existe 1 carta por jogador: não há escolha real de qual jogar, a
      // rodada inteira se joga sozinha assim que o palpite termina.
      game.turnoExpiraEm = null
      const seat = game.turnoSeat
      agendarTimer(roomCode, tempoEntreJogadasCegasMs, () => {
        const sala = obterSala(roomCode)
        if (!sala || sala.fase !== 'jogando' || sala.turnoSeat !== seat) return
        const jogador = sala.players.find((p) => p.seat === seat)
        if (jogador) jogarCartaAutomatica(sala, jogador.id)
      })
      return
    }

    // Palpite (inclusive na rodada às cegas, onde a escolha do valor ainda é
    // real) ou jogada normal: prazo de verdade, com jogada automática se
    // ninguém agir a tempo.
    game.turnoExpiraEm = Date.now() + tempoLimiteTurnoMs
    const seat = game.turnoSeat
    const fase = game.fase
    agendarTimer(roomCode, tempoLimiteTurnoMs, () => {
      const sala = obterSala(roomCode)
      if (!sala || sala.fase !== fase || sala.turnoSeat !== seat) return
      const jogador = sala.players.find((p) => p.seat === seat)
      if (!jogador) return

      if (fase === 'palpite') {
        const valor = sala.escolherPalpiteAutomatico(jogador.id)
        try {
          sala.registrarPalpite(jogador.id, valor)
        } catch (err) {
          return
        }
        broadcastEstadoReal(sala)
      } else {
        jogarCartaAutomatica(sala, jogador.id)
      }
    })
  }

  function jogarCartaAutomatica (game, playerId) {
    const idCarta = game.escolherCartaAutomatica(playerId)
    let vazaResolvida
    try {
      vazaResolvida = game.jogarCarta(playerId, idCarta)
    } catch (err) {
      return
    }
    resolverJogada(game, vazaResolvida)
  }

  // Mostra a mesa completa (a vaza recém-jogada) por alguns segundos antes de
  // seguir pra próxima vaza ou pro resultado da rodada, pra todo mundo ter
  // tempo de ver as cartas jogadas. Congela fase/resultado/vencedor na visão
  // "ainda jogando" durante a espera, já que internamente o motor já pode ter
  // avançado a rodada/partida.
  function resolverJogada (game, vazaResolvida) {
    if (vazaResolvida) {
      broadcastState(io, game, {
        mesaAtual: game.ultimaVaza.cartas,
        turnoSeat: null,
        turnoExpiraEm: null,
        fase: 'jogando',
        ultimoResultado: null,
        vencedor: null,
      })
      setTimeout(() => broadcastEstadoReal(game), tempoEsperaVazaMs)
    } else {
      broadcastEstadoReal(game)
    }
  }

  function broadcastEstadoReal (game) {
    agendarAutomacoes(game)
    broadcastState(io, game)
  }

  io.on('connection', (socket) => {
    socket.on('room:create', ({ name, color, autoPlayStrategy } = {}, callback) => {
      if (!name || !name.trim()) {
        return ack(callback, { ok: false, error: 'Informe um nome.' })
      }
      const game = criarSala()
      const playerToken = gerarTokenJogador()
      game.adicionarJogador({ id: playerToken, name: name.trim(), color, socketId: socket.id, autoPlayStrategy })
      socket.join(game.roomCode)
      socket.data.roomCode = game.roomCode
      socket.data.playerToken = playerToken

      ack(callback, { ok: true, roomCode: game.roomCode, playerToken })
      broadcastEstadoReal(game)
    })

    socket.on('room:join', ({ roomCode, name, color, autoPlayStrategy } = {}, callback) => {
      const game = obterSala(roomCode)
      if (!game) return ack(callback, { ok: false, error: 'Sala não encontrada.' })
      if (!name || !name.trim()) return ack(callback, { ok: false, error: 'Informe um nome.' })

      const playerToken = gerarTokenJogador()
      try {
        game.adicionarJogador({ id: playerToken, name: name.trim(), color, socketId: socket.id, autoPlayStrategy })
      } catch (err) {
        return ack(callback, { ok: false, error: err.message })
      }

      socket.join(game.roomCode)
      socket.data.roomCode = game.roomCode
      socket.data.playerToken = playerToken

      ack(callback, { ok: true, roomCode: game.roomCode, playerToken })
      broadcastEstadoReal(game)
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
      broadcastEstadoReal(game)
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
        broadcastEstadoReal(game)
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

    socket.on('jogador:estrategia', comAcaoDeJogo((game, { estrategia }) => {
      game.atualizarEstrategiaAutomatica(socket.data.playerToken, estrategia)
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
      resolverJogada(game, vazaResolvida)
    })

    socket.on('disconnect', () => {
      const roomCode = socket.data.roomCode
      const game = obterSala(roomCode)
      if (!game) return

      game.desconectarSocket(socket.id)
      broadcastEstadoReal(game)
      limparSalaSeVazia(roomCode)
      if (!obterSala(roomCode)) cancelarTimer(roomCode)
    })
  })
}

module.exports = { registerSocketHandlers }
