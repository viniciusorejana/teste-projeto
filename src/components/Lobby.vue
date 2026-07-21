<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5">
        <v-card class="pa-4 painel-mesa" elevation="8">
          <v-card-title class="flex-column">
            <p class="mb-1 text-center">{{ $t('lobby.codigoSala') }}</p>
            <p class="codigo-sala text-center mb-2">{{ gameState.roomCode }}</p>
            <div class="d-flex justify-center flex-wrap">
              <v-btn text small color="primary" class="ma-1" @click="copiarCodigo">
                <v-icon small left>mdi-content-copy</v-icon>
                {{ $t('comum.copiar') }}
              </v-btn>
              <v-btn text small color="primary" class="ma-1" @click="compartilhar">
                <v-icon small left>mdi-share-variant</v-icon>
                {{ $t('comum.compartilhar') }}
              </v-btn>
            </div>
          </v-card-title>

          <v-card-text>
            <v-list dense>
              <v-list-item v-for="j in gameState.jogadores" :key="j.seat">
                <v-list-item-avatar :color="j.color" size="32" class="avatar-jogador">
                  <span class="white--text font-weight-bold">{{ j.name.charAt(0).toUpperCase() }}</span>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ j.name }}
                    <v-chip v-if="j.seat === gameState.meuAssento" x-small class="ml-1">{{ $t('lobby.voceChip') }}</v-chip>
                    <v-chip v-if="j.seat === gameState.ownerSeat" x-small color="amber" class="ml-1">
                      <v-icon x-small left>mdi-crown</v-icon>
                      {{ $t('lobby.donoChip') }}
                    </v-chip>
                    <v-chip v-if="!j.connected" x-small color="grey" text-color="white" class="ml-1">
                      {{ $t('lobby.offline') }}
                    </v-chip>
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>

              <v-list-item v-for="n in slotsVazios" :key="'vazio-' + n" class="slot-vazio">
                <v-list-item-avatar size="32">
                  <v-avatar size="32" color="grey lighten-3" class="avatar-vazio">
                    <v-icon small color="grey">mdi-account-outline</v-icon>
                  </v-avatar>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title class="font-italic grey--text">
                    {{ $t('lobby.aguardandoJogador') }}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>

            <p class="text-center caption mt-2">
              {{ $tc('lobby.jogadoresNaSala', gameState.jogadores.length, { n: gameState.jogadores.length, min: minJogadores }) }}
            </p>

            <div v-if="souDono" class="d-flex justify-center mt-4">
              <v-btn
                color="success"
                rounded
                class="btn-acao"
                :disabled="gameState.jogadores.length < 2"
                :loading="iniciando"
                @click="iniciar"
              >
                {{ $t('lobby.comecar') }}
              </v-btn>
            </div>
            <p v-else class="text-center mt-4">
              {{ $t('lobby.aguardandoDono', { nome: nomeDono }) }}
            </p>

            <v-alert v-if="erro" type="error" dense class="mt-4">
              {{ erro }}
            </v-alert>

            <v-divider class="mt-4 mb-2" />
            <div class="text-center">
              <v-btn text small color="grey darken-1" @click="sair">
                <v-icon small left>mdi-exit-to-app</v-icon>
                {{ $t('lobby.sairDaSala') }}
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="copiado" :timeout="2000" color="success">
      {{ $t('lobby.copiado') }}
    </v-snackbar>
  </v-container>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

const MIN_JOGADORES = 2

export default {
  name: 'Lobby',

  data: () => ({
    iniciando: false,
    erro: null,
    copiado: false,
  }),

  computed: {
    minJogadores: () => MIN_JOGADORES,

    ...mapState(['gameState']),
    ...mapGetters(['souDono']),

    nomeDono () {
      const dono = this.gameState.jogadores.find((j) => j.seat === this.gameState.ownerSeat)
      return dono ? dono.name : this.$t('comum.donoDaSala')
    },

    slotsVazios () {
      return Math.max(0, MIN_JOGADORES - this.gameState.jogadores.length)
    },

    linkConvite () {
      return window.location.href
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
      if (!navigator.clipboard) return
      navigator.clipboard.writeText(this.gameState.roomCode).then(() => {
        this.copiado = true
      }).catch(() => {
        // falha silenciosa: sem permissão de clipboard etc.
      })
    },

    async compartilhar () {
      if (navigator.share) {
        try {
          await navigator.share({
            title: this.$t('jogo.conviteTitulo'),
            text: this.$t('jogo.conviteTexto'),
            url: this.linkConvite,
          })
        } catch (err) {
          // usuário cancelou o compartilhamento ou o browser recusou: sem tratamento necessário.
        }
        return
      }

      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(this.linkConvite)
          this.copiado = true
        } catch (err) {
          // falha silenciosa
        }
      }
    },

    sair () {
      this.$store.dispatch('sairDaSala')
      this.$router.push({ name: 'Home' })
    },
  },
}
</script>

<style scoped>
.codigo-sala {
  font-size: clamp(2rem, 10vw, 3rem);
  font-weight: 900;
  letter-spacing: .3rem;
  line-height: 1.1;
  margin-bottom: 0;
}

/* O Vuetify aplica `justify-content: flex-start` em `.v-list-item__avatar`
   (mesmo elemento raiz do `v-avatar` aqui dentro), sobrepondo o
   `justify-content: center` padrão do avatar e jogando a letra pra esquerda
   do círculo em vez de centralizada. */
.avatar-jogador {
  justify-content: center !important;
}

.slot-vazio {
  opacity: .55;
}

.avatar-vazio {
  border: 2px dashed rgba(0, 0, 0, .3) !important;
}

.btn-acao {
  min-width: 180px;
}

/* Painel em papel com filete dourado: o mesmo material das cartas, pra as
   telas fora da mesa não destoarem do tabuleiro. */
.painel-mesa {
  border-radius: 14px !important;
  background-color: var(--carta-papel) !important;
  background-image: linear-gradient(160deg, #ffffff 0%, var(--carta-papel) 50%, var(--carta-papel-sombra) 100%) !important;
  border: 1px solid rgba(255, 210, 74, .5) !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, .5) !important;
}
</style>