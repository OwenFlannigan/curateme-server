var express = require('express');
var router = express.Router();
var request = require('request');
var querystring = require('querystring');
var parseString = require('xml2js').parseString;
require('dotenv').config();




router.get('/', function (req, res, next) {
    console.log('call to get events near me');
    var query = req.query.location;
    console.log('searching with query', query);

    if (query) {
        var params = querystring.stringify({
            app_key: process.env.EVENTFUL_API_KEY,
            date: 'Today',
            keywords: 'concert',
            page_size: 30,
            within: 10,
            location: query
        });

        console.log(params);

        var options = {
            url: 'http://api.eventful.com/rest/events/search?' + params,
            headers: {
                'Content-Type': 'application/json'
            },
            json: true
        }

        console.log('event options', options);


        request.get(options, function (err, contentRes, body) {
            // var data = {};
            parseString(body, function(err, result) {

                var events = result.search.events[0].event.map((event) => {
                    return {
                        id: event['$'].id,
                        title: event.title[0],
                        url: event.url[0],
                        description: event.description[0],
                        start_time: event.start_time[0],
                        venue_url: event.venue_url[0],
                        venue_name: event.venue_name[0],
                        venue_address: event.venue_address,
                        city_name: event.city_name[0],
                        region_name: event.region_name[0],
                        postal_code: event.postal_code[0],
                        latitude: event.latitude[0],
                        longitude: event.longitude[0],
                        // image: (event.image && event.image[0]) ? event.image[0].url[0] : ''
                    }
                });


                // console.log(events[0]);
                res.send(events);
            })
            // res.send(body);
        });
    } else {
        res.send({ "error": "A query parameter was missing. Please be sure to include the location parameter." });
    }

});

module.exports = router;
