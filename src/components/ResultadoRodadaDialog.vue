<template>
  <v-bottom-sheet v-if="$vuetify.breakpoint.xsOnly" v-model="dialog" inset>
    <v-card v-if="resultado">
      <v-card-title>{{ $t('resultado.titulo', { n: resultado.rodada }) }}</v-card-title>

      <v-divider />

      <v-list class="py-0" two-line>
        <v-list-item
          v-for="r in resultado.jogadores"
          :key="r.seat"
          :class="['linha-jogador', 'px-4', r.delta === 0 ? 'linha-acerto' : 'linha-erro']"
        >
          <v-list-item-avatar color="grey darken-1" size="36">
            <span class="white--text font-weight-bold">{{ inicial(r.name) }}</span>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title class="font-weight-bold">
              {{ r.name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ $t('resultado.palpitouFez', { bid: r.bid, made: r.made }) }}
            </v-list-item-subtitle>
            <div class="mt-1 coracoes">
              <v-icon
                v-for="i in 5"
                :key="i"
                x-small
                :color="r.lives >= i ? 'red' : 'grey lighten-1'"
              >
                {{ r.lives >= i ? 'mdi-heart' : 'mdi-heart-outline' }}
              </v-icon>
            </div>
          </v-list-item-content>

          <v-list-item-action class="text-center">
            <template v-if="r.delta === 0">
              <v-icon color="success">mdi-check-circle</v-icon>
              <div class="caption success--text font-weight-bold mt-1">
                {{ $t('resultado.acertou') }}
              </div>
            </template>
            <template v-else>
              <v-icon color="error">mdi-close-circle</v-icon>
              <div class="caption error--text font-weight-bold mt-1">
                {{ $tc('resultado.perdeuVidas', r.delta, { n: r.delta }) }}
              </div>
            </template>
          </v-list-item-action>
        </v-list-item>
      </v-list>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="fechar">{{ $t('comum.fechar') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>

  <v-dialog v-else v-model="dialog" max-width="420">
    <v-card v-if="resultado">
      <v-card-title>{{ $t('resultado.titulo', { n: resultado.rodada }) }}</v-card-title>

      <v-divider />

      <v-list class="py-0" two-line>
        <v-list-item
          v-for="r in resultado.jogadores"
          :key="r.seat"
          :class="['linha-jogador', 'px-4', r.delta === 0 ? 'linha-acerto' : 'linha-erro']"
        >
          <v-list-item-avatar color="grey darken-1" size="36">
            <span class="white--text font-weight-bold">{{ inicial(r.name) }}</span>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title class="font-weight-bold">
              {{ r.name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ $t('resultado.palpitouFez', { bid: r.bid, made: r.made }) }}
            </v-list-item-subtitle>
            <div class="mt-1 coracoes">
              <v-icon
                v-for="i in 5"
                :key="i"
                x-small
                :color="r.lives >= i ? 'red' : 'grey lighten-1'"
              >
                {{ r.lives >= i ? 'mdi-heart' : 'mdi-heart-outline' }}
              </v-icon>
            </div>
          </v-list-item-content>

          <v-list-item-action class="text-center">
            <template v-if="r.delta === 0">
              <v-icon color="success">mdi-check-circle</v-icon>
              <div class="caption success--text font-weight-bold mt-1">
                {{ $t('resultado.acertou') }}
              </div>
            </template>
            <template v-else>
              <v-icon color="error">mdi-close-circle</v-icon>
              <div class="caption error--text font-weight-bold mt-1">
                {{ $tc('resultado.perdeuVidas', r.delta, { n: r.delta }) }}
              </div>
            </template>
          </v-list-item-action>
        </v-list-item>
      </v-list>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="fechar">{{ $t('comum.fechar') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'ResultadoRodadaDialog',

  props: {
    value: {
      type: Boolean,
      default: false,
    },
    resultado: {
      type: Object,
      default: null,
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

  methods: {
    inicial (nome) {
      return nome ? nome.charAt(0).toUpperCase() : '?'
    },
    fechar () {
      this.$emit('input', false)
    },
  },
}
</script>

<style scoped>
.linha-jogador {
  border-left: 4px solid transparent;
}

.linha-acerto {
  border-left-color: var(--v-success-base, #4caf50);
}

.linha-erro {
  border-left-color: var(--v-error-base, #ff5252);
}

.coracoes {
  line-height: 1;
}
</style>
