import { io } from 'socket.io-client'

const URL = process.env.VUE_APP_SERVER_URL || 'http://localhost:4000'

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
