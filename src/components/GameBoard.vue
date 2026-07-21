<template>
  <v-container fluid class="fill-height board pa-2 d-flex flex-column">
    <!-- ZONA TOPO: informação da rodada e adversários. Altura variável, mas
         sempre ancorada no alto — não disputa espaço com a mesa. -->
    <div class="zona-topo">
    <div class="barra-superior d-flex align-center px-2">
      <div class="barra-superior-lado d-flex justify-start">
        <v-btn
          v-if="$vuetify.breakpoint.xsOnly"
          icon
          color="white"
          class="btn-tutorial"
          :aria-label="$t('comum.comoJogar')"
          @click="mostrarTutorialLocal = true"
        >
          <v-icon>mdi-help-circle-outline</v-icon>
        </v-btn>
        <v-btn
          v-else
          text
          small
          color="white"
          class="btn-tutorial"
          :aria-label="$t('comum.comoJogar')"
          @click="mostrarTutorialLocal = true"
        >
          <v-icon left small>mdi-help-circle-outline</v-icon>
          {{ $t('comum.comoJogar') }}
        </v-btn>
      </div>

      <div class="text-center white--text barra-superior-titulo">
        <div class="text-h6 font-weight-bold rodada-titulo fonte-baralho">
          {{ $t('tabuleiro.rodada', { n: gameState.rodadaNumero }) }}
        </div>
        <div v-if="gameState.tamanhoMao" class="caption white--text text--lighten-2 rodada-subtitulo">
          {{ $tc('tabuleiro.cartasNaMao', gameState.tamanhoMao, { n: gameState.tamanhoMao }) }}
        </div>
      </div>

      <!-- Espelha a largura do botão à esquerda pra manter o título centralizado
           (o seletor de idioma fixo do App.vue pousa exatamente aqui). -->
      <div class="barra-superior-lado" aria-hidden="true"></div>
    </div>

    <GameToast ref="toast" :suprimir="mostrarResultado || fimDeJogo" />
    <GameToast ref="toastCanto" posicao="canto" :suprimir="mostrarResultado || fimDeJogo" />

    <TabelaForcaCartas
      v-model="mostrarTabelaForca"
      :vira="gameState.vira"
      :manilha="gameState.manilha"
    />

    <TutorialDialog v-model="mostrarTutorialLocal" />

    <transition name="banner-vencedor-transicao">
      <div
        v-if="mostrarBannerVencedorDaMao"
        class="banner-vencedor mx-auto my-2 text-center"
      >
        <v-icon color="#212121" large class="mr-1">mdi-trophy</v-icon>
        <span class="banner-vencedor-texto">
          {{ $t('tabuleiro.venceuAMao', { nome: nomeVencedorDaMao }) }}
        </span>
      </div>
    </transition>

    <transition-group name="oponente-transicao" tag="div" class="oponentes-linha my-2">
      <div v-for="j in outrosJogadores" :key="j.seat" class="ma-1 oponente-item">
        <PlayerSeat
          :jogador="j"
          :dealer="j.seat === gameState.dealerSeat"
          :destacado="j.seat === gameState.turnoSeat"
          :carta-revelada="gameState.rodadaCega && j.hand ? j.hand[0] : null"
          :manilha="gameState.manilha"
          :compacto="outrosJogadores.length > 3"
        />
      </div>
    </transition-group>

    <v-alert
      v-if="gameState.rodadaCega && (gameState.fase === 'palpite' || gameState.fase === 'jogando')"
      dense
      text
      type="info"
      class="mx-auto mb-2"
      max-width="420"
    >
      {{ $t('tabuleiro.avisoCegas') }}
    </v-alert>
    </div>

    <!-- ZONA MESA: ocupa toda a folga vertical que sobrar e centraliza as
         cartas jogadas no eixo central da tela. O vira/força das cartas é um
         apoio, não o assunto principal: em telas médias pra cima ele vira uma
         coluna lateral ancorada fora do fluxo, e o recuo simétrico da mesa
         garante que o centro da área de vazas continue sendo o centro real da
         tela (antes os dois eram centralizados juntos, como um par, e a mesa
         acabava deslocada pra direita). -->
    <div class="zona-mesa mesa-area">
      <div class="mesa-apoio text-center">
        <div v-if="gameState.vira" class="mesa-apoio-vira">
          <p class="white--text caption mb-1">{{ $t('tabuleiro.vira') }}</p>
          <Carta :carta="gameState.vira" />
        </div>
        <v-chip
          color="secondary"
          text-color="#212121"
          class="font-weight-bold mt-2 chip-forca"
          @click="mostrarTabelaForca = true"
        >
          <v-icon left small color="#212121">mdi-cards</v-icon>
          <span v-if="gameState.manilha">{{ $t('tabuleiro.manilha', { rank: gameState.manilha }) }}</span>
          <span v-else>{{ $t('tabuleiro.forcaDasCartas') }}</span>
        </v-chip>
        <p class="white--text caption mb-0 mt-1 dica-forca d-none d-sm-block">
          {{ $t('tabuleiro.dicaForca') }}
        </p>
      </div>

      <div class="mesa-centro">
        <TrickArea
          :mesa-atual="gameState.mesaAtual"
          :jogadores="gameState.jogadores"
          :manilha="gameState.manilha"
        />
      </div>
    </div>

    <!-- ZONA JOGADOR: tudo que é "seu" fica agrupado embaixo, na mesma ordem
         de leitura — quem você é, o que precisa fazer agora, e a sua mão. -->
    <div class="zona-jogador">
    <div v-if="meuJogador" class="mb-2 meu-jogador-linha">
      <!-- Fora do fluxo, ancorado à esquerda do eixo central: assim o card do
           jogador fica de fato no meio da tela, e o botão de estratégia
           acompanha ao lado em vez de empurrá-lo pro lado. -->
      <v-menu offset-y top>
        <template #activator="{ on, attrs }">
          <v-btn
            fab
            small
            color="secondary"
            class="btn-estrategia"
            :aria-label="$t('tabuleiro.estrategia.rotulo')"
            v-bind="attrs"
            v-on="on"
          >
            <v-icon color="#212121">{{ iconeEstrategiaAtual }}</v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-subheader>{{ $t('tabuleiro.estrategia.cabecalho') }}</v-subheader>
          <v-list-item
            v-for="opcao in opcoesEstrategia"
            :key="opcao.valor"
            @click="mudarEstrategia(opcao.valor)"
          >
            <v-list-item-icon class="mr-2">
              <v-icon small>{{ opcao.icone }}</v-icon>
            </v-list-item-icon>
            <v-list-item-title>{{ opcao.label }}</v-list-item-title>
            <v-list-item-icon v-if="gameState.meuAutoPlayStrategy === opcao.valor" class="ml-2">
              <v-icon small color="primary">mdi-check</v-icon>
            </v-list-item-icon>
          </v-list-item>
          <v-divider class="my-1" />
          <p class="caption grey--text px-4 pt-1 pb-2 mb-0 aviso-palpite-auto">
            {{ $t('tabuleiro.estrategia.aviso') }}
          </p>
        </v-list>
      </v-menu>

      <PlayerSeat
        :jogador="meuJogador"
        :dealer="meuJogador.seat === gameState.dealerSeat"
        :destacado="meuJogador.seat === gameState.turnoSeat"
        sou-eu
      />
    </div>

    <div class="text-center mb-2 area-status">
      <template v-if="gameState.fase === 'aguardando_distribuir'">
        <p class="white--text">
          {{ gameState.rodadaNumero > 0 ? $t('tabuleiro.preparandoRodada') : $t('tabuleiro.preparandoPartida') }}
        </p>
      </template>

      <template v-else-if="gameState.fase === 'palpite'">
        <BidSelector
          v-if="ehMinhaVez"
          :tamanho-mao="gameState.tamanhoMao"
          :jogadores="gameState.jogadores"
          :meu-seat="gameState.meuAssento"
          @erro="mostrarErro"
        />
        <p v-else class="white--text">
          {{ $t('tabuleiro.aguardandoPalpite', { nome: nomeDaVez }) }}
        </p>
      </template>

      <template v-else-if="gameState.fase === 'jogando'">
        <p v-if="gameState.turnoSeat === null" class="white--text">
          {{ $t('tabuleiro.resolvendoVaza') }}
        </p>
        <p v-else-if="!ehMinhaVez" class="white--text">
          {{ $t('tabuleiro.vezDeJogar', { nome: nomeDaVez }) }}
        </p>
        <p v-else class="white--text font-weight-bold">{{ $t('tabuleiro.suaVezEscolha') }}</p>
      </template>

      <div v-if="segundosRestantes !== null" class="contador-turno mx-auto mt-1">
        <v-progress-linear
          :value="progressoTurno"
          height="6"
          rounded
          :color="corContadorTurno"
        />
        <span class="caption white--text">
          {{ $t('tabuleiro.segundos', { n: segundosRestantes })
          }}<span class="d-none d-sm-inline">{{ $t('tabuleiro.paraJogadaAutomatica') }}</span>
        </span>
      </div>
    </div>

    <div v-if="mostrarMaoOculta" class="d-flex justify-center flex-wrap mao-container">
      <div :class="['mx-1', { 'carta-jogavel': podeJogar }]" @click="jogarAsCegas">
        <Carta virada />
      </div>
    </div>
    <template v-else-if="minhaMao.length">
      <div v-if="minhaMao.length > 1" class="d-flex justify-center mb-1">
        <v-btn text x-small color="white" class="btn-ordenar" @click="ordenarMao">
          <v-icon left small>{{ ordemCrescente ? 'mdi-sort-ascending' : 'mdi-sort-descending' }}</v-icon>
          {{ $t('tabuleiro.ordenarCartas') }}
        </v-btn>
      </div>
      <transition-group name="carta-mao-transicao" tag="div" class="d-flex mao-container mao-scroll">
        <div
          v-for="carta in minhaMaoExibida"
          :key="cartaId(carta)"
          :class="['mx-1', 'carta-mao-item', { 'carta-jogavel': podeJogar, 'carta-arrastando': arrastando === cartaId(carta) }]"
          @pointerdown="aoPressionarCarta($event, carta)"
          @pointermove="aoMoverPonteiro($event)"
          @pointerup="aoSoltarPonteiro($event)"
          @pointercancel="aoSoltarPonteiro($event)"
          @click="jogar(carta)"
        >
          <Carta
            :carta="carta"
            :manilha="carta.rank === gameState.manilha"
            :rotacao="rotacaoParaCarta(carta)"
          />
        </div>
      </transition-group>
    </template>
    </div>

    <ResultadoRodadaDialog v-model="mostrarResultado" :resultado="gameState.ultimoResultado" />

    <FimDeJogoDialog
      :value="fimDeJogo"
      :vencedor="gameState.vencedor"
      :sou-dono="souDono"
      :nome-dono="nomeDono"
      :reiniciando="reiniciando"
      @jogar-novamente="jogarNovamente"
      @sair="sair"
    />

    <v-snackbar v-model="temErro" color="error" timeout="3000">{{ erro }}</v-snackbar>
  </v-container>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import Carta from './Carta.vue'
