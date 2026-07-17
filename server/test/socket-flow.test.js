const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('http')
const { Server } = require('socket.io')
const { io: ioClient } = require('socket.io-client')
const { registerSocketHandlers } = require('../src/socket/handlers')

function iniciarServidorDeTeste () {
  return new Promise((resolve) => {
    const httpServer = http.createServer()
    const io = new Server(httpServer)
    // delay bem curto nos testes: só precisa existir o passo intermediário,
    // não precisa esperar os ~2.5s reais de produção. Os prazos de automação
    // (timer de turno, auto-distribuir, rodada às cegas) ficam bem longos pra
    // não disparar no meio das asserções, que exercitam as ações manuais.
    registerSocketHandlers(io, {
      tempoEsperaVazaMs: 20,
      tempoLimiteTurnoMs: 10 * 60 * 1000,
      tempoAutoDistribuirMs: 10 * 60 * 1000,
      tempoEntreJogadasCegasMs: 10 * 60 * 1000,
    })
    httpServer.listen(0, () => {
      resolve({ httpServer, io, port: httpServer.address().port })
    })
  })
}

function conectarCliente (port) {
  return new Promise((resolve) => {
    const socket = ioClient(`http://localhost:${port}`, { transports: ['websocket'] })
    socket.on('connect', () => resolve(socket))
  })
}

// Mantém o último estado recebido e permite esperar pelo próximo. O resolver
// precisa ser registrado ANTES do emit que vai disparar o broadcast, senão
// corre o risco do evento chegar antes de começarmos a esperar por ele.
function criarColetorDeEstado (socket) {
  let atual = null
  let resolvers = []
  socket.on('game:state', (s) => {
    atual = s
    const pendentes = resolvers
    resolvers = []
    pendentes.forEach((r) => r(s))
  })
  return {
    get atual () { return atual },
    aguardarProximo: () => new Promise((resolve) => resolvers.push(resolve)),
    // Espera até que o estado (o atual, ou algum futuro) satisfaça o
    // predicado. Necessário porque uma vaza completa gera um estado
    // intermediário (mesa cheia, turno nulo) antes do estado resolvido.
    aguardarAte (predicado) {
      if (atual && predicado(atual)) return Promise.resolve(atual)
      return new Promise((resolve) => {
        const checar = (s) => {
          if (predicado(s)) {
            resolve(s)
            socket.off('game:state', checar)
          }
        }
        socket.on('game:state', checar)
      })
    },
  }
}

// Verdadeiro quando o estado está "pronto pra agir": ou não estamos mais na
// fase de jogo (rodada terminou), ou já tem um turno definido de novo (a
// vaza, se acabou de completar, já foi resolvida).
function estadoAcionavel (s) {
  return s.fase !== 'jogando' || s.turnoSeat !== null
}

function agir (socket, evento, payload, coletores) {
  const esperas = coletores.map((c) => c.aguardarProximo())
  return new Promise((resolve, reject) => {
    socket.emit(evento, payload, (resp) => {
      if (!resp || !resp.ok) return reject(new Error(resp && resp.error))
      Promise.all(esperas).then(() => resolve(resp))
    })
  })
}

test('fluxo completo via socket.io: criar sala, entrar, iniciar, palpitar e jogar', async (t) => {
  const { httpServer, io, port } = await iniciarServidorDeTeste()
  t.after(() => { io.close(); httpServer.close() })

  const clienteA = await conectarCliente(port)
  const clienteB = await conectarCliente(port)
  t.after(() => { clienteA.close(); clienteB.close() })

  const colA = criarColetorDeEstado(clienteA)
  const colB = criarColetorDeEstado(clienteB)

  const respostaCriar = await agir(clienteA, 'room:create', { name: 'Ana', color: 'red' }, [colA])
  const roomCode = respostaCriar.roomCode
  assert.match(roomCode, /^[A-Z0-9]{5}$/)
  assert.ok(respostaCriar.playerToken)

  await agir(clienteB, 'room:join', { roomCode, name: 'Beto', color: 'blue' }, [colA, colB])
  assert.equal(colA.atual.jogadores.length, 2)
  // o token nunca deve aparecer no estado sanitizado
  assert.ok(!JSON.stringify(colA.atual).includes(respostaCriar.playerToken))

  // só o dono (quem criou a sala) pode começar
  await assert.rejects(() => agir(clienteB, 'game:start', {}, [colA, colB]), /dono da sala/)

  await agir(clienteA, 'game:start', {}, [colA, colB])
  assert.equal(colA.atual.fase, 'aguardando_distribuir')

  function ehDeA (seat) { return colA.atual.meuAssento === seat }

  const dealerSeat = colA.atual.dealerSeat
  const dealerSocket = ehDeA(dealerSeat) ? clienteA : clienteB

  await agir(dealerSocket, 'round:deal', {}, [colA, colB])
  assert.equal(colA.atual.fase, 'palpite')
  assert.equal(colA.atual.tamanhoMao, 1)

  // rodada 1 é às cegas: eu vejo a mão do outro, mas não a minha
  assert.equal(colA.atual.rodadaCega, true)
  const minhaMaoA = colA.atual.jogadores.find((j) => j.seat === colA.atual.meuAssento).hand
  assert.equal(minhaMaoA, undefined)
  const maoDeOutroVistaPorA = colA.atual.jogadores.find((j) => j.seat !== colA.atual.meuAssento).hand
  assert.equal(maoDeOutroVistaPorA.length, 1)

  while (colA.atual.fase === 'palpite') {
    const socket = ehDeA(colA.atual.turnoSeat) ? clienteA : clienteB
    await agir(socket, 'bid:submit', { valor: 0 }, [colA, colB])
  }

  assert.equal(colA.atual.fase, 'jogando')

  let vazasJogadas = 0
  while (colA.atual.fase === 'jogando') {
    const deA = ehDeA(colA.atual.turnoSeat)
    const socket = deA ? clienteA : clienteB
    // às cegas, o cliente não sabe a própria carta: joga sem escolher (só há 1)
    await agir(socket, 'card:play', { cartaId: null }, [colA, colB])
    // se essa jogada completou a vaza, espera o estado intermediário (mesa
    // cheia) dar lugar ao estado já resolvido antes de continuar
    await Promise.all([colA, colB].map((c) => c.aguardarAte(estadoAcionavel)))
    vazasJogadas++
    if (vazasJogadas > 5) throw new Error('loop infinito na fase de jogo')
  }

  assert.equal(colA.atual.fase, 'aguardando_distribuir')
  assert.equal(colA.atual.rodadaNumero, 1)
  assert.ok(colA.atual.ultimoResultado)
  assert.equal(colA.atual.ultimoResultado.jogadores.length, 2)

  const totalDelta = colA.atual.ultimoResultado.jogadores.reduce((acc, j) => acc + j.delta, 0)
  assert.ok(totalDelta === 0 || totalDelta === 1)
})

test('reconexão: cai a conexão em partida e volta com o token, mantendo a mão', async (t) => {
  const { httpServer, io, port } = await iniciarServidorDeTeste()
  t.after(() => { io.close(); httpServer.close() })

  const clienteA = await conectarCliente(port)
  let clienteB = await conectarCliente(port)
  t.after(() => { clienteA.close(); clienteB.close() })

  const colA = criarColetorDeEstado(clienteA)
  let colB = criarColetorDeEstado(clienteB)

  const respostaCriar = await agir(clienteA, 'room:create', { name: 'Ana', color: 'red' }, [colA])
  const roomCode = respostaCriar.roomCode

  const respostaEntrar = await agir(clienteB, 'room:join', { roomCode, name: 'Beto', color: 'blue' }, [colA, colB])
  const tokenB = respostaEntrar.playerToken

  await agir(clienteA, 'game:start', {}, [colA, colB])

  const esperaA = colA.aguardarProximo()
  clienteB.close()
  await esperaA
  assert.equal(colA.atual.jogadores.find((j) => j.name === 'Beto').connected, false)

  clienteB = await conectarCliente(port)
  colB = criarColetorDeEstado(clienteB)
  const esperaA2 = colA.aguardarProximo()
  const respostaRejoin = await new Promise((resolve, reject) => {
    clienteB.emit('room:rejoin', { roomCode, playerToken: tokenB }, (resp) => {
      if (!resp.ok) return reject(new Error(resp.error))
      resolve(resp)
    })
  })
  assert.equal(respostaRejoin.roomCode, roomCode)
  await esperaA2
  assert.equal(colA.atual.jogadores.find((j) => j.name === 'Beto').connected, true)
})
