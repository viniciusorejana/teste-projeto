const test = require('node:test')
const assert = require('node:assert/strict')
const { FodinhaGame, FASES } = require('../src/game/engine')
const { cartaId } = require('../src/game/deck')

function criarJogoComJogadores (n) {
  const game = new FodinhaGame('ABCD')
  const ids = []
  for (let i = 0; i < n; i++) {
    const id = `p${i}`
    ids.push(id)
    game.adicionarJogador({ id, name: `Jogador ${i}`, color: 'red', socketId: `s${i}` })
  }
  return { game, ids }
}

test('o primeiro jogador a entrar é o dono da sala', () => {
  const { game, ids } = criarJogoComJogadores(3)
  assert.equal(game.ownerId, ids[0])
})

test('só o dono pode iniciar a partida', () => {
  const { game, ids } = criarJogoComJogadores(2)
  assert.throws(() => game.iniciarPartida(ids[1]), /dono da sala/)
  assert.doesNotThrow(() => game.iniciarPartida(ids[0]))
})

test('fluxo completo de uma rodada com 3 jogadores', () => {
  const { game, ids } = criarJogoComJogadores(3)
  game.iniciarPartida(ids[0])
  assert.equal(game.fase, FASES.AGUARDANDO_DISTRIBUIR)

  const dealerId = game.players[game.dealerSeat].id
  game.distribuirCartas(dealerId)
  assert.equal(game.fase, FASES.PALPITE)
  assert.equal(game.tamanhoMaoEstado.cartas, 1)

  game.players.forEach((p) => assert.equal(p.hand.length, 1))

  let ordem = []
  while (game.fase === FASES.PALPITE) {
    const atual = game.players[game.turnoSeat]
    ordem.push(atual.id)
    game.registrarPalpite(atual.id, 0)
  }
  assert.equal(ordem.length, 3)
  assert.equal(game.fase, FASES.JOGANDO)

  while (game.fase === FASES.JOGANDO) {
    const atual = game.players[game.turnoSeat]
    game.jogarCarta(atual.id, cartaId(atual.hand[0]))
  }

  assert.equal(game.fase, FASES.AGUARDANDO_DISTRIBUIR)
  assert.equal(game.rodadaNumero, 1)
  assert.ok(game.ultimoResultado)
  game.ultimoResultado.jogadores.forEach((r) => {
    assert.ok(r.delta === 0 || r.delta === 1)
  })
})

test('não permite jogar fora de turno', () => {
  const { game, ids } = criarJogoComJogadores(2)
  game.iniciarPartida(ids[0])
  const dealerId = game.players[game.dealerSeat].id
  game.distribuirCartas(dealerId)

  const foraDeTurno = game.players.find((p, i) => i !== game.turnoSeat)
  assert.throws(() => game.registrarPalpite(foraDeTurno.id, 0), /vez/)
})

test('último a palpitar não pode fechar a soma no tamanho da mão', () => {
  const { game, ids } = criarJogoComJogadores(2)
  game.iniciarPartida(ids[0])
  const dealerId = game.players[game.dealerSeat].id
  game.distribuirCartas(dealerId)

  // força o tamanho da mão para reproduzir o exemplo do usuário (rodada com 3 cartas)
  game.tamanhoMaoEstado = { cartas: 3, direcao: 1 }

  const primeiro = game.players[game.turnoSeat]
  game.registrarPalpite(primeiro.id, 2)

  const segundo = game.players[game.turnoSeat]
  assert.notEqual(primeiro.id, segundo.id)
  // segundo (e último, com 2 jogadores) não pode palpitar 1, pois 2+1=3 fecharia a conta
  assert.throws(() => game.registrarPalpite(segundo.id, 1), /fechar/)
  // outro valor qualquer é permitido
  assert.doesNotThrow(() => game.registrarPalpite(segundo.id, 0))
})

test('jogador que não é o último a palpitar pode escolher qualquer valor', () => {
  const { game, ids } = criarJogoComJogadores(3)
  game.iniciarPartida(ids[0])
  const dealerId = game.players[game.dealerSeat].id
  game.distribuirCartas(dealerId)
  game.tamanhoMaoEstado = { cartas: 3, direcao: 1 }

  const primeiro = game.players[game.turnoSeat]
  // primeiro a palpitar não tem restrição, mesmo que "pareça" fechar futuramente
  assert.doesNotThrow(() => game.registrarPalpite(primeiro.id, 3))
})

