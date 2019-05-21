"use strict";
process.chdir(__dirname);
const fs = require('fs');
fs.writeFileSync('pid.txt', process.pid);

const config = require('komodo-sdk/config');
const logger = require('komodo-sdk/logger');

require('komodo-sdk/api-server');
const pullgw = require('komodo-sdk/gateway/pull');
const partner = require('./lib/partner');
const adviceServer = require('komodo-sdk/gateway/advice-push-server');

if (config.partner && config.partner.reverse_report_irs) {
    logger.info('Reverse report using IRS mode');
    require('./lib/irs/reverse-report');
}
else {
    require('./lib/reverse-report');
}


pullgw.setPartner(partner);
adviceServer.setPartner(partner);
