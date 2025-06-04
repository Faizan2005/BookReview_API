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

app.post('/books', (req, res) => {
    
})

app.get('/books', (req, res) => {

})

app.get('/books/:author', (req, res) => {

})

app.get('/books/:genre', (req, res) => {

})


app.get('/books/:id', (req, res) => {

})

app.post('/books/:id/reviews', (req, res) => {

})

app.put('/reviews/:id', (req, res) => {

})

app.delete('/reviews/:id', (req, res) => {
    
})






