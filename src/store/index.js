import Vue from 'vue'
import Vuex from 'vuex'
import { socket, emitir } from '../services/socket'
import { salvarSessao, limparSessao } from '../services/sessao'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    conectado: false,
    roomCode: null,
    meuId: null, // token estável da sessão (não é o socket.id)
    meuNome: '',
    minhaCor: '',
    gameState: null,
    erro: null,
    mostrarTutorial: false,
  },

  getters: {
    meuJogador (state) {
      if (!state.gameState) return null
      return state.gameState.jogadores.find((j) => j.seat === state.gameState.meuAssento) || null
    },
    souDealer (state) {
      if (!state.gameState) return false
      return state.gameState.dealerSeat === state.gameState.meuAssento
    },
    ehMinhaVez (state) {
      if (!state.gameState) return false
      return state.gameState.turnoSeat === state.gameState.meuAssento
    },
    souDono (state) {
      if (!state.gameState) return false
      return state.gameState.ownerSeat === state.gameState.meuAssento
    },
  },

  mutations: {
    SET_CONECTADO (state, valor) {
      state.conectado = valor
    },
    SET_GAME_STATE (state, gameState) {
      state.gameState = gameState
    },
    SET_ROOM_CODE (state, roomCode) {
      state.roomCode = roomCode
    },
    SET_MEU_ID (state, id) {
      state.meuId = id
    },
    SET_PERFIL (state, { nome, cor }) {
      state.meuNome = nome
      state.minhaCor = cor
    },
    SET_ERRO (state, erro) {
      state.erro = erro
    },
    SET_MOSTRAR_TUTORIAL (state, valor) {
      state.mostrarTutorial = valor
    },
    RESET (state) {
      state.roomCode = null
      state.meuId = null
      state.gameState = null
      state.erro = null
    },
  },

  actions: {
    conectar () {
      if (!socket.connected) socket.connect()
    },

    async criarSala ({ commit, dispatch }, { nome, cor, autoPlayStrategy }) {
      dispatch('conectar')
      if (!socket.connected) await new Promise((resolve) => socket.once('connect', resolve))
      commit('SET_PERFIL', { nome, cor })
      const resp = await emitir('room:create', { name: nome, color: cor, autoPlayStrategy })
      commit('SET_MEU_ID', resp.playerToken)
      commit('SET_ROOM_CODE', resp.roomCode)
      salvarSessao({ roomCode: resp.roomCode, playerToken: resp.playerToken, nome, cor })
      return resp.roomCode
    },

    async entrarSala ({ commit, dispatch }, { roomCode, nome, cor, autoPlayStrategy }) {
      dispatch('conectar')
      if (!socket.connected) await new Promise((resolve) => socket.once('connect', resolve))
      commit('SET_PERFIL', { nome, cor })
      const resp = await emitir('room:join', { roomCode, name: nome, color: cor, autoPlayStrategy })
      commit('SET_MEU_ID', resp.playerToken)
      commit('SET_ROOM_CODE', resp.roomCode)
      salvarSessao({ roomCode: resp.roomCode, playerToken: resp.playerToken, nome, cor })
      return resp.roomCode
    },

    // Restaura uma sessão salva no navegador (F5, aba fechada e reaberta...).
    // A reconexão de fato acontece quando o socket conectar (ver listener
    // 'connect' abaixo), que já vai encontrar roomCode/meuId preenchidos.
    retomarSessao ({ commit, dispatch }, sessao) {
      commit('SET_PERFIL', { nome: sessao.nome, cor: sessao.cor })
      commit('SET_ROOM_CODE', sessao.roomCode)
      commit('SET_MEU_ID', sessao.playerToken)
      dispatch('conectar')
    },

    sairDaSala ({ commit }) {
      limparSessao()
      commit('RESET')
      socket.disconnect()
    },

    iniciarPartida () {
      return emitir('game:start')
    },

    distribuirCartas () {
      return emitir('round:deal')
    },

    enviarPalpite (context, valor) {
      return emitir('bid:submit', { valor })
    },

    jogarCarta (context, cartaId) {
      return emitir('card:play', { cartaId })
    },

    atualizarEstrategiaAutomatica (context, estrategia) {
      return emitir('jogador:estrategia', { estrategia })
    },
  },
})

// Listeners registrados uma única vez (módulo é um singleton), independente
// de quantas vezes as actions acima forem despachadas.
socket.on('connect', () => {
  store.commit('SET_CONECTADO', true)
  const { roomCode, meuId } = store.state
  if (roomCode && meuId) {
    emitir('room:rejoin', { roomCode, playerToken: meuId }).catch(() => {
      limparSessao()
      store.commit('RESET')
    })
  }
})

socket.on('disconnect', () => store.commit('SET_CONECTADO', false))
socket.on('game:state', (estado) => store.commit('SET_GAME_STATE', estado))

export default store
