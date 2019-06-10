"use strict";

const http = require('http');
const url = require('url');

const stringify = require("json-stringify-pretty-compact");

const config = require('komodo-sdk/config');
const logger = require('komodo-sdk/logger');

const partner = require('../partner');
const irs = require('komodo-gw-irs-lib');

function processPartnerReport(qs) {
    let rc = '68';
    if (qs.statuscode === '1') {
        rc = '00';
    }
    else if (qs.statuscode === '2') {
        rc = '40';
    }

    if (rc === '40') {
        rc = irs.getRcFromMessage(qs.msg) || '40';
    }

    let amount = null;
    if (rc === '00') {
        amount = Number(qs.hrg);
        if (!amount) {
            amount = irs.getPriceFromMessage(qs.msg, config.partner.price_pattern);
        }
    }

    partner.report({
        trx_id: qs.clientid,
        rc: rc,
        message: 'REVERSE-REPORT: ' + stringify(qs),
        raw: stringify(qs),
        sn: (qs.sn ? qs.sn : null) || irs.getSnFromMessage(qs.msg, config.partner.sn_pattern) || null,
        amount: amount,
        balance: (rc === '00') ? irs.getBalanceFromMessage(qs.msg, config.partner.balance_pattern) : null,
        misc: {}
    })
}

function create() {
    http.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        const qs = url.parse(req.url, true).query;
        res.end('OK');

        const remote_ip = req.connection ? req.connection.remoteAddress : null;
        logger.verbose('REVERSE-REPORT: got report from partner', {url: req.url, remote_ip: remote_ip});

        processPartnerReport(qs);
    }).listen(config.reverse_report_port);

    logger.info('REVERSE-REPORT: listen on port ' + config.reverse_report_port);
}

config.reverse_report_port && create();
