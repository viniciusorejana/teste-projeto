<template>
  <div class="tabela-forca-cartas">
    <v-bottom-sheet
      v-if="$vuetify.breakpoint.xsOnly"
      v-model="mostrar"
      inset
    >
      <v-sheet class="pa-4 tabela-forca-cartas__sheet">
        <div class="d-flex align-center mb-2">
          <h3 class="text-subtitle-1 font-weight-bold mb-0">
            Força das cartas
          </h3>
          <v-spacer />
          <v-btn icon small @click="fechar">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="tabela-forca-cartas__conteudo">
          <!-- Destaque da manilha atual -->
          <v-chip v-if="manilha" color="amber darken-1" text-color="black" label class="mb-3">
            <v-icon left color="black">
              mdi-crown
            </v-icon>
            <span class="font-weight-bold">{{ manilha }} é a manilha desta rodada</span>
          </v-chip>
          <div v-else class="text-caption grey--text mb-3">
            Manilha ainda não definida (aguardando o vira).
          </div>

          <!-- Leque de cartas: força na horizontal, sem deslizar -->
          <div class="forca-leque__legenda d-flex justify-space-between text-caption grey--text text--darken-1 mb-1 px-1">
            <span><v-icon x-small color="grey darken-1">mdi-arrow-left-bold</v-icon> mais fraca</span>
            <span>mais forte <v-icon x-small color="grey darken-1">mdi-arrow-right-bold</v-icon></span>
          </div>
          <div class="forca-leque">
            <div
              v-for="(rank, index) in ranksOrdenados"
              :key="rank"
              :class="['forca-leque__carta', corDoNaipeDecorativo, { 'forca-leque__carta--manilha': rank === manilha }]"
              :style="{ zIndex: index + 1 }"
            >
              <v-icon v-if="rank === manilha" x-small color="amber darken-4" class="forca-leque__coroa">
                mdi-crown
              </v-icon>
              <span class="forca-leque__rank">{{ rank }}</span>
              <span class="forca-leque__naipe">{{ simboloDecorativo }}</span>
            </div>
          </div>

          <!-- Desempate entre manilhas -->
          <div v-if="manilha" class="forca-desempate">
            <div class="text-subtitle-2 font-weight-bold mb-2">
              Desempate entre manilhas
            </div>
            <div class="d-flex align-center flex-wrap">
              <template v-for="(suit, index) in suits">
                <span v-if="index > 0" :key="`sep-${suit}`" class="mx-1 grey--text">&lt;</span>
                <div
                  :key="suit"
                  :class="['forca-desempate__carta', 'd-flex', 'align-center', 'justify-center', corDoNaipe(suit), { 'forca-desempate__carta--vencedora': index === suits.length - 1 }]"
                >
                  <span class="font-weight-bold">{{ manilha }}{{ simboloDoNaipe(suit) }}</span>
                </div>
              </template>
            </div>
            <div class="text-caption grey--text text--darken-1 mt-2">
              Quanto mais à direita, mais forte no empate de manilhas.
            </div>
          </div>
          <div v-else class="forca-desempate forca-desempate--vazio text-caption grey--text">
            Aguardando o vira para saber o desempate entre manilhas.
          </div>

          <div class="text-caption grey--text text--darken-1 mt-4">
            Cartas comuns de mesmo valor se anulam em pares.
          </div>
        </div>
      </v-sheet>
    </v-bottom-sheet>

    <v-dialog
      v-else
      v-model="mostrar"
      max-width="480"
      class="tabela-forca-cartas__dialog"
    >
      <v-card>
        <v-card-title class="d-flex align-center">
          <span class="text-h6">Força das cartas</span>
          <v-spacer />
          <v-btn icon @click="fechar">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <!-- Destaque da manilha atual -->
          <v-chip v-if="manilha" color="amber darken-1" text-color="black" label class="mb-3">
            <v-icon left color="black">
              mdi-crown
            </v-icon>
            <span class="font-weight-bold">{{ manilha }} é a manilha desta rodada</span>
          </v-chip>
          <div v-else class="text-caption grey--text mb-3">
            Manilha ainda não definida (aguardando o vira).
          </div>

          <!-- Leque de cartas: força na horizontal, sem deslizar -->
          <div class="forca-leque__legenda d-flex justify-space-between text-caption grey--text text--darken-1 mb-1 px-1">
            <span><v-icon x-small color="grey darken-1">mdi-arrow-left-bold</v-icon> mais fraca</span>
            <span>mais forte <v-icon x-small color="grey darken-1">mdi-arrow-right-bold</v-icon></span>
          </div>
          <div class="forca-leque">
            <div
              v-for="(rank, index) in ranksOrdenados"
              :key="rank"
              :class="['forca-leque__carta', corDoNaipeDecorativo, { 'forca-leque__carta--manilha': rank === manilha }]"
              :style="{ zIndex: index + 1 }"
            >
              <v-icon v-if="rank === manilha" x-small color="amber darken-4" class="forca-leque__coroa">
                mdi-crown
              </v-icon>
              <span class="forca-leque__rank">{{ rank }}</span>
              <span class="forca-leque__naipe">{{ simboloDecorativo }}</span>
            </div>
          </div>

          <!-- Desempate entre manilhas -->
          <div v-if="manilha" class="forca-desempate">
            <div class="text-subtitle-2 font-weight-bold mb-2">
              Desempate entre manilhas
            </div>
            <div class="d-flex align-center flex-wrap">
              <template v-for="(suit, index) in suits">
                <span v-if="index > 0" :key="`sep-${suit}`" class="mx-1 grey--text">&lt;</span>
                <div
                  :key="suit"
                  :class="['forca-desempate__carta', 'd-flex', 'align-center', 'justify-center', corDoNaipe(suit), { 'forca-desempate__carta--vencedora': index === suits.length - 1 }]"
                >
                  <span class="font-weight-bold">{{ manilha }}{{ simboloDoNaipe(suit) }}</span>
                </div>
              </template>
            </div>
            <div class="text-caption grey--text text--darken-1 mt-2">
              Quanto mais à direita, mais forte no empate de manilhas.
            </div>
          </div>
          <div v-else class="forca-desempate forca-desempate--vazio text-caption grey--text">
            Aguardando o vira para saber o desempate entre manilhas.
          </div>

          <div class="text-caption grey--text text--darken-1 mt-4">
            Cartas comuns de mesmo valor se anulam em pares.
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { RANKS, SUITS } from '../constants/cartas'

