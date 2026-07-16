<template>
  <v-container fluid class="fill-height board pa-2 d-flex flex-column">
    <div class="d-flex justify-space-between align-center white--text px-2">
      <span class="font-weight-bold">Rodada {{ gameState.rodadaNumero }}</span>
      <span v-if="gameState.tamanhoMao" class="caption">{{ gameState.tamanhoMao }} carta(s) na mão</span>
      <span v-if="gameState.ultimoResultado && gameState.ultimoResultado.vencedorDaRodada" class="font-weight-bold" style="color: #ffd600;">
        ✓ {{ gameState.ultimoResultado.vencedorDaRodada.name }} venceu!
      </span>
    </div>

    <div class="d-flex justify-center flex-wrap my-2">
      <div v-for="j in outrosJogadores" :key="j.seat" class="ma-1">
        <PlayerSeat
          :jogador="j"
          :dealer="j.seat === gameState.dealerSeat"
          :destacado="j.seat === gameState.turnoSeat"
          :carta-revelada="gameState.rodadaCega && j.hand ? j.hand[0] : null"
          :manilha="gameState.manilha"
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

    <div class="d-flex justify-center align-center flex-grow-1 flex-wrap">
      <div v-if="gameState.vira" class="text-center mr-6 mb-2">
        <p class="white--text caption mb-1">Vira</p>
        <Carta :carta="gameState.vira" />
        <p class="white--text caption mt-1">Manilha: {{ gameState.manilha }}</p>
      </div>
      <TrickArea
        :mesa-atual="gameState.mesaAtual"
        :jogadores="gameState.jogadores"
        :manilha="gameState.manilha"
      />
    </div>

    <div v-if="meuJogador" class="text-center mb-2">
      <PlayerSeat
        :jogador="meuJogador"
        :dealer="meuJogador.seat === gameState.dealerSeat"
        :destacado="meuJogador.seat === gameState.turnoSeat"
        sou-eu
        class="mx-auto d-inline-block"
      />
    </div>

    <div class="text-center mb-2">
      <template v-if="gameState.fase === 'aguardando_distribuir'">
        <v-btn v-if="souDealer" color="success" :loading="distribuindo" @click="distribuir">
          Começar
        </v-btn>
        <p v-else class="white--text">Aguardando {{ nomeDealer }} distribuir as cartas...</p>
      </template>

      <template v-else-if="gameState.fase === 'palpite'">
        <BidSelector v-if="ehMinhaVez" :tamanho-mao="gameState.tamanhoMao" @erro="mostrarErro" />
        <p v-else class="white--text">Aguardando palpite de {{ nomeDaVez }}...</p>
      </template>

      <template v-else-if="gameState.fase === 'jogando'">
        <p v-if="gameState.turnoSeat === null" class="white--text">Resolvendo a vaza...</p>
        <p v-else-if="!ehMinhaVez" class="white--text">Vez de {{ nomeDaVez }} jogar...</p>
        <p v-else class="white--text font-weight-bold">Sua vez! Escolha uma carta.</p>
      </template>
    </div>

    <div v-if="mostrarMaoOculta" class="d-flex justify-center flex-wrap pb-4">
      <div :class="['mx-1', { 'carta-jogavel': podeJogar }]" @click="jogarAsCegas">
        <Carta virada />
      </div>
    </div>
    <div v-else-if="minhaMao.length" class="d-flex justify-center flex-wrap pb-4">
      <div
        v-for="carta in minhaMao"
        :key="cartaId(carta)"
        :class="['mx-1', { 'carta-jogavel': podeJogar }]"
        @click="jogar(carta)"
      >
        <Carta
          :carta="carta"
          :manilha="carta.rank === gameState.manilha"
          :rotacao="rotacaoParaCarta(carta)"
        />
      </div>
    </div>

    <v-dialog v-model="mostrarResultado" max-width="420">
      <v-card v-if="gameState.ultimoResultado">
        <v-card-title>Resultado da rodada {{ gameState.ultimoResultado.rodada }}</v-card-title>
        <v-card-text>
          <v-simple-table dense>
            <template #default>
              <thead>
                <tr>
                  <th>Jogador</th>
                  <th>Palpite</th>
                  <th>Fez</th>
                  <th>Perdeu</th>
                  <th>Vidas</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in gameState.ultimoResultado.jogadores" :key="r.seat">
                  <td>{{ r.name }}</td>
                  <td>{{ r.bid }}</td>
                  <td>{{ r.made }}</td>
                  <td>{{ r.delta }}</td>
                  <td>{{ r.lives }}</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="mostrarResultado = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog :value="fimDeJogo" max-width="400" persistent>
      <v-card class="text-center pa-4">
        <v-card-title class="justify-center">Fim de jogo!</v-card-title>
        <v-card-text v-if="gameState.vencedor">
          <strong>{{ gameState.vencedor.name }}</strong> venceu a partida!
        </v-card-text>
        <v-card-actions class="d-flex flex-column">
          <v-btn v-if="souDono" block color="success" :loading="reiniciando" @click="jogarNovamente">
            Jogar novamente
          </v-btn>
          <p v-else class="caption mt-2">Aguardando {{ nomeDono }} decidir se joga de novo...</p>
          <v-btn text class="mt-2" @click="sair">Sair</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="temErro" color="error" timeout="3000">{{ erro }}</v-snackbar>
  </v-container>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import Carta from './Carta.vue'
import PlayerSeat from './PlayerSeat.vue'
import BidSelector from './BidSelector.vue'
import TrickArea from './TrickArea.vue'

export default {
  name: 'GameBoard',

  components: { Carta, PlayerSeat, BidSelector, TrickArea },

  data: () => ({
    distribuindo: false,
    reiniciando: false,
    mostrarResultado: false,
    erro: '',
    temErro: false,
    rotacoesCache: {},
  }),

  computed: {
    ...mapState(['gameState']),
    ...mapGetters(['meuJogador', 'souDealer', 'ehMinhaVez', 'souDono']),

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

    nomeDealer () {
      const j = this.gameState.jogadores.find((p) => p.seat === this.gameState.dealerSeat)
      return j ? j.name : ''
    },

    nomeDaVez () {
      const j = this.gameState.jogadores.find((p) => p.seat === this.gameState.turnoSeat)
      return j ? j.name : ''
    },

    fimDeJogo () {
      return this.gameState.fase === 'fim_de_jogo'
    },

    nomeDono () {
      const j = this.gameState.jogadores.find((p) => p.seat === this.gameState.ownerSeat)
      return j ? j.name : 'o dono da sala'
    },
  },

  watch: {
    'gameState.fase' (novaFase) {
      if (novaFase === 'aguardando_distribuir' && this.gameState.ultimoResultado) {
        this.mostrarResultado = true
      }
    },
  },

  methods: {
    cartaId (carta) {
      return `${carta.rank}-${carta.suit}`
    },

    rotacaoParaCarta (carta) {
      const id = this.cartaId(carta)
      if (!this.rotacoesCache[id]) {
        const graus = (Math.random() * 8 - 4).toFixed(1)
        this.$set(this.rotacoesCache, id, `transform: rotate(${graus}deg)`)
      }
      return this.rotacoesCache[id]
    },

    async distribuir () {
      this.distribuindo = true
      try {
        await this.$store.dispatch('distribuirCartas')
      } catch (err) {
        this.mostrarErro(err.message)
      } finally {
        this.distribuindo = false
      }
    },

    async jogar (carta) {
      if (!this.podeJogar) return
      try {
        await this.$store.dispatch('jogarCarta', this.cartaId(carta))
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
}

.carta-jogavel {
  cursor: pointer;
}
</style>
