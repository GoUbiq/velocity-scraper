#! /usr/bin/env node

'use strict';

var velocityScraper = require('/usr/local/lib/node_modules/velocity-scraper');

var userArgs = process.argv;
var searchParam = userArgs[2];

if (userArgs.indexOf('-h') !== -1 || userArgs.indexOf('--help') !== -1) {
    console.log('Velocity Scraper');
    console.log('================\n');
    console.log('    --help or -h       You see this manual');
    console.log('    --version or -v    You see package version');
    console.log('\nUsage:');
    console.log('\tvelocity-scraper \'http://meetingroom.velocity.uwaterloo.ca/day.php?year=2014&month=12&day=10&area=2\'\n');
    return;
}

if (userArgs.indexOf('-v') !== -1 || userArgs.indexOf('--version') !== -1) {
    return console.log(require('./package').version);
}

velocityScraper.getMeetings(searchParam);