<template>
  <v-card :style="rotacao"
          class="mx-auto white cartaClass"
          min-width="110"
          min-height="170"
          elevation="5"
  >
    <v-card-title :class="corDaCarta()">
      <h1 class="pl-5 font-weight-black display-3">
        {{ carta.substring(0, 1) }}
        <br>
        {{ carta.substring(1) }}
      </h1>
    </v-card-title>
  </v-card>
</template>

<script>
  export default {
    name: 'Carta',

    props: {
      carta: String,
      rotacao: String,
    },

    methods: {
      corDaCarta() {
        return this.carta.match(/[♥♦]/g) ? 'red--text' : 'black--text'
      }
    },

  }
</script>


<style type="text/css" scoped>
.cartaClass{
  transition: all .2s ease-in-out;
}

.cartaClass:hover{
  transform: scale(1.2) !important;
  cursor: pointer;
}
</style>
