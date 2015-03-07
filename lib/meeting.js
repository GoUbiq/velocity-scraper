/*
 * 2015 Gaurav Mali
 */

'use strict';

var moment = require('moment');

/**
 * Information about a single meeting booked in a room
 * @class
 * @param    {JSDOM}    window              The meeting page
 * @param    {Moment}   date                The date of the meeting
 * @property {Function} toReadableFormat    Output the meeting information
 */
var Meeting = function (window, date) {
    var $, $table, $contents, rawStartTime, rawEndTime, createdBy, meetingName;

    // this way server-side jquery knows which 'window' to query
    $ = require('jquery')(window);

    $table       = $('table#entry');
    $contents    = $('#contents h3');
    rawStartTime = $table.find('tr:nth-child(4) td:nth-child(2)').html().trim().split(' - ');
    rawEndTime   = $table.find('tr:nth-child(6) td:nth-child(2)').html().trim().split(' - ');
    createdBy    = $table.find('tr:nth-child(8) td:nth-child(2)').html().trim();
    meetingName  = $contents.html().trim();

    this.name         = meetingName;
    this.startTime    = _velocityTimeToMoment(date, rawStartTime[0]);
    this.endTime      = _velocityTimeToMoment(date, rawEndTime[0]);
    this.startEndTime = this.startTime.format('hh:mmA') + ' - ' + this.endTime.format('hh:mmA');
    this.creator      = createdBy;

    this.toReadableFormat = function() {
        var output = '' +
            this.name + '\n' +
            this.startTime.format('YYYY-MM-DD HH:mm:ss') + '\n' +
            this.endTime.format('YYYY-MM-DD HH:mm:ss') + '\n' +
            this.startEndTime + '\n' +
            this.creator;
        return output;
    };
};

function _velocityTimeToMoment (date, time) {
    var amPm, newTime, newTimeHr, newDate;

    amPm      = time.substr(-2);
    newTime   = time.replace(amPm, '').split(':');
    newTimeHr = _meridiemChange(newTime[0], amPm);
    newDate   = moment([date.year(), date.month(), date.dayOfYear(), newTimeHr, newTime[1], newTime[2]]);

    return newDate;
}

function _meridiemChange (hr, amPm) {
    // 12:20am => 00:20
    if (amPm.toLowerCase() === 'am' && hr === '12') return '00';

    // 10:40am => 10:40
    if (amPm.toLowerCase() === 'am') return hr;

    // 1:30pm => 13:30, 12:30pm => 12:30
    var hrNum = parseInt(hr, 10);
    return hrNum === 12 ? hrNum : hrNum + 12;
}

module.exports = Meeting;