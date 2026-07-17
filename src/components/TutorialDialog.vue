<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="$vuetify.breakpoint.xsOnly"
    :max-width="$vuetify.breakpoint.xsOnly ? undefined : 560"
    :transition="$vuetify.breakpoint.xsOnly ? 'dialog-bottom-transition' : 'dialog-transition'"
    scrollable
  >
    <v-card class="tutorial-card d-flex flex-column white">
      <div class="tutorial-header d-flex align-center justify-space-between px-4 py-3">
        <h2 class="text-h6 font-weight-bold black--text mb-0">
          Como jogar Fodinha
        </h2>
        <v-btn icon aria-label="Fechar tutorial" @click="fechar">
          <v-icon color="black">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-divider />

      <v-card-text class="tutorial-body flex-grow-1 pa-0">
        <v-window v-model="passo" class="fill-height">
          <!-- 1. Objetivo e vidas -->
          <v-window-item :value="0">
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold black--text mb-3">
                🎯 Objetivo do jogo
              </h3>
              <p class="black--text">
                Fodinha é um jogo de apostas: em cada rodada você "palpita"
                quantas vazas (mãos) vai vencer e depois tenta acertar na
                prática.
              </p>
              <p class="black--text">
                Todo mundo começa com <strong>5 vidas</strong> (❤️❤️❤️❤️❤️).
                Errar o palpite custa vidas. Quem perde todas as vidas é
                eliminado.
              </p>
              <p class="black--text mb-0">
                O último jogador que sobrar com vida é o campeão!
              </p>
            </div>
          </v-window-item>

          <!-- 2. Como funciona a rodada -->
          <v-window-item :value="1">
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold black--text mb-3">
                🃏 Como funciona a rodada
              </h3>
              <p class="black--text">
                A cada rodada, o número de cartas que você recebe na mão muda:
                ele vai <strong>aumentando</strong> rodada após rodada e depois
                <strong>diminuindo</strong>, até acabar o baralho de 52
                cartas.
              </p>
              <p class="black--text">
                No início de cada rodada, uma carta é virada na mesa: o
                <strong>"vira"</strong>. Ele define qual carta manda naquela
                rodada (falamos disso no próximo passo).
              </p>
              <p class="black--text mb-0">
                Cada carta jogada por você forma uma "vaza" com as cartas dos
                outros jogadores — quem jogar a carta mais forte, vence a
                vaza.
              </p>
            </div>
          </v-window-item>

          <!-- 3. Palpite e fecha a conta -->
          <v-window-item :value="2">
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold black--text mb-3">
                🤔 O palpite
              </h3>
              <p class="black--text">
                Antes de jogar, cada jogador dá um <strong>palpite</strong>:
                quantas vazas acha que vai ganhar naquela rodada.
              </p>
              <p class="black--text">
                Tem uma pegadinha chamada <strong>"fecha a conta"</strong>: o
                último jogador a palpitar não pode dar um número que faça a
                soma de todos os palpites bater exatamente com o total de
                cartas da rodada.
              </p>
              <p class="black--text mb-0">
                Ou seja: sempre sobra alguém que vai errar de propósito (ou
                sem querer) — é isso que deixa o jogo tenso!
              </p>
              <p class="black--text mt-3 mb-0">
                <strong>Exceção:</strong> na mão de <strong>1 carta</strong>
                (a rodada às cegas) essa regra não vale — todo mundo pode
                palpitar livremente, mesmo que a soma feche certinha, e é
                possível todo mundo acertar o palpite ao mesmo tempo.
              </p>
            </div>
          </v-window-item>

          <!-- 4. Força das cartas -->
          <v-window-item :value="3">
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold black--text mb-3">
                💪 Força das cartas
              </h3>
              <p class="black--text mb-4">
                Da mais fraca para a mais forte, a ordem das cartas é sempre a
                mesma:
              </p>
              <div class="mini-carta-row">
                <div
                  v-for="(c, i) in sequenciaRanks"
                  :key="i"
                  class="mini-carta-wrap"
                >
                  <div class="mini-carta">
                    <span class="mini-carta-rank black--text">{{ c }}</span>
                  </div>
                </div>
              </div>
              <p class="black--text mt-4 mb-0">
                Repare que o <strong>3 é a carta mais forte</strong> do jogo e
                o <strong>4 é a mais fraca</strong> — o baralho é "sujo",
                fora da ordem que a gente costuma pensar.
              </p>
            </div>
          </v-window-item>

          <!-- 5. Manilha -->
          <v-window-item :value="4">
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold black--text mb-3">
                ⭐ A manilha
              </h3>
              <p class="black--text">
                A manilha é definida pelo "vira": ela é sempre o
                <strong>próximo rank depois do vira</strong> na sequência de
                força (se o vira for o 3, a manilha volta pro 4).
              </p>
              <div class="d-flex align-center justify-center my-3 flex-wrap">
                <div class="mini-carta">
                  <span class="mini-carta-rank black--text">7</span>
                </div>
                <v-icon class="mx-2" color="black">mdi-arrow-right</v-icon>
                <div class="mini-carta mini-carta-manilha">
                  <span class="mini-carta-rank black--text">8</span>
                </div>
              </div>
              <p class="black--text text-center mb-4">
                Exemplo: vira <strong>7</strong> → manilha é <strong>8</strong>.
                Cartas de rank manilha ganham de qualquer outra carta, até do 3!
              </p>
              <p class="black--text mb-2">
                Quando duas manilhas se encontram, desempata pelo naipe, do
                mais fraco pro mais forte:
              </p>
              <div class="mini-carta-row justify-center">
                <div
                  v-for="naipe in naipesOrdenados"
                  :key="naipe.nome"
                  class="mini-carta-wrap"
                >
                  <div class="mini-carta">
                    <span
                      class="mini-carta-naipe"
                      :class="naipe.cor"
                    >{{ naipe.simbolo }}</span>
                  </div>
                  <span class="mini-carta-label black--text">{{ naipe.label }}</span>
                </div>
              </div>
              <p class="black--text mt-3 mb-0 text-center">
                Ouros é a manilha mais forte, paus é a mais fraca.
              </p>
            </div>
          </v-window-item>

          <!-- 6. Empate/anulação -->
          <v-window-item :value="5">
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold black--text mb-3">
                🔄 Empate na mesa
              </h3>
              <p class="black--text">
                Se duas cartas do <strong>mesmo rank</strong> (que não sejam
                manilha) caírem na mesma vaza, elas se anulam em pares: é como
                se as duas nem tivessem sido jogadas.
              </p>
              <p class="black--text">
                A anulação acontece na ordem em que as cartas caíram na mesa,
                sempre formando pares.
              </p>
              <p class="black--text mb-0">
                <strong>Manilhas nunca se anulam</strong> — nem entre si, nem
                com outras cartas.
              </p>
            </div>
          </v-window-item>

          <!-- 7. Rodada às cegas -->
          <v-window-item :value="6">
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold black--text mb-3">
                🙈 Rodada às cegas
              </h3>
              <p class="black--text">
                Quando a rodada tem só <strong>1 carta</strong> na mão, ela
                vira "às cegas": você não vê a sua própria carta, ela fica
                virada pra baixo só pra você.
              </p>
              <p class="black--text mb-0">
                Os outros jogadores enxergam a sua carta normalmente — você
                precisa palpitar e jogar olhando só as cartas dos adversários.
              </p>
            </div>
          </v-window-item>

          <!-- 8. Vidas e vitória -->
          <v-window-item :value="7">
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold black--text mb-3">
                ❤️ Vidas e vitória
              </h3>
              <p class="black--text">
                No final da rodada, quem <strong>errou o palpite</strong>
                perde vidas: a diferença entre o que apostou e o que realmente
                fez em vazas.
              </p>
              <p class="black--text">
                Errou por 2? Perde 2 vidas. Errou por 3? Perde 3 vidas. Quanto
                mais longe do palpite, mais caro sai.
              </p>
              <p class="black--text mb-4">
                Cada jogador começa com 5 vidas. Quem chega a 0 é eliminado.
                O último que sobrar em pé vence a partida!
              </p>
              <v-btn
                block
                x-large
                color="green darken-1"
                dark
                class="font-weight-bold"
                @click="fechar"
              >
                Entendi, bora jogar!
              </v-btn>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />

      <div class="tutorial-footer px-4 py-3">
        <div class="d-flex justify-center mb-2">
          <button
            v-for="i in 8"
            :key="i"
            type="button"
            class="tutorial-dot"
            :class="{ 'tutorial-dot--ativo': (i - 1) === passo }"
            :aria-label="'Ir para o passo ' + i"
            @click="passo = i - 1"
          />
        </div>
        <div class="d-flex align-center justify-space-between">
          <v-btn
            text
            :disabled="passo === 0"
            @click="anterior"
          >
            <v-icon left>mdi-chevron-left</v-icon>
            Anterior
          </v-btn>

          <span class="black--text text-caption">{{ passo + 1 }} / 8</span>

          <v-btn
            v-if="passo < 7"
            text
            color="green darken-1"
            @click="proximo"
          >
            Próximo
            <v-icon right>mdi-chevron-right</v-icon>
          </v-btn>
          <v-btn
            v-else
            text
            color="green darken-1"
            @click="fechar"
          >
            Fechar
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
const NAIPES = {
  ouros: { simbolo: '♦', cor: 'red--text', label: 'Ouros' },
  espadas: { simbolo: '♠', cor: 'black--text', label: 'Espadas' },
  copas: { simbolo: '♥', cor: 'red--text', label: 'Copas' },
  paus: { simbolo: '♣', cor: 'black--text', label: 'Paus' },
}

