<template>
  <div class="fill-height">
    <div v-if="pedirEntrada" class="fill-height d-flex align-center justify-center">
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="5">
            <v-card class="pa-4" elevation="8">
              <v-card-title class="justify-center text-center break-word">
                Entrar na sala {{ $route.params.code }}
              </v-card-title>
              <v-card-text>
                <v-text-field
                  ref="inputNome"
                  v-model="nome"
                  label="Seu nome"
                  maxlength="16"
                  counter
                  outlined
                  dense
                  autofocus
                  @keyup.enter="entrar"
                />
                <div class="d-flex justify-center">
                  <v-btn
                    color="success"
                    rounded
                    class="btn-acao"
                    :disabled="!podeEntrar"
                    :loading="entrando"
                    @click="entrar"
                  >
                    Entrar na sala
                  </v-btn>
                </div>
                <v-alert v-if="erro" type="error" dense class="mt-4">{{ erro }}</v-alert>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <div v-else-if="!gameState" class="fill-height d-flex align-center justify-center">
      <div v-if="roomCode" class="text-center white--text">
        <v-progress-circular indeterminate color="white" size="48" class="mb-3" />
        <p>Reconectando à sala...</p>
      </div>
      <v-alert v-else type="warning" class="ma-4">
        Não foi possível entrar nessa sala. Volte para o início e tente novamente.
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

const CHAVE_PERFIL = 'fodinha_perfil'
const CORES = ['red', 'blue', 'green', 'orange', 'purple', 'teal', 'pink', 'amber darken-2']

export default {
  name: 'Room',

  components: { Lobby, GameBoard },

  data: () => ({
    pedirEntrada: false,
    nome: '',
    cor: '',
    autoPlayStrategy: 'aleatoria',
    entrando: false,
    erro: null,
  }),

  computed: {
    ...mapState(['gameState', 'conectado', 'roomCode']),

    podeEntrar () {
      return this.nome.trim().length > 0
    },
  },

  mounted () {
    if (this.gameState || this.roomCode) return

    const sessao = carregarSessao()
    if (sessao && sessao.roomCode === this.$route.params.code) {
      this.$store.dispatch('retomarSessao', sessao)
      return
    }

    // Chegou por um link de convite direto (ex.: /sala/ABCDE) sem nunca ter
    // passado pela Home: só pede o nome aqui mesmo, sem voltar ao início.
    this.carregarPerfil()
    this.pedirEntrada = true
  },

  methods: {
    carregarPerfil () {
      try {
        const bruto = localStorage.getItem(CHAVE_PERFIL)
        const perfil = bruto && JSON.parse(bruto)
        if (perfil && typeof perfil === 'object') {
          if (perfil.nome) this.nome = perfil.nome
          if (perfil.autoPlayStrategy) this.autoPlayStrategy = perfil.autoPlayStrategy
        }
        this.cor = (perfil && perfil.cor) || CORES[Math.floor(Math.random() * CORES.length)]
      } catch (err) {
        this.cor = CORES[Math.floor(Math.random() * CORES.length)]
      }
    },

    async entrar () {
      if (!this.podeEntrar) return
      this.erro = null
      this.entrando = true
      try {
        await this.$store.dispatch('entrarSala', {
          roomCode: this.$route.params.code,
          nome: this.nome,
          cor: this.cor,
          autoPlayStrategy: this.autoPlayStrategy,
        })
        this.pedirEntrada = false
      } catch (err) {
        this.erro = err.message
      } finally {
        this.entrando = false
      }
    },
  },
}
</script>

<style scoped>
.break-word {
  word-break: break-word;
}

.btn-acao {
  min-width: 180px;
}
</style>