import TabelaForcaCartas from './TabelaForcaCartas.vue'
import ResultadoRodadaDialog from './ResultadoRodadaDialog.vue'
import FimDeJogoDialog from './FimDeJogoDialog.vue'
import TutorialDialog from './TutorialDialog.vue'
import PlayerSeat from './PlayerSeat.vue'
import BidSelector from './BidSelector.vue'
import TrickArea from './TrickArea.vue'
import GameToast from './GameToast.vue'
import { RANKS, SUITS } from '../constants/cartas'

// Espelha handlers.js (TEMPO_LIMITE_TURNO_MS_PADRAO): só usado pra desenhar a
// barra de progresso do prazo, o valor de verdade vem do servidor em
// gameState.turnoExpiraEm.
const TEMPO_LIMITE_TURNO_S = 45

// Distância (em px) que o ponteiro precisa se mover antes de decidir se é um
// toque/rolagem (ignora) ou o início de um arraste pra reordenar a mão.
const LIMIAR_ARRASTO_PX = 10
// Quanto tempo parado com o dedo/mouse pressionado até "pegar" a carta.
const ATRASO_ARRASTO_MS = 200

export default {
  name: 'GameBoard',

  components: { Carta, PlayerSeat, BidSelector, TrickArea, GameToast, TabelaForcaCartas, ResultadoRodadaDialog, FimDeJogoDialog, TutorialDialog },

  data: () => ({
    reiniciando: false,
    mostrarResultado: false,
    mostrarTabelaForca: false,
    mostrarTutorialLocal: false,
    erro: '',
    temErro: false,
    rotacoesCache: {},
    agora: Date.now(),
    ordemManual: [],
    ordemCrescente: true,
    arrastando: null,
    arrastarPressTimer: null,
    arrastarOrigem: null,
    arrastarOcorreu: false,
  }),

  computed: {
    ...mapState(['gameState']),
    ...mapGetters(['meuJogador', 'ehMinhaVez', 'souDono']),

    // Computada (e não `data`) pra que os rótulos sejam retraduzidos quando o
    // jogador trocar de idioma no meio da partida.
    opcoesEstrategia () {
      return [
        { valor: 'maior', label: this.$t('tabuleiro.estrategia.maior'), icone: 'mdi-arrow-up-bold' },
        { valor: 'menor', label: this.$t('tabuleiro.estrategia.menor'), icone: 'mdi-arrow-down-bold' },
        { valor: 'aleatoria', label: this.$t('tabuleiro.estrategia.aleatoria'), icone: 'mdi-shuffle-variant' },
      ]
    },

    outrosJogadores () {
      const todos = this.gameState.jogadores
      if (!this.meuJogador) return todos
      const total = todos.length
      const ordenados = []
      for (let i = 1; i < total; i++) {
        const seat = (this.meuJogador.seat + i) % total
        const jogador = todos.find((j) => j.seat === seat)
        if (jogador) ordenados.push(jogador)
      }
      return ordenados
    },

    minhaMao () {
      return (this.meuJogador && this.meuJogador.hand) || []
    },

    // Mão na ordem escolhida pelo jogador (arrastando ou pelo botão "Ordenar"),
    // não a ordem em que o servidor distribuiu as cartas.
    minhaMaoExibida () {
      const porId = new Map(this.minhaMao.map((c) => [this.cartaId(c), c]))
      const emOrdem = this.ordemManual.map((id) => porId.get(id)).filter(Boolean)
      // Se a ordem manual ainda não reflete a mão atual (ex.: primeira
      // renderização antes do watcher rodar), cai pra ordem do servidor.
      return emOrdem.length === this.minhaMao.length ? emOrdem : this.minhaMao
    },

    segundosRestantes () {
      if (!this.gameState.turnoExpiraEm) return null
      return Math.max(0, Math.ceil((this.gameState.turnoExpiraEm - this.agora) / 1000))
    },

    progressoTurno () {
      if (this.segundosRestantes === null) return 0
      return Math.min(100, (this.segundosRestantes / TEMPO_LIMITE_TURNO_S) * 100)
    },

    corContadorTurno () {
      if (this.segundosRestantes === null) return 'white'
      if (this.segundosRestantes <= 10) return 'red'
      if (this.segundosRestantes <= 20) return 'amber'
      return 'white'
    },

    mostrarMaoOculta () {
      return !!(
        this.gameState.rodadaCega &&
        this.meuJogador &&
        this.meuJogador.handCount > 0 &&
        this.minhaMao.length === 0
      )
    },

    podeJogar () {
      return this.gameState.fase === 'jogando' && this.ehMinhaVez
    },

    nomeDaVez () {
      const j = this.gameState.jogadores.find((p) => p.seat === this.gameState.turnoSeat)
      return j ? j.name : ''
    },

    // A pausa entre vazas (mãos): o servidor congela turnoSeat em null e
    // mantém fase 'jogando' por alguns segundos depois de resolver uma vaza,
    // pra dar tempo de ver quem ganhou aquela mão antes de seguir.
    mostrarBannerVencedorDaMao () {
      return !!(
        this.gameState.fase === 'jogando' &&
        this.gameState.turnoSeat === null &&
        this.gameState.ultimaVaza &&
        !this.gameState.ultimaVaza.empate
      )
    },

    nomeVencedorDaMao () {
      if (!this.gameState.ultimaVaza) return ''
      const j = this.gameState.jogadores.find((p) => p.seat === this.gameState.ultimaVaza.vencedorSeat)
      return j ? j.name : ''
    },

    fimDeJogo () {
      return this.gameState.fase === 'fim_de_jogo'
    },

    nomeDono () {
      const j = this.gameState.jogadores.find((p) => p.seat === this.gameState.ownerSeat)
      return j ? j.name : this.$t('comum.donoDaSala')
    },

    iconeEstrategiaAtual () {
      const atual = this.opcoesEstrategia.find((o) => o.valor === this.gameState.meuAutoPlayStrategy)
      return atual ? atual.icone : 'mdi-robot-outline'
    },
  },

  watch: {
    'gameState.fase' (novaFase, faseAntiga) {
      if (novaFase === 'aguardando_distribuir' && this.gameState.ultimoResultado) {
        // A distribuição da próxima rodada é automática agora (poucos
        // segundos depois); se o tutorial ou a tabela de força estiverem
        // abertos nesse momento, fecha os dois antes — dois diálogos do
        // Vuetify abertos ao mesmo tempo brigam pela sobreposição (scrim de
        // um bloqueia clique no outro). Ver o resultado da rodada tem
        // prioridade; o jogador pode reabrir o resto depois.
        this.mostrarTutorialLocal = false
        this.mostrarTabelaForca = false
        this.mostrarResultado = true
      } else if (novaFase === 'palpite' && this.mostrarResultado) {
        // A rodada seguinte já foi distribuída automaticamente antes do
        // jogador fechar o resultado da rodada anterior: fecha sozinho pra
        // não deixar o diálogo antigo bloqueando a rodada nova por baixo.
        this.mostrarResultado = false
      }

      // Único anúncio de fase (os toasts de vez/palpite já cobrem o resto):
      // a virada de "todos palpitaram" pra "hora de jogar" é o marco que
      // vale destacar. Ignora a primeira renderização (faseAntiga undefined).
      if (novaFase === 'jogando' && faseAntiga === 'palpite') {
        this.anunciarToast({ texto: this.$t('tabuleiro.toasts.todosPalpitaram'), icone: 'mdi-cards-playing' })
      }
    },

    // Anuncia de quem é a vez sempre que o turno muda pra um assento válido.
    'gameState.turnoSeat' (novoSeat, seatAntigo) {
      if (novoSeat === null || novoSeat === undefined || novoSeat === seatAntigo) return
      // Mão de 1 carta: o servidor joga a rodada inteira sozinho, trocando de
      // jogador a cada ~700ms sem esperar nenhuma decisão real (ver
      // agendarAutomacoes em handlers.js) — anunciar cada troca só entope a
      // fila de toasts com avisos que já estão desatualizados quando aparecem.
      if (this.gameState.rodadaCega && this.gameState.fase === 'jogando') return
      if (novoSeat === this.gameState.meuAssento) {
        this.anunciarToast({ texto: this.$t('tabuleiro.toasts.suaVez'), icone: 'mdi-account-star', cor: 'amber' })
      } else {
        this.anunciarToast({
          texto: this.$t('tabuleiro.toasts.vezDe', { nome: this.nomeDoSeat(novoSeat) }),
          icone: 'mdi-account-arrow-right',
        })
      }
    },

    // Anuncia palpites: dispara pra cada jogador cujo bid saiu de vazio
    // (null/undefined) pra um número desde a atualização anterior. O servidor
    // manda o estado completo a cada evento, então basta comparar array novo
    // vs. antigo (na primeira renderização, jogadoresAntigos vem undefined).
    'gameState.jogadores' (jogadoresNovos, jogadoresAntigos) {
      if (!jogadoresAntigos) return
      for (const jogador of jogadoresNovos) {
        const antigo = jogadoresAntigos.find((j) => j.seat === jogador.seat)
        const bidAntigo = antigo ? antigo.bid : null
        const bidVazio = bidAntigo === null || bidAntigo === undefined
        const bidNovoValido = jogador.bid !== null && jogador.bid !== undefined
        if (bidVazio && bidNovoValido) {
          const nome = jogador.seat === this.gameState.meuAssento
            ? this.$t('comum.vocêMaiusculo')
            : jogador.name
          this.anunciarToast({
            texto: this.$t('tabuleiro.toasts.palpitou', { nome, valor: jogador.bid }),
            icone: 'mdi-hand-back-right',
          }, 'canto')
        }
      }
    },

    // Nova rodada (nova mão distribuída): a ordem manual antiga não faz mais
    // sentido, começa de novo a partir da ordem em que o servidor mandou.
    'gameState.rodadaNumero' () {
      this.ordemManual = this.minhaMao.map((c) => this.cartaId(c))
    },

    minhaMao (novaMao) {
      const idsNovos = novaMao.map((c) => this.cartaId(c))
      // Mantém a ordem relativa das cartas que sobraram (uma foi jogada);
      // qualquer id novo que não devia estar aqui (só acontece em uma nova
      // rodada, já tratada acima) entra no fim como rede de segurança.
      const mantidos = this.ordemManual.filter((id) => idsNovos.includes(id))
      const novos = idsNovos.filter((id) => !mantidos.includes(id))
      this.ordemManual = [...mantidos, ...novos]
    },
  },

  mounted () {
    this.ordemManual = this.minhaMao.map((c) => this.cartaId(c))
    this.intervaloRelogio = setInterval(() => {
      this.agora = Date.now()
    }, 250)
  },

  beforeDestroy () {
    clearInterval(this.intervaloRelogio)
    clearTimeout(this.arrastarPressTimer)
  },

  methods: {
    cartaId (carta) {
      return `${carta.rank}-${carta.suit}`
    },

    nomeDoSeat (seat) {
      const j = this.gameState.jogadores.find((p) => p.seat === seat)
      return j ? j.name : ''
    },

    // Encaminha pro GameToast certo ('centro', padrão, pra avisos importantes
    // como vez/fim do palpite; 'canto' pra avisos discretos como palpite de
    // alguém). Pode ainda não estar montado em algum caso de corrida durante
    // a montagem inicial.
    anunciarToast (aviso, destino = 'centro') {
      const ref = destino === 'canto' ? this.$refs.toastCanto : this.$refs.toast
      if (ref) ref.anunciar(aviso)
    },

    compararForca (a, b) {
      const manilha = this.gameState.manilha
      const aManilha = a.rank === manilha
      const bManilha = b.rank === manilha
      if (aManilha && bManilha) return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit)
      if (aManilha) return 1
      if (bManilha) return -1
      return RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank)
    },

    ordenarMao () {
      const ordenado = [...this.minhaMao].sort((a, b) => (
        this.ordemCrescente ? this.compararForca(a, b) : this.compararForca(b, a)
      ))
      this.ordemManual = ordenado.map((c) => this.cartaId(c))
      this.ordemCrescente = !this.ordemCrescente
    },

    // Arrastar pra reordenar a mão: um "toque e segure" breve (pra não
    // atrapalhar o gesto de rolar a mão horizontalmente) inicia o modo de
    // arraste; a partir daí, cada "slot" de carta cruzado pelo ponteiro troca
    // a posição da carta arrastada com a vizinha.
    aoPressionarCarta (event, carta) {
      const id = this.cartaId(carta)
      const largura = event.currentTarget.getBoundingClientRect().width + 8
      this.arrastarOrigem = {
        x: event.clientX,
        y: event.clientY,
        cartaId: id,
        larguraSlot: largura,
        pointerId: event.pointerId,
        el: event.currentTarget,
      }
      clearTimeout(this.arrastarPressTimer)
      this.arrastarPressTimer = setTimeout(() => {
        if (!this.arrastarOrigem || this.arrastarOrigem.cartaId !== id) return
        this.arrastando = id
        event.currentTarget.style.touchAction = 'none'
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch (err) {
          // alguns navegadores não suportam pointer capture em todo elemento: segue sem capturar
        }
      }, ATRASO_ARRASTO_MS)
    },

    aoMoverPonteiro (event) {
      if (!this.arrastarOrigem) return
      const dx = event.clientX - this.arrastarOrigem.x
      const dy = event.clientY - this.arrastarOrigem.y

      if (!this.arrastando) {
        // ainda decidindo se é um toque/rolagem (ignora) ou o início do arraste
        if (Math.abs(dx) > LIMIAR_ARRASTO_PX || Math.abs(dy) > LIMIAR_ARRASTO_PX) {
          clearTimeout(this.arrastarPressTimer)
          this.arrastarOrigem = null
        }
        return
      }

      // já em modo de arraste: evita que o navegador tente rolar por baixo
      event.preventDefault()
      const largura = this.arrastarOrigem.larguraSlot
      if (Math.abs(dx) < largura / 2) return

      const passos = Math.trunc(dx / largura)
      if (passos === 0) return

      const ids = this.ordemManual
      const indiceAtual = ids.indexOf(this.arrastando)
      const novoIndice = Math.max(0, Math.min(ids.length - 1, indiceAtual + passos))
      if (novoIndice !== indiceAtual) {
        ids.splice(indiceAtual, 1)
        ids.splice(novoIndice, 0, this.arrastando)
        this.arrastarOcorreu = true
      }
      this.arrastarOrigem.x = event.clientX
      this.arrastarOrigem.y = event.clientY
    },

    aoSoltarPonteiro () {
      clearTimeout(this.arrastarPressTimer)
      if (this.arrastarOrigem && this.arrastarOrigem.el) {
        try {
          this.arrastarOrigem.el.releasePointerCapture(this.arrastarOrigem.pointerId)
        } catch (err) {
          // ignora: elemento pode já ter perdido a captura
        }
        this.arrastarOrigem.el.style.touchAction = ''
      }
      this.arrastando = null
      this.arrastarOrigem = null
    },

    rotacaoParaCarta (carta) {
      const id = this.cartaId(carta)
      if (!this.rotacoesCache[id]) {
        const graus = (Math.random() * 8 - 4).toFixed(1)
        this.$set(this.rotacoesCache, id, `transform: rotate(${graus}deg)`)
      }
      return this.rotacoesCache[id]
    },

    async jogar (carta) {
      // Um arraste pra reordenar a mão termina com um pointerup que também
      // dispara o click nativo do navegador em seguida — sem essa checagem,
      // soltar a carta depois de só reordenar acabaria jogando ela.
      if (this.arrastarOcorreu) {
        this.arrastarOcorreu = false
        return
      }
      if (!this.podeJogar) return
      try {
        await this.$store.dispatch('jogarCarta', this.cartaId(carta))
      } catch (err) {
        this.mostrarErro(err.message)
      }
    },

    async mudarEstrategia (valor) {
      try {
        await this.$store.dispatch('atualizarEstrategiaAutomatica', valor)
      } catch (err) {
        this.mostrarErro(err.message)
      }
    },

    async jogarAsCegas () {
      if (!this.podeJogar) return
      try {
        await this.$store.dispatch('jogarCarta', null)
      } catch (err) {
        this.mostrarErro(err.message)
      }
    },

    async jogarNovamente () {
      this.reiniciando = true
      try {
        await this.$store.dispatch('iniciarPartida')
      } catch (err) {
        this.mostrarErro(err.message)
      } finally {
        this.reiniciando = false
      }
    },

    mostrarErro (msg) {
      this.erro = msg
      this.temErro = true
    },

    sair () {
      this.$store.dispatch('sairDaSala')
      this.$router.push({ name: 'Home' })
    },
  },
}
</script>

