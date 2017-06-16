var express = require('express');
var request = require('request');
var router = express.Router();
require('dotenv').config();

var _ = require('lodash');


var client_id = process.env.SPOTIFY_CLIENT_ID;

var baseApiUrl = 'https://api.spotify.com';

router.get('/', function (req, res, next) {
    console.log('call to search');
    console.log(req.query);

    if (req.query.q) {
        var resource = '/v1/search';
        var uri = baseApiUrl + resource + '?q=' + req.query.q + '&type=track,artist,album';

        var options = {
            url: uri,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + req.spotify_access_token
            },
            json: true
        };

        request.get(options, function (err, searchRes, body) {
            console.log('here, getting search results');
            if (!err && searchRes.statusCode === 200) {
                res.send(body);
            } else {
                res.send({
                    'error': 'Spotify failed to get search results.'
                });
            }
        });
    } else {
        res.send({
            'error': 'Request is missing q parameter'
        });
    }

});

module.exports = router;