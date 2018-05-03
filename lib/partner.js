"use strict";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const url = require('url');
const https = require('https');
const xmlrpc = require('xmlrpc');
const moment = require('moment');
const stringify = require("json-stringify-pretty-compact");

const config = require('komodo-sdk/config');
const logger = require('komodo-sdk/logger');
const matrix = require('komodo-sdk/matrix');
const pull = require('komodo-sdk/gateway/pull');
const resendDelay = require('komodo-sdk/gateway/resend-delay');

const st24 = require('./st24');

if (config.partner.use_sslv3) {
    https.globalAgent.options.secureProtocol = 'SSLv3_method';
}

const partnerRc = fs.existsSync(__dirname + '/../rc-local.json') ? require('../rc-local.json') : require('./partner-rc.json');
logger.verbose('Partner RC dictionary loaded', {partner_rc: partnerRc});

const RESPONSECODE_TAG = config.responsecode_tag ? config.responsecode_tag : 'RESPONSECODE';

function komodoRc(rc) {
    return (config.partner.override_rc ? config.partner.override_rc[rc] : null) || partnerRc[rc] || '40';
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

            return;
        }

        logger.info('Got XMLRPC response from partner for', {method: xmlrpcMethod, trx_id: task.trx_id, destination: task.destination, response: value});
        matrix.last_topupRequest_ack = value;

        report({
            trx_id: task.trx_id,
            rc: komodoRc(value[RESPONSECODE_TAG]) || '40',
            message: stringify(value),
            sn: (value.SN || '').replace(/;$/, '') || st24.extractSnFromMessage(value.MESSAGE, config.sn_pattern),
            amount: value.PRICE || st24.extractPriceFromMsg(value.MESSAGE, config.amount_pattern),
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
            rc: komodoRc(value[RESPONSECODE_TAG]) || '40',
            message: stringify(value),
            sn: (value.SN || '').replace(/;$/, '') || st24.extractSnFromMessage(value.MESSAGE, config.sn_pattern),
            amount: value.PRICE || st24.extractPriceFromMsg(value.MESSAGE, config.amount_pattern),
            raw: value,
            misc: {
                task: task
            }
        });
    });
}

function advice(task) {
    if (config && config.advice_is_not_allowed) {
        return;
    }

    if (config && config.advice_max_age_ms) {
        if (moment() - moment(task.created) > config.advice_max_age_ms) {
            logger.verbose('Ignoring advice request because of expired task', {trx_id: task.trx_id, destination: task.destination, product: task.product, created: task.created, max_age: config.advice_max_age_ms});
            return;
        }
    }

    if (config && config.advice_is_topuprequest) {
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

    if (config && config.force_all_to_pending) {
        data.rc = '68';
    }

    matrix.last_report_to_core = data;
    pull.report(data);

    if (!resendDelay.isEnabled()) {
        //logger.verbose('Skipping resend delay because resend delay has not configured yet', {trx_id: task.trx_id, destination: task.destination, product: task.product});
        return;
    }

    if (data.rc !== '68') {
        logger.verbose('Canceling resend delay', {trx_id: data.trx_id})
        resendDelay.cancel(data.trx_id);
        return;
    }


    if (!data.misc || !data.misc.task || typeof data.misc.task !== 'object') {
        return;
    }

    const task = data.misc.task;    
    logger.verbose('Registering resend delay', {trx_id: task.trx_id, destination: task.destination, product: task.product})
    resendDelay.register(task, advice);

}

exports.buy = buy;
exports.advice = advice;
exports.report = report;
