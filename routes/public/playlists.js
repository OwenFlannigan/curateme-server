var express = require('express');
var router = express.Router();

var firebase = require('firebase-admin');
var _ = require('lodash');


router.get('/search', function (req, res, next) {
    console.log('call to search public playlists');

    var query = req.query.q;
    var moods = req.query.moods ? req.query.moods : [];
    var best_used_for = req.query.best_used_for ? req.query.best_used_for : '';

    var playlistsRef = firebase.database().ref('/playlists');

    playlistsRef.once('value', (snapshot) => {
        var data = snapshot.val();
        if (data) {
            var results = {};


            // weight results by varying criteria
            _.forEach(data, (value, key) => {
                console.log('priv value', !value.private);
                if (!value.private) {
                    var weight = 0;

                    weight += _.intersection(_.words(_.lowerCase(value.name)), _.words(_.lowerCase(query))).length;

                    if (value.mood) {
                        weight += _.intersection(_.words(_.lowerCase(value.mood)), _.words(_.lowerCase(moods))).length;

                        weight += _.intersection(_.words(_.lowerCase(value.mood)), _.words(_.lowerCase(query))).length;
                    }

                    if(value.best_used_for) {
                        weight += _.intersection(_.words(_.lowerCase(value.best_used_for)), _.words(_.lowerCase(best_used_for))).length;

                        weight += _.intersection(_.words(_.lowerCase(value.best_used_for)), _.words(_.lowerCase(query))).length;
                    }


                    if (weight && value.tracks && _.values(value.tracks).length) {
                        value.search_relevance = weight;
                        results[key] = value;
                    }

                }
            });

            var sortedResults = _.sortBy(results, ['search_relevance']);

            res.send(sortedResults);
        }
    });

});

// Get top public playlists
router.get('/top', function (req, res, next) {
    console.log('call to get top public playlists');

    var playlistsRef = firebase.database().ref('/playlists').orderByChild('favorites');

    playlistsRef.once('value', (snapshot) => {
        var data = snapshot.val();
        if (data) {
            var results = {};
            _.forEach(data, (value, key) => {
                if (!value.private && value.favorites) {
                    results[key] = value;
                }
            });

            res.send(results);
        } else {
            res.send({ "message": "There are no playlists! Be the first to make one!" });
        }
    });

});

module.exports = router;