test('jogo termina quando resta 1 jogador com vida', () => {
  const { game, ids } = criarJogoComJogadores(2)
  game.iniciarPartida(ids[0])
  game.players[0].lives = 1
  game.players[1].lives = 5

  const dealerId = game.players[game.dealerSeat].id
  game.distribuirCartas(dealerId)

  while (game.fase === FASES.PALPITE) {
    const atual = game.players[game.turnoSeat]
    game.registrarPalpite(atual.id, 1)
  }
  while (game.fase === FASES.JOGANDO) {
    const atual = game.players[game.turnoSeat]
    game.jogarCarta(atual.id, cartaId(atual.hand[0]))
  }

  const eliminado = game.players.find((p) => p.lives === 0)
  if (eliminado) {
    assert.equal(game.fase, FASES.FIM_DE_JOGO)
    assert.ok(game.vencedor)
    assert.equal(typeof game.vencedor.seat, 'number')
  }
})

test('dono pode reiniciar a partida após o fim de jogo', () => {
  const { game, ids } = criarJogoComJogadores(2)
  game.iniciarPartida(ids[0])
  // força o fim de jogo diretamente, sem depender do resultado aleatório de uma vaza
  game.fase = FASES.FIM_DE_JOGO
  game.players[0].lives = 0
  game.players[1].lives = 3

  assert.doesNotThrow(() => game.iniciarPartida(ids[0]))
  assert.equal(game.fase, FASES.AGUARDANDO_DISTRIBUIR)
  assert.equal(game.players[0].lives, 5)
  assert.equal(game.players[1].lives, 5)
})

test('não-dono não pode reiniciar após o fim de jogo', () => {
  const { game, ids } = criarJogoComJogadores(2)
  game.iniciarPartida(ids[0])
  game.fase = FASES.FIM_DE_JOGO
  assert.throws(() => game.iniciarPartida(ids[1]), /dono da sala/)
})

test('estado sanitizado nunca expõe o token do jogador, só o assento', () => {
  const { game, ids } = criarJogoComJogadores(3)
  game.iniciarPartida(ids[0])
  const dealerId = game.players[game.dealerSeat].id
  game.distribuirCartas(dealerId)

  // sai da rodada 1 (às cegas) pra testar a visibilidade normal de mão
  while (game.fase === FASES.PALPITE) {
    const atual = game.players[game.turnoSeat]
    game.registrarPalpite(atual.id, 0)
  }
  while (game.fase === FASES.JOGANDO) {
    const atual = game.players[game.turnoSeat]
    game.jogarCarta(atual.id, null)
  }
  game.distribuirCartas(game.players[game.dealerSeat].id)

  const estado = game.getStateFor(ids[0])
  const json = JSON.stringify(estado)
  ids.forEach((token) => assert.ok(!json.includes(token), `token ${token} vazou no estado`))

  const meuAssento = estado.meuAssento
  const eu = estado.jogadores.find((j) => j.seat === meuAssento)
  const outro = estado.jogadores.find((j) => j.seat !== meuAssento)
  assert.ok(Array.isArray(eu.hand))
  assert.equal(outro.hand, undefined)
  assert.equal(typeof outro.handCount, 'number')
})

test('desconectar em partida em andamento preserva a mão; reconectar restaura o acesso', () => {
  const { game, ids } = criarJogoComJogadores(3)
  game.iniciarPartida(ids[0])
  const dealerId = game.players[game.dealerSeat].id
  game.distribuirCartas(dealerId)

  const jogador = game.players[1]
  const socketAntigo = jogador.socketId
  game.desconectarSocket(socketAntigo)
  assert.equal(jogador.connected, false)
  assert.equal(jogador.socketId, null)
  assert.ok(jogador.hand) // mão preservada

  game.reconectarJogador(jogador.id, 's-novo')
  assert.equal(jogador.connected, true)
  assert.equal(jogador.socketId, 's-novo')
})

