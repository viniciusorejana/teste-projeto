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
          <!-- Escada de força dos ranks -->
          <div class="forca-escada d-flex align-center mb-4">
            <div class="forca-escada__scroll d-flex align-center">
              <div
                v-for="rank in ranks"
                :key="rank"
                :class="['forca-escada__cela', 'd-flex', 'align-center', 'justify-center', { 'forca-escada__cela--manilha': rank === manilha }]"
              >
                <v-icon v-if="rank === manilha" small color="amber darken-4" class="mr-1">
                  mdi-crown
                </v-icon>
                <span class="font-weight-bold">{{ rank }}</span>
              </div>
            </div>
            <v-icon color="grey darken-1" class="ml-2">
              mdi-arrow-right-bold
            </v-icon>
            <span class="text-caption grey--text text--darken-1 ml-1">mais forte</span>
          </div>

          <!-- Destaque da manilha atual -->
          <v-chip v-if="manilha" color="amber darken-1" text-color="black" label class="mb-4">
            <v-icon left color="black">
              mdi-crown
            </v-icon>
            <span class="font-weight-bold">{{ manilha }} é a manilha desta rodada</span>
          </v-chip>
          <div v-else class="text-caption grey--text mb-4">
            Manilha ainda não definida (aguardando o vira).
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
          <!-- Escada de força dos ranks -->
          <div class="forca-escada d-flex align-center mb-4">
            <div class="forca-escada__scroll d-flex align-center">
              <div
                v-for="rank in ranks"
                :key="rank"
                :class="['forca-escada__cela', 'd-flex', 'align-center', 'justify-center', { 'forca-escada__cela--manilha': rank === manilha }]"
              >
                <v-icon v-if="rank === manilha" small color="amber darken-4" class="mr-1">
                  mdi-crown
                </v-icon>
                <span class="font-weight-bold">{{ rank }}</span>
              </div>
            </div>
            <v-icon color="grey darken-1" class="ml-2">
              mdi-arrow-right-bold
            </v-icon>
            <span class="text-caption grey--text text--darken-1 ml-1">mais forte</span>
          </div>

          <!-- Destaque da manilha atual -->
          <v-chip v-if="manilha" color="amber darken-1" text-color="black" label class="mb-4">
            <v-icon left color="black">
              mdi-crown
            </v-icon>
            <span class="font-weight-bold">{{ manilha }} é a manilha desta rodada</span>
          </v-chip>
          <div v-else class="text-caption grey--text mb-4">
            Manilha ainda não definida (aguardando o vira).
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
  max-height: 40vh;
  overflow-y: auto;
}

.forca-escada {
  overflow-x: auto;
}

.forca-escada__scroll {
  overflow-x: auto;
  flex-wrap: nowrap;
}

.forca-escada__cela {
  min-width: 40px;
  height: 40px;
  padding: 0 6px;
  margin-right: 4px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, .06);
  flex: 0 0 auto;
}

.forca-escada__cela--manilha {
  background-color: #ffd600;
  color: #000;
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
