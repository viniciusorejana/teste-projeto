<template>
  <v-container fluid class="fill-height board pa-2 d-flex flex-column">
    <div class="text-center white--text barra-superior">
      <div class="text-h6 font-weight-bold rodada-titulo">Rodada {{ gameState.rodadaNumero }}</div>
      <div v-if="gameState.tamanhoMao" class="caption white--text text--lighten-2 rodada-subtitulo">
        {{ gameState.tamanhoMao }} carta(s) na mão
      </div>
    </div>

    <div class="d-flex justify-start px-2">
      <v-btn
        text
        small
        color="white"
        class="btn-tutorial"
        aria-label="Como jogar"
        @click="mostrarTutorialLocal = true"
      >
        <v-icon left small>mdi-help-circle-outline</v-icon>
        Como jogar?
      </v-btn>
    </div>

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
        <span class="banner-vencedor-texto">{{ nomeVencedorDaMao }} venceu a mão!</span>
      </div>
    </transition>

    <div class="oponentes-linha my-2">
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
    </div>

    <v-alert
      v-if="gameState.rodadaCega && (gameState.fase === 'palpite' || gameState.fase === 'jogando')"
      dense
      text
      type="info"
      class="mx-auto mb-2"
      max-width="420"
    >
      Rodada às cegas: você não vê sua própria carta, só as dos outros. Palpite (e jogue) no escuro!
    </v-alert>

    <div class="d-flex justify-center align-center flex-grow-1 flex-wrap mesa-area">
      <div class="text-center mr-6 mb-2">
        <template v-if="gameState.vira">
          <p class="white--text caption mb-1">Vira</p>
          <Carta :carta="gameState.vira" />
        </template>
        <v-chip
          color="secondary"
          text-color="#212121"
          class="font-weight-bold mt-2 chip-forca"
          @click="mostrarTabelaForca = true"
        >
          <v-icon left small color="#212121">mdi-cards</v-icon>
          <span v-if="gameState.manilha">Manilha: {{ gameState.manilha }}</span>
          <span v-else>Força das cartas</span>
        </v-chip>
        <p class="white--text caption mb-0 mt-1 dica-forca">
          toque para ver a força das cartas
        </p>
      </div>
      <TrickArea
        :mesa-atual="gameState.mesaAtual"
        :jogadores="gameState.jogadores"
        :manilha="gameState.manilha"
      />
    </div>

    <div v-if="meuJogador" class="d-flex justify-center align-center mb-2 meu-jogador-linha">
      <v-menu offset-y top>
        <template #activator="{ on, attrs }">
          <v-btn
            fab
            small
            color="secondary"
            class="btn-estrategia"
            aria-label="Jogada automática se o tempo esgotar"
            v-bind="attrs"
            v-on="on"
          >
            <v-icon color="#212121">{{ iconeEstrategiaAtual }}</v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-subheader>Se o tempo esgotar, jogar...</v-subheader>
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
            No palpite, se o tempo esgotar a escolha é sempre um valor
            aleatório válido — essa preferência vale só pra qual carta jogar.
          </p>
        </v-list>
      </v-menu>

      <PlayerSeat
        :jogador="meuJogador"
        :dealer="meuJogador.seat === gameState.dealerSeat"
        :destacado="meuJogador.seat === gameState.turnoSeat"
        sou-eu
        class="mx-2"
      />
    </div>

    <div class="text-center mb-2">
      <template v-if="gameState.fase === 'aguardando_distribuir'">
        <p class="white--text">
          {{ gameState.rodadaNumero > 0 ? 'Preparando a próxima rodada...' : 'Preparando a partida...' }}
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
        <p v-else class="white--text">Aguardando palpite de {{ nomeDaVez }}...</p>
      </template>

      <template v-else-if="gameState.fase === 'jogando'">
        <p v-if="gameState.turnoSeat === null" class="white--text">Resolvendo a vaza...</p>
        <p v-else-if="!ehMinhaVez" class="white--text">Vez de {{ nomeDaVez }} jogar...</p>
        <p v-else class="white--text font-weight-bold">Sua vez! Escolha uma carta.</p>
      </template>

      <div v-if="segundosRestantes !== null" class="contador-turno mx-auto mt-1">
        <v-progress-linear
          :value="progressoTurno"
          height="6"
          rounded
          :color="corContadorTurno"
        />
        <span class="caption white--text">{{ segundosRestantes }}s para a jogada automática</span>
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
          Ordenar cartas
        </v-btn>
      </div>
      <div class="d-flex mao-container mao-scroll">
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
      </div>
    </template>

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

  components: { Carta, PlayerSeat, BidSelector, TrickArea, TabelaForcaCartas, ResultadoRodadaDialog, FimDeJogoDialog, TutorialDialog },

  data: () => ({
    reiniciando: false,
    mostrarResultado: false,
    mostrarTabelaForca: false,
    mostrarTutorialLocal: false,
    erro: '',
    temErro: false,
    rotacoesCache: {},
    agora: Date.now(),
    opcoesEstrategia: [
      { valor: 'maior', label: 'a maior carta', icone: 'mdi-arrow-up-bold' },
      { valor: 'menor', label: 'a menor carta', icone: 'mdi-arrow-down-bold' },
      { valor: 'aleatoria', label: 'uma carta aleatória', icone: 'mdi-shuffle-variant' },
    ],
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
      return j ? j.name : 'o dono da sala'
    },

    iconeEstrategiaAtual () {
      const atual = this.opcoesEstrategia.find((o) => o.valor === this.gameState.meuAutoPlayStrategy)
      return atual ? atual.icone : 'mdi-robot-outline'
    },
  },

  watch: {
    'gameState.fase' (novaFase) {
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

.barra-superior {
  line-height: 1.2;
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

.meu-jogador-linha {
  position: relative;
}

.btn-estrategia {
  position: relative;
  z-index: 2;
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
     horizontal) corta a ponta/sombra das cartas nas bordas e no topo. */
  padding: 14px 16px 0;
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
}

.carta-jogavel {
  cursor: pointer;
}

.carta-arrastando {
  z-index: 10;
  opacity: 0.85;
  transform: scale(1.08);
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

.banner-vencedor-transicao-enter-active,
.banner-vencedor-transicao-leave-active {
  transition: opacity .25s ease, transform .25s ease;
}

.banner-vencedor-transicao-enter,
.banner-vencedor-transicao-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
</style>