<style scoped>
.board {
  min-height: 100vh;
  min-height: 100dvh;
  padding-top: calc(8px + env(safe-area-inset-top)) !important;
  /* O Vuetify aplica `flex-wrap: wrap` e `align-items: center` em todo
     `.container.fill-height` (pensado pra layout em linha) — aqui o layout é
     em coluna (flex-direction: column), e as duas regras conflitam com isso:
     `wrap` faz o conteúdo que não cabe na altura "quebrar" pra uma segunda
     coluna inteira fora da tela (em vez de só crescer pra baixo), e
     `align-items: center` (em vez do `stretch` padrão) permite que uma linha
     larga — como a mão de cartas, com `overflow-x: auto` — cresça além da
     largura da tela e fique centralizada, com metade sumindo pra fora dos
     dois lados, ao invés de ficar presa na largura da tela e rolar por
     dentro. Sem essas duas correções a mão de cartas podia sumir cortada. */
  flex-wrap: nowrap !important;
  align-items: stretch !important;
}

/* As três zonas do tabuleiro. O topo e a base ocupam só o que precisam; toda
   a folga vertical que sobra vai pra mesa, que centraliza as cartas jogadas
   entre os adversários (em cima) e a sua mão (embaixo). */
.zona-topo,
.zona-jogador {
  flex: 0 0 auto;
  width: 100%;
}

