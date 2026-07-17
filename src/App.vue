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
      @click="mostrarTutorial = true"
    >
      <v-icon color="#212121">mdi-help</v-icon>
    </v-btn>

    <TutorialDialog v-model="mostrarTutorial" />
  </v-app>
</template>

<script>
import { mapState } from 'vuex'
import TutorialDialog from './components/TutorialDialog.vue'

export default {
  name: 'App',

  components: { TutorialDialog },

  data: () => ({
    mostrarTutorial: false,
  }),

  computed: {
    ...mapState(['gameState']),

    // Durante a partida (fora do lobby) o GameBoard já tem seu próprio ícone
    // de ajuda na barra superior, mais perto da mão de cartas em mobile — o
    // FAB global fica oculto pra não sobrepor a mão.
    mostrarFabAjuda () {
      if (this.$route.name !== 'Room') return true
      if (!this.gameState) return true
      return this.gameState.fase === 'lobby'
    },
  },
};
</script>

<style scoped>
.tudo {
  background: radial-gradient(ellipse at center, #1e6b26 0%, #123d16 100%) !important;
  overflow: hidden !important;
}

.fab-ajuda {
  bottom: calc(16px + env(safe-area-inset-bottom)) !important;
  right: calc(16px + env(safe-area-inset-right)) !important;
  z-index: 20;
}
</style>
