"use strict";

const xmlrpc = require('xmlrpc');
const stringify = require("json-stringify-pretty-compact");

const config = require('komodo-sdk/config');
const logger = require('komodo-sdk/logger');
const matrix = require('komodo-sdk/matrix');
const pull = require('komodo-sdk/gateway/pull');

const st24 = require('./st24');
const partner = require('./partner');
const partnerRc = require('./partner-rc.json');

function create() {
    if (!config || !config.reverse_report_port) {
        logger.info('Not creating reverse report server because of undefined config.reverse_report_port');
        return;
    }

    const server = xmlrpc.createServer({ port: config.reverse_report_port });

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
                //message: value.MESSAGE,
                message: 'topUpReport: ' + stringify(value),
                sn: (value.SN || '').replace(/;$/, '') || st24.extractSnFromMessage(value.MESSAGE),
                amount: value.PRICE || st24.extractPriceFromMsg(value.MESSAGE),
                balance: st24.extractBalanceFromMsg(value.MESSAGE, config.balance_pattern),
                raw: value,
                misc: {
                }
            });
        }

        callback(null, 'ACK REPORT OK');
    })
}

create();
