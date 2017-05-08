var express = require('express');
var router = express.Router();
var request = require('request');
var querystring = require('querystring');



var firebase = require('firebase-admin');
var _ = require('lodash');

// Get specified public playlist
router.get('/', function (req, res, next) {
    console.log('call to get playlist with key', req.query.playlist_key);

    if (req.query.playlist_key) {
        var playlistRef = firebase.database().ref('/playlists/' + req.query.playlist_key);
        playlistRef.once('value', (snapshot) => {
            var data = snapshot.val();
            if (data) {
                if (!data.private || (req.firebaseUser && req.firebaseUser.key == data.creator_key)) {

                    var trackIds = querystring.stringify({
                        ids: _.values(data.tracks).slice(0, 50).join(',')
                    });

                    var url = 'https://api.spotify.com/v1/tracks?' + trackIds;
                    var options = {
                        url: url,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        json: true
                    }

                    // get tracks
                    request.get(options, (error, innerRes, body) => {
                        if (error) {
                            res.send(err);
                        }
                        data.tracks = body.tracks;

                        console.log('sending public playlist');
                        res.send(data);
                    });

                } else {
                    res.send({
                        "message": "The playlist you are trying to access is not public.",
                        "suggestion": "If you are trying to access your own playlist, use the /me/playlist endpoint."
                    });
                }
            } else {
                res.send({ "message": "We could not find the playlist you were looking for." });
            }
        });
    } else {
        res.send({ "error": "A query parameter was missing. Please be sure to include the playlist_key parameter." });
    }
});


// Get multiple public playlists
router.get('/multiple', function (req, res, next) {
    console.log('call to multiple public playlists', req.query.playlist_keys);
    if (req.query.playlist_keys) {
        var playlist_keys = req.query.playlist_keys.split(',');
        var playlists = {};

        var playlistsRef = firebase.database().ref('/playlists');


        var promise = playlistsRef.once('value', (snapshot) => {
            var data = snapshot.val();
            if (data) {
                playlist_keys.forEach((key) => {
                    // console.log('playlist key', key);
                    // console.log('playlist', data[key]);
                    if (!data[key].private) {
                        playlists[key] = data[key];
                    } else {
                        playlists = {
                            "message": "At least one playlist that you are trying to access is private.",
                            "suggestion": "If you are trying to access your own playlist, use the /me/playlist endpoint."
                        };
                    }
                });
            } else {
                res.send({ "message": "There are no playlists! Be the first to make one!" });
            }
        });

        Promise.resolve(promise).then((value) => {
            res.send(playlists);
        });
    } else {
        res.send({ "error": "A query parameter was missing. Please be sure to include the playlist_keys parameter." });
    }
});

// Favorite or unfavorite a playlist
router.put('/favorite', function (req, res) {
    console.log('favorite');
    console.log('call to favorite a playlist with key', req.query.playlist_key);
    if (req.query.playlist_key) {
        var playlistRef = firebase.database().ref('/playlists/' + req.query.playlist_key);
        playlistRef.once('value', (snapshot) => {
            var data = snapshot.val();

            var promise = '';
            var favoriteKey = _.findKey(data.favorites, (o) => {
                return o == req.firebaseUser.username;
            });

            if (favoriteKey) {
                delete data.favorites[favoriteKey];
            } else {
                var key = playlistRef.child('favorites').push().key;
                if(!data.favorites) {
                    data.favorites = {};
                }
                data.favorites[key] = req.firebaseUser.username;
            }

            var promise = playlistRef.set(data);

            Promise.resolve(promise).then((value) => {
                res.send({
                    "count": _.keys(data.favorites).length,
                    "favorites": data.favorites
                });
            });
        });
    } else {
        res.send({ "error": "A query parameter was missing. Please be sure to include the playlist_key parameter." });
    }
});


// Post a suggestion to the specified playlist
router.post('/suggest', function (req, res, next) {
    console.log('call to add suggestions to playlist with key', req.body.playlist_key);

    if (req.body.playlist_key && req.body.suggested_track) {
        var playlistRef = firebase.database().ref('/playlists/' + req.body.playlist_key);
        var suggestedTrack = req.body.suggested_track;

        suggestedTrack.suggestion_date = firebase.database.ServerValue.TIMESTAMP;
        suggestedTrack.suggester_key = req.firebaseUser.key;
        suggestedTrack.suggester_name = req.firebaseUser.username;

        var playlistPromise = playlistRef.child('/suggested_tracks').push(suggestedTrack);

        // Should probs remove this...
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
        res.send({ "error": "A query parameter was missing. Please be sure to include the playlist_key and suggested_track parameter." });
    }
});


module.exports = router;
