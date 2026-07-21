// Português "raiz": o jogo com o nome original e o tom mais solto de mesa de
// bar. É só uma camada de sobreposição — tudo que não estiver aqui cai
// automaticamente no pt-BR (ver o merge em src/i18n/index.js), então este
// arquivo só precisa declarar o que realmente muda de uma versão pra outra.
export default {
  jogo: {
    nome: 'Fodinha',
    chamada: 'Palpitou errado, perdeu vida!',
    conviteTitulo: 'Fodinha',
    conviteTexto: 'Entra na minha sala de Fodinha!',
  },

  tabuleiro: {
    venceuAMao: '{nome} levou a mão!',
    toasts: {
      todosPalpitaram: 'Todo mundo palpitou — agora é no grito!',
    },
  },

  palpite: {
    pergunta: 'Quantas você crava?',
  },

  tutorial: {
    objetivo: {
      p3: 'O último que sobrar vivo leva a fama — o resto que se vire!',
    },
    palpite: {
      p3: 'Ou seja: sempre sobra um coitado que vai errar de propósito (ou sem querer) — é isso que deixa o jogo tenso!',
    },
    vidas: {
      botao: 'Entendi, bora jogar!',
    },
  },
}
