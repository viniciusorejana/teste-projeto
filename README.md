# Fodinha

Jogo de cartas multiplayer (2 a 8 jogadores). Front-end em Vue 2 +
Vuetify, back-end em Node/Express/Socket.io que mantém o estado
autoritativo da partida (cada jogador só recebe a própria mão).

- `server/` — motor do jogo (`server/src/game`) e servidor Socket.io.
- `src/` — front-end (telas de início, lobby e tabuleiro).

## Project setup
```
npm install
npm run server:install
```

### Roda front-end e back-end juntos (desenvolvimento)
```
npm run dev
```
Front-end em http://localhost:8080, back-end em http://localhost:4000
(configurável via `VUE_APP_SERVER_URL` no `.env.development` e `PORT`
no `server/`).

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

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
