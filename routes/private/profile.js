var express = require('express');
var router = express.Router();

var firebase = require('firebase-admin');

router.get('/', function (req, res, next) {
    res.send(req.firebaseUser);
});

router.delete('/messages', function (req, res, next) {
    // may need to refactor when including more than just playlist sharing
    if (req.query.message_key) {

        // delete req.firebaseUser.inbox.playlists[req.query.message_key];
        var promise = firebase.database().ref('/users/' + req.firebaseUser.key + '/inbox/playlists/' + req.query.message_key).remove();

        Promise.resolve(promise).then((value) => {
            res.send({ "message": "Message deleted." });
        });
    } else {
        res.send({ "error": "A query parameter was missing. Please be sure to include the message_key parameter." });
    }
});

module.exports = router;
