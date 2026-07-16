const http = require('http')
const express = require('express')
const cors = require('cors')
const { Server } = require('socket.io')
const { registerSocketHandlers } = require('./socket/handlers')

const PORT = process.env.PORT || 4000
const ORIGIN = process.env.CLIENT_ORIGIN || '*'

const app = express()
app.use(cors({ origin: ORIGIN }))
app.get('/health', (req, res) => res.json({ ok: true }))

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: ORIGIN },
})

registerSocketHandlers(io)

server.listen(PORT, () => {
  console.log(`Servidor da Fodinha rodando na porta ${server.address().port}`)
})
