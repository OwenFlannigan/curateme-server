var express = require('express');
var router = express.Router();
var request = require('request');
var querystring = require('querystring');


var firebase = require('firebase-admin');
var _ = require('lodash');

// Get specified playlist owned by the current user
router.get('/', function (req, res, next) {
    console.log('test');
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


module.exports = router;
