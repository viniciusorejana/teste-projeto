<template>
  <div class="d-flex justify-center flex-wrap mesa">
    <div v-if="mesaAtual.length === 0" class="white--text caption mesa-vazia">
      Aguardando jogadas...
    </div>
    <transition-group name="carta-mesa-transicao" tag="div" class="mesa-grupo">
      <div v-for="jogada in mesaAtual" :key="jogada.seat" class="text-center mx-2 mb-2">
        <div :class="['carta-mesa-estado', { 'carta-anulada': anuladas.has(jogada.seat), 'carta-ganhando': jogada.seat === seatGanhando }]">
          <Carta :carta="jogada.carta" :manilha="jogada.carta.rank === manilha" />
        </div>
        <p class="white--text caption mt-1 mb-0">
          {{ nomeDoAssento(jogada.seat) }}
          <span v-if="anuladas.has(jogada.seat)" class="anulada-label">
            <v-icon x-small color="#fff59d">mdi-cancel</v-icon> anulada
          </span>
          <span v-else-if="jogada.seat === seatGanhando" class="ganhando-label">
            <v-icon x-small color="#ffd600">mdi-trophy</v-icon> ganhando
          </span>
        </p>
      </div>
    </transition-group>
  </div>
</template>

<script>
import Carta from './Carta.vue'
import { RANKS, SUITS } from '../constants/cartas'

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

    // Espelha server/src/game/deck.js (compararCartas): entre as cartas ainda
    // elegíveis (não anuladas), acha quem está vencendo a vaza até agora.
    seatGanhando () {
      const elegiveis = this.mesaAtual.filter((j) => !this.anuladas.has(j.seat))
      if (elegiveis.length === 0) return null

      let melhor = elegiveis[0]
      for (const atual of elegiveis.slice(1)) {
        if (this.compararCartas(atual.carta, melhor.carta) > 0) melhor = atual
      }
      return melhor.seat
    },
  },

  methods: {
    nomeDoAssento (seat) {
      const jogador = this.jogadores.find((j) => j.seat === seat)
      return jogador ? jogador.name : ''
    },

    ehManilha (carta) {
      return carta.rank === this.manilha
    },

    compararCartas (a, b) {
      const aManilha = this.ehManilha(a)
      const bManilha = this.ehManilha(b)
      if (aManilha && bManilha) return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit)
      if (aManilha) return 1
      if (bManilha) return -1
      return RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank)
    },
  },
}
</script>

<style scoped>
.mesa {
  min-height: 130px;
  align-items: center;
  position: relative;
}

.mesa-vazia {
  opacity: 0.7;
}

/* display:contents faz o wrapper do transition-group "sumir" do layout: os
   itens dentro dele viram filhos diretos do flex .mesa, como se o
   transition-group nem existisse — só assim dá pra animar entrada/saída das
   cartas sem quebrar a centralização/wrap da mesa. */
.mesa-grupo {
  display: contents;
}

.carta-mesa-estado {
  transition: opacity .3s ease, filter .3s ease, box-shadow .3s ease;
}

.carta-anulada {
  opacity: 0.35;
  filter: grayscale(1);
}

.carta-ganhando {
  outline: 3px solid #ffd600;
  border-radius: 6px;
  box-shadow: 0 0 10px rgba(255, 214, 0, 0.7);
}

/* Carta "pousando" na mesa: sobe e cresce até o tamanho final, como se
   tivesse acabado de ser jogada da mão. Ao sair (vaza resolvida), encolhe e
   desaparece no lugar. */
.carta-mesa-transicao-enter-active {
  transition: opacity .3s ease, transform .35s cubic-bezier(.34, 1.56, .64, 1);
}

.carta-mesa-transicao-leave-active {
  transition: opacity .25s ease, transform .25s ease;
  position: absolute;
}

.carta-mesa-transicao-enter {
  opacity: 0;
  transform: translateY(36px) scale(0.7);
}

.carta-mesa-transicao-leave-to {
  opacity: 0;
  transform: scale(0.75);
}

.carta-mesa-transicao-move {
  transition: transform .3s ease;
}

.anulada-label,
.ganhando-label {
  font-weight: bold;
}

.anulada-label {
  color: #fff59d;
}

.ganhando-label {
  color: #ffd600;
}
</style>
