"use strict";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const url = require('url');
const xmlrpc = require('xmlrpc');

const config = require('komodo-sdk/config');
const logger = require('komodo-sdk/logger');
const matrix = require('komodo-sdk/matrix');
const pull = require('komodo-sdk/gateway/pull');

const st24 = require('./st24');
const partnerRc = require('./partner-rc.json');

function buy(task) {
    const partnerUrl = url.parse(config.partner.url);
    const clientOptions = {
        host: partnerUrl.hostname,
        port: partnerUrl.port,
        path: partnerUrl.pathname
    };

    let client;
    if (partnerUrl.protocol == 'https:') {
        client = xmlrpc.createSecureClient(clientOptions);
    } else {
        client = xmlrpc.createClient(clientOptions);
    }

    const params = {
        MSISDN: config.partner.msisdn || config.partner.userid,
        REQUESTID: task.trx_id,
        PIN: config.partner.pin || config.partner.password,
        NOHP: task.destination,
        NOM: task.remote_product
    };

    const xmlrpcMethod = 'topUpRequest';
    logger.info('Preparing XMLRPC request', {method: xmlrpcMethod, params: params, partnerUrl: partnerUrl.href});

    client.methodCall(xmlrpcMethod, [ params ], function (err, value) {

        if (err) {
            let rc = '68';
            let msg = 'XMLRPC Client Error: ' + err;

            if (error.code == 'ECONNREFUSED' || error.code == 'EHOSTUNREACH' || (error.code == 'ETIMEDOUT' && error.syscall == "connect")) {
                rc = '91';
            }

            logger.warn(msg, {method: xmlrpcMethod, trx_id: task.trx_id, destination: task.destination, err: err});
            report({
                trx_id: task.trx_id,
                rc: rc,
                message: 'INTERNAL: ' + msg,
                misc: {
                    task: task
                }
            });

            return;
        }

        logger.info('Got XMLRPC response from partner for', {method: xmlrpcMethod, trx_id: task.trx_id, destination: task.destination, response: value});
        matrix.last_topupRequest_ack = value;

        report({
            trx_id: task.trx_id,
            rc: partnerRc[value.RESPONSECODE] || '40',
            message: value.MESSAGE,
            sn: value.SN || st24.extractSnFromMessage(value.MESSAGE),
            amount: value.PRICE || st24.extractPriceFromMsg(value.MESSAGE),
            raw: value,
            misc: {
                task: task
            }
        });
    });
}

function advice(task) {
}

function report(data) {
    matrix.last_report_to_core = data;
    pull.report(data);
}

exports.buy = buy;
exports.advice = advice;
exports.report = report;
