import { io } from 'socket.io-client'
import i18n from '../i18n'

// Se VUE_APP_SERVER_URL estiver definido (deploy com servidores separados),
// usa esse valor. Senão, detecta o servidor dinamicamente: o front-end foi
// servido por algum servidor HTTP, então o Socket.io do back-end está no
// mesmo host (window.location.origin, que já inclui protocol+hostname+porta).
// Isso funciona em localhost, IP público, render.com, etc.
const URL = process.env.VUE_APP_SERVER_URL || window.location.origin

export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket'],
})

// Envolve socket.emit com ack em uma Promise, rejeitando quando o servidor
// responde com { ok: false, error }.
//
// O servidor manda um `errorCode` estável junto da mensagem (ver
// server/src/socket/handlers.js). Quando esse código existe no idioma ativo, a
// mensagem exibida é a traduzida; senão cai no texto que veio do servidor
// (sempre em português), pra nunca ficar sem explicação nenhuma.
export function emitir (evento, payload = {}) {
  return new Promise((resolve, reject) => {
    socket.emit(evento, payload, (resposta) => {
      if (resposta && resposta.ok === false) {
        reject(new Error(traduzirErro(resposta)))
      } else {
        resolve(resposta)
      }
    })
  })
}

function traduzirErro (resposta) {
  const chave = resposta.errorCode && `erros.${resposta.errorCode}`
  if (chave && i18n.te(chave)) {
    return i18n.t(chave, resposta.errorParams || {})
  }
  return resposta.error || i18n.t('erros.SEM_CONEXAO')
}