export default {
  name: 'TutorialDialog',

  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },

  data () {
    return {
      passo: 0,
      sequenciaRanks: ['4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', '3'],
      naipesOrdenados: [
        { nome: 'paus', ...NAIPES.paus },
        { nome: 'copas', ...NAIPES.copas },
        { nome: 'espadas', ...NAIPES.espadas },
        { nome: 'ouros', ...NAIPES.ouros },
      ],
    }
  },

  computed: {
    dialog: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      },
    },
  },

  watch: {
    value (aberto) {
      if (aberto) {
        this.passo = 0
      }
    },
  },

  methods: {
    fechar () {
      this.$emit('input', false)
    },
    proximo () {
      if (this.passo < 7) {
        this.passo++
      } else {
        this.fechar()
      }
    },
    anterior () {
      if (this.passo > 0) {
        this.passo--
      }
    },
  },
}
</script>

<style type="text/css" scoped>
.tutorial-card {
  height: 100%;
  max-height: 100%;
}

.tutorial-header {
  flex: 0 0 auto;
}

.tutorial-body {
  overflow-y: auto;
  min-height: 320px;
}

.tutorial-footer {
  flex: 0 0 auto;
  padding-bottom: calc(12px + env(safe-area-inset-bottom)) !important;
}

.tutorial-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.2);
  border: none;
  margin: 0 4px;
  padding: 0;
  cursor: pointer;
  transition: background-color .2s ease-in-out, transform .2s ease-in-out;
}

.tutorial-dot--ativo {
  background-color: #2e7d32;
  transform: scale(1.3);
}

.mini-carta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.mini-carta-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mini-carta {
  min-width: 34px;
  height: 46px;
  border: 1px solid rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  flex: 0 0 auto;
}

.mini-carta-manilha {
  outline: 2px solid #ffd600;
}

.mini-carta-rank {
  font-weight: 700;
  font-size: 0.95rem;
}

.mini-carta-naipe {
  font-size: 1.3rem;
  font-weight: 700;
}

.mini-carta-label {
  font-size: 0.7rem;
  margin-top: 2px;
}
</style>
