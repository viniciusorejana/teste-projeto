<template>
  <div
    :style="rotacao"
    :class="['mx-auto', 'carta', virada ? 'carta--verso' : 'carta--face', {
      'carta-manilha': manilha,
      'carta-pequena': small,
      [corDaCarta]: !virada,
    }]"
  >
    <v-icon v-if="manilha" color="#3b2a00" class="coroa-manilha" small>mdi-crown</v-icon>

    <template v-if="!virada">
      <!-- Índices nos cantos, como num baralho de verdade: o de baixo é o
           mesmo girado 180°, pra carta ser legível nas duas orientações. -->
      <span class="carta-indice">
        <span class="carta-indice-rank">{{ carta.rank }}</span>
        <span class="carta-indice-naipe">{{ simboloNaipe }}</span>
      </span>

      <span class="carta-pip">{{ simboloNaipe }}</span>

      <span class="carta-indice carta-indice--fim" aria-hidden="true">
        <span class="carta-indice-rank">{{ carta.rank }}</span>
        <span class="carta-indice-naipe">{{ simboloNaipe }}</span>
      </span>
    </template>

    <span v-else class="carta-verso-marca"></span>
  </div>
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
      return this.carta.suit === 'ouros' || this.carta.suit === 'copas'
        ? 'carta--vermelha'
        : 'carta--preta'
    },
  },
}
</script>

<style scoped>
.carta {
  position: relative;
  width: clamp(58px, 16vw, 82px);
  min-height: 104px;
  border-radius: var(--carta-raio);
  flex: 0 0 auto;
  transition: transform .2s cubic-bezier(.34, 1.56, .64, 1), box-shadow .2s ease;
}

/* Face: papel levemente creme com brilho no alto, filete interno e sombra
   projetada — a soma é o que dá volume de carta física. */
.carta--face {
  background-color: var(--carta-papel);
  background-image:
    linear-gradient(150deg, #ffffff 0%, var(--carta-papel) 42%, var(--carta-papel-sombra) 100%);
  box-shadow:
    0 3px 6px rgba(0, 0, 0, .38),
    0 1px 2px rgba(0, 0, 0, .3),
    inset 0 0 0 1px var(--carta-borda),
    inset 0 0 0 3px rgba(255, 255, 255, .55);
}

/* Verso: treliça em diagonal nos dois sentidos sobre vermelho profundo, com
   moldura branca — o padrão clássico de dorso de baralho. */
.carta--verso {
  background-color: #8c1122;
  background-image:
    repeating-linear-gradient(45deg, rgba(255, 255, 255, .16) 0 4px, transparent 4px 9px),
    repeating-linear-gradient(-45deg, rgba(255, 255, 255, .16) 0 4px, transparent 4px 9px),
    radial-gradient(circle at 50% 45%, #a81a30 0%, #7d0f1f 70%, #5c0a16 100%);
  box-shadow:
    0 3px 6px rgba(0, 0, 0, .45),
    inset 0 0 0 1px rgba(0, 0, 0, .35),
    inset 0 0 0 4px rgba(255, 255, 255, .82);
}

.carta-verso-marca {
  position: absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%) rotate(45deg);
  width: 30%;
  height: 30%;
  border: 2px solid rgba(255, 255, 255, .75);
  border-radius: 3px;
  background: rgba(255, 255, 255, .14);
}

.carta--vermelha {
  color: var(--carta-vermelho);
}

.carta--preta {
  color: var(--carta-preto);
}

.carta-indice {
  position: absolute;
  top: 5px;
  left: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: .95;
  font-weight: 800;
}

.carta-indice--fim {
  top: auto;
  left: auto;
  bottom: 5px;
  right: 6px;
  transform: rotate(180deg);
}

.carta-indice-rank {
  font-size: .82rem;
  letter-spacing: -.02em;
}

.carta-indice-naipe {
  font-size: .68rem;
  margin-top: 1px;
}

/* Pip central grande: o que faz a carta ser lida de relance na mesa. */
.carta-pip {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.1rem;
  line-height: 1;
  opacity: .92;
  text-shadow: 0 1px 0 rgba(255, 255, 255, .6);
}

.carta-pequena {
  width: clamp(42px, 11vw, 58px);
  min-height: 74px;
}

.carta-pequena .carta-pip {
  font-size: 1.4rem;
}

.carta-pequena .carta-indice-rank {
  font-size: .62rem;
}

.carta-pequena .carta-indice-naipe {
  font-size: .52rem;
}

@media (hover: hover) {
  .carta:hover {
    transform: translateY(-4px) scale(1.06) !important;
    box-shadow:
      0 10px 18px rgba(0, 0, 0, .45),
      inset 0 0 0 1px var(--carta-borda),
      inset 0 0 0 3px rgba(255, 255, 255, .6);
    cursor: pointer;
  }
}

.carta:active {
  transform: scale(0.96);
  transition-duration: .08s;
}

/* Manilha: anel dourado com brilho, pra saltar sem depender só do ícone. */
.carta-manilha {
  box-shadow:
    0 3px 6px rgba(0, 0, 0, .38),
    0 0 14px rgba(255, 210, 74, .55),
    inset 0 0 0 3px var(--ouro),
    inset 0 0 0 5px rgba(255, 255, 255, .55);
}

.coroa-manilha {
  position: absolute;
  top: -10px;
  right: -6px;
  background: linear-gradient(160deg, #ffe17a, var(--ouro) 55%, var(--ouro-escuro));
  border-radius: 50%;
  padding: 2px;
  z-index: 2;
  box-shadow: 0 2px 5px rgba(0, 0, 0, .5);
}
</style>
