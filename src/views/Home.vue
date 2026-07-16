<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5">
        <v-card class="pa-4" elevation="8">
          <v-card-title class="justify-center display-1 font-weight-black">
            Fodinha
          </v-card-title>

          <v-card-text>
            <v-text-field
              v-model="nome"
              label="Seu nome"
              maxlength="16"
              counter
              outlined
              dense
            />

            <p class="mb-2 font-weight-medium">Sua cor</p>
            <div class="d-flex flex-wrap mb-4">
              <v-avatar
                v-for="c in cores"
                :key="c"
                :color="c"
                :class="['ma-1', 'cor-avatar', { 'cor-selecionada': cor === c }]"
                size="36"
                @click="cor = c"
              >
                <v-icon v-if="cor === c" color="white" small>mdi-check</v-icon>
              </v-avatar>
            </div>

            <v-btn
              block
              color="success"
              class="mb-3"
              :disabled="!podeSubmeter"
              :loading="criando"
              @click="criarSala"
            >
              Criar sala
            </v-btn>

            <v-divider class="mb-3" />

            <v-text-field
              v-model="codigoSala"
              label="Código da sala"
              maxlength="5"
              outlined
              dense
              @input="codigoSala = codigoSala.toUpperCase()"
            />
            <v-btn
              block
              color="primary"
              :disabled="!podeSubmeter || !codigoSala"
              :loading="entrando"
              @click="entrarSala"
            >
              Entrar na sala
            </v-btn>

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
export default {
  name: 'Home',

  data: () => ({
    nome: '',
    cor: '',
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

  methods: {
    async criarSala () {
      this.erro = null
      this.criando = true
      try {
        const roomCode = await this.$store.dispatch('criarSala', { nome: this.nome, cor: this.cor })
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
        })
        this.$router.push({ name: 'Room', params: { code: roomCode } })
      } catch (err) {
        this.erro = err.message
      } finally {
        this.entrando = false
      }
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
</style>
