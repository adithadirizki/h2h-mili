"use strict";
process.chdir(__dirname);

const pullgw = require('komodo-sdk/gateway/pull');
const partner = require('./lib/partner');
const reverseReport = require('./lib/reverse-report');
const adviceServer = require('komodo-sdk/gateway/advice-push-server');

pullgw.setPartner(partner);
adviceServer.setPartner(partner);