test('desconectar na lobby remove o jogador e reatribui o dono se preciso', () => {
  const { game, ids } = criarJogoComJogadores(2)
  assert.equal(game.ownerId, ids[0])
  game.desconectarSocket('s0')
  assert.equal(game.players.length, 1)
  assert.equal(game.ownerId, ids[1])
})

test('reconectar com token inválido lança erro', () => {
  const { game } = criarJogoComJogadores(2)
  assert.throws(() => game.reconectarJogador('token-invalido', 's-x'), /inválida/)
})

test('rodada às cegas: cada um vê a mão dos outros, mas não a própria', () => {
  const { game, ids } = criarJogoComJogadores(3)
  game.iniciarPartida(ids[0])
  const dealerId = game.players[game.dealerSeat].id
  game.distribuirCartas(dealerId)
  assert.equal(game.rodadaNumero, 1)

  const estado = game.getStateFor(ids[0])
  assert.equal(estado.rodadaCega, true)

  const eu = estado.jogadores.find((j) => j.seat === estado.meuAssento)
  const outros = estado.jogadores.filter((j) => j.seat !== estado.meuAssento)
  assert.equal(eu.hand, undefined)
  outros.forEach((o) => assert.ok(Array.isArray(o.hand) && o.hand.length === 1))
})

test('rodada às cegas vale sempre que a mão tem 1 carta, não só na 1ª rodada', () => {
  const { game, ids } = criarJogoComJogadores(2)
  game.iniciarPartida(ids[0])
  // simula uma rodada bem mais à frente no jogo (ex: descendo de volta pra 1 carta)
  game.rodadaNumero = 7
  game.tamanhoMaoEstado = { cartas: 1, direcao: -1 }
  game.players.forEach((p) => { p.hand = [{ rank: '4', suit: 'paus' }] })

  const estado = game.getStateFor(ids[0])
  assert.equal(estado.rodadaCega, true)
})

test('rodada 2 em diante volta ao normal: só vejo a própria mão', () => {
  const { game, ids } = criarJogoComJogadores(2)
  game.iniciarPartida(ids[0])
  let dealerId = game.players[game.dealerSeat].id
  game.distribuirCartas(dealerId)
  // resolve a rodada 1 rapidamente pra chegar na rodada 2
  while (game.fase === FASES.PALPITE) {
    const atual = game.players[game.turnoSeat]
    game.registrarPalpite(atual.id, 0)
  }
  while (game.fase === FASES.JOGANDO) {
    const atual = game.players[game.turnoSeat]
    game.jogarCarta(atual.id, null)
  }
  assert.equal(game.fase, FASES.AGUARDANDO_DISTRIBUIR)

  dealerId = game.players[game.dealerSeat].id
  game.distribuirCartas(dealerId)
  assert.equal(game.rodadaNumero, 2)

  const estado = game.getStateFor(ids[0])
  assert.equal(estado.rodadaCega, false)
  const eu = estado.jogadores.find((j) => j.seat === estado.meuAssento)
  const outro = estado.jogadores.find((j) => j.seat !== estado.meuAssento)
  assert.ok(Array.isArray(eu.hand))
  assert.equal(outro.hand, undefined)
})

test('jogarCarta sem cartaId funciona quando só resta 1 carta (jogada às cegas)', () => {
  const { game, ids } = criarJogoComJogadores(2)
  game.iniciarPartida(ids[0])
  const dealerId = game.players[game.dealerSeat].id
  game.distribuirCartas(dealerId)
  while (game.fase === FASES.PALPITE) {
    const atual = game.players[game.turnoSeat]
    game.registrarPalpite(atual.id, 0)
  }
  const primeiro = game.players[game.turnoSeat]
  assert.doesNotThrow(() => game.jogarCarta(primeiro.id, null))
})

test('sala aceita no máximo 6 jogadores', () => {
  const { game } = criarJogoComJogadores(6)
  assert.equal(game.players.length, 6)
  assert.throws(() => game.adicionarJogador({ id: 'extra', name: 'Sétimo', color: 'red', socketId: 's6' }), /cheia/)
  assert.equal(game.players.length, 6)
})