.zona-mesa {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
}

.barra-superior {
  line-height: 1.2;
}

/* Os dois "lados" têm a mesma largura flexível, então o título fica de fato
   centralizado independentemente da largura do botão (ícone no mobile, ícone
   + texto em telas maiores). */
.barra-superior-lado {
  flex: 1 1 0;
  min-width: 0;
}

.barra-superior-titulo {
  flex: 0 1 auto;
}

.rodada-titulo {
  line-height: 1.25;
}

.rodada-subtitulo {
  margin-top: 2px;
  opacity: 0.85;
}

.chip-forca {
  cursor: pointer;
}

.dica-forca {
  opacity: 0.75;
}

.btn-tutorial {
  min-height: 36px;
}

/* Eixo central: o card do jogador é o único item do fluxo, então ele fica
   exatamente no meio da tela. O botão de estratégia é ancorado a partir do
   próprio centro (50% + meia largura do card), de forma que ele acompanha o
   card em qualquer largura de tela sem nunca deslocá-lo. */
.meu-jogador-linha {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.btn-estrategia {
  position: absolute;
  right: calc(50% + 74px);
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
}

/* Reserva vertical pra área de status/palpite: sem isso a troca de fase
   (texto curto -> botões de palpite) empurra a mesa e a mão pra cima e pra
   baixo a cada rodada. */
.area-status {
  min-height: 72px;
}

.mesa-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  /* A mesa é uma faixa centralizada em vez de ocupar a largura toda do
     monitor. Como a coluna do vira/manilha é ancorada na borda desta faixa
     (e não na da tela), num monitor largo ela acompanha as cartas em vez de
     ficar isolada lá no canto. O centro da faixa continua sendo o centro real
     da tela, então o eixo central não se mexe. */
  max-width: 960px;
  margin-left: auto;
  margin-right: auto;
}