const SIMBOLOS = {
  ouros: '♦',
  espadas: '♠',
  copas: '♥',
  paus: '♣',
}

// Naipe único usado em todas as cartas do leque: aqui o naipe não tem
// significado (só a força do rank importa, exceto no desempate de manilhas
// logo abaixo), então misturar naipes só criava ruído visual.
const NAIPE_DECORATIVO = 'espadas'

export default {
  name: 'TabelaForcaCartas',

  props: {
    value: {
      type: Boolean,
      default: false,
    },
    vira: {
      type: Object,
      default: null,
    },
    manilha: {
      type: String,
      default: null,
    },
  },

  data () {
    return {
      ranks: RANKS,
      suits: SUITS,
    }
  },

  computed: {
    mostrar: {
      get () {
        return this.value
      },
      set (novoValor) {
        this.$emit('input', novoValor)
      },
    },

    // Ranks ordenados da mais fraca para a mais forte, com a manilha
    // sempre por último (independente da posição que ocupa em `RANKS`).
    ranksOrdenados () {
      const crescente = [...this.ranks]
      if (!this.manilha) {
        return crescente
      }
      return [...crescente.filter((rank) => rank !== this.manilha), this.manilha]
    },

    simboloDecorativo () {
      return SIMBOLOS[NAIPE_DECORATIVO] || ''
    },

    corDoNaipeDecorativo () {
      return NAIPE_DECORATIVO === 'ouros' || NAIPE_DECORATIVO === 'copas' ? 'forca-leque__carta--vermelha' : 'forca-leque__carta--preta'
    },
  },

  methods: {
    fechar () {
      this.mostrar = false
    },
    corDoNaipe (suit) {
      return suit === 'ouros' || suit === 'copas' ? 'red--text' : 'black--text'
    },
    simboloDoNaipe (suit) {
      return SIMBOLOS[suit] || ''
    },
  },
}
</script>

