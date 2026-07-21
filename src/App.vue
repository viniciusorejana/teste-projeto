<template>
  <v-app class="tudo textura-feltro">
    <router-view />

    <!-- Seletor de idioma global: fica acima de qualquer tela (início, lobby,
         mesa) pra que dê pra trocar de idioma a qualquer momento. Na mesa ele
         cai exatamente sobre o espaçador vazio da barra superior. -->
    <div class="seletor-idioma-fixo">
      <SeletorIdioma />
    </div>

    <v-btn
      v-if="mostrarFabAjuda"
      fab
      fixed
      bottom
      right
      color="secondary"
      class="fab-ajuda"
      :aria-label="$t('comum.comoJogar')"
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
import SeletorIdioma from './components/SeletorIdioma.vue'

export default {
  name: 'App',

  components: { TutorialDialog, SeletorIdioma },

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
}
</script>

<style scoped>
/* O fundo agora vem da textura de feltro (styles/tema.css); aqui fica só o
   comportamento de rolagem. */
.tudo {
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

.seletor-idioma-fixo {
  position: fixed;
  top: calc(6px + env(safe-area-inset-top));
  right: calc(6px + env(safe-area-inset-right));
  z-index: 25;
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
