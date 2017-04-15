var express = require('express');
var router = express.Router();

var firebase = require('firebase-admin');
var _ = require('lodash');


// Get top public playlists
router.get('/top', function (req, res, next) {
    console.log('call to get top public playlists');

    var playlistsRef = firebase.database().ref('/playlists').orderByChild('favorites');

    playlistsRef.once('value', (snapshot) => {
        var data = snapshot.val();
        if (data) {
            var results = {};
            _.forEach(data, (value, key) => {
                if (!value.private && value.favorites) {
                    results[key] = value;
                }
            });

            res.send(results);
        } else {
            res.send({ "message": "There are no playlists! Be the first to make one!" });
        }
    });

});

module.exports = router;
