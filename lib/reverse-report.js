"use strict";

const xmlrpc = require('xmlrpc');

const config = require('komodo-sdk/config');
const logger = require('komodo-sdk/logger');
const matrix = require('komodo-sdk/matrix');
const pull = require('komodo-sdk/gateway/pull');

const st24 = require('./st24');
const partner = require('./partner');
const partnerRc = require('./partner-rc.json');

function create() {
    const server = xmlrpc.createServer({
        port: config.reverse_report_port
    });

    logger.info('Reverse report server listen on port ' + config.reverse_report_port);

    server.on('NotFound', function (method, params) {
        logger.warn('REVERSEREPORT: Unknown method recevied on XMLRPC server', {method: method, params: params});
    });

    server.on('topUpReport', function (err, params, callback) {

        logger.info('REVERSEREPORT: Got XMLRPC topUpReport request from partner', {method: 'topUpReport', params: params});
        matrix.last_topupReport_params = params;

        const paramsCount = params.length;
        for (let i = 0; i < paramsCount; i++) {
            let value = params[i];

            partner.report({
                trx_id: value.REQUESTID,
                rc: partnerRc[value.RESPONSECODE] || '40',
                message: value.MESSAGE,
                sn: (value.SN || '').replace(/;$/, '') || st24.extractSnFromMessage(value.MESSAGE),
                amount: value.PRICE || st24.extractPriceFromMsg(value.MESSAGE),
                raw: value,
                misc: {
                }
            });
        }

        callback(null, 'ACK REPORT OK');
    })
}

create();
