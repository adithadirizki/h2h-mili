"use strict";

const rcFromMsg = require('komodo-sdk/rc-from-msg');
const organicRc = require('./rc');

function getRcFromMessage(msg, customRc) {
    let rc;
    if (customRc) {
        rc = rcFromMsg(msg, customRc);
    }

    if (!rc) {
        rc = rcFromMsg(msg, organicRc);
    }

    return rc;
}

function getPriceFromMessage(msg, rule) {
    if (typeof msg !== 'string') {
        return;
    }

    if (process.env.DEBUG_IRS && !rule) {
        console.log('** IRS.getPriceFromMessage no rule'); // eslint-disable-line no-console
    }

    if (process.env.DEBUG_IRS && rule) {
        console.log('** IRS.getPriceFromMessage rule: ' + JSON.stringify(rule, null, 2)); // eslint-disable-line no-console
    }

    const pattern = (rule && typeof rule.pattern === 'string') ? rule.pattern : "Harga: ([\\d\\.]+?) ";
    const match_idx = (rule && typeof rule.match_idx === 'number') ? rule.match_idx : 1;

    const re = new RegExp(pattern);
    const matches = msg.match(re);
    if (process.env.DEBUG_IRS) {
        console.log('** IRS.getPriceFromMessage msg: "' + msg + '" active_pattern: "' + pattern + '" active_match_idx: ' + match_idx); // eslint-disable-line no-console
        console.log('** IRS.getPriceFromMessage matches:\n' + JSON.stringify(matches)); // eslint-disable-line no-console
    }
    if (matches && matches[match_idx]) {
        const result =  Number(matches[match_idx].replace(/\./g, ''));
        if (process.env.DEBUG_IRS) {
            console.log('** IRS.getPriceFromMessage SUPPLIER-PRICE: ' + result); // eslint-disable-line no-console
        }
        return result;
    }
}

function extractFromMessage(msg, rule) {
    if (typeof msg !== 'string') { return; }

    if (!rule) { return; }

    if (typeof rule !== 'object') {
        return;
    }

    rule.match_idx = Number(rule.match_idx);

    if (!rule.match_idx) {
        rule.match_idx = 1;
    }

    const re = new RegExp(rule.pattern);
    const matches = msg.match(re);
    if (matches && matches[rule.match_idx] && typeof matches[rule.match_idx] === 'string') {
        return matches[rule.match_idx];
    }
}

function getSnFromMessage(msg, rule) {
    if (!rule) {
        rule = {
            pattern: "SN: (\\d+)",
            match_idx: 1
        }
    }

    let sn = extractFromMessage(msg, rule);
    if (!sn || typeof sn !== 'string') { return; }

    return sn.toUpperCase().replace(/[^a-zA-Z0-9/]/g, '-').replace(/-+/g, '-').replace(/-*\/-*/g, '/').replace(/^-+/, '').replace(/-+$/, '');
}

function getBalanceFromMessage(msg, rule) {
    if (!rule) {
        rule = {
            pattern: "Sisa Saldo: .+? = ([\\d\\.]+) ",
            match_idx: 1
        }
    }

    let result = extractFromMessage(msg, rule);
    if (!result || typeof result !== 'string') { return; }

    return Number(result.replace(/\./g, ''));
}

exports.getRcFromMessage = getRcFromMessage;
exports.getPriceFromMessage = getPriceFromMessage;
exports.getSnFromMessage = getSnFromMessage;
exports.getBalanceFromMessage = getBalanceFromMessage;
