<template>
  <div class="fill-height">
    <div v-if="!gameState" class="fill-height d-flex align-center justify-center">
      <div v-if="roomCode" class="text-center white--text">
        <v-progress-circular indeterminate color="white" size="48" class="mb-3" />
        <p>Reconectando à sala...</p>
      </div>
      <v-alert v-else type="warning" class="ma-4">
        Você não está conectado a essa sala. Volte para o início e entre novamente.
        <div class="mt-3">
          <v-btn small color="white" text @click="$router.push({ name: 'Home' })">
            Voltar ao início
          </v-btn>
        </div>
      </v-alert>
    </div>

    <Lobby v-else-if="gameState.fase === 'lobby'" />
    <GameBoard v-else />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Lobby from '../components/Lobby.vue'
import GameBoard from '../components/GameBoard.vue'
import { carregarSessao } from '../services/sessao'

export default {
  name: 'Room',

  components: { Lobby, GameBoard },

  computed: {
    ...mapState(['gameState', 'conectado', 'roomCode']),
  },

  mounted () {
    if (this.gameState || this.roomCode) return

    const sessao = carregarSessao()
    if (sessao && sessao.roomCode === this.$route.params.code) {
      this.$store.dispatch('retomarSessao', sessao)
    } else {
      // Sem sessão salva pra essa sala: não dá pra reconstruir nome/cor sozinho.
      this.$router.replace({ name: 'Home' })
    }
  },
};
</script>
