<template>
  <div class="text-center">
    <p class="white--text font-weight-bold mb-2">Quantas você vai fazer?</p>
    <v-btn
      v-for="valor in opcoes"
      :key="valor"
      class="ma-1"
      fab
      small
      :loading="enviando === valor"
      :disabled="enviando !== null"
      color="white"
      @click="escolher(valor)"
    >
      {{ valor }}
    </v-btn>
  </div>
</template>

<script>
export default {
  name: 'BidSelector',

  props: {
    tamanhoMao: { type: Number, required: true },
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
