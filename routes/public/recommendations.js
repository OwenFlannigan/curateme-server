var express = require('express');
var router = express.Router();
var request = require('request');
var querystring = require('querystring');
var firebase = require('firebase-admin');


var _ = require('lodash');

router.get('/tracks', function (req, res, next) {
    console.log('call to get recommendations based on tracks');
    var seedIds = req.query.seeds;
    console.log('seeds', seedIds)

    if (seedIds) {
        var limit = Math.min(seedIds.split(',').length, 5);
        seedIds = _.shuffle(seedIds.split(',')).slice(0, limit).join(',');

        var trackLimit = req.query.limit ? '&limit=' + req.query.limit : '';
        var reqOptions = {
            url: 'https://api.spotify.com/v1/recommendations?seed_tracks=' + seedIds + trackLimit,
            headers: {
                'Authorization': 'Bearer ' + req.spotify_access_token
            },
            json: true
        };

        request.get(reqOptions, function (err, innerRes, body) {
            if (body.tracks) {
                var limit = Math.min(body.tracks.length, 30);
                var tracks = _.shuffle(body.tracks).slice(0, limit)

                res.send(body.tracks);
            } else {
                res.send({});
            }
        });
    } else {
        res.send({ "error": "A query parameter was missing. Please be sure to include the seeds parameter." });
    }

});

module.exports = router;
