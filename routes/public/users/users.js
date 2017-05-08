var express = require('express');
var router = express.Router();

var firebase = require('firebase-admin');
var _ = require('lodash');

// Get all users
router.get('/', function (req, res, next) {
  firebase.database().ref('/users').once('value', (snapshot) => {
      var data = snapshot.val();

      data = (Object.keys(data)).map((key) => {
          return {
            name: data[key].name,
            key: key,
            avatar: data[key].avatar,
            username: data[key].username
          };
      });

      res.send(data);
  });
});

module.exports = router;
