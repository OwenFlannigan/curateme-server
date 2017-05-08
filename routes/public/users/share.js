var express = require('express');
var router = express.Router();

var firebase = require('firebase-admin');
var _ = require('lodash');

// Get specified playlist owned by the current user
router.post('/', function (req, res, next) {
    console.log('call to share a playlist with user', req.query.usernames);
    
    if (req.query.usernames && req.query.playlist_key) {
                console.log(req.query.usernames.split(',').length);
        
        var userRef = firebase.database().ref('/users');
        userRef.once('value', (snapshot) => {
            var data = snapshot.val();
            var newMessage = {
                from: {
                    key: req.firebaseUser.key,
                    name: req.firebaseUser.name
                },
                playlist_key: req.query.playlist_key
            };

            var index = 0;
            _.forEach(req.query.usernames.split(','), (value, key) => {
                var userKey = _.findKey(data, (userObj) => {
                    return userObj.username == value;
                });
                userRef.child(userKey + '/inbox/playlists').push(newMessage);

                if (index >= req.query.usernames.split(',').length - 1) {
                    res.send({ "message": "Playlist shared with user(s)." });
                }
                index++;
            });



            // data = _.forEach(data, (value, key) => {
            //     if (_.includes(req.query.usernames.split(','), value.username)) {
            //         if (!value.inbox) {
            //             value.inbox = {};
            //         }
            //         if (!value.inbox.playlists) {
            //             value.inbox.playlists = {};
            //         }


            //         // value.inbox.playlists = _.compact(_.concat([newMessage], value.inbox.playlists ? value.inbox.playlists : []));
            //     }
            // });

            // var promise = firebase.database().ref('/users').set(data);

            // Promise.resolve(promise).then((value) => {
            //     res.send({ "message": "Playlist shared with user(s)." });
            // });
        });
    } else {
        res.send({ "error": "A query parameter was missing. Please be sure to include the usernames and playlist_key parameter." });
    }
});

module.exports = router;
