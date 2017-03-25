var express = require('express');
var router = express.Router();

var firebase = require('firebase-admin');

router.get('/', function (req, res, next) {
    res.send(req.firebaseUser);
});

module.exports = router;
