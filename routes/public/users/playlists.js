var express = require('express');
var router = express.Router();

var firebase = require('firebase-admin');
var _ = require('lodash');

// Get current users playlists
router.get('/', function (req, res, next) {
    console.log('call to users playlists with user key', req.query.user_key);

    var playlistsRef = firebase.database().ref('/playlists').orderByChild('creator_key').equalTo(req.query.user_key);
    playlistsRef.once('value', (snapshot) => {
        var data = snapshot.val();
        if (data) {
            res.send(_.filter(data, ['private', false]));
        } else {
            res.send({});
        }
    });
});


module.exports = router;
