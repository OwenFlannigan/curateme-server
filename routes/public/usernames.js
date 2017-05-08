var express = require('express');
var router = express.Router();

var firebase = require('firebase-admin');
var _ = require('lodash');

// Get all users
router.get('/', function (req, res, next) {
  firebase.database().ref('/users').once('value', (snapshot) => {
      var data = snapshot.val();

      var usernames = _.mapValues(data, 'username');

      res.send(usernames);
  });
});

module.exports = router;
