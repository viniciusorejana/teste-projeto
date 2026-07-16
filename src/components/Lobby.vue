<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5">
        <v-card class="pa-4" elevation="8">
          <v-card-title class="justify-center">
            <div class="text-center">
              <p class="mb-1">Código da sala</p>
              <p class="display-1 font-weight-black">
                {{ gameState.roomCode }}
                <v-btn icon small @click="copiarCodigo">
                  <v-icon small>mdi-content-copy</v-icon>
                </v-btn>
              </p>
            </div>
          </v-card-title>

          <v-card-text>
            <v-list dense>
              <v-list-item v-for="j in gameState.jogadores" :key="j.seat">
                <v-list-item-avatar :color="j.color" size="32">
                  <span class="white--text font-weight-bold">{{ j.name.charAt(0).toUpperCase() }}</span>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ j.name }}
                    <v-chip v-if="j.seat === gameState.meuAssento" x-small class="ml-1">você</v-chip>
                    <v-chip v-if="j.seat === gameState.ownerSeat" x-small color="amber" class="ml-1">
                      <v-icon x-small left>mdi-crown</v-icon>
                      dono
                    </v-chip>
                    <v-chip v-if="!j.connected" x-small color="grey" text-color="white" class="ml-1">
                      offline
                    </v-chip>
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>

            <p class="text-center caption mt-2">
              {{ gameState.jogadores.length }} jogador(es) na sala (mínimo 2 para começar)
            </p>

            <v-btn
              v-if="souDono"
              block
              color="success"
              class="mt-4"
              :disabled="gameState.jogadores.length < 2"
              :loading="iniciando"
              @click="iniciar"
            >
              Começar
            </v-btn>
            <p v-else class="text-center mt-4">
              Aguardando {{ nomeDono }} começar a partida...
            </p>

            <v-alert v-if="erro" type="error" dense class="mt-4">
              {{ erro }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'Lobby',

  data: () => ({
    iniciando: false,
    erro: null,
  }),

  computed: {
    ...mapState(['gameState']),
    ...mapGetters(['souDono']),

    nomeDono () {
      const dono = this.gameState.jogadores.find((j) => j.seat === this.gameState.ownerSeat)
      return dono ? dono.name : 'o dono da sala'
    },
  },

  methods: {
    async iniciar () {
      this.erro = null
      this.iniciando = true
      try {
        await this.$store.dispatch('iniciarPartida')
      } catch (err) {
        this.erro = err.message
      } finally {
        this.iniciando = false
      }
    },

    copiarCodigo () {
      navigator.clipboard && navigator.clipboard.writeText(this.gameState.roomCode)
    },
  },
};
</script>
