const express = require ('express');
const request = require('request'); 
const cors = require('cors');
const querystring =require('querystring');
const cookieParser = require('cookie-parser');
const jwt=require('jsonwebtoken');


const client_id=process.env.SPOTIFY_CLIENT_ID || '97a6dd834548478295bdb781f20e6f19';
const client_secret=process.env.SPOTIFY_CLIENT_SECRET || 'b1995e93d7ed4797b0406e4c6c6dab8e';
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
      .use(cookieParser())
      .use(express.json());
      //.use(express.static(__dirname + '/public'))



server.get('/', (req,res)=>{
    res.send("SERVER UP!")
});



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
        'Authorization': 'Basic ' + (new Buffer.from(
          client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };


  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {

      const access_token = body.access_token,
          refresh_token = body.refresh_token;
//redirect to frontend after auth
      // let frontUri = process.env.FRONTEND_URI
      // res.redirect(frontUri + '?access_token=' + access_token)

      const options = {
        url: 'https://api.spotify.com/v1/me',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
      };
      console.log('USING TOKEN/redirect', access_token, redirect_uri)
      // use the access token to access the Spotify Web API
      request.get(options, function(error, response, body) {
        console.log(body);
      });

      // we can also pass the token to the browser to make requests from there
      
      res.redirect('/#' +
        querystring.stringify({
          access_token: access_token,
          refresh_token: refresh_token
        }));
    } else {
      res.redirect('/#' +
        querystring.stringify({
          error: 'invalid_token'
        }));
    }
      //need to redirect to frontend after login
     /* request.post(authOptions, function(error, response, body) {
        var access_token = body.access_token
        let uri = process.env.FRONTEND_URI || 'https://localhost:3000'
        res.redirect(uri + '?access_token=' + access_token)
      })
  */
  });
}
});



server.get('/refresh_token', function (req,res){
  //request refresh token
  const refresh_token=req.query.refresh_token;
  const authOptions={
    url: 'https://accounts.spotify.com/api/token',
    headers:{
      'Authorization': 'Basic ' + (new Buffer.from(
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