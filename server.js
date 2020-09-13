const express = require ('express');
const request = require('request'); 
const cors = require('cors');
const querystring =require('querystring');
const cookieParser = require('cookie-parser');
const jwt=require('jsonwebtoken');
const { Http2ServerRequest } = require('http2');

const client_id=process.env.SPOTIFY_CLIENT_ID;
const client_secret=process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri=process.env.REDIRECT_URI || 
'http://localhost:8888/callback'

//generate  token
function signToken(){
  secret=process.env.JWT_SECRET || 'dev mode';
  const options={
    expiresIn: '1h'
  }
  return jwt.sign(secret,options);
}
function decodeToken(jwtToken){
  algo={algorithm:process.env.JWT_SECRET}
  jwt.decode(jwtToken, process.env.JWT_SECRET, true, algo)[0]
}

const stateKey='spotify_auth_state';


const server = express();
server.use(express.static(__dirname + '/public'))
      .use(cors())
      .use(cookieParser())
      .use(express.json());



server.get('/', (req,res)=>{
    res.send("SERVER UP!")
});



server.get('/login', function(req, res) {
  const state = signToken();
  res.cookie(stateKey,state);

const scopes = 'user-read-private user-read-email user-read-recently-played user-top-read playlist-read-private';

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scopes,
      redirect_uri: redirect_uri,
      state:state
    }));
});

server.get('/callback', function(req, res) {
  const code = req.query.code || null
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState){
    res.redirect('/#' + 
    querystring.stringify({
      error:'state_mismatch'
    }));
  } else {
    res.clearCookie(stateKey);
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (Buffer.from(
          client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    }
  }//may need to remove

  req.post(authOptions, function(error, response, body) {
if (!error && response.statusCode === 200){
  const access_token = body.access_token,
  refresh_token = body.refresh_token;

    const postOptions = {
      url: 'https://api.spotify.com/v1/me',
      headers: {'Authorization': 'Bearer' + access_token},
      json:true
    };

    //use token to access spotify api
    request.get(postOptions, function(error, response, body){
      console.log('POST BODY', body)
    });



}
  })
})

server.get('/refresh_token', (req,res)=>{
  //request refresh token
  const refresh_token=req.query.refresh_token;
  const authOptions={
    url: 'https://accounts.spotify.com/api/token',
    headers:{
      'Authorization': 'Basic ' + (Buffer.from(
        client_id + ':' + client_secret).toString('base64'))
    },
    form: {
      grant_type:'refresh_token',
      refresh_token: refresh_token
    },
    json:true

  };

  request.post(authOptions, function(error, response, body){
    if (!error && response.statusCode ===200){
      let access_token=body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});


module.exports=server;