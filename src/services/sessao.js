const CHAVE = 'fodinha:sessao'

// Sessão persistida no navegador para permitir voltar à sala após um F5 ou
// uma queda de conexão: código da sala + token estável do jogador (não é o
// socket.id, que muda a cada reconexão).
export function salvarSessao ({ roomCode, playerToken, nome, cor }) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ roomCode, playerToken, nome, cor }))
  } catch (err) {
    // localStorage indisponível (modo privado etc.): sem reconexão automática, sem quebrar o app.
  }
}

export function carregarSessao () {
  try {
    const bruto = localStorage.getItem(CHAVE)
    return bruto ? JSON.parse(bruto) : null
  } catch (err) {
    return null
  }
}

export function limparSessao () {
  try {
    localStorage.removeItem(CHAVE)
  } catch (err) {
    // ignora
  }
}
