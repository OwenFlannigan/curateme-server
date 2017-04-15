var express = require('express');
var path = require('path');
// var favicon = require('serve-favicon');
var logger = require('morgan');
// var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var _ = require('lodash');
var request = require('request');

require('dotenv').config();

var client_info = process.env.SPOTIFY_CLIENT_INFO;

// Firebase initialization
var firebase = require('firebase-admin');
var serviceAccount = require("./firebase_admin_creds.json");

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://curate-me-a42fc.firebaseio.com/"
});


// Route importing
var index = require('./routes/index');
var users = require('./routes/users');
var search = require('./routes/search');
var myProfile = require('./routes/private/profile');
var myPlaylist = require('./routes/private/playlist');
var myPlaylists = require('./routes/private/playlists');
var myFriends = require('./routes/private/friends');
var myRecommendations = require('./routes/private/recommendations');
var playlist = require('./routes/public/playlist');
var playlists = require('./routes/public/playlists');
var userPlaylists = require('./routes/public/users/playlists');

var spotifyLogin = require('./routes/spotify/login');
var spotifyImport = require('./routes/spotify/import');

var youtubeSearch = require('./routes/youtube/search');

var eventfulEvents = require('./routes/eventful/events');

// cached tokens to save time and limit requests made to APIs
var spotifyToken = '';



// JWT Authentication imports
var jwt = require('express-jwt');
require('dotenv').config();

var authenticate = jwt({
  secret: process.env.AUTH0_SECRET,
  audience: process.env.AUTH0_CLIENT_ID
});

var setUser = function (req, res, next) {
  // get current user
  console.log(req.user.sub);
  var userRef = firebase.database().ref('/users');
  userRef.once('value', (snapshot) => {
    var data = snapshot.val();
    var firebaseUser = {};
    (Object.keys(data)).forEach((key) => {
      if (data[key].id == req.user.sub) {

        firebaseUser = data[key];
        firebaseUser.key = key;
      }
    });
    req.firebaseUser = firebaseUser;
    return next();
  });
};


var spotifyClientAuth = function (req, res, next) {
  if (!spotifyToken || spotifyToken.expiration < Date.now()) {
    console.log('spotify client auth');
    var authentication = new Buffer(client_info).toString('base64');

    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        grant_type: 'client_credentials'
      },
      headers: {
        'Authorization': 'Basic ' + (authentication)
      },
      json: true
    };


    request.post(authOptions, function (err, res, body) {
      if (!err && res.statusCode === 200) {
        var token = body.access_token;
        req.spotify_access_token = token;

        spotifyToken = {
          token: token,
          expiration: new Date().getTime() + (body.expires_in * 1000)
        };

        return next();
      } else {
        console.log('error requesting auth', err);
        response.send({
          'error': 'Authorization request failed. Please contact the site administration to resolve this issue.'
        });
      }
    });

  } else {
    req.spotify_access_token = spotifyToken.token;
    next();
  }

};


// App setup
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// NO MORE ROUTES HERE
app.use('/', index);
app.use('/users', users);
// MIDDLEWARE WON'T AFFECT THESE ROUTES

/**  MIDDLEWARE  **/
// authenticate individual private data
app.use('/api/me/*', authenticate, setUser);
// public, but requires a logged in user
app.use('/api/playlist/suggest', authenticate, setUser);
app.use('/api/playlist/favorite', authenticate, setUser);


/** ROUTES **/
// public routes fo here
app.use('/api/search', search);
app.use('/api/playlist', playlist);
app.use('/api/playlists', playlists);
app.use('/api/users/playlists', userPlaylists);

// private routes go here
app.use('/api/me/profile', myProfile);
app.use('/api/me/playlist', myPlaylist);
app.use('/api/me/playlists', myPlaylists);
app.use('/api/me/friends', myFriends);
app.use('/api/me/recommendations/refresh/tracks', spotifyClientAuth);
app.use('/api/me/recommendations', myRecommendations);


app.use('/api/spotify', spotifyLogin); // done for all spotify, can be at top
app.use('/api/spotify/import', authenticate, setUser, spotifyImport);

app.use('/api/youtube/search', youtubeSearch);

app.use('/api/eventful/events', eventfulEvents);




// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  // res.render('error');
});

module.exports = app;
