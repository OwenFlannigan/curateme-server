var express = require('express');
var request = require('request');
var router = express.Router();
require('dotenv').config();

var firebase = require('firebase-admin');
var _ = require('lodash');


var client_id = process.env.SPOTIFY_CLIENT_ID;

var baseApiUrl = 'https://api.spotify.com';

router.get('/', function (req, res, next) {
    console.log('call to import playlists');
    console.log(req.query);
    var spotify_user_id = req.query.spotify_user_id;
    var access_token = req.query.access_token;

    if (spotify_user_id && access_token) {
        var resource = '/v1/me/playlists';//'/v1/users/' + spotify_user_id + '/playlists/';
        var uri = baseApiUrl + resource;

        var options = {
            url: uri,
            headers: {
                'Authorization': 'Bearer ' + access_token,
                'Content-Type': 'application/json'
            },
            json: true
        };

        request.get(options, function (err, playlistsRes, body) {
            console.log('here, getting list of playlists');
            if (!err && playlistsRes.statusCode === 200) {
                // body = JSON.parse(body);

                // var playlistIds = body.items.map((playlist) => {
                //     return playlist.id;
                // });
                // var promises = [];

                firebase.database().ref('/images').once('value', (imageSnapshot) => {
                    var images = imageSnapshot.val();

                    var playlists = [];

                    // for each playlist
                    _.forEach(body.items, (playlistValue, key) => {
                        var playlistOptions = {
                            url: playlistValue.tracks.href + '?fields=items.track',
                            headers: {
                                'Authorization': 'Bearer ' + access_token,
                                'Content-Type': 'application/json'
                            },
                            json: true
                        }

                        // request tracks
                        return request.get(playlistOptions, (err, playlistRes, playlistBody) => {
                            if (err) {
                                res.send(err);
                            }

                            var tracks = [];
                            _.forEach(playlistBody.items, (trackValue, key) => {
                                if (trackValue.track.id) {
                                    tracks.push(trackValue.track.id);
                                }
                            });

                            var image = _.values(images).length ? _.sample(_.values(images)) : 'http://students.washington.edu/oflann/curator/playlist.png';


                            var newPlaylist = {
                                best_used_for: 'listening',
                                creation_date: firebase.database.ServerValue.TIMESTAMP,
                                creator_key: req.firebaseUser.key,
                                creator_name: req.firebaseUser.username,
                                description: 'no description added',
                                name: playlistValue.name,
                                tracks: tracks,
                                private: true,
                                image: image,
                                spotify_playlist_id: playlistValue.id
                            }


                            playlists.push(newPlaylist);
                            var playlistRef = firebase.database().ref('/playlists').orderByChild('spotify_playlist_id').equalTo(playlistValue.id);

                            // var playlistRef = firebase.database().ref('/playlists');
                            playlistRef.once('value', (snapshot) => {
                                var data = snapshot.val();

                                // var existingKey = null;
                                // _.forEach(data, (value, key) => {
                                //     if(value.spotify_playlist_id == playlistValue.id) {
                                //         existingKey = key;
                                //     }
                                // });

                                // var exists = _.find(data, ['spotify_playlist_id', playlistValue.id]);


                                // console.log('esadsacdascsdcasdcascas', existingKey);

                                if (!data) {
                                    firebase.database().ref('/playlists').push(newPlaylist);
                                } else {
                                    var key = Object.keys(data)[0];
                                    data[key].tracks = _.union(data[key].tracks, tracks);

                                    var updateRef = firebase.database().ref('/playlists/' + key).set(data[key]);

                                    // console.log('update', snapshot);


                                    // firebase.database().ref('/playlists').orderByChild('spotify_playlist_id').equalTo(playlistValue.id).set(data);
                                }
                            });

                            // playlistValue.tracks = tracks;
                            // playlists.push(playlistValue);
                            // // console.log(playlists);

                            if (playlists.length == body.items.length) {
                                res.send({
                                    "message": "Playlists imported!"
                                });
                            }
                        });
                    });



                });

                // Promise.all(promises).then((values) => {
                //     console.log('yup 1', promises);
                //     console.log('yup', playlists);
                //     res.send(playlists);
                // });


            } else {
                console.log('error requesting auth', err);
                res.send({
                    'error': 'Authorization request failed. Please contact the site administration to resolve this issue.'
                });
            }
        });
    } else {
        res.send({
            'error': 'Request is missing spotify_user_id parameter'
        });
    }

});

module.exports = router;