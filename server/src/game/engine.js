const { criarBaralho, embaralhar, manilhaRank, compararCartas, cartaId } = require('./deck')
const { proximoTamanhoDeMao } = require('./rounds')
const { palpiteProibido } = require('./bids')
const { cartasElegiveis } = require('./vaza')

const VIDAS_INICIAIS = 5
const MAX_JOGADORES = 6

const ESTRATEGIAS_AUTOMATICAS = ['maior', 'menor', 'aleatoria']
const ESTRATEGIA_AUTOMATICA_PADRAO = 'aleatoria'

const FASES = {
  LOBBY: 'lobby',
  AGUARDANDO_DISTRIBUIR: 'aguardando_distribuir',
  PALPITE: 'palpite',
  JOGANDO: 'jogando',
  FIM_DE_JOGO: 'fim_de_jogo',
}

class FodinhaGame {
  constructor (roomCode) {
    this.roomCode = roomCode
    this.fase = FASES.LOBBY
    this.ownerId = null
    // jogador: { id (token estável), socketId (conexão atual ou null),
    //            name, color, seat, lives, hand, bid, made, connected, eliminated }
    this.players = []
    this.dealerSeat = null
    this.turnoSeat = null
    this.leaderSeat = null
    // Assento que deve iniciar (palpitar e jogar primeiro) a próxima rodada:
    // quem vence a última vaza puxa a rodada seguinte. null = usa o assento
    // após o dealer (1ª rodada da partida, ou empate/eliminação na última vaza).
    this.proximoLider = null
    this.rodadaNumero = 0
    this.tamanhoMaoEstado = null // { cartas, direcao }
    this.vira = null
    this.manilha = null
    this.baralho = []
    this.mesaAtual = [] // { seat, carta }
    this.tricksJogadas = 0
    this.ultimaVaza = null
    this.ultimoResultado = null
    this.vencedor = null
    // Timestamp (Date.now() + ms) de quando o turno atual expira e uma jogada
    // automática é feita no lugar do jogador; null = sem prazo em andamento
    // (fora de palpite/jogando, ou rodada às cegas jogando sozinha). Só
    // controla o valor exibido aos clientes — quem agenda e dispara a jogada
    // automática de fato é a camada de sockets (handlers.js).
    this.turnoExpiraEm = null
  }

  // ---- Sala / lobby ----

  adicionarJogador ({ id, name, color, socketId, autoPlayStrategy }) {
    if (this.fase !== FASES.LOBBY) {
      throw new Error('Não é possível entrar: a partida já começou.')
    }
    if (this.players.some((p) => p.id === id)) return
    if (this.players.length >= MAX_JOGADORES) {
      throw new Error(`Sala cheia: o máximo é ${MAX_JOGADORES} jogadores.`)
    }

    const primeiroJogador = this.players.length === 0
    this.players.push({
      id,
      socketId,
      name,
      color,
      seat: this.players.length,
      lives: VIDAS_INICIAIS,
      hand: [],
      bid: null,
      made: 0,
      connected: true,
      eliminated: false,
      lastRoundDelta: null,
      autoPlayStrategy: ESTRATEGIAS_AUTOMATICAS.includes(autoPlayStrategy)
        ? autoPlayStrategy
        : ESTRATEGIA_AUTOMATICA_PADRAO,
    })
    if (primeiroJogador) this.ownerId = id
  }

  // Preferência de jogada automática (usada quando o tempo de turno esgota):
  // 'maior' joga sempre a carta mais forte da mão, 'menor' a mais fraca,
  // 'aleatoria' sorteia entre as cartas da mão. Pode ser trocada a qualquer
  // momento, inclusive no meio da partida.
  atualizarEstrategiaAutomatica (playerId, estrategia) {
    if (!ESTRATEGIAS_AUTOMATICAS.includes(estrategia)) {
      throw new Error('Estratégia de jogada automática inválida.')
    }
    const jogador = this.players.find((p) => p.id === playerId)
    if (!jogador) throw new Error('Jogador não encontrado na sala.')
    jogador.autoPlayStrategy = estrategia
  }

  // Chamado quando um socket cai. Na lobby o jogador é removido de vez; em
  // partida em andamento ele só fica marcado como desconectado, mantendo mão
  // e vidas, para poder voltar depois com reconectarJogador.
  desconectarSocket (socketId) {
    const jogador = this.players.find((p) => p.socketId === socketId)
    if (!jogador) return

    if (this.fase === FASES.LOBBY) {
      this.players = this.players.filter((p) => p.id !== jogador.id)
      this.players.forEach((p, i) => { p.seat = i })
      if (this.ownerId === jogador.id) {
        this.ownerId = this.players.length > 0 ? this.players[0].id : null
      }
    } else {
      jogador.connected = false
      jogador.socketId = null
    }
  }

