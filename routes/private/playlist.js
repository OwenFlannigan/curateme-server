var express = require('express');
var router = express.Router();
var request = require('request');
var querystring = require('querystring');


var firebase = require('firebase-admin');
var _ = require('lodash');

// Get specified playlist owned by the current user
router.get('/', function (req, res, next) {
    console.log('call to get MY playlist with key', req.query.playlist_key);

    if (req.query.playlist_key) {
        var playlistRef = firebase.database().ref('/playlists/' + req.query.playlist_key);
        playlistRef.once('value', (snapshot) => {
            var data = snapshot.val();
            if (data) {
                if (req.firebaseUser.key == data.creator_key) {

                    var trackIds = querystring.stringify({
                        ids: _.values(data.tracks).slice(0, 50).join(',')
                    });

                    var url = 'https://api.spotify.com/v1/tracks?' + trackIds;
                    console.log('url', url);
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
                        // console.log(body);
                        data.tracks = body.tracks;

                        res.send(data);
                    });
                } else {
                    res.send({
                        "message": "You do not own that playlist.",
                        "suggestion": "If you want to get a public playlist, use the /playlist endpoint."
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

// Update a playlist's details
router.put('/', function (req, res, next) {
    console.log('call to edit a playlist with key', req.query.playlist_key);
    console.log('body', req.body);

    if (req.query.playlist_key) {
        var playlistRef = firebase.database().ref('/playlists/' + req.query.playlist_key);

        playlistRef.once('value', (snapshot) => {
            var data = snapshot.val();

            if (data.creator_key == req.firebaseUser.key) {

                data.name = req.body.name ? req.body.name : data.name;
                data.best_used_for = req.body.best_used_for ? req.body.best_used_for : data.best_used_for;
                if (data.mood || req.body.mood) {
                    data.mood = req.body.mood ? req.body.mood : data.mood;
                }
                data.private = typeof req.body.private == 'boolean' ? req.body.private : (typeof data.private == 'boolean' ? data.private : false);

                console.log('setting with', data);

                var promise = playlistRef.set(data);

                Promise.resolve(promise).then((value) => {
                    res.send(data);
                });
            } else {
                res.send({ "message": "You cannot edit a playlist that is not yours." });
            }
        });
    } else {
        res.send({ "error": "A query parameter was missing. Please be sure to include the playlist_key parameter and optionally, the name, best_used_for and mood parameters." });
    }
});

// Post track(s) to the specified playlist
router.post('/tracks', function (req, res, next) {
    console.log('call to add tracks to playlist with key', req.query.playlist_key);

    if (req.query.playlist_key && req.query.track_ids) {
        var playlistRef = firebase.database().ref('/playlists/' + req.query.playlist_key);

        var trackIds = req.query.track_ids.split(',');

        playlistRef.once('value', (snapshot) => {
            var data = snapshot.val();

            trackIds.forEach((id, index) => {

                if (!_.includes(_.values((data.tracks ? data.tracks : [])), id)) {
                    console.log('adding');
                    playlistRef.child('/tracks').push(id);
                }

                if (index == trackIds.length - 1) {
                    res.send({ "message": "Track(s) added to playlist!" });
                }
            });

        });
    } else {
        res.send({ "error": "A query parameter was missing. Please be sure to include the playlist_key and track_ids parameter." });
    }
});

router.delete('/tracks', function (req, res, next) {
    console.log('call to remove tracks to playlist with key', req.query.playlist_key);

    if (req.query.playlist_key && req.query.track_ids) {
        var playlistRef = firebase.database().ref('/playlists/' + req.query.playlist_key);

        var trackIds = req.query.track_ids.split(',');

        playlistRef.once('value', (snapshot) => {
            var data = snapshot.val();
            data.tracks = _.difference(_.values(data.tracks), trackIds);

            var promise = playlistRef.set(data);

            Promise.resolve(promise).then((value) => {
                console.log('track removed');
                res.send({ "message": "Track(s) removed from playlist!" });
            });

        });
    } else {
        res.send({ "error": "A query parameter was missing. Please be sure to include the playlist_key and track_ids parameter." });
    }
});


module.exports = router;
