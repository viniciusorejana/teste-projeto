<template>
  <v-app class="tudo">
    <router-view />

    <v-btn
      v-if="mostrarFabAjuda"
      fab
      fixed
      bottom
      right
      color="secondary"
      class="fab-ajuda"
      aria-label="Como jogar"
      @click="abrirTutorial"
    >
      <v-icon color="#212121">mdi-help</v-icon>
    </v-btn>

    <TutorialDialog v-model="mostrarTutorialModel" />
  </v-app>
</template>

<script>
import { mapState } from 'vuex'
import TutorialDialog from './components/TutorialDialog.vue'

export default {
  name: 'App',

  components: { TutorialDialog },

  computed: {
    ...mapState(['gameState', 'mostrarTutorial']),

    // Durante a partida (fora do lobby) o GameBoard já tem seu próprio ícone
    // de ajuda no centro da mesa — o FAB global fica oculto pra não sobrepor
    // a mão de cartas em mobile.
    mostrarFabAjuda () {
      if (this.$route.name !== 'Room') return true
      if (!this.gameState) return true
      return this.gameState.fase === 'lobby'
    },

    // Estado do tutorial vive no store pra qualquer tela (ex.: Home.vue) poder
    // abri-lo, não só o FAB daqui.
    mostrarTutorialModel: {
      get () {
        return this.mostrarTutorial
      },
      set (valor) {
        this.$store.commit('SET_MOSTRAR_TUTORIAL', valor)
      },
    },
  },

  methods: {
    abrirTutorial () {
      this.$store.commit('SET_MOSTRAR_TUTORIAL', true)
    },
  },
};
</script>

<style scoped>
.tudo {
  background: radial-gradient(ellipse at center, #1e6b26 0%, #123d16 100%) !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  /* Some telas (mais jogadores, mão grande) passam de 100vh de altura; deixa
     rolar em vez de cortar o conteúdo embaixo, mas sem mostrar a barra de
     rolagem nativa (fica parecendo um app, não uma página que "vaza"). */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tudo::-webkit-scrollbar {
  display: none;
}

.fab-ajuda {
  bottom: calc(16px + env(safe-area-inset-bottom)) !important;
  right: calc(16px + env(safe-area-inset-right)) !important;
  z-index: 20;
}
</style>

<style>
/* O Vuetify força `overflow-y: scroll` no <html> pra reservar sempre o
   espaço da barra de rolagem (evita "pulo" de layout entre telas com e sem
   scroll) — isso deixa uma barra vazia sempre visível. Quem rola de verdade
   é o .tudo acima (com a barra já escondida), então aqui só neutraliza essa
   barra externa também. */
html {
  overflow-y: auto !important;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

html::-webkit-scrollbar {
  display: none;
}
</style>
