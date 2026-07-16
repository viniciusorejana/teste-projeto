<template>
  <v-card
    :class="['pa-2', 'text-center', 'assento', { 'assento-dealer': dealer, 'assento-vez': destacado }]"
    elevation="4"
    min-width="110"
  >
    <v-avatar :color="jogador.color" size="40">
      <span class="white--text font-weight-bold">{{ inicial }}</span>
    </v-avatar>

    <p :class="['mb-0', 'mt-1', 'caption', { 'font-weight-black': destacado }]">
      {{ jogador.name }}
      <span v-if="souEu">(você)</span>
    </p>

    <div class="vidas mb-1">
      <v-icon
        v-for="i in 5"
        :key="i"
        x-small
        :color="jogador.lives >= i ? 'red' : 'grey lighten-1'"
      >
        {{ jogador.lives >= i ? 'mdi-heart' : 'mdi-heart-outline' }}
      </v-icon>
    </div>

    <p v-if="jogador.made > 0" class="caption font-weight-bold mb-1 contador-maos">
      ✓ {{ jogador.made }} mão(s) na rodada
    </p>

    <v-chip v-if="jogador.eliminated" x-small color="grey" text-color="white">eliminado</v-chip>
    <template v-else>
      <v-chip v-if="jogador.bid !== null && jogador.bid !== undefined" x-small class="mr-1">
        palpite {{ jogador.bid }}
      </v-chip>
      <v-chip x-small color="grey lighten-3">{{ jogador.handCount }} carta(s)</v-chip>
    </template>

    <div v-if="cartaRevelada" class="mt-2 d-flex justify-center">
      <Carta
        :carta="cartaRevelada"
        :manilha="cartaRevelada.rank === manilha"
        class="carta-mini"
      />
    </div>

    <div v-if="dealer" class="etiqueta etiqueta-dealer">embaralha</div>
    <div v-else-if="destacado" class="etiqueta etiqueta-vez">vez</div>
  </v-card>
</template>

<script>
import Carta from './Carta.vue'

export default {
  name: 'PlayerSeat',

  components: { Carta },

  props: {
    jogador: { type: Object, required: true },
    dealer: { type: Boolean, default: false },
    destacado: { type: Boolean, default: false },
    souEu: { type: Boolean, default: false },
    cartaRevelada: { type: Object, default: null },
    manilha: { type: String, default: null },
  },

  computed: {
    inicial () {
      return this.jogador.name.charAt(0).toUpperCase()
    },
  },
}
</script>

<style scoped>
.assento {
  border: 3px solid transparent;
  position: relative;
  transition: all .2s ease-in-out;
}

.assento-dealer {
  border-color: #d32f2f;
}

.assento-vez {
  border-color: #ffd600;
  transform: scale(1.05);
}

.vidas {
  line-height: 1;
}

.contador-maos {
  color: #e65100;
}

.etiqueta {
  position: absolute;
  top: -10px;
  right: -10px;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  color: white;
  font-weight: bold;
}

.etiqueta-dealer {
  background: #d32f2f;
}

.etiqueta-vez {
  background: #f9a825;
}

.carta-mini {
  transform: scale(0.6);
  margin: -20px;
}
</style>
