"use strict";

process.chdir(__dirname);
const fs = require('fs');
fs.writeFileSync('pid.txt', process.pid);

const config = require('komodo-sdk/config');

global.KOMODO_LOG_LABEL = `KOMODO-GW@${ config.handler_name }`;

require('komodo-sdk/api-server');
const pullgw = require('komodo-sdk/gateway/pull');
const adviceServer = require('komodo-sdk/gateway/advice-push-server');

const partner = require('./lib/partner');
require('./lib/reverse-report');

pullgw.setPartner(partner);
adviceServer.setPartner(partner);
