var express = require('express');
var router = express.Router();
var request = require('request');
require('dotenv').config();


router.get('/', function (req, res, next) {
    console.log('call to search eventful');
    var query = req.query.location;
    console.log('searching with query', query);


    var options = {
        url: 'http://api.eventful.com/rest/events/search?' + ids.join(',') + '&part=contentDetails,snippet&key=' + api_key + '',
        headers: {
            'Content-Type': 'application/json'
        },
        json: true
    }


    request.get(options, function (err, contentRes, body) {

        var singleResult = body.items[0];

        res.send({
            "url": 'https://www.youtube.com/watch?v=' + singleResult.id,
            "image": singleResult.snippet.thumbnails.medium.url,
            "id": singleResult.id,
            "title": singleResult.snippet.title,
            "channelTitle": singleResult.snippet.channelTitle,
            "duration": singleResult.contentDetails.duration
        });
    });

});