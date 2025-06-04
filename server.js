const express = require('express')
const http = require('http')
require('dotenv').config()

const app = express()

const server = http.createServer(app)

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
    console.log(`[Server] Listening on port ${PORT}...`)
    console.log(`[Server] Visit http://localhost:${PORT}`)
})





