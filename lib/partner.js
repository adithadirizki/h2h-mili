"use strict";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const url = require('url');
const https = require('https');
const xmlrpc = require('xmlrpc');

const config = require('komodo-sdk/config');
const logger = require('komodo-sdk/logger');
const matrix = require('komodo-sdk/matrix');
const pull = require('komodo-sdk/gateway/pull');

const st24 = require('./st24');

const partnerRc = fs.existsSync(__dirname + '/../rc-local.json') ? require('../rc-local.json') : require('./partner-rc.json');

if (config.partner.use_sslv3) {
    https.globalAgent.options.secureProtocol = 'SSLv3_method';
}

function createXmlRpcClient(endpoint) {
    const partnerUrl = url.parse(endpoint);
    const clientOptions = {
        host: partnerUrl.hostname,
        port: partnerUrl.port,
        path: partnerUrl.pathname
    };

    logger.verbose('Creating XML-RPC client using ' + partnerUrl.protocol, clientOptions);

    return (partnerUrl.protocol === 'https:') ? xmlrpc.createSecureClient(clientOptions) : xmlrpc.createClient(clientOptions);
}

function buy(task) {
    _topUpRequest(task);
}

function _topUpRequest(task, isAdvice) {
    const params = {
        MSISDN: config.partner.msisdn || config.partner.userid,
        REQUESTID: task.trx_id,
        PIN: config.partner.pin || config.partner.password,
        NOHP: task.destination,
        NOM: task.remote_product
    };

    const xmlrpcMethod = 'topUpRequest';
    logger.info('Preparing XMLRPC request', {method: xmlrpcMethod, params: params, partnerUrl: config.partner.url});

    const client = createXmlRpcClient(config.partner.url);
    client.methodCall(xmlrpcMethod, [ params ], function (err, value) {

        if (err) {

            let msg = 'XMLRPC Client Error: ' + err;
            let rc = '68';

            if (
                !isAdvice &&
                (
                    err.code === 'ECONNREFUSED'
                    || err.code === 'EHOSTUNREACH'
                    || (err.code === 'ETIMEDOUT' && err.syscall === "connect")
                    || (err.code === 'EPROTO' && err.syscall === "write")
                )
            ) {
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

            if (rc === '68') {
                setTimeout(
                    function() { advice(task); },
                    5 * 60 * 1000
                );
            }

            return;
        }

        logger.info('Got XMLRPC response from partner for', {method: xmlrpcMethod, trx_id: task.trx_id, destination: task.destination, response: value});
        matrix.last_topupRequest_ack = value;

        report({
            trx_id: task.trx_id,
            rc: partnerRc[value.RESPONSECODE] || '40',
            message: value.MESSAGE,
            sn: (value.SN || '').replace(/;$/, '') || st24.extractSnFromMessage(value.MESSAGE),
            amount: value.PRICE || st24.extractPriceFromMsg(value.MESSAGE),
            raw: value,
            misc: {
                task: task
            }
        });
    });
}

function _topUpInquiry(task) {
    const params = {
        REQUESTID: task.trx_id,
        MSISDN: config.partner.msisdn || config.partner.userid,
        PIN: config.partner.pin || config.partner.password,
        NOHP: task.destination
    };

    const xmlrpcMethod = 'topUpInquiry';
    logger.info('Preparing XMLRPC request', {method: xmlrpcMethod, params: params, partnerUrl: config.partner.url});

    const client = createXmlRpcClient(config.partner.url);
    client.methodCall(xmlrpcMethod, [ params ], function (err, value) {

        if (err) {

            const msg = 'XMLRPC Client Error: ' + err;

            logger.warn(msg, {method: xmlrpcMethod, trx_id: task.trx_id, destination: task.destination, err: err});
            report({
                trx_id: task.trx_id,
                rc: '68',
                message: 'INTERNAL: ' + msg,
                misc: {
                    task: task
                }
            });

            return;
        }

        logger.info('Got XMLRPC response from partner for', {method: xmlrpcMethod, trx_id: task.trx_id, destination: task.destination, response: value});
        //matrix.last_topupRequest_ack = value;

        report({
            trx_id: task.trx_id,
            rc: partnerRc[value.RESPONSECODE] || '40',
            message: value.MESSAGE,
            sn: (value.SN || '').replace(/;$/, '') || st24.extractSnFromMessage(value.MESSAGE, config.sn_pattern),
            amount: value.PRICE || st24.extractPriceFromMsg(value.MESSAGE),
            raw: value,
            misc: {
                task: task
            }
        });
    });
}

function advice(task) {
    if (config && advice_is_not_allowed) {
        return;
    }

    if (config && advice_is_topuprequest) {
        _topUpRequest(task, true);
    }
    else {
        _topUpInquiry(task);
    }
}

function report(data) {
    if (!data) {
        return;
    }

    matrix.last_report_to_core = data;
    pull.report(data);
}

exports.buy = buy;
exports.advice = advice;
exports.report = report;
