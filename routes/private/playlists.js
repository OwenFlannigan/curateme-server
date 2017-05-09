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
  newPlaylist.creator_name = req.firebaseUser.username;

  var tracks = newPlaylist.tracks;
  delete newPlaylist.tracks;

  var key = playlistsRef.push().key;
  var updates = {};
  updates[key] = newPlaylist;


  var playlistPromise = playlistsRef.update(updates);


  Promise.resolve(playlistPromise)
    .then((value) => {

      if (tracks && tracks.length) {
        var index = 0;
        _.forEach(tracks, (value, trackKey) => {
          firebase.database().ref('/playlists/' + key).child('tracks').push(value);

          if (index >= tracks.length - 1) {
            res.send({ "message": "Playlist has been created.", "key": key });
          }
          index++;
        });
      } else {
        res.send({ "message": "Playlist has been created.", "key": key });
      }

      if (typeof newPlaylist.private == 'boolean' ? !newPlaylist.private : false) {
        // Add playlist to user's recent activity
        var userRef = firebase.database().ref('/users/' + req.firebaseUser.key);
        // var activityKey = userRef.child('/recent_activity/playlists').push().key;

        var updates = {};
        var activity = {
          playlist_key: key,
          image: req.body.image,
          date: firebase.database.ServerValue.TIMESTAMP
        };


        if (req.firebaseUser.recent_activity && req.firebaseUser.recent_activity.playlists) {
          console.log('1');
          updates = _.slice(_.reverse(_.sortBy(_.concat(_.values(req.firebaseUser.recent_activity.playlists), [activity]), ['date'])), 0, 3);
        } else {
          console.log('2');
          updates = [activity];
        }

        console.log('updates for recent activity', updates);
        userRef.child('/recent_activity/playlists').set(updates);
      }
    })
    .catch((error) => {
      res.send(error);
    });
});

module.exports = router;
