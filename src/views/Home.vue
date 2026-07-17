<template>
  <v-container class="fill-height" fluid>
    <v-row
      :align="$vuetify.breakpoint.xsOnly ? 'start' : 'center'"
      justify="center"
      :class="{ 'pt-6': $vuetify.breakpoint.xsOnly }"
    >
      <v-col cols="12" sm="8" md="5">
        <v-card class="pa-4" elevation="8">
          <div class="cartas-decorativas d-flex justify-center mb-1">
            <div class="mini-carta carta-esq"><span class="naipe-preto">&#9824;</span></div>
            <div class="mini-carta carta-centro"><span class="naipe-vermelho">&#9829;</span></div>
            <div class="mini-carta carta-dir"><span class="naipe-vermelho">&#9830;</span></div>
          </div>

          <v-card-title class="justify-center display-1 font-weight-black pt-0">
            <span class="naipe-preto mr-2">&#9827;</span>
            Fodinha
            <span class="naipe-preto ml-2">&#9824;</span>
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
              @focus="aoFocar"
            />

            <p class="mb-2 font-weight-medium">Sua cor</p>
            <div class="d-flex flex-wrap mb-4">
              <v-avatar
                v-for="c in cores"
                :key="c"
                :color="c"
                :class="['ma-1', 'cor-avatar', { 'cor-selecionada': cor === c }]"
                size="44"
                @click="cor = c"
              >
                <v-icon v-if="cor === c" color="white">mdi-check</v-icon>
              </v-avatar>
            </div>

            <p class="mb-2 font-weight-medium">Jogada automática (se o tempo esgotar)</p>
            <v-btn-toggle
              v-model="autoPlayStrategy"
              mandatory
              dense
              color="primary"
              class="mb-4 toggle-estrategia"
            >
              <v-btn value="maior" small>Maior carta</v-btn>
              <v-btn value="menor" small>Menor carta</v-btn>
              <v-btn value="aleatoria" small>Aleatória</v-btn>
            </v-btn-toggle>
            <p class="caption grey--text text--darken-1 mt-n3 mb-4">
              Cada jogada tem 45s. Se o tempo acabar na hora de jogar uma
              carta, o jogo escolhe por você seguindo essa preferência — pode
              trocar a qualquer momento durante a partida. No palpite, se o
              tempo esgotar, a escolha é sempre um valor aleatório válido
              (essa preferência não vale pra ele).
            </p>

            <div class="d-flex justify-center mb-3">
              <v-btn
                color="success"
                rounded
                class="btn-acao"
                :disabled="!podeSubmeter"
                :loading="criando"
                @click="criarSala"
              >
                Criar sala
              </v-btn>
            </div>

            <v-divider class="mb-3" />

            <v-text-field
              ref="inputCodigo"
              v-model="codigoSala"
              label="Código da sala"
              maxlength="5"
              outlined
              dense
              autocapitalize="characters"
              @focus="aoFocar"
              @input="codigoSala = codigoSala.toUpperCase()"
            />
            <div class="d-flex justify-center">
              <v-btn
                color="primary"
                rounded
                class="btn-acao"
                :disabled="!podeSubmeter || !codigoSala"
                :loading="entrando"
                @click="entrarSala"
              >
                Entrar na sala
              </v-btn>
            </div>

            <v-alert v-if="erro" type="error" dense class="mt-4">
              {{ erro }}
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- TODO(integração): trocar por TutorialDialog global quando disponível -->
        <div class="text-center mt-4 mb-2">
          <v-btn text color="white" class="btn-tutorial" @click="abrirTutorial">
            <v-icon left>mdi-help-circle-outline</v-icon>
            Como jogar?
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
const CHAVE_PERFIL = 'fodinha_perfil'