test('na mão de 1 carta, a soma dos palpites pode fechar em 1 (única exceção)', () => {
  const { game, ids } = criarJogoComJogadores(2)
  game.iniciarPartida(ids[0])
  const dealerId = game.players[game.dealerSeat].id
  game.distribuirCartas(dealerId)
  assert.equal(game.tamanhoMaoEstado.cartas, 1)

  const primeiro = game.players[game.turnoSeat]
  game.registrarPalpite(primeiro.id, 0)
  const ultimo = game.players[game.turnoSeat]
  // soma fecharia em 1 (0 + 1), mas na mão de 1 carta isso é permitido
  assert.doesNotThrow(() => game.registrarPalpite(ultimo.id, 1))
})

test('quem vence a última vaza da rodada inicia a próxima, mesmo não sendo o seguinte ao novo dealer', () => {
  const { game, ids } = criarJogoComJogadores(3)
  game.iniciarPartida(ids[0])
  game.dealerSeat = 0
  game.distribuirCartas(game.players[0].id)
  assert.equal(game.leaderSeat, 1) // assento seguinte ao dealer, rodada 1

  game.manilha = '6' // evita que qualquer uma das cartas abaixo vire manilha
  game.players[0].hand = [{ rank: '4', suit: 'paus' }]
  game.players[1].hand = [{ rank: '3', suit: 'paus' }] // maior rank não-manilha: vence
  game.players[2].hand = [{ rank: '5', suit: 'paus' }]

  while (game.fase === FASES.PALPITE) {
    const atual = game.players[game.turnoSeat]
    game.registrarPalpite(atual.id, 0)
  }
  while (game.fase === FASES.JOGANDO) {
    const atual = game.players[game.turnoSeat]
    game.jogarCarta(atual.id, cartaId(atual.hand[0]))
  }

  assert.equal(game.fase, FASES.AGUARDANDO_DISTRIBUIR)
  assert.equal(game.dealerSeat, 1) // dealer rotaciona normalmente
  // sem a regra nova, o líder seria proximoAssentoAtivo(1) = 2; com a regra,
  // é o assento 1, que venceu a única vaza da rodada anterior
  game.distribuirCartas(game.players[1].id)
  assert.equal(game.leaderSeat, 1)
  assert.equal(game.turnoSeat, 1)
})

test('empate na última vaza: sem líder definido, próxima rodada usa o assento seguinte ao dealer', () => {
  const { game, ids } = criarJogoComJogadores(2)
  game.iniciarPartida(ids[0])
  game.dealerSeat = 0
  game.distribuirCartas(game.players[0].id)

  game.manilha = '6' // evita que a manilha coincida com o rank usado abaixo
  game.players[0].hand = [{ rank: '4', suit: 'paus' }]
  game.players[1].hand = [{ rank: '4', suit: 'copas' }] // mesmo rank, não-manilha: se anulam

  while (game.fase === FASES.PALPITE) {
    const atual = game.players[game.turnoSeat]
    game.registrarPalpite(atual.id, 0)
  }
  while (game.fase === FASES.JOGANDO) {
    const atual = game.players[game.turnoSeat]
    game.jogarCarta(atual.id, cartaId(atual.hand[0]))
  }

  assert.equal(game.ultimaVaza.empate, true)
  assert.equal(game.dealerSeat, 1)
  game.distribuirCartas(game.players[1].id)
  assert.equal(game.leaderSeat, 0) // proximoAssentoAtivo(1), já que ninguém venceu a vaza anterior
})

test('jogarCarta sem cartaId falha se houver mais de uma carta na mão', () => {
  const { game, ids } = criarJogoComJogadores(2)
  game.iniciarPartida(ids[0])
  const dealerId = game.players[game.dealerSeat].id
  game.distribuirCartas(dealerId)
  game.players.forEach((p) => { p.hand = [{ rank: '4', suit: 'paus' }, { rank: '5', suit: 'paus' }] })
  while (game.fase === FASES.PALPITE) {
    const atual = game.players[game.turnoSeat]
    game.registrarPalpite(atual.id, 0)
  }
  const primeiro = game.players[game.turnoSeat]
  assert.throws(() => game.jogarCarta(primeiro.id, null), /Escolha qual carta/)
})
