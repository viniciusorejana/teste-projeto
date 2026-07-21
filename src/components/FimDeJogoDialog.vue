<template>
  <v-dialog v-model="dialog" max-width="400" persistent>
    <v-card class="text-center pa-6">
      <div class="d-flex flex-column align-center mb-2">
        <v-icon color="amber darken-1" x-large size="72">mdi-trophy</v-icon>
        <v-card-title class="justify-center pb-0">{{ $t('fimDeJogo.titulo') }}</v-card-title>
      </div>

      <v-card-text v-if="vencedor" class="pt-2">
        <p class="text-h5 font-weight-black success--text mb-1">
          {{ vencedor.name }}
        </p>
        <p class="mb-0">{{ $t('fimDeJogo.venceu') }}</p>
      </v-card-text>

      <v-card-actions class="d-flex flex-column mt-2">
        <v-btn
          v-if="souDono"
          block
          x-large
          color="success"
          :loading="reiniciando"
          @click="$emit('jogar-novamente')"
        >
          {{ $t('fimDeJogo.jogarNovamente') }}
        </v-btn>
        <p v-else class="caption mt-2 mb-0">
          {{ $t('fimDeJogo.aguardandoDono', { nome: nomeDono }) }}
        </p>

        <v-btn text class="mt-3" @click="$emit('sair')">{{ $t('comum.sair') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'FimDeJogoDialog',

  props: {
    value: {
      type: Boolean,
      default: false,
    },
    vencedor: {
      type: Object,
      default: null,
    },
    souDono: {
      type: Boolean,
      default: false,
    },
    nomeDono: {
      type: String,
      default: '',
    },
    reiniciando: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    dialog: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      },
    },
  },
}
</script>
