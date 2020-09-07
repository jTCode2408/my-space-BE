require('dotenv').config();

const server = require ('./server')
const PORT = 8888 || process.env.PORT

server.listen(PORT, ()=>{
    console.log(`Listening on port ${PORT}. /login to initiate authentication flow.`)
})
