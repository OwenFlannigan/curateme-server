var express = require('express');
var router = express.Router();

var firebase = require('firebase-admin');
var _ = require('lodash');

// Get current users playlists
router.get('/', function (req, res, next) {
  console.log('call to playlists');
  var playlistsRef = firebase.database().ref('/playlists').orderByChild('creator_key').equalTo(req.firebaseUser.key);
  playlistsRef.once('value', (snapshot) => {
    var data = snapshot.val();
    if (data) {
      res.send(data);
    } else {
      res.send({});
    }
  });
});


// Post a playlist by the current user
router.post('/', function (req, res, next) {
  console.log('call to add playlist');
  // might want to add a check to make sure that basic params are met

  var playlistsRef = firebase.database().ref('/playlists');
  var newPlaylist = req.body;

  newPlaylist.creation_date = firebase.database.ServerValue.TIMESTAMP;
  newPlaylist.creator_key = req.firebaseUser.key;
  newPlaylist.creator_name = req.firebaseUser.name;

  var key = playlistsRef.push().key;
  var updates = {};
  updates[key] = newPlaylist;
  var playlistPromise = playlistsRef.update(updates);


  Promise.resolve(playlistPromise)
    .then((value) => {
      // Add playlist to user's playlist list
      var userRef = firebase.database().ref('/users/' + req.firebaseUser.key);
      var userPromise = userRef.child('/playlists').push(key);

      Promise.resolve(userPromise)
        .then((value) => {
          res.send({ "message": "Playlist has been created." });
        })
        .catch((error) => {
          res.send({ "message": "Playlist was created, but there were issues adding it to your account. You will still be marked as its creator, but it won't show up in your playlists." });
        });
    })
    .catch((error) => {
      res.send(error);
    });
});

module.exports = router;
