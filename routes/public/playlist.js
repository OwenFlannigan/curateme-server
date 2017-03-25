var express = require('express');
var router = express.Router();

var firebase = require('firebase-admin');
var _ = require('lodash');

// Get current users playlists
router.get('/', function (req, res, next) {
    console.log('call to get playlist with key', req.query.playlist_key);

    if (req.query.playlist_key) {
        var playlistRef = firebase.database().ref('/playlists/' + req.query.playlist_key);
        playlistRef.once('value', (snapshot) => {
            var data = snapshot.val();
            if (!data.private) {
                res.send(data);
            } else {
                res.send({ "message": "The playlist you are trying to access is not public. If you are trying to access your own playlist, use the /me/playlist endpoint." });
            }
        });
    } else {
        res.send({ "error": "A query parameter was missing. Please be sure to include the playlist_key parameter." });
    }
});


// // MAYBE CHANGE TO ADDING SUGGESTIONS

// // Post a suggestion to the following playlist
router.post('/suggest', function (req, res, next) {
    console.log('call to add suggestions to playlist with key', req.body.playlist_key);

    if (req.body.playlist_key) {
        var playlistRef = firebase.database().ref('/playlists/' + req.body.playlist_key);
        var suggestedTrack = req.body.suggested_track;

        suggestedTrack.suggestion_date = firebase.database.ServerValue.TIMESTAMP;
        suggestedTrack.suggester_key = req.firebaseUser.key;
        suggestedTrack.suggester_name = req.firebaseUser.name;

        var playlistPromise = playlistRef.child('/suggested_tracks').push(suggestedTrack);

        Promise.resolve(playlistPromise)
            .then((value) => {
                // Add playlist to user's playlist list
                var userRef = firebase.database().ref('/users/' + req.firebaseUser.key);
                var userPromise = userRef.child('playlists').push(req.body.playlist_key);

                Promise.resolve(userPromise)
                    .then((value) => {
                        res.send({ "message": "Suggestion has been added to playlist." });
                    })
                    .catch((error) => {
                        res.send({ "message": "Suggestion was added, but there were issues adding it to your account. You will still be marked as its suggester, but it won't show up in your contributed playlists." });
                    });
            })
            .catch((error) => {
                res.send(error);
            });
    } else {
        res.send({ "error": "A query parameter was missing. Please be sure to include the playlist_key parameter." });
    }
});


module.exports = router;
