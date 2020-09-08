const express = require ('express')
const server = express()
const cors = require('cors')
const querystring =require('querystring');

server.use(express.json());

server.use(cors());


const request = require('request'); // "Request" library
const cookieParser = require('cookie-parser');

server.get('/', (req,res)=>{
    res.send("SERVER UP!")
});







module.exports=server;