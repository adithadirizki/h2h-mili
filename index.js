"use strict";
process.chdir(__dirname);
const fs = require('fs');
fs.writeFileSync('pid.txt', process.pid);

require('komodo-sdk/api-server');
const pullgw = require('komodo-sdk/gateway/pull');
const partner = require('./lib/partner');
require('./lib/reverse-report');
const adviceServer = require('komodo-sdk/gateway/advice-push-server');

pullgw.setPartner(partner);
adviceServer.setPartner(partner);
