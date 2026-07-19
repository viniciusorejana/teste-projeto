<template>
  <transition :name="posicao === 'canto' ? 'game-toast-canto-transicao' : 'game-toast-transicao'">
    <div
      v-if="atual && !suprimir"
      :class="['game-toast', { 'game-toast--canto': posicao === 'canto' }]"
      role="status"
      aria-live="polite"
    >
      <v-icon v-if="atual.icone" :color="atual.cor || 'white'" :small="posicao === 'canto'" class="mr-2">
        {{ atual.icone }}
      </v-icon>
      <span class="game-toast-texto">{{ atual.texto }}</span>
    </div>
  </transition>
</template>

<script>
// Tempo (ms) que cada anúncio fica visível antes de dar lugar ao próximo da
// fila. Central pra facilitar ajuste fino do ritmo dos avisos.
const DURACAO_MS = 2500

// Trava de segurança contra rajadas de eventos automáticos (ex.: vários
// jogadores agindo em sequência rápida): sem isso a fila cresce sem limite e
// os avisos acabam aparecendo bem depois do momento real a que se referem.
// Ao invés de deixar acumular, descarta o mais antigo pendente e mantém só os
// mais recentes.
const MAX_FILA = 2

export default {
  name: 'GameToast',

  props: {
    // Quando um diálogo modal de verdade está aberto (resultado da rodada,
    // fim de jogo), o toast é escondido pra não competir/aparecer por cima
    // do scrim do diálogo.
    suprimir: { type: Boolean, default: false },
    // 'centro' (padrão): avisos importantes que merecem interromper a
    // atenção (vez, fim do palpite). 'canto': avisos de menor peso (ex.:
    // palpite de alguém), num canto discreto que não cobre a mesa.
    posicao: { type: String, default: 'centro' },
  },

  data: () => ({
    fila: [],
    atual: null,
    temporizador: null,
  }),

  beforeDestroy () {
    clearTimeout(this.temporizador)
  },

  methods: {
    // API pública (chamada via $refs pelo GameBoard): empilha um anúncio na
    // fila. Se nada estiver sendo exibido, começa a processar na hora.
    anunciar ({ texto, icone, cor } = {}) {
      if (!texto) return
      if (this.fila.length >= MAX_FILA) this.fila.shift()
      this.fila.push({ texto, icone, cor })
      if (!this.atual) this.proximo()
    },

    proximo () {
      if (this.fila.length === 0) {
        this.atual = null
        return
      }
      this.atual = this.fila.shift()
      clearTimeout(this.temporizador)
      this.temporizador = setTimeout(() => this.proximo(), DURACAO_MS)
    },
  },
}
</script>

<style scoped>
.game-toast {
  position: fixed;
  top: 38%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* Acima dos overlays comuns do Vuetify (~menus/tooltips em torno de 200),
     mas os diálogos modais (resultado/fim de jogo) são suprimidos via prop
     em vez de disputarem z-index. */
  z-index: 300;
  display: flex;
  align-items: center;
  max-width: 80vw;
  padding: 12px 22px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.82);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
  color: #fff;
  /* Não deve bloquear cliques/toques no jogo por baixo. */
  pointer-events: none;
}

.game-toast-texto {
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
}

/* Variante discreta: canto superior direito, menor e menos chamativa —
   pensada pra avisos que não precisam interromper a atenção do jogador
   (ex.: "Fulano palpitou N"), sem cobrir o centro da mesa. */
.game-toast--canto {
  top: calc(10px + env(safe-area-inset-top));
  left: auto;
  right: 10px;
  transform: none;
  max-width: 60vw;
  padding: 8px 14px;
  border-radius: 10px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.4);
}

.game-toast--canto .game-toast-texto {
  font-size: 0.85rem;
  font-weight: 600;
}

.game-toast-transicao-enter-active,
.game-toast-transicao-leave-active {
  transition: opacity .25s ease, transform .25s ease;
}

.game-toast-transicao-enter,
.game-toast-transicao-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.85);
}

.game-toast-canto-transicao-enter-active,
.game-toast-canto-transicao-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}

.game-toast-canto-transicao-enter,
.game-toast-canto-transicao-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.9);
}
</style>
