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
    // might want to add a check to make sure that basic params are met

    if (req.body.friend_key) {
        var friendUserRef = firebase.database().ref('/users/' + req.body.friend_key);
        friendUserRef.once('value', (snapshot) => {
            var data = snapshot.val();

            if (data) {
                var userFriendsRef = firebase.database().ref('/users/' + req.firebaseUser.key + '/friends');
                userFriendsRef.once('value', (snapshot) => {
                    var friends = snapshot.val();

                    var exists = _.filter(friends, function (o) { return o.friend_key == req.body.friend_key });

                    if (!exists.length) {
                        var newFriend = {};
                        newFriend.friend_key = req.body.friend_key;
                        newFriend.friend_name = data.name;
                        var promise = userFriendsRef.push(newFriend);

                        Promise.resolve(promise).then((value) => {
                            res.send({ "message": data.name + " has been added as a friend." });
                        });
                    } else { // user is already added as a friend
                        res.send({ "message": "You have already added this user as a friend." });
                    }
                });
            } else {
                res.send({ "message": "We could not find the friend you were trying to add." });
            }
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

    var friends = _.compact(req.firebaseUser.friends);
    // console.log('friends here', friends);
    
    // var friendsRef = firebase.database().ref('/users/' + req.firebaseUser.key + '/friends');
    // friendsRef.once('value', (snapshot) => {
    //     var data = snapshot.val();
    var results = {};

    var usersRef = firebase.database().ref('/users');
    usersRef.once('value', (snapshot) => {
        var data = snapshot.val();

        // console.log('friends', friends);
        // console.log('data', data);

        _.forEach(friends, (value, key) => {
            results[value.friend_key] = {
                "recent_activity": data[value.friend_key].recent_activity,
                "name": data[value.friend_key].name
            }
        });

        res.send(results);
    });

});


module.exports = router;
