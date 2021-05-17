<template>
  <v-app class="tudo">
    <p class="headline font-weight-black rodada pa-3">Rodada: {{rodada}}</p>
    <Carta :carta="cartaVira" class="mt-3 mb-3"
           :rotacao="rotacaoAleatoria(20)"/>
    <Carta :style="opacidadeCartaEscolhida"
           class="mb-3 mt-3"
           :carta="cartaEscolhida"
           :rotacao="rotacaoAleatoria(5)"/>
    <div class="mx-auto align-end pb-3 text-center">
      <v-row>
        <v-col v-for="carta in cartas"
               :key="carta"
               :id="carta"
               v-on:click="escolher(carta)"
               :class="cartas.length >= 11 ? 'cartaClass mr-1 ml-1 mt-3 mb-3' : 'cartasClass mt-3 mb-3'" :cols="cartas.length >= 11 ? 1 : null">
          <Carta :carta="carta"
                 :rotacao="rotacaoAleatoria(5)" />
        </v-col>
      </v-row>
      <v-col cols="12">
        <v-btn v-if="cartas.length > 0"
               v-on:click="jogarCarta()"
               class="success v-btn--block">
          Jogar
        </v-btn>
      </v-col>
    </div>
  </v-app>
</template>

<script>
import Carta from './components/Carta';

export default {
  name: 'App',

  components: {
    Carta,
  },

  data: () => ({
    nipes: ['♥', '♣', '♠', '♦'],
    faces: ['A', '2', '3', '4', '5', '6', '7', 'Q', 'J', 'K'],
    baralho: [],
    cartaVira: '',
    cartas: [],
    cartaEscolhida: '',
    opacidadeCartaEscolhida: 'opacity: 0',
    cartaEscolhidaMao: '',
    rodada: 0,
  }),

  mounted() {
    this.comecarJogo()
  },

  methods: {
    comecarJogo (){
      this.rodada++
      this.baralho = this.criarBaralho()
      this.cartaVira = this.vira()
      this.cartas = this.darCartas()
    },

    criarBaralho (){
      var baralho = []
      for (let i = 0; i < this.nipes.length; i++) {
        for (let j = 0; j < this.faces.length; j++) {
          baralho.push(this.faces[j] + " " + this.nipes[i])
        }
      }
      return baralho
    },

    vira (){
      return this.escolheCarta()
    },

    darCartas (){
      var cartas = []
        for (let l = 0; l < this.rodada; l++) {
          var carta = this.escolheCarta()
          cartas.push(carta)
        }
      return cartas
    },

    escolheCarta (){
      var random = Math.floor(Math.random() * this.baralho.length-1) + 1
      var carta = this.baralho[random]
      this.baralho.splice(random, 1)
      return carta
    },

    rotacaoAleatoria (multiplicador){
      var signal = [1, -1]
      var random = Math.floor(Math.random() * multiplicador) + 1
      var randomSignal = random * Math.floor(Math.random() * signal.length-1) + 1
      return 'transform: rotate('+randomSignal+'deg)'
    },

    escolher (carta){
      if(this.cartaEscolhida === ''){
        this.cartaEscolhida = carta
        this.opacidadeCartaEscolhida = 'opacity: 100'
        this.cartaEscolhidaMao = carta
        document.getElementById(this.cartaEscolhidaMao).style.opacity = 0
      } else {
        this.cartaEscolhida = ''
        this.opacidadeCartaEscolhida = 'opacity: 0'
        document.getElementById(this.cartaEscolhidaMao).style.opacity = 100
      }
    },

    jogarCarta (){
      if (this.cartaEscolhida !== ''){
        this.cartaEscolhida = ' '
        this.cartas.splice(this.cartas.indexOf(this.cartaEscolhidaMao), 1)
        this.escolher()
        document.getElementById(this.cartaEscolhidaMao).remove()
      }

      setTimeout( () => {
        if (this.cartas.length === 0){
          this.comecarJogo()
        }
      })
    }
  },
};
</script>

<style scoped>
.tudo {
  background-color: #f44336 !important;
  overflow: hidden !important;
  text-shadow: 2px 2px rgba(0, 0, 0, 0.15);
}

.rodada {
  position: absolute;
}

.cartaClass{
  transition: all .2s ease-in-out;
}
</style>
