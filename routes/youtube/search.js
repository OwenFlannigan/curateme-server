var express = require('express');
var router = express.Router();
var request = require('request');
require('dotenv').config();

var _ = require('lodash');

var api_key = process.env.YOUTUBE_API_KEY;
var YouTube = require('youtube-node');

var youTube = new YouTube();

youTube.setKey(api_key);

router.get('/', function (req, res, next) {
    console.log('call to search youtube.');
    var query = req.query.q;
    console.log('searching with query', query);


    // youTube.addParam('order', 'viewCount');
    youTube.search(query, 50, function (error, result) {
        if (error) {
            console.log(error);
        }
        else {
            console.log(JSON.stringify(result, null, 2));

            // res.send(result);
            // var id = result.items[0].id.videoId;
            // var limit = Math.min(result.items.length, 50);
            // var ids = _.map(result.items.slice(0, limit), (o) => {
            //     return o.id.videoId;
            // });
            // res.send(result);

            var singleResult = result.items[0];

            res.send({
                "url": 'https://www.youtube.com/watch?v=' + singleResult.id,
                "image": singleResult.snippet.thumbnails.medium.url,
                "id": singleResult.id.videoId,
                "title": singleResult.snippet.title,
                "channelTitle": singleResult.snippet.channelTitle,
            });

            // var options = {
            //     url: 'https://www.googleapis.com/youtube/v3/videos?id=' + ids.join(',') + '&part=contentDetails,snippet&key=' + api_key + '',
            //     headers: {
            //         'Content-Type': 'application/json'
            //     },
            //     json: true
            // }


            // request.get(options, function (err, contentRes, body) {

            //     var singleResult = body.items[0];

            //     res.send({
            //         "url": 'https://www.youtube.com/watch?v=' + singleResult.id,
            //         "image": singleResult.snippet.thumbnails.medium.url,
            //         "id": singleResult.id,
            //         "title": singleResult.snippet.title,
            //         "channelTitle": singleResult.snippet.channelTitle,
            //         "duration": singleResult.contentDetails.duration
            //     });
            // });

        }
    });

});

router.get('/multiple', function (req, res, next) {
    console.log('call to search youtube with multiple tracks.');
    var queries = req.query.q.split(',');
    console.log('searching with query', queries);

    queries = queries.map((query, index) => {
        return index + '[%]' + query;
    });

    var videoResults = [];
    var index = 0;
    _.forEach(queries, (query, key) => {
        var currentIndex = query.split('[%]')[0];
        youTube.search(query.split('[%]')[1].split('[:trackId]')[0], 1, function (error, result) {
            if (error) {
                console.log(error);
            } else {
                var singleResult = result.items[0];

                videoResults[currentIndex] = {
                    "url": 'https://www.youtube.com/watch?v=' + singleResult.id,
                    "image": singleResult.snippet.thumbnails.medium.url,
                    "id": singleResult.id.videoId,
                    "title": singleResult.snippet.title,
                    "channelTitle": singleResult.snippet.channelTitle,
                    "trackId": query.split('[:trackId]')[1]
                };

                if (index >= queries.length - 1) {
                    res.send(videoResults);
                }

                index++;
            }
        });
    });

});



module.exports = router;

