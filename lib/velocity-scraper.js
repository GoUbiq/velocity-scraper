/*
 * 2015 Gaurav Mali
 */

'use strict';

// dependencies
var env      = require('jsdom').env,
    Promises = require('promise'),
    _        = require('lodash'),
    fs       = require('fs'),
    URL      = require('url'),
    moment   = require('moment'),
    Meeting  = require('./meeting.js');

// Room information that will be written to files. name : [meeting, ..]
var rooms = {
    "StrongBad" : [],
    "Trogdor"   : [],
    "Furnace"   : [],
    "Icebox"    : []
};

// constant
var TODAYS_AREAS = [
    'http://meetingroom.velocity.uwaterloo.ca/day.php?area=1',
    'http://meetingroom.velocity.uwaterloo.ca/day.php?area=2'
];

/**
 * API
 * @param  {String} url [optional] url of the day that is to be scraped
 * @return {JSON}       The formatted data from the site
 */
exports.getMeetings = function (url) {
    url = url || '';
    if (!_validURL(url)) return _outputError('[velocity-scraper] ERROR: Invalid input. Please check the URL');
    return url.length ? _getMeetingsFromDay(url) : _.each(TODAYS_AREAS, _getMeetingsFromDay);
};

function _getMeetingsFromDay (dayURL) {
    console.log('[velocity-scraper] Opening', dayURL);
    _scrapeVelocityPage(dayURL)
        .then(_scrapeDay, _outputError)
        .then(_scrapeMeetingPages, _outputError);

    return 'Finished!';
}


/*******************************************************************************
 *  Functions for scraping, promising, and writing to a file
 ******************************************************************************/


// scrape meetings from the given URL, and return a promise
function _scrapeVelocityPage (url) {
    return new Promises(function (resolve, reject) {
        env(url, function (err, window) {
            if (err) reject(err);
            else resolve(window);
        });
    });
}

function _validURL (url) {
    var velocityURL = new URL.parse(url, true);
    return url.length === 0 || (velocityURL.hostname === 'meetingroom.velocity.uwaterloo.ca' &&
                               (velocityURL.pathname === '/view_entry.php' || velocityURL.pathname === '/day.php'));
}

function _scrapeDay (window) {
    var $, info = {};

    // this way server-side jquery knows which 'window' to query
    $ = require('jquery')(window);

    info.date  = moment( $('#dwm h2').html(), "dddd D MMMM YYYY");
    info.links = $("table#day_main td:not(.new):not(.row_labels) a").map(function(){
        return 'http://meetingroom.velocity.uwaterloo.ca/' + $(this).attr("href");
    }).get();

    return info;
}

function _outputError (err) {
    if (err) return console.error(err);
}

function _scrapeMeetingPages (dayInfo) {
    console.log('[velocity-scraper] Collecting data from %s meeting(s)', dayInfo.links.length);
    var meetingPagePromises = _.map(dayInfo.links, function(url) { return _scrapeVelocityPage(url); });

    Promises.all(meetingPagePromises).then(function (meetings) {
        _.each(meetings, function(m) { _scrapeMeetingInfo(m, dayInfo.date); });
        _.forOwn(rooms, function(meetings, name) {
            rooms[name] = _.sortBy(meetings, function(m) { return m.startTime.unix(); });
        });
        // console.log(rooms); // DEBUGGING
        _saveRoomsToFile(dayInfo.date);
    }, _outputError);
}

function _scrapeMeetingInfo (window, date) {
    var $, room, roomName;

    // this way server-side jquery knows which 'window' to query
    $ = require('jquery')(window);

    room     = $('table#entry tr:nth-child(3) td:nth-child(2)').html();
    roomName = room.replace('Velocity Foundry - ', '').replace('Velocity Garage - ', '');

    // We are only interested in certain rooms
    if (rooms[roomName]) rooms[roomName].push(new Meeting(window, date));
}

function _saveRoomsToFile (date) {
    var homeDir = process.env.HOME
    var velocityDir = homeDir + '/Velocity_scrape/'
    var directoryName = velocityDir + date.format('YYYY_MM_DD');

    console.log('[velocity-scraper] Creating directory', directoryName);
    fs.mkdir(directoryName, function(err) {
        if (err && err.code !== 'EEXIST') return _outputError(err);

        _.forOwn(rooms, function(meetings, name) {
            var filename, stream;

            if (!meetings.length) return; // Create files for rooms with meetings

            filename = directoryName + '/' + name + '.txt';
            stream   = fs.createWriteStream(filename);

            console.log('[velocity-scraper] Writing file ', filename);
            stream.once('open', function() {
                var count = 0;
                _.each(meetings, function(m){
                    var now = moment();
                    if (moment(m.endTime).isAfter(now)){
                        count += 1;
                    }
                });
                stream.write(count + '\n');
                _.each(meetings, function(m) {
                    var now = moment();
                    if(moment(m.endTime).isAfter(now)){
                        stream.write(m.toReadableFormat() + '\n');
                    }
                });
                stream.end();
                //stream.write(meetings.length + '\n');
                //_.each(meetings, function(m) { stream.write(m.toReadableFormat() + '\n'); });
                //stream.end();
            });
            console.log('[velocity-scraper] Finished writing meeting informations to', filename);
        });

    });

}
