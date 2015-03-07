/*global describe,it*/
'use strict';
var assert = require('assert'),
    velocityScraper = require('../lib/velocity-scraper.js');

describe('velocity-scraper node module.', function() {
    it('finishes', function() {
        assert( velocityScraper.getMeetings(), 'Finished!');
    });
});
