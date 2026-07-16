const http = require('http')
const express = require('express')
const cors = require('cors')
const path = require('path')
const { Server } = require('socket.io')
const { registerSocketHandlers } = require('./socket/handlers')

const PORT = process.env.PORT || 4000
const ORIGIN = process.env.CLIENT_ORIGIN || '*'

const app = express()
app.use(cors({ origin: ORIGIN }))

// Serve o front-end buildado (npm run build cria a pasta dist/)
const distPath = path.join(__dirname, '../../dist')
app.use(express.static(distPath))

app.get('/health', (req, res) => res.json({ ok: true }))

// Rota catch-all: qualquer URL não encontrada volta pra index.html
// (necessário pra Vue Router funcionar com histórico em produção)
app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')))

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: ORIGIN },
})

registerSocketHandlers(io)

server.listen(PORT, () => {
  console.log(`Servidor da Fodinha rodando na porta ${server.address().port}`)
})