export default {
  name: 'Home',

  data: () => ({
    nome: '',
    cor: '',
    autoPlayStrategy: 'aleatoria',
    codigoSala: '',
    criando: false,
    entrando: false,
    erro: null,
    cores: ['red', 'blue', 'green', 'orange', 'purple', 'teal', 'pink', 'amber darken-2'],
  }),

  computed: {
    podeSubmeter () {
      return this.nome.trim().length > 0 && this.cor !== ''
    },
  },

  watch: {
    nome () {
      this.salvarPerfil()
    },
    cor () {
      this.salvarPerfil()
    },
    autoPlayStrategy () {
      this.salvarPerfil()
    },
  },

  mounted () {
    this.carregarPerfil()
  },

  methods: {
    async criarSala () {
      this.erro = null
      this.criando = true
      try {
        const roomCode = await this.$store.dispatch('criarSala', {
          nome: this.nome,
          cor: this.cor,
          autoPlayStrategy: this.autoPlayStrategy,
        })
        this.$router.push({ name: 'Room', params: { code: roomCode } })
      } catch (err) {
        this.erro = err.message
      } finally {
        this.criando = false
      }
    },

    async entrarSala () {
      this.erro = null
      this.entrando = true
      try {
        const roomCode = await this.$store.dispatch('entrarSala', {
          roomCode: this.codigoSala.trim(),
          nome: this.nome,
          cor: this.cor,
          autoPlayStrategy: this.autoPlayStrategy,
        })
        this.$router.push({ name: 'Room', params: { code: roomCode } })
      } catch (err) {
        this.erro = err.message
      } finally {
        this.entrando = false
      }
    },

    carregarPerfil () {
      try {
        const bruto = localStorage.getItem(CHAVE_PERFIL)
        if (!bruto) return
        const perfil = JSON.parse(bruto)
        if (perfil && typeof perfil === 'object') {
          if (perfil.nome) this.nome = perfil.nome
          if (perfil.cor) this.cor = perfil.cor
          if (perfil.autoPlayStrategy) this.autoPlayStrategy = perfil.autoPlayStrategy
        }
      } catch (err) {
        // localStorage indisponível (modo privado etc.): segue sem pré-preenchimento.
      }
    },

    salvarPerfil () {
      try {
        localStorage.setItem(CHAVE_PERFIL, JSON.stringify({
          nome: this.nome,
          cor: this.cor,
          autoPlayStrategy: this.autoPlayStrategy,
        }))
      } catch (err) {
        // localStorage indisponível: sem persistência, sem quebrar o app.
      }
    },

    aoFocar (event) {
      const el = event && event.target
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    },

    abrirTutorial () {
      this.$store.commit('SET_MOSTRAR_TUTORIAL', true)
    },
  },
};
</script>

<style scoped>
.cor-avatar {
  cursor: pointer;
  border: 3px solid transparent;
  transition: all .15s ease-in-out;
}

.cor-selecionada {
  border-color: white;
  transform: scale(1.15);
}

.cartas-decorativas {
  height: 44px;
}

.mini-carta {
  width: 34px;
  height: 48px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, .25);
  border: 1px solid rgba(0, 0, 0, .1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 1;
}

.carta-esq {
  transform: rotate(-16deg) translate(8px, 4px);
  z-index: 1;
}

.carta-centro {
  transform: translateY(-6px);
  z-index: 2;
}

.carta-dir {
  transform: rotate(16deg) translate(-8px, 4px);
  z-index: 1;
}

.naipe-preto {
  color: #212121;
}

.naipe-vermelho {
  color: #d32f2f;
}

.btn-tutorial {
  min-height: 44px;
  padding: 0 20px;
}

.btn-acao {
  min-width: 180px;
}

.toggle-estrategia {
  width: 100%;
  flex-wrap: wrap;
  height: auto !important;
}

.toggle-estrategia .v-btn {
  flex: 1 1 auto;
  min-height: 40px;
}

@media (max-width: 599px) {
  .fill-height {
    align-items: flex-start;
  }
}
</style>
