<template>
  <v-card
    :style="rotacao"
    :class="['mx-auto', 'cartaClass', virada ? 'grey darken-2' : 'white', { 'carta-manilha': manilha }]"
    min-width="70"
    min-height="100"
    elevation="5"
  >
    <v-card-title v-if="!virada" :class="corDaCarta" class="justify-center pa-2">
      <h2 class="font-weight-black">
        {{ carta.rank }}
        <br>
        <span class="naipe">{{ simboloNaipe }}</span>
      </h2>
    </v-card-title>
    <v-card-title v-else class="justify-center pa-2 fill-height">
      <v-icon color="grey lighten-1">mdi-cards-playing-outline</v-icon>
    </v-card-title>
  </v-card>
</template>

<script>
const SIMBOLOS = {
  ouros: '♦',
  espadas: '♠',
  copas: '♥',
  paus: '♣',
}

export default {
  name: 'Carta',

  props: {
    carta: {
      type: Object,
      default: null,
    },
    rotacao: {
      type: String,
      default: '',
    },
    virada: {
      type: Boolean,
      default: false,
    },
    manilha: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    simboloNaipe () {
      return this.carta ? SIMBOLOS[this.carta.suit] : ''
    },
    corDaCarta () {
      if (!this.carta) return ''
      return this.carta.suit === 'ouros' || this.carta.suit === 'copas' ? 'red--text' : 'black--text'
    },
  },
}
</script>

<style type="text/css" scoped>
.cartaClass {
  transition: all .2s ease-in-out;
}

.cartaClass:hover {
  transform: scale(1.1) !important;
  cursor: pointer;
}

.naipe {
  font-size: 1.3rem;
}

.carta-manilha {
  outline: 3px solid #ffd600;
}
</style>