  // Retoma a sessão de um jogador (token estável) numa nova conexão.
  reconectarJogador (token, novoSocketId) {
    const jogador = this.players.find((p) => p.id === token)
    if (!jogador) throw new Error('Sessão inválida para esta sala.')
    jogador.connected = true
    jogador.socketId = novoSocketId
    return jogador
  }

  jogadoresAtivos () {
    return this.players.filter((p) => p.lives > 0)
  }

  proximoAssentoAtivo (assentoAtual) {
    const total = this.players.length
    for (let i = 1; i <= total; i++) {
      const seat = (assentoAtual + i) % total
      if (this.players[seat].lives > 0) return seat
    }
    return null
  }

  iniciarPartida (playerId) {
    if (this.fase !== FASES.LOBBY && this.fase !== FASES.FIM_DE_JOGO) {
      throw new Error('A partida já foi iniciada.')
    }
    if (playerId !== this.ownerId) {
      throw new Error('Só o dono da sala pode começar a partida.')
    }
    if (this.players.length < 2) throw new Error('São necessários pelo menos 2 jogadores.')

    this.players.forEach((p) => { p.lives = VIDAS_INICIAIS; p.eliminated = false })
    this.dealerSeat = Math.floor(Math.random() * this.players.length)
    this.proximoLider = null
    this.rodadaNumero = 0
    this.tamanhoMaoEstado = null
    this.ultimoResultado = null
    this.ultimaVaza = null
    this.vencedor = null
    this.fase = FASES.AGUARDANDO_DISTRIBUIR
  }

  // ---- Distribuição ----

  distribuirCartas (playerId) {
    this._validarFase(FASES.AGUARDANDO_DISTRIBUIR)
    this._validarAtor(playerId, this.dealerSeat)

    const ativos = this.jogadoresAtivos()
    this.rodadaNumero += 1
    this.tamanhoMaoEstado = proximoTamanhoDeMao(this.tamanhoMaoEstado, ativos.length)
    const tamanhoMao = this.tamanhoMaoEstado.cartas

    this.baralho = embaralhar(criarBaralho())
    ativos.forEach((p) => {
      p.hand = this.baralho.splice(0, tamanhoMao)
      p.bid = null
      p.made = 0
      p.lastRoundDelta = null
    })
    this.vira = this.baralho.splice(0, 1)[0]
    this.manilha = manilhaRank(this.vira)

    this.mesaAtual = []
    this.tricksJogadas = 0
    this.ultimaVaza = null
    this.ultimoResultado = null

    // Quem venceu a última vaza da rodada anterior puxa esta; sem isso (1ª
    // rodada da partida, empate ou eliminação na última vaza), usa o assento
    // seguinte ao dealer.
    const lider = this.players.find((p) => p.seat === this.proximoLider)
    this.leaderSeat = (lider && lider.lives > 0) ? lider.seat : this.proximoAssentoAtivo(this.dealerSeat)
    this.proximoLider = null
    this.turnoSeat = this.leaderSeat
    this.fase = FASES.PALPITE
  }

  // ---- Palpite ----

  registrarPalpite (playerId, valor) {
    this._validarFase(FASES.PALPITE)
    const jogador = this._validarAtor(playerId, this.turnoSeat)

    const tamanhoMao = this.tamanhoMaoEstado.cartas
    if (!Number.isInteger(valor) || valor < 0 || valor > tamanhoMao) {
      throw new Error(`Palpite deve ser um número entre 0 e ${tamanhoMao}.`)
    }

    const ativos = this.jogadoresAtivos()
    const faltamPalpitar = ativos.filter((p) => p.bid === null)
    const souUltimoAPalpitar = faltamPalpitar.length === 1
    // Exceção: na mão de 1 carta a soma pode fechar em 1 — é a única rodada em
    // que todo mundo pode acertar o palpite e ninguém perde vida.
    if (souUltimoAPalpitar && tamanhoMao !== 1) {
      const somaOutros = ativos.reduce((acc, p) => (p.id === playerId ? acc : acc + p.bid), 0)
      const proibido = palpiteProibido(tamanhoMao, somaOutros)
      if (proibido !== null && valor === proibido) {
        throw new Error(`A soma dos palpites não pode fechar em ${tamanhoMao}. Escolha outro valor.`)
      }
    }

    jogador.bid = valor

    const proximo = this.proximoAssentoAtivo(this.turnoSeat)
    const todosPalpitaram = ativos.every((p) => p.bid !== null)

    if (todosPalpitaram) {
      this.fase = FASES.JOGANDO
      this.turnoSeat = this.leaderSeat
    } else {
      this.turnoSeat = proximo
    }
  }

