import { io } from 'socket.io-client'

// Sem VUE_APP_SERVER_URL definido, assume que o back-end roda no mesmo host
// que serviu a página (porta 4000). Isso é o que faz o jogo funcionar tanto
// em localhost quanto para quem acessa pelo IP público/da rede da máquina
// que está hospedando — um valor fixo tipo "localhost" quebraria a conexão
// (e pareceria erro de CORS) pra qualquer um que não seja o próprio host.
function urlPadraoDoServidor () {
  const { protocol, hostname } = window.location
  return `${protocol}//${hostname}:4000`
}

const URL = process.env.VUE_APP_SERVER_URL || urlPadraoDoServidor()

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
