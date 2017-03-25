var express = require('express');
var path = require('path');
// var favicon = require('serve-favicon');
var logger = require('morgan');
// var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var _ = require('lodash');


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
var myProfile = require('./routes/private/profile');
var myPlaylists = require('./routes/private/playlists');
var playlist = require('./routes/public/playlist');
var userPlaylists = require('./routes/public/users/playlists');


// JWT Authentication imports
var jwt = require('express-jwt');
require('dotenv').config();

var authenticate = jwt({
  secret: process.env.AUTH0_SECRET,
  audience: process.env.AUTH0_CLIENT_ID
});

var setUser = function (req, res, next) {
  // get current user
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


/** ROUTES **/
// public routes fo here
app.use('/api/playlist', playlist);
app.use('/api/users/playlists', userPlaylists);

// private routes go here
app.use('/api/me/profile', myProfile);
app.use('/api/me/playlists', myPlaylists);




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
