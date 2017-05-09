var express = require('express');
var router = express.Router();

var firebase = require('firebase-admin');
var _ = require('lodash');

// Get current users friends
router.get('/', function (req, res, next) {
    console.log('call to get friends');
    var userRef = firebase.database().ref('/users/' + req.firebaseUser.key + '/friends');
    userRef.once('value', (snapshot) => {
        var data = snapshot.val();
        if (data) {
            res.send(data);
        } else {
            res.send({ "message": "You have not added any friends yet." });
        }
    });
});


// Add a friend of the current user
router.post('/', function (req, res, next) {
    console.log('call to add friend');

    if (req.query.usernames) {
        var usersRef = firebase.database().ref('/users');
        usersRef.once('value', (snapshot) => {
            var data = snapshot.val();

            var index = 0;
            var usernames = req.query.usernames.split(',');
            _.forEach(usernames, (username, key) => {
                var userKey = _.findKey(data, (user) => {
                    return user.username == username;
                });
                console.log('username', username);

                console.log('userkey', userKey);

                var exists = req.firebaseUser.friends ? _.findKey(req.firebaseUser.friends, (user) => {
                    if (user) {
                        return user.friend_username == username;
                    }
                }) : false;

                if (userKey && !exists && username != req.firebaseUser.username) {
                    var userRef = firebase.database().ref('/users/' + req.firebaseUser.key);

                    var newFriend = {
                        friend_key: userKey,
                        friend_username: data[userKey].username
                    };

                    userRef.child('friends').push(newFriend);
                }

                if (index >= usernames.length - 1) {
                    res.send({ "message": "Friend(s) added." });
                }
                index++;
            });
        });
    } else {
        res.send({ "error": "A query parameter was missing. Please be sure to include the friend_key parameter." });
    }

});

// Remove a friend for the current user
router.delete('/', function (req, res, next) {
    console.log('call to remove friend');

    if (req.body.friend_key) {

        var friendsRef = firebase.database().ref('/users/' + req.firebaseUser.key + '/friends');
        friendsRef.once('value', (snapshot) => {
            var data = snapshot.val();

            var friend = _.find(data, function (o) { return o.friend_key == req.body.friend_key });

            if (friend) {

                var newFriendsList = _.filter(data, function (o) { return o.friend_key != req.body.friend_key });

                var promise = friendsRef.set(newFriendsList);

                Promise.resolve(promise).then((value) => {
                    res.send({ "message": friend.friend_name + " has been removed as a friend." });
                });
            } else {
                res.send({ "error": "We could not find the friend you are trying to remove." });
            }
        });

    } else {
        res.send({ "error": "A query parameter was missing. Please be sure to include the friend_key parameter." });
    }
});

// Get activity for friend
router.get('/activity', function (req, res, next) {
    console.log('call to get activity of my friends', req.firebaseUser);

    var friends = req.firebaseUser.friends;

    var results = {};

    var usersRef = firebase.database().ref('/users');
    usersRef.once('value', (snapshot) => {
        var data = snapshot.val();

        _.forEach(friends, (value, key) => {
            if (data[value.friend_key].recent_activity) {
                results[value.friend_key] = {
                    "recent_activity": data[value.friend_key].recent_activity,
                    "name": data[value.friend_key].username
                }
            }
        });

        res.send(results);
    });

});


module.exports = router;