  // ---- Jogar carta ----

  jogarCarta (playerId, idCarta) {
    this._validarFase(FASES.JOGANDO)
    const jogador = this._validarAtor(playerId, this.turnoSeat)

    let indice
    if (idCarta) {
      indice = jogador.hand.findIndex((c) => cartaId(c) === idCarta)
      if (indice === -1) throw new Error('Carta não está na sua mão.')
    } else {
      // Rodada às cegas: o jogador não sabe a identidade da própria carta,
      // então só pode jogar "sem escolher" quando resta exatamente uma.
      if (jogador.hand.length !== 1) throw new Error('Escolha qual carta jogar.')
      indice = 0
    }

    const [carta] = jogador.hand.splice(indice, 1)
    this.mesaAtual.push({ seat: jogador.seat, carta })

    const ativos = this.jogadoresAtivos()
    if (this.mesaAtual.length < ativos.length) {
      this.turnoSeat = this.proximoAssentoAtivo(this.turnoSeat)
      return false
    }

    this._resolverVaza(ativos)
    return true
  }

  // ---- Ações automáticas (usadas pela camada de sockets quando o tempo do
  // turno esgota) ----
  // Sorteia um palpite válido para o jogador, já respeitando a regra do
  // "fecha a conta" quando ele for o último a palpitar (mesma lógica de
  // registrarPalpite, sem lançar erro: sempre existe pelo menos uma opção
  // válida entre 0 e o tamanho da mão).
  escolherPalpiteAutomatico (playerId) {
    const tamanhoMao = this.tamanhoMaoEstado.cartas
    const ativos = this.jogadoresAtivos()
    const faltamPalpitar = ativos.filter((p) => p.bid === null)
    const souUltimoAPalpitar = faltamPalpitar.length === 1

    const opcoes = []
    for (let i = 0; i <= tamanhoMao; i++) opcoes.push(i)

    if (souUltimoAPalpitar && tamanhoMao !== 1) {
      const somaOutros = ativos.reduce((acc, p) => (p.id === playerId ? acc : acc + p.bid), 0)
      const proibido = palpiteProibido(tamanhoMao, somaOutros)
      const indice = proibido !== null ? opcoes.indexOf(proibido) : -1
      if (indice !== -1) opcoes.splice(indice, 1)
    }

    return opcoes[Math.floor(Math.random() * opcoes.length)]
  }

  // Escolhe a carta a jogar de acordo com a preferência do jogador (maior,
  // menor ou aleatória). Com 1 carta na mão não há escolha real de qualquer
  // forma.
  escolherCartaAutomatica (playerId) {
    const jogador = this.players.find((p) => p.id === playerId)
    if (!jogador || jogador.hand.length === 0) return null
    if (jogador.hand.length === 1) return cartaId(jogador.hand[0])

    const estrategia = jogador.autoPlayStrategy || ESTRATEGIA_AUTOMATICA_PADRAO
    if (estrategia === 'aleatoria') {
      const carta = jogador.hand[Math.floor(Math.random() * jogador.hand.length)]
      return cartaId(carta)
    }

    let maisForte = jogador.hand[0]
    let maisFraca = jogador.hand[0]
    for (const carta of jogador.hand.slice(1)) {
      if (compararCartas(carta, maisForte, this.manilha) > 0) maisForte = carta
      if (compararCartas(carta, maisFraca, this.manilha) < 0) maisFraca = carta
    }
    return cartaId(estrategia === 'menor' ? maisFraca : maisForte)
  }

  _resolverVaza (ativos) {
    const elegiveis = cartasElegiveis(this.mesaAtual, this.manilha)

    let vencedorJogada = null
    if (elegiveis.length > 0) {
      vencedorJogada = elegiveis.reduce((melhor, atual) => (
        compararCartas(atual.carta, melhor.carta, this.manilha) > 0 ? atual : melhor
      ))
    }

    if (vencedorJogada) {
      const vencedor = this.players.find((p) => p.seat === vencedorJogada.seat)
      vencedor.made += 1
      this.leaderSeat = vencedor.seat
    }
    // sem vencedor (tudo se anulou ou empate): leaderSeat permanece o mesmo

    this.ultimaVaza = {
      cartas: this.mesaAtual,
      vencedorSeat: vencedorJogada ? vencedorJogada.seat : null,
      empate: !vencedorJogada,
    }
    this.mesaAtual = []
    this.tricksJogadas += 1

    if (this.tricksJogadas >= this.tamanhoMaoEstado.cartas) {
      this._finalizarRodada(ativos)
    } else {
      this.turnoSeat = this.leaderSeat
    }
  }

