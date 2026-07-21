# Palpitezinho

Jogo de cartas multiplayer (2 a 6 jogadores), jogável no navegador e instalável
como PWA no celular. Front-end em Vue 2 + Vuetify, back-end em
Node/Express/Socket.io que mantém o estado autoritativo da partida — cada
jogador só recebe a própria mão (ou a dos outros, na rodada às cegas), nunca
os dados de ninguém além do que pode ver.

## Funcionalidades

- Salas com código de 5 caracteres, lobby com lista de jogadores em tempo
  real e reconexão automática após queda de conexão ou F5 (token de sessão
  persistido no navegador).
- Motor de jogo completo: palpite com a regra do "fecha a conta", força das
  cartas com manilha e desempate por naipe, anulação de cartas de mesmo rank,
  vidas e eliminação, rodada às cegas (mão de 1 carta).
- Jogada automática por tempo: se ninguém agir em 45s, o servidor decide por
  quem está na vez (palpite aleatório válido; carta pela preferência
  maior/menor/aleatória escolhida por cada jogador).
- Tutorial interativo, tabela de força das cartas e toasts de aviso (vez,
  palpites) direto no tabuleiro.
- Layout responsivo com atenção especial ao mobile (reordenar a mão
  arrastando, tabuleiro compacto, PWA instalável). No tabuleiro, os elementos
  principais (vazas, seu assento, sua mão) dividem um mesmo eixo vertical
  central; os apoios (vira/força das cartas, estratégia automática) ficam
  ancorados ao lado sem deslocar esse eixo.
- Três idiomas trocáveis a qualquer momento pelo seletor no canto superior
  direito: **Português** (padrão, para todos os públicos, em que o jogo se
  chama *Palpitezinho*), **Português (raiz)** (mesma tradução com o nome e o
  tom originais de *Fodinha*) e **English**. A escolha é lembrada no
  navegador.

## Estrutura

- `server/` — motor do jogo (`server/src/game`), servidor Socket.io
  (`server/src/socket/handlers.js`) e testes (`server/test`).
- `src/` — front-end:
  - `views/` — telas roteadas (`Home`, `Room`, que decide entre lobby e
    tabuleiro conforme a fase da partida).
  - `components/` — lobby, tabuleiro, assento de jogador, carta, seletor de
    palpite, área da vaza, diálogos de resultado/fim de jogo/tutorial, tabela
    de força e toasts.
  - `store/` — estado global (Vuex), fonte única de verdade recebida do
    servidor via Socket.io.
  - `services/` — cliente Socket.io (`socket.js`) e persistência de sessão
    no `localStorage` (`sessao.js`).
  - `locales/` — os arquivos de idioma (`pt-BR.js` é a referência de chaves;
    `pt-BR-raiz.js` só declara o que muda em relação a ele; `en.js` é a
    tradução completa) e `i18n/` a configuração do vue-i18n.

### Traduções

Para acrescentar um texto novo, adicione a chave em `src/locales/pt-BR.js` e a
tradução correspondente em `en.js` — o `pt-BR-raiz.js` herda tudo do padrão e
só precisa ser tocado se aquela frase mudar na versão original. Mensagens de
erro do servidor viajam com um código estável (`server/src/game/erros.js`) e
são traduzidas no cliente pelas chaves em `erros`.

## Project setup
```
npm install
npm run server:install
```

### Roda front-end e back-end juntos (desenvolvimento)
```
npm run dev
```
Front-end em http://localhost:8080, back-end em http://localhost:4000.

O front-end detecta sozinho o endereço do back-end (mesmo host da
página, porta 4000), então também funciona para quem acessar pelo seu
IP público/de rede (ex: `http://SEU_IP:8080`) — só é preciso liberar
as portas 8080 e 4000 no firewall/roteador. Se o back-end estiver em
outro host/porta, defina `VUE_APP_SERVER_URL` em `.env.development`
(front-end) e `PORT` em `server/` (back-end).

### Só o front-end
```
npm run serve
```

### Só o back-end
```
npm run server
```

### Testes do motor de jogo e do servidor
```
npm run server:test
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

## Deploy no Render.com

O servidor Node serve o front-end buildado + a API Socket.io na mesma porta (que o Render atribui via `PORT` env var).

### Passos:

1. Push o repositório para GitHub.
2. No [Render.com](https://render.com), crie um novo **Web Service**:
   - Conecte seu GitHub
   - Selecione este repositório
   - **Build Command**: `npm install && npm run build && npm run server:install`
   - **Start Command**: `npm run server`
   - **Node Version**: `18` (ou acima)
3. Render vai detectar `server/package.json` e fazer o deploy.

O cliente automaticamente conecta na mesma porta que recebeu a página, então funciona sem mudanças de configuração.

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
