# My-Space-BE
Backend for my-space application for Spotify login authorization flow.


*[Hosted On Heroku](https://my-space-backend.herokuapp.com/)*

## Built  With:
  * NodeJS  
  * Express
  * Axios
  
  
  ## Getting started:
  *First, be sure to have followed Spotify's guide for setting up your individual Client Key and Client Secret for authentification [Spotify Developer Site](https://developer.spotify.com)*
  * `npm install` to download dependencies
  *  Replace the following variables:
      `client_id = ‘CLIENT_ID’;` // Your client id
      `client_secret = ‘CLIENT_SECRET’;` // Your secret
      `redirect_uri = ‘REDIRECT_URI’;` // Your redirect uri
   * `npm start` to run server
   
   **This flow assumes frontend app running on localhost:3000. If not--change this portion of code in `server.js` file to redirect to your frontend location:
    `res.redirect('http://localhost:3000/#' + querystring.stringify({
              access_token:access_token,
              refresh_token:refresh_token
            })
            ); 
            `
            
            
   **[Spotify Web API Authorization documentation](https://developer.spotify.com/documentation/general/guides/authorization-guide)**
        
        
        
