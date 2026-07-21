<template>
  <v-menu offset-y left>
    <template #activator="{ on, attrs }">
      <v-btn
        icon
        small
        color="white"
        class="btn-idioma"
        :aria-label="$t('idioma.escolher')"
        v-bind="attrs"
        v-on="on"
      >
        <span class="bandeira-atual">{{ bandeiraAtual }}</span>
      </v-btn>
    </template>

    <v-list dense>
      <v-subheader>{{ $t('idioma.titulo') }}</v-subheader>
      <v-list-item
        v-for="idioma in idiomas"
        :key="idioma.codigo"
        @click="escolher(idioma.codigo)"
      >
        <v-list-item-icon class="mr-2">
          <span class="bandeira-opcao">{{ idioma.bandeira }}</span>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ $t('idioma.nomes.' + idioma.codigo) }}</v-list-item-title>
          <v-list-item-subtitle class="caption">
            {{ $t('idioma.descricoes.' + idioma.codigo) }}
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-icon v-if="idioma.codigo === $i18n.locale" class="ml-2">
          <v-icon small color="primary">mdi-check</v-icon>
        </v-list-item-icon>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
import { IDIOMAS, definirIdioma } from '../i18n'

export default {
  name: 'SeletorIdioma',

  data: () => ({
    idiomas: IDIOMAS,
  }),

  computed: {
    bandeiraAtual () {
      const atual = IDIOMAS.find((idioma) => idioma.codigo === this.$i18n.locale)
      return atual ? atual.bandeira : '🌐'
    },
  },

  methods: {
    escolher (codigo) {
      definirIdioma(codigo)
    },
  },
}
</script>

<style scoped>
.bandeira-atual {
  font-size: 1.25rem;
  line-height: 1;
}

.bandeira-opcao {
  font-size: 1.1rem;
  line-height: 1;
}
</style>
