var express = require('express');
var router = express.Router();
var request = require('request');


var firebase = require('firebase-admin');
var _ = require('lodash');

// Get current users friends
router.get('/', function (req, res, next) {
    var authOptions = {
            url: 'https://api.unsplash.com/photos/curated?page=1&client_id=7b65f22642aecd0846c0ed0cebf39c51fbc5949cd786233f00091c7c79c077ae',
            json: true
        };

        request.get(authOptions, function (err, response, body) {
            if (!err && response.statusCode === 200) {

                var urls = _.map(body, function(o) {
                    return o.urls.small;
                });

                res.send(urls);

                // uncomment to quickly get urls for unsplash images
                // urls.forEach((url) => {
                //     var imageRef = firebase.database().ref('/images').push(url);
                // });

            }
        });
});



module.exports = router;
