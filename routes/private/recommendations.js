var express = require('express');
var router = express.Router();
var request = require('request');
var querystring = require('querystring');
var firebase = require('firebase-admin');


var _ = require('lodash');

router.get('/tracks', function (req, res, next) {
    console.log('call to get my recommended tracks');
    var data = req.firebaseUser.recommended_tracks;

    if (data) {
        var trackIds = querystring.stringify({
            ids: _.values(data).join(',')
        });

        var url = 'https://api.spotify.com/v1/tracks?' + trackIds;
        var options = {
            url: url,
            headers: {
                'Content-Type': 'application/json'
            },
            json: true
        }

        // get tracks
        request.get(options, (error, innerRes, body) => {
            if (error) {
                res.send(err);
            }

            res.send(body);
        });
    } else {
        res.send({ "message": "You have no recommended tracks at this time. Please check back later!" });
    }

});


router.get('/refresh/tracks', function (req, res, next) {
    console.log('call to refresh recommended tracks with client token', req.spotify_access_token);

    var data = req.firebaseUser;
    console.log('here');

    // base recommendations off of varying criteria

    // base recs off of recent favorites
    if (data.recent_activity && data.recent_activity.favorites && data.recent_activity.favorites.playlists) {
        console.log('case one');
        // if they have playlist favorites, base on that
        var favoritePlaylists = _.values(data.recent_activity.favorites.playlists);
        var randomPlaylist = favoritePlaylists[Math.floor(Math.random() * favoritePlaylists.length)];


        var playlist = firebase.database().ref('/playlists/' + randomPlaylist.playlist_key);
        playlist.once('value', (snapshot) => {
            var playlistData = snapshot.val();

            if (playlistData) {
                var limit = Math.min(_.values(playlistData.tracks).length, 5);
                var seeds = _.shuffle(_.values(playlistData.tracks)).slice(0, limit);
                var reqOptions = {
                    url: 'https://api.spotify.com/v1/recommendations?seed_tracks=' + seeds,
                    headers: {
                        'Authorization': 'Bearer ' + req.spotify_access_token
                    },
                    json: true
                };

                request.get(reqOptions, function (err, innerRes, body) {
                    var limit = Math.min(body.tracks.length, 30);
                    var tracks = _.shuffle(body.tracks).slice(0, limit)
                    // respond for immediate use
                    res.send(tracks);

                    // update firebase
                    firebase.database().ref('/users/' + req.firebaseUser.key + '/recommended_tracks').set(_.mapValues((tracks), 'id'));

                });
            } else {
                res.send({ "message": "Recommendations not updated, try again." });
            }
        });
    } else if (data.recent_activity && data.recent_activity.playlists) { // base off of their recent playlists
        console.log('case two');

        var playlistsRef = firebase.database().ref('/playlists').orderByChild('creator_key').equalTo(req.firebaseUser.key);
        playlistsRef.once('value', (snapshot) => {
            var playlistData = snapshot.val();

            if (playlistData) {
                var playlists = _.values(_.filter(playlistData, (playlist) => {
                    return playlist.tracks;
                }));
                if (playlists) {// if they have at least one playlist that has tracks
                    var randomPlaylist = playlists[Math.floor(Math.random() * playlists.length)];

                    var limit = Math.min(_.values(randomPlaylist.tracks).length, 5);
                    var seeds = _.shuffle(_.values(randomPlaylist.tracks)).slice(0, limit);
                    var reqOptions = {
                        url: 'https://api.spotify.com/v1/recommendations?seed_tracks=' + seeds,
                        headers: {
                            'Authorization': 'Bearer ' + req.spotify_access_token
                        },
                        json: true
                    };

                    request.get(reqOptions, function (err, innerRes, body) {
                        var limit = Math.min(body.tracks.length, 30);
                        tracks = _.shuffle(body.tracks).slice(0, limit);
                        // respond for immediate use
                        res.send(tracks);

                        // update firebase
                        firebase.database().ref('/users/' + req.firebaseUser.key + '/recommended_tracks').set(_.mapValues(tracks, 'id'));
                    });
                } else {
                    res.send({ "message": "Recommendations not updated, try again." });
                }
            } else {
                res.send({ "message": "Recommendations not updated, try again." });
            }
        });

    } else {
        console.log('case three');
        //grab new releases
        var reqOptions = {
            url: 'https://api.spotify.com/v1/browse/new-releases',
            headers: {
                'Authorization': 'Bearer ' + req.spotify_access_token
            },
            json: true
        };

        request.get(reqOptions, function (err, innerRes, body) {

            var albumIds = body.albums.items.map((album) => {
                return album.id;
            });

            var albumOptions = {
                url: 'https://api.spotify.com/v1/albums?ids=' + albumIds.join(','),
                headers: {
                    'Authorization': 'Bearer ' + req.spotify_access_token
                },
                json: true
            }

            request.get(albumOptions, function (error, doubleInnerRes, innerBody) {


                var tracks = innerBody.albums.map((album) => {
                    return album.tracks.items.map((track) => {
                        track.album = {
                            images: album.images,
                            name: album.name,
                            id: album.id
                        };
                        delete track.available_markets;
                        return track;
                    });
                });

                tracks = _.shuffle(_.flatten(tracks));

                var limit = Math.min(tracks.length, 30);
                tracks = tracks.slice(0, limit);

                console.log('sending tracks', limit);
                res.send(tracks);

                console.log('updating firebase');
                firebase.database().ref('/users/' + req.firebaseUser.key + '/recommended_tracks').set(_.mapValues(tracks, 'id'));

            })
        });
    }

});

module.exports = router;