  _finalizarRodada (ativos) {
    const resultado = ativos.map((p) => {
      const delta = Math.abs(p.bid - p.made)
      p.lives = Math.max(0, p.lives - delta)
      p.lastRoundDelta = delta
      p.eliminated = p.lives === 0
      return { seat: p.seat, name: p.name, bid: p.bid, made: p.made, delta, lives: p.lives }
    })
    // Vencedor da rodada: quem fez mais tricks (poderia estar empatado)
    const vencedorDaRodada = ativos.reduce((melhor, atual) =>
      atual.made > melhor.made ? atual : melhor
    )
    this.ultimoResultado = {
      rodada: this.rodadaNumero,
      jogadores: resultado,
      vencedorDaRodada: { seat: vencedorDaRodada.seat, name: vencedorDaRodada.name },
    }

    const sobreviventes = this.jogadoresAtivos()
    if (sobreviventes.length <= 1) {
      this.fase = FASES.FIM_DE_JOGO
      const vencedor = sobreviventes[0] || null
      this.vencedor = vencedor ? { seat: vencedor.seat, name: vencedor.name, color: vencedor.color } : null
      this.turnoSeat = null
    } else {
      // quem venceu a última vaza inicia a próxima rodada (empate: sem líder definido)
      this.proximoLider = this.ultimaVaza.vencedorSeat
      this.dealerSeat = this.proximoAssentoAtivo(this.dealerSeat)
      this.fase = FASES.AGUARDANDO_DISTRIBUIR
      this.turnoSeat = null
    }
  }

  // ---- Helpers ----

  _validarFase (esperada) {
    if (this.fase !== esperada) {
      throw new Error(`Ação inválida para a fase atual (${this.fase}).`)
    }
  }

  _validarAtor (playerId, assentoEsperado) {
    const jogador = this.players.find((p) => p.id === playerId)
    if (!jogador) throw new Error('Jogador não encontrado na sala.')
    if (jogador.seat !== assentoEsperado) throw new Error('Não é a sua vez.')
    return jogador
  }

  // ---- Estado sanitizado ----
  // Nunca inclui o token (`id`) de nenhum jogador: assento (`seat`) é o único
  // identificador público. `meuAssento` diz ao destinatário qual é o dele.

  getStateFor (playerId) {
    const eu = this.players.find((p) => p.id === playerId)
    const dono = this.players.find((p) => p.id === this.ownerId)
    // Rodada às cegas: toda rodada de 1 carta (a primeira, e qualquer outra
    // que volte a ter só 1 carta por jogador ao longo do jogo) se joga com as
    // mãos invertidas — cada um vê a carta de todo mundo, menos a própria.
    const rodadaCega = !!this.tamanhoMaoEstado && this.tamanhoMaoEstado.cartas === 1

    return {
      roomCode: this.roomCode,
      fase: this.fase,
      rodadaNumero: this.rodadaNumero,
      rodadaCega,
      tamanhoMao: this.tamanhoMaoEstado ? this.tamanhoMaoEstado.cartas : null,
      vira: this.vira,
      manilha: this.manilha,
      dealerSeat: this.dealerSeat,
      turnoSeat: this.turnoSeat,
      turnoExpiraEm: this.turnoExpiraEm,
      leaderSeat: this.leaderSeat,
      ownerSeat: dono ? dono.seat : null,
      meuAssento: eu ? eu.seat : null,
      meuAutoPlayStrategy: eu ? eu.autoPlayStrategy : null,
      mesaAtual: this.mesaAtual,
      ultimaVaza: this.ultimaVaza,
      ultimoResultado: this.ultimoResultado,
      vencedor: this.vencedor,
      jogadores: this.players.map((p) => ({
        seat: p.seat,
        name: p.name,
        color: p.color,
        lives: p.lives,
        connected: p.connected,
        eliminated: p.eliminated,
        bid: p.bid,
        made: p.made,
        lastRoundDelta: p.lastRoundDelta,
        handCount: p.hand.length,
        hand: this._maoVisivelPara(p, playerId, rodadaCega) ? p.hand : undefined,
      })),
    }
  }

  _maoVisivelPara (jogador, playerId, rodadaCega) {
    return rodadaCega ? jogador.id !== playerId : jogador.id === playerId
  }
}

module.exports = { FodinhaGame, FASES, VIDAS_INICIAIS, ESTRATEGIAS_AUTOMATICAS }