<style type="text/css" scoped>
.tabela-forca-cartas__sheet {
  max-height: 85vh;
  overflow-y: auto;
}

/* O Vuetify força `width: 100%` em todo `.v-dialog` (pensado pra caber até o
   `max-width`); aqui o conteúdo (leque de cartas) é bem mais estreito que os
   480px do `max-width`, então sem isso o diálogo sempre abre mais largo do
   que precisa. `max-width` continua valendo como teto. */
.tabela-forca-cartas__dialog {
  width: auto !important;
}

.forca-leque {
  display: flex;
  align-items: center;
  padding: 16px 4px 14px;
  margin-bottom: 8px;
}

.forca-leque__carta {
  position: relative;
  flex: 0 0 auto;
  width: 42px;
  height: 60px;
  margin-left: -22px;
  background-color: #fff;
  border: 1px solid rgba(0, 0, 0, .2);
  border-radius: 7px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, .3);
}

.forca-leque__carta:first-child {
  margin-left: 0;
}

.forca-leque__carta--vermelha {
  color: #d32f2f;
}

.forca-leque__carta--preta {
  color: #212121;
}

/* Ancorado à esquerda (não à direita): como as cartas mais à direita ficam
   por cima no leque (empilhamento natural, reforçado pelo z-index abaixo), o
   lado direito de cada carta comum fica coberto pela carta seguinte — só a
   faixa esquerda (antes do overlap de -22px começar) fica sempre visível. */
.forca-leque__rank {
  position: absolute;
  left: 5px;
  top: 3px;
  font-weight: 800;
  font-size: .8rem;
  line-height: 1;
}

.forca-leque__naipe {
  position: absolute;
  left: 5px;
  top: 18px;
  font-size: .75rem;
  line-height: 1;
}

.forca-leque__carta--manilha {
  width: 58px;
  height: 82px;
  /* Agora é a última carta do leque (mais forte, à direita): precisa de uma
     folga positiva à esquerda em vez do overlap padrão (-22px) das outras
     cartas, senão ela fica espremida contra a carta anterior. */
  margin-left: 14px;
  transform: translateY(-12px);
  background-color: #fff8e1;
  border: 2px solid #ffd600;
  box-shadow: 0 6px 12px rgba(255, 214, 0, .55);
}

.forca-leque__carta--manilha .forca-leque__rank {
  left: 0;
  right: 0;
  top: 10px;
  text-align: center;
  font-size: 1.15rem;
}

.forca-leque__carta--manilha .forca-leque__naipe {
  left: 0;
  right: 0;
  top: 33px;
  text-align: center;
  font-size: 1.05rem;
}

.forca-leque__coroa {
  position: absolute;
  top: -9px;
  left: 50%;
  transform: translateX(-50%);
  background: #ffd600;
  border-radius: 50%;
  padding: 2px;
  z-index: 3;
}

.forca-desempate__carta {
  min-width: 56px;
  height: 40px;
  padding: 0 8px;
  margin-right: 0;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, .2);
  background-color: #fff;
}

.forca-desempate__carta--vencedora {
  border: 2px solid #ffd600;
  box-shadow: 0 0 4px rgba(255, 214, 0, .8);
}
</style>