.mesa-centro {
  display: flex;
  justify-content: center;
  width: 100%;
}

/* Em telas estreitas o apoio volta pro fluxo, mas deitado (vira ao lado do
   atalho de força das cartas) — na vertical ele comeria a altura que a mesa e
   a mão precisam. O chip fica alinhado à base da carta, não centralizado
   nela, pra linha ficar assentada. */
.mesa-apoio {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 10px;
}

.mesa-apoio-vira {
  flex: 0 0 auto;
}

.mesa-apoio .chip-forca {
  margin-top: 0 !important;
}

@media (min-width: 600px) {
  .mesa-area {
    flex-direction: row;
    /* Recuo simétrico: abre espaço pra coluna lateral do vira à esquerda sem
       tirar a área de vazas do centro real da tela. */
    padding: 0 156px;
  }

  .mesa-apoio {
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 140px;
    /* De volta ao empilhamento vertical: como coluna lateral fora do fluxo,
       a altura extra não disputa espaço com a mesa. */
    flex-direction: column;
    align-items: center;
  }

  .mesa-apoio .chip-forca {
    margin-top: 8px !important;
  }
}

.aviso-palpite-auto {
  max-width: 230px;
  line-height: 1.3;
}

.oponentes-linha {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.oponente-item {
  transition: transform .3s ease;
}

.oponente-transicao-enter-active,
.oponente-transicao-leave-active {
  transition: opacity .25s ease, transform .25s ease;
}

.oponente-transicao-enter,
.oponente-transicao-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

@media (max-width: 599px) {
  .oponentes-linha {
    flex-wrap: nowrap;
    overflow-x: auto;
    /* "safe center": centraliza quando os assentos cabem inteiros na tela;
       se não couberem, cai para o alinhamento normal (senão o `center` puro
       esconde os primeiros assentos atrás da borda). Mesmo padrão do
       .mao-scroll acima. */
    justify-content: center;
    justify-content: safe center;
    /* overflow-x: auto sem overflow-y definido faz o navegador tratar
       overflow-y como auto também (não "visible"), cortando a etiqueta
       ("embaralha"/"vez", top: -10px) e o realce do assento da vez
       (transform: scale) que ultrapassam o topo do card. */
    padding: 14px 4px 4px;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .oponentes-linha::-webkit-scrollbar {
    display: none;
  }

  .oponente-item {
    flex: 0 0 auto;
  }
}

.mao-container {
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

.mao-scroll {
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
  flex-wrap: nowrap;
  /* "safe center": centraliza quando a mão cabe inteira na tela (sem barra de
     rolagem); se não couber, cai para o alinhamento normal (senão o
     `center` puro esconde as primeiras cartas atrás da borda, exigindo
     rolar "pra trás" pra vê-las). A declaração simples antes serve de
     fallback pra navegadores sem suporte a `safe center`. */
  justify-content: center;
  justify-content: safe center;
  /* As cartas da mão giram um pouco (rotacaoParaCarta) e têm sombra
     (elevation); sem essa folga, o overflow (necessário pro scroll
     horizontal) corta a ponta/sombra das cartas nas bordas, no topo e
     embaixo. A folga de baixo precisa ser declarada aqui junto das outras:
     como este bloco vem depois de `.mao-container`, o shorthand `padding`
     zerava o `padding-bottom` de lá e o giro deixava o canto inferior das
     cartas cortado. */
  padding: 14px 16px calc(18px + env(safe-area-inset-bottom));
  /* Esconde a barra de rolagem nativa (feia) sem desativar o gesto de
     arrastar/rolar por toque ou mouse. */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.mao-scroll::-webkit-scrollbar {
  display: none;
}

.carta-mao-item {
  flex: 0 0 auto;
  scroll-snap-align: center;
  /* Anima tanto o reordenar por arraste/botão (FLIP do transition-group)
     quanto o "pegar" a carta ao segurar pra arrastar. */
  transition: transform .3s cubic-bezier(.34, 1.56, .64, 1);
}

.carta-jogavel {
  cursor: pointer;
}

.carta-arrastando {
  z-index: 10;
  opacity: 0.85;
  transform: scale(1.08);
  transition: transform .15s ease, opacity .15s ease;
}

/* Carta jogada "voa" pra fora da mão; carta nova entra subindo de baixo
   (distribuição). */
.carta-mao-transicao-enter-active {
  transition: opacity .25s ease, transform .25s ease;
}

.carta-mao-transicao-leave-active {
  transition: opacity .2s ease, transform .2s ease;
  position: absolute;
}

.carta-mao-transicao-enter {
  opacity: 0;
  transform: translateY(24px) scale(0.9);
}

.carta-mao-transicao-leave-to {
  opacity: 0;
  transform: translateY(-60px) scale(0.85);
}

.btn-ordenar {
  opacity: 0.85;
}

.contador-turno {
  max-width: 260px;
}

.banner-vencedor {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 28px;
  border-radius: 999px;
  background: linear-gradient(90deg, #ffd600, #ffab00);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
  width: fit-content;
}

.banner-vencedor-texto {
  font-size: 1.3rem;
  font-weight: 900;
  color: #212121;
  letter-spacing: 0.3px;
}

.banner-vencedor-transicao-enter-active {
  transition: opacity .3s ease, transform .35s cubic-bezier(.34, 1.56, .64, 1);
}

.banner-vencedor-transicao-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}

.banner-vencedor-transicao-enter,
.banner-vencedor-transicao-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
