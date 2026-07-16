import { io } from 'socket.io-client'

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
export function emitir (evento, payload = {}) {
  return new Promise((resolve, reject) => {
    socket.emit(evento, payload, (resposta) => {
      if (resposta && resposta.ok === false) {
        reject(new Error(resposta.error || 'Erro desconhecido.'))
      } else {
        resolve(resposta)
      }
    })
  })
}
