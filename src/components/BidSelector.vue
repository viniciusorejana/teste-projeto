<template>
  <div class="text-center">
    <p class="white--text font-weight-bold mb-2">Quantas você vai fazer?</p>
    <div class="d-flex flex-wrap justify-center opcoes-palpite">
      <v-btn
        v-for="valor in opcoes"
        :key="valor"
        class="ma-1"
        fab
        :disabled="enviando !== null || valor === palpiteProibido"
        :loading="enviando === valor"
        color="white"
        @click="escolher(valor)"
      >
        {{ valor }}
      </v-btn>
    </div>
    <p v-if="palpiteProibido !== null" class="caption white--text mt-1 aviso-proibido">
      Você não pode palpitar {{ palpiteProibido }} (fecharia a conta certinha)
    </p>
  </div>
</template>

<script>
// Mesma regra de server/src/game/bids.js: espelhada aqui só pra desabilitar
// no cliente o valor que o servidor recusaria, evitando erro por tentativa.
function calcularPalpiteProibido (tamanhoMao, somaDosOutrosPalpites) {
  const proibido = tamanhoMao - somaDosOutrosPalpites
  return proibido >= 0 && proibido <= tamanhoMao ? proibido : null
}

export default {
  name: 'BidSelector',

  props: {
    tamanhoMao: { type: Number, required: true },
    jogadores: { type: Array, default: () => [] },
    meuSeat: { type: Number, default: null },
  },

  data: () => ({
    enviando: null,
  }),

  computed: {
    opcoes () {
      const lista = []
      for (let i = 0; i <= this.tamanhoMao; i++) lista.push(i)
      return lista
    },

    souOUltimoAPalpitar () {
      return this.jogadores
        .filter((j) => !j.eliminated && j.seat !== this.meuSeat)
        .every((j) => j.bid !== null && j.bid !== undefined)
    },

    palpiteProibido () {
      // Exceção do servidor (engine.js): na mão de 1 carta a soma pode fechar
      // certinho — é a única rodada em que todo mundo pode acertar o palpite
      // e ninguém é obrigado a errar.
      if (!this.souOUltimoAPalpitar || this.tamanhoMao === 1) return null
      const soma = this.jogadores
        .filter((j) => !j.eliminated && j.seat !== this.meuSeat)
        .reduce((total, j) => total + (j.bid || 0), 0)
      return calcularPalpiteProibido(this.tamanhoMao, soma)
    },
  },

  methods: {
    async escolher (valor) {
      this.enviando = valor
      try {
        await this.$store.dispatch('enviarPalpite', valor)
      } catch (err) {
        this.$emit('erro', err.message)
      } finally {
        this.enviando = null
      }
    },
  },
}
</script>

<style scoped>
.opcoes-palpite .v-btn {
  min-width: 56px;
  min-height: 56px;
}

.aviso-proibido {
  opacity: 0.85;
}
</style>
