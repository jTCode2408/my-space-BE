const express = require ('express')
const cors = require('cors')
const server = express()
server.use(cors());
server.use(express.json());
server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
    return res.status(200).json({});
  }
  next();
});

const querystring =require('querystring');

const request = require('request'); 
const cookieParser = require('cookie-parser');
const stateKey='spotify_auth_state';

server.get('/', (req,res)=>{
    res.send("SERVER UP!")
});


const redirect_uri=
process.env.REDIRECT_URI || 
'http://localhost:8888/callback'



server.get('/login', function(req, res) {
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: 'user-read-private, user-read-email, user-read-recently-played user-top-read playlist-read-private',
      redirect_uri
    }))
})

server.get('/callback', function(req, res) {
  let code = req.query.code || null
  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (Buffer.from(
        process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
      ).toString('base64'))
    },
    json: true
  }
  request.post(authOptions, function(error, response, body) {
    var access_token = body.access_token
    let uri = process.env.FRONTEND_URI || 'https://localhost.3000/playlist'
    res.redirect(uri + '?access_token=' + access_token)
  })
})




module.exports=server;