var express = require('express');
var router = express.Router();
var request = require('request');
var querystring = require('querystring');

require('dotenv').config();

var client_id = process.env.SPOTIFY_CLIENT_ID;
var redirect_uri = 'http://localhost:3000/api/spotify/callback';


var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

router.get('/', function (req, res) {
    console.log('CID', client_id);
    var state = generateRandomString(16);

    var scope = 'playlist-modify-public user-top-read playlist-read-private playlist-read-collaborative';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

var authentication = new Buffer(process.env.SPOTIFY_CLIENT_INFO).toString('base64');

router.get('/callback', function (req, res) {
    var code = req.query.code || null;
    var state = req.query.state || null;

    if (state === null) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + authentication
            },
            json: true
        };

        request.post(authOptions, function (err, response, body) {
            if (!err && response.statusCode === 200) {
                var access_token = body.access_token;
                var refresh_token = body.refresh_token;


                res.redirect('http://localhost:3001/redirect/' +
                    querystring.stringify({
                        access_token: access_token,
                        refresh_token: refresh_token
                    })
                );
            } else {
                res.redirect('http://localhost:3001/redirect/' +
                    querystring.stringify({
                        error: 'invalid_token'
                    })
                );
            }
        });
    }
});

module.exports = router;