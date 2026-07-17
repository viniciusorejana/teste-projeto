<template>
  <v-card
    :style="rotacao"
    :class="['mx-auto', 'cartaClass', virada ? 'grey darken-2' : 'white', { 'carta-manilha': manilha, 'carta-pequena': small }]"
    elevation="5"
  >
    <v-icon v-if="manilha" color="#212121" class="coroa-manilha" small>mdi-crown</v-icon>
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
    small: {
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
  width: clamp(56px, 16vw, 80px);
  min-height: 100px;
  position: relative;
}

.carta-pequena {
  width: clamp(40px, 11vw, 56px);
  min-height: 70px;
}

.carta-pequena .naipe {
  font-size: 0.9rem;
}

.carta-pequena h2 {
  font-size: 1rem;
}

@media (hover: hover) {
  .cartaClass:hover {
    transform: scale(1.1) !important;
    cursor: pointer;
  }
}

.cartaClass:active {
  transform: scale(0.96);
}

.naipe {
  font-size: 1.3rem;
}

.carta-manilha {
  outline: 3px solid #ffd600;
}

.coroa-manilha {
  position: absolute;
  top: -10px;
  right: -6px;
  background: #ffd600;
  border-radius: 50%;
  padding: 2px;
  z-index: 2;
}
</style>
