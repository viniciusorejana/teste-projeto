<template>
  <v-card
    :class="['pa-2', 'text-center', 'assento', { 'assento-dealer': dealer, 'assento-vez': destacado, 'assento-compacto': compacto, 'assento-com-carta': cartaRevelada }]"
    elevation="4"
  >
    <v-avatar :color="jogador.color" :size="compacto ? 32 : 40">
      <span class="white--text font-weight-bold">{{ inicial }}</span>
    </v-avatar>

    <p :class="['mb-0', 'mt-1', 'nome-jogador', { 'font-weight-black': destacado }]">
      {{ jogador.name }}
      <span v-if="souEu">{{ $t('assento.sufixoVoce') }}</span>
    </p>

    <div class="vidas mb-1">
      <v-icon
        v-for="i in 5"
        :key="i"
        :small="!compacto"
        :x-small="compacto"
        :color="jogador.lives >= i ? 'red' : 'grey lighten-1'"
      >
        {{ jogador.lives >= i ? 'mdi-heart' : 'mdi-heart-outline' }}
      </v-icon>
    </div>

    <p v-if="jogador.made > 0" class="caption font-weight-bold mb-1 contador-maos">
      {{ $tc('assento.maosNaRodada', jogador.made, { n: jogador.made }) }}
    </p>

    <v-chip v-if="jogador.eliminated" small color="grey" text-color="white">
      {{ $t('assento.eliminado') }}
    </v-chip>
    <v-chip
      v-else-if="jogador.bid !== null && jogador.bid !== undefined"
      small
      class="chip-palpite"
    >
      {{ $t('assento.palpite', { valor: jogador.bid }) }}
    </v-chip>

    <transition name="badge-transicao">
      <div v-if="cartaRevelada" class="carta-revelada-badge">
        <Carta
          :carta="cartaRevelada"
          :manilha="cartaRevelada.rank === manilha"
          small
          class="carta-mini"
        />
      </div>
    </transition>

    <transition name="etiqueta-transicao">
      <div v-if="dealer" key="dealer" class="etiqueta etiqueta-dealer">
        {{ $t('assento.embaralha') }}
      </div>
      <div v-else-if="destacado" key="vez" class="etiqueta etiqueta-vez">
        {{ $t('assento.vez') }}
      </div>
    </transition>
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
    compacto: { type: Boolean, default: false },
  },

  computed: {
    inicial () {
      return this.jogador.name.charAt(0).toUpperCase()
    },
  },
}
</script>

<style scoped>
/* O assento é lido como uma carta pousada na mesa: mesmo papel, mesmo raio de
   canto e sombra projetada das cartas de verdade. */
.assento {
  border: 3px solid transparent;
  position: relative;
  transition: transform .3s cubic-bezier(.34, 1.56, .64, 1), border-color .25s ease, margin-bottom .25s ease, box-shadow .25s ease;
  min-width: 110px;
  border-radius: 10px !important;
  background-color: var(--carta-papel) !important;
  background-image: linear-gradient(155deg, #ffffff 0%, var(--carta-papel) 45%, var(--carta-papel-sombra) 100%) !important;
  box-shadow:
    0 3px 8px rgba(0, 0, 0, .4),
    inset 0 0 0 1px rgba(0, 0, 0, .1) !important;
}

.assento-compacto {
  min-width: 92px;
  padding: 4px !important;
}

/* Reserva espaço embaixo pro badge da carta revelada (rodada às cegas), que
   sai da borda inferior do card, pra ele não ser cortado pelo overflow da
   linha de oponentes. */
.assento-com-carta {
  margin-bottom: 30px;
}

.nome-jogador {
  font-size: 0.9rem;
  line-height: 1.1;
}

.chip-palpite {
  font-weight: 600;
}

.assento-dealer {
  border-color: #d32f2f;
}

.assento-vez {
  border-color: var(--ouro);
  transform: scale(1.05);
  box-shadow:
    0 6px 16px rgba(0, 0, 0, .45),
    0 0 16px rgba(255, 210, 74, .5),
    inset 0 0 0 1px rgba(0, 0, 0, .1) !important;
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
  font-size: 12px;
  padding: 2px 9px;
  border-radius: 9px;
  color: white;
  font-weight: bold;
}

.etiqueta-dealer {
  background: #d32f2f;
}

.etiqueta-vez {
  background: #f9a825;
}

/* Carta revelada nas rodadas às cegas: ancorada como um badge saindo da borda
   inferior do assento, com anel/sombra escura pra destacar do fundo branco do
   card (antes ficava branco-sobre-branco e ilegível). */
.carta-revelada-badge {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
}

.carta-mini {
  transform: scale(0.82);
  border-radius: 8px;
  outline: 2px solid #212121;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6) !important;
}

.etiqueta-transicao-enter-active,
.etiqueta-transicao-leave-active {
  transition: opacity .2s ease, transform .2s cubic-bezier(.34, 1.56, .64, 1);
}

.etiqueta-transicao-enter,
.etiqueta-transicao-leave-to {
  opacity: 0;
  transform: scale(0.4);
}

.badge-transicao-enter-active,
.badge-transicao-leave-active {
  transition: opacity .25s ease, transform .25s ease;
}

.badge-transicao-enter,
.badge-transicao-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px) scale(0.7);
}
</style>
