<template>
  <div class="d-flex justify-center flex-wrap mesa">
    <div v-if="mesaAtual.length === 0" class="white--text caption mesa-vazia">
      Aguardando jogadas...
    </div>
    <div v-for="jogada in mesaAtual" :key="jogada.seat" class="text-center mx-2 mb-2">
      <div :class="{ 'carta-anulada': anuladas.has(jogada.seat) }">
        <Carta :carta="jogada.carta" :manilha="jogada.carta.rank === manilha" />
      </div>
      <p class="white--text caption mt-1 mb-0">
        {{ nomeDoAssento(jogada.seat) }}
        <span v-if="anuladas.has(jogada.seat)" class="anulada-label">anulada</span>
      </p>
    </div>
  </div>
</template>

<script>
import Carta from './Carta.vue'

export default {
  name: 'TrickArea',

  components: { Carta },

  props: {
    mesaAtual: { type: Array, required: true },
    jogadores: { type: Array, required: true },
    manilha: { type: String, default: null },
  },

  computed: {
    // Cartas de mesmo rank (fora manilha) se anulam em pares, na ordem em que
    // foram jogadas. Espelha server/src/game/vaza.js para mostrar em tempo
    // real, enquanto a vaza ainda está em andamento, quais cartas já foram
    // anuladas.
    anuladas () {
      const pendentePorRank = new Map()
      const vivas = new Set()
      const anuladasSet = new Set()

      for (const jogada of this.mesaAtual) {
        if (jogada.carta.rank === this.manilha) {
          vivas.add(jogada.seat)
          continue
        }
        const rank = jogada.carta.rank
        if (pendentePorRank.has(rank)) {
          const seatPendente = pendentePorRank.get(rank)
          vivas.delete(seatPendente)
          anuladasSet.add(seatPendente)
          anuladasSet.add(jogada.seat)
          pendentePorRank.delete(rank)
        } else {
          vivas.add(jogada.seat)
          anuladasSet.delete(jogada.seat)
          pendentePorRank.set(rank, jogada.seat)
        }
      }

      return anuladasSet
    },
  },

  methods: {
    nomeDoAssento (seat) {
      const jogador = this.jogadores.find((j) => j.seat === seat)
      return jogador ? jogador.name : ''
    },
  },
}
</script>

<style scoped>
.mesa {
  min-height: 130px;
  align-items: center;
}

.mesa-vazia {
  opacity: 0.7;
}

.carta-anulada {
  opacity: 0.35;
  filter: grayscale(1);
}

.anulada-label {
  color: #ffd600;
  font-weight: bold;
}
</style>
