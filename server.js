const express = require ('express');
const axios =require('axios');
const cors = require('cors');
const querystring =require('querystring');
const cookieParser = require('cookie-parser');

const client_id=process.env.SPOTIFY_CLIENT_ID 
const client_secret=process.env.SPOTIFY_CLIENT_SECRET 
const redirect_uri=process.env.REDIRECT_URI || 
'http://localhost:8888/callback'

//generate  token
const randomString = function(length){
let text = '';
let possible= 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
for ( let i=0; i < length; i++ ){
  text += possible.charAt(Math.floor(Math.random() * possible.length));
}
return text;

};

const stateKey='spotify_auth_state';

const server = express();

server.use(cors())
      .use(express.static(__dirname + '/public'))
      .use(cookieParser());
     // .use(express.json());
      //
      

server.get('/login', function(req, res) {

  const state = randomString(16);
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
    console.log('REDIRECTING', state, scopes, redirect_uri)
});


server.get('/callback', function(req, res) {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState){
    res.redirect('/#' + querystring.stringify({
      error:'state_mismatch'
    }));
  } else {
    res.clearCookie(stateKey)

    axios({
      url: 'https://accounts.spotify.com/api/token',
      method: 'post',
      params:{
        code:code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers:{
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      auth:{ 
      username:client_id,
      password:client_secret
    }
    })
    .then(res=>{
      console.log('TOKEN RES', res, code)
      const accessToken=res.data.access_token,
            refreshToken=res.data.refresh_token

    axios({
      url:'https://api.spotify.com/v1/me',
      headers:{
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      params: {
        grant_type: 'authorization_code',
        access_token:accessToken,
        refresh_token:refreshToken
      }
    })
    .then(res=>{
      console.log('ME RES', res)
      res.redirect('http://localhost:3000/playlist/#' + querystring.stringify({
        access_token:access_token,
        refresh_token:refresh_token
      })
      )
    })
    .catch(err=>{
      res.redirect('/#' + querystring.stringify({
        error: 'invalid token'
      }))
      console.log(err)
    })
    .catch(err=>{
      console.log(err)
    })
    })

  }
});



server.get('/refresh_token', function (req,res){
  //request refresh token
  const refresh_token=req.query.refresh_token;
  
  axios({
    url: 'https://accounts.spotify.com/api/token',
    method: 'post',
    params:{
      code:code,
      redirect_uri: redirect_uri,
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    headers:{
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    auth:{ 
    username:client_id,
    password:client_secret
  }
  })
  .then(res=>{
    res.send({
      'access_token': access_token
    })
  })
  .catch(err=>{
    res.send('refresh token error')
    console.log(err)
  })
 
});

const PORT = process.env.PORT || 8888

server.listen(PORT, ()=>{
    console.log(`Listening on port ${PORT}. /login to initiate authentication flow.`)
})
