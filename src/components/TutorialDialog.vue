<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="$vuetify.breakpoint.xsOnly"
    :max-width="$vuetify.breakpoint.xsOnly ? undefined : 560"
    :transition="$vuetify.breakpoint.xsOnly ? 'dialog-bottom-transition' : 'dialog-transition'"
    scrollable
  >
    <v-card class="tutorial-card d-flex flex-column white">
      <div class="tutorial-header textura-feltro d-flex align-center justify-space-between px-4 py-3">
        <h2 class="text-h6 font-weight-bold white--text mb-0 fonte-baralho">
          {{ $t('tutorial.titulo', { jogo: $t('jogo.nome') }) }}
        </h2>
        <v-btn icon :aria-label="$t('tutorial.fecharAria')" @click="fechar">
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-divider />

      <v-card-text class="tutorial-body flex-grow-1 pa-0">
        <v-window v-model="passo" class="fill-height">
          <!-- 1. Objetivo e vidas -->
          <v-window-item :value="0">
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold black--text mb-3">
                {{ $t('tutorial.objetivo.titulo') }}
              </h3>
              <p class="black--text">
                {{ $t('tutorial.objetivo.p1', { jogo: $t('jogo.nome') }) }}
              </p>
              <i18n path="tutorial.objetivo.p2" tag="p" class="black--text">
                <template #vidas><strong>{{ $t('tutorial.objetivo.p2Forte') }}</strong></template>
              </i18n>
              <p class="black--text mb-0">
                {{ $t('tutorial.objetivo.p3') }}
              </p>
            </div>
          </v-window-item>

          <!-- 2. Como funciona a rodada -->
          <v-window-item :value="1">
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold black--text mb-3">
                {{ $t('tutorial.rodada.titulo') }}
              </h3>
              <i18n path="tutorial.rodada.p1" tag="p" class="black--text">
                <template #aumentando><strong>{{ $t('tutorial.rodada.p1Forte1') }}</strong></template>
                <template #diminuindo><strong>{{ $t('tutorial.rodada.p1Forte2') }}</strong></template>
              </i18n>
              <i18n path="tutorial.rodada.p2" tag="p" class="black--text">
                <template #vira><strong>{{ $t('tutorial.rodada.p2Forte') }}</strong></template>
              </i18n>
              <p class="black--text mb-0">
                {{ $t('tutorial.rodada.p3') }}
              </p>
            </div>
          </v-window-item>

          <!-- 3. Palpite e fecha a conta -->
          <v-window-item :value="2">
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold black--text mb-3">
                {{ $t('tutorial.palpite.titulo') }}
              </h3>
              <i18n path="tutorial.palpite.p1" tag="p" class="black--text">
                <template #palpite><strong>{{ $t('tutorial.palpite.p1Forte') }}</strong></template>
              </i18n>
              <i18n path="tutorial.palpite.p2" tag="p" class="black--text">
                <template #fechaAConta><strong>{{ $t('tutorial.palpite.p2Forte') }}</strong></template>
              </i18n>
              <p class="black--text mb-0">
                {{ $t('tutorial.palpite.p3') }}
              </p>
              <i18n path="tutorial.palpite.p4" tag="p" class="black--text mt-3 mb-0">
                <template #excecao><strong>{{ $t('tutorial.palpite.p4Forte1') }}</strong></template>
                <template #umaCarta><strong>{{ $t('tutorial.palpite.p4Forte2') }}</strong></template>
              </i18n>
            </div>
          </v-window-item>

          <!-- 4. Força das cartas -->
          <v-window-item :value="3">
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold black--text mb-3">
                {{ $t('tutorial.forca.titulo') }}
              </h3>
              <p class="black--text mb-4">
                {{ $t('tutorial.forca.p1') }}
              </p>

              <!-- Listagem de força: uma linha por rank, da mais forte pra
                   mais fraca, com a barra dando a leitura relativa de
                   imediato. A manilha entra fora da numeração porque não é um
                   rank fixo — depende do vira e ganha de todo o resto. -->
              <div class="ranking">
                <div class="ranking-linha ranking-linha--manilha">
                  <span class="ranking-posicao ranking-posicao--coroa">
                    <v-icon x-small color="#3b2a00">mdi-crown</v-icon>
                  </span>
                  <span class="ranking-carta ranking-carta--manilha">★</span>
                  <span class="ranking-barra">
                    <span class="ranking-barra-fill ranking-barra-fill--manilha" style="width: 100%"></span>
                  </span>
                  <span class="ranking-nome black--text">
                    {{ $t('tutorial.forca.manilhaLinha') }}
                    <small class="ranking-nota">{{ $t('tutorial.forca.manilhaNota') }}</small>
                  </span>
                </div>

                <div
                  v-for="item in rankingForca"
                  :key="item.rank"
                  class="ranking-linha"
                >
                  <span class="ranking-posicao">{{ item.posicao }}</span>
                  <span :class="['ranking-carta', { 'ranking-carta--topo': item.posicao === 1 }]">
                    {{ item.rank }}
                  </span>
                  <span class="ranking-barra">
                    <span class="ranking-barra-fill" :style="{ width: item.forca + '%' }"></span>
                  </span>
                  <span class="ranking-nome black--text">
                    <small v-if="item.posicao === 1" class="ranking-nota ranking-nota--forte">
                      {{ $t('tutorial.forca.notaMaisForte') }}
                    </small>
                    <small v-else-if="item.ultima" class="ranking-nota">
                      {{ $t('tutorial.forca.notaMaisFraca') }}
                    </small>
                  </span>
                </div>
              </div>
              <i18n path="tutorial.forca.p2" tag="p" class="black--text mt-4 mb-0">
                <template #maisForte><strong>{{ $t('tutorial.forca.p2Forte1') }}</strong></template>
                <template #maisFraca><strong>{{ $t('tutorial.forca.p2Forte2') }}</strong></template>
              </i18n>
            </div>
          </v-window-item>

          <!-- 5. Manilha -->
          <v-window-item :value="4">
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold black--text mb-3">
                {{ $t('tutorial.manilha.titulo') }}
              </h3>
              <i18n path="tutorial.manilha.p1" tag="p" class="black--text">
                <template #proximoRank><strong>{{ $t('tutorial.manilha.p1Forte') }}</strong></template>
              </i18n>
              <div class="d-flex align-center justify-center my-3 flex-wrap">
                <div class="mini-carta">
                  <span class="mini-carta-rank black--text">7</span>
                </div>
                <v-icon class="mx-2" color="black">mdi-arrow-right</v-icon>
                <div class="mini-carta mini-carta-manilha">
                  <span class="mini-carta-rank black--text">8</span>
                </div>
              </div>
              <i18n path="tutorial.manilha.exemplo" tag="p" class="black--text text-center mb-4">
                <template #vira><strong>7</strong></template>
                <template #manilha><strong>8</strong></template>
              </i18n>
              <p class="black--text mb-2">
                {{ $t('tutorial.manilha.p2') }}
              </p>
              <div class="mini-carta-row justify-center">
                <div
                  v-for="naipe in naipesOrdenados"
                  :key="naipe.nome"
                  class="mini-carta-wrap"
                >
                  <div class="mini-carta">
                    <span
                      class="mini-carta-naipe"
                      :class="naipe.cor"
                    >{{ naipe.simbolo }}</span>
                  </div>
                  <span class="mini-carta-label black--text">{{ naipe.label }}</span>
                </div>
              </div>
              <p class="black--text mt-3 mb-0 text-center">
                {{ $t('tutorial.manilha.p3') }}
              </p>
            </div>
          </v-window-item>

          <!-- 6. Empate/anulação -->
          <v-window-item :value="5">
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold black--text mb-3">
                {{ $t('tutorial.empate.titulo') }}
              </h3>
              <i18n path="tutorial.empate.p1" tag="p" class="black--text">
                <template #mesmoRank><strong>{{ $t('tutorial.empate.p1Forte') }}</strong></template>
              </i18n>
              <p class="black--text">
                {{ $t('tutorial.empate.p2') }}
              </p>
              <i18n path="tutorial.empate.p3" tag="p" class="black--text mb-0">
                <template #manilhasNuncaAnulam>
                  <strong>{{ $t('tutorial.empate.p3Forte') }}</strong>
                </template>
              </i18n>
            </div>
          </v-window-item>

          <!-- 7. Rodada às cegas -->
          <v-window-item :value="6">
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold black--text mb-3">
                {{ $t('tutorial.cegas.titulo') }}
              </h3>
              <i18n path="tutorial.cegas.p1" tag="p" class="black--text">
                <template #umaCarta><strong>{{ $t('tutorial.cegas.p1Forte') }}</strong></template>
              </i18n>
              <p class="black--text mb-0">
                {{ $t('tutorial.cegas.p2') }}
              </p>
            </div>
          </v-window-item>

          <!-- 8. Vidas e vitória -->
          <v-window-item :value="7">
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold black--text mb-3">
                {{ $t('tutorial.vidas.titulo') }}
              </h3>
              <i18n path="tutorial.vidas.p1" tag="p" class="black--text">
                <template #errouOPalpite><strong>{{ $t('tutorial.vidas.p1Forte') }}</strong></template>
              </i18n>
              <p class="black--text">
                {{ $t('tutorial.vidas.p2') }}
              </p>
              <p class="black--text mb-4">
                {{ $t('tutorial.vidas.p3') }}
              </p>
              <v-btn
                block
                x-large
                color="green darken-1"
                dark
                class="font-weight-bold"
                @click="fechar"
              >
                {{ $t('tutorial.vidas.botao') }}
              </v-btn>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />

      <div class="tutorial-footer px-4 py-3">
        <div class="d-flex justify-center mb-2">
          <button
            v-for="i in 8"
            :key="i"
            type="button"
            class="tutorial-dot"
            :class="{ 'tutorial-dot--ativo': (i - 1) === passo }"
            :aria-label="$t('tutorial.irParaPasso', { n: i })"
            @click="passo = i - 1"
          />
        </div>
        <div class="d-flex align-center justify-space-between">
          <v-btn
            text
            :disabled="passo === 0"
            @click="anterior"
          >
            <v-icon left>mdi-chevron-left</v-icon>
            {{ $t('comum.anterior') }}
          </v-btn>

          <span class="black--text text-caption">
            {{ $t('tutorial.contador', { atual: passo + 1, total: 8 }) }}
          </span>

          <v-btn
            v-if="passo < 7"
            text
            color="green darken-1"
            @click="proximo"
          >
            {{ $t('comum.proximo') }}
            <v-icon right>mdi-chevron-right</v-icon>
          </v-btn>
          <v-btn
            v-else
            text
            color="green darken-1"
            @click="fechar"
          >
            {{ $t('comum.fechar') }}
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
import { RANKS } from '../constants/cartas'

// Só a parte visual do naipe; o nome exibido vem do idioma ativo (naipes.*).
const NAIPES = {
  ouros: { simbolo: '♦', cor: 'red--text' },
  espadas: { simbolo: '♠', cor: 'black--text' },
  copas: { simbolo: '♥', cor: 'red--text' },
  paus: { simbolo: '♣', cor: 'black--text' },
}

export default {
  name: 'TutorialDialog',

  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },

  data () {
    return {
      passo: 0,
    }
  },

  computed: {
    // Ranks da mais forte pra mais fraca (RANKS vem em ordem crescente), com
    // uma força relativa em % só pra dimensionar a barra da listagem.
    rankingForca () {
      const decrescente = [...RANKS].reverse()
      const total = decrescente.length
      return decrescente.map((rank, indice) => ({
        rank,
        posicao: indice + 1,
        ultima: indice === total - 1,
        forca: Math.round(((total - indice) / total) * 100),
      }))
    },

    // Do naipe mais fraco pro mais forte no desempate entre manilhas.
    naipesOrdenados () {
      return ['ouros', 'espadas', 'copas', 'paus'].map((nome) => ({
        nome,
        ...NAIPES[nome],
        label: this.$t('naipes.' + nome),
      }))
    },

    dialog: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      },
    },
  },

  watch: {
    value (aberto) {
      if (aberto) {
        this.passo = 0
      }
    },
  },

  methods: {
    fechar () {
      this.$emit('input', false)
    },
    proximo () {
      if (this.passo < 7) {
        this.passo++
      } else {
        this.fechar()
      }
    },
    anterior () {
      if (this.passo > 0) {
        this.passo--
      }
    },
  },
}
</script>

<style type="text/css" scoped>
.tutorial-card {
  height: 100%;
  max-height: 100%;
  border-radius: 12px;
}

.tutorial-header {
  flex: 0 0 auto;
  /* Filete dourado separando o "feltro" do cabeçalho do corpo em papel. */
  border-bottom: 2px solid var(--ouro);
  box-shadow: inset 0 -6px 12px rgba(0, 0, 0, .25);
}

/* Corpo em papel, pra contrastar com o feltro do cabeçalho. */
.tutorial-body {
  background-color: var(--carta-papel);
  background-image: linear-gradient(180deg, #ffffff 0%, var(--carta-papel) 100%);
}

.tutorial-body >>> h3 {
  font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
}

/* ---- Listagem de força das cartas ---- */

.ranking {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ranking-linha {
  display: grid;
  grid-template-columns: 22px 34px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 3px 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, .025);
}

.ranking-linha--manilha {
  background: linear-gradient(90deg, rgba(255, 210, 74, .35), rgba(255, 210, 74, .08));
  margin-bottom: 5px;
}

.ranking-posicao {
  font-size: .7rem;
  font-weight: 700;
  color: rgba(0, 0, 0, .45);
  text-align: right;
}

.ranking-posicao--coroa {
  text-align: center;
}

/* Cada item da listagem é uma carta em miniatura, não só um número. */
.ranking-carta {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  border-radius: 4px;
  font-weight: 800;
  font-size: .85rem;
  color: var(--carta-preto);
  background-color: var(--carta-papel);
  background-image: linear-gradient(150deg, #fff, var(--carta-papel-sombra));
  box-shadow:
    0 1px 2px rgba(0, 0, 0, .28),
    inset 0 0 0 1px var(--carta-borda);
}

.ranking-carta--topo {
  box-shadow:
    0 1px 3px rgba(0, 0, 0, .3),
    inset 0 0 0 2px var(--ouro);
}

.ranking-carta--manilha {
  color: var(--ouro-escuro);
  font-size: 1rem;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, .3),
    inset 0 0 0 2px var(--ouro);
}

.ranking-barra {
  display: block;
  height: 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, .08);
  overflow: hidden;
}

.ranking-barra-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #66bb6a, #2e7d32);
}

.ranking-barra-fill--manilha {
  background: linear-gradient(90deg, #ffe17a, var(--ouro-escuro));
}

.ranking-nome {
  font-size: .72rem;
  min-width: 62px;
  text-align: right;
}

.ranking-nota {
  color: rgba(0, 0, 0, .5);
  font-style: italic;
}

.ranking-nota--forte {
  color: var(--ouro-escuro);
  font-style: normal;
  font-weight: 700;
}

.tutorial-body {
  overflow-y: auto;
  min-height: 320px;
}

.tutorial-footer {
  flex: 0 0 auto;
  padding-bottom: calc(12px + env(safe-area-inset-bottom)) !important;
}

.tutorial-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.2);
  border: none;
  margin: 0 4px;
  padding: 0;
  cursor: pointer;
  transition: background-color .2s ease-in-out, transform .2s ease-in-out;
}

.tutorial-dot--ativo {
  background-color: #2e7d32;
  transform: scale(1.3);
}

.mini-carta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.mini-carta-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mini-carta {
  min-width: 34px;
  height: 46px;
  border: 1px solid rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  flex: 0 0 auto;
}

.mini-carta-manilha {
  outline: 2px solid #ffd600;
}

.mini-carta-rank {
  font-weight: 700;
  font-size: 0.95rem;
}

.mini-carta-naipe {
  font-size: 1.3rem;
  font-weight: 700;
}

.mini-carta-label {
  font-size: 0.7rem;
  margin-top: 2px;
}
</style>
