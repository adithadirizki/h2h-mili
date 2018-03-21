"use strict";
process.chdir(__dirname);

const pullgw = require('komodo-sdk/gateway/pull');
const partner = require('./lib/partner');
const reverseReport = require('./lib/reverse-report');

pullgw.setPartner(partner);
