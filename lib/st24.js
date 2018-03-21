"use strict";

function extractSnFromMessage(msg) {
    if (!msg || typeof msg !== 'string') {
        return;
    }

    let match = msg.match(/^SN=(.*?);/);
    if (!match || match.length < 2) {
        return;
    }

    return match[1];
}

function extractPriceFromMsg(msg) {
    if (!msg || typeof msg !== 'string') {
        return;
    }

    let match = msg.match(/\d,HRG=(.*?),ID=/);
    if (!match || match.length < 2) {
        return;
    }

    if (!match[1]) {
        return;
    }

    return parseInt(match[1].replace(/\./g, ''));
}


exports.extractSnFromMessage = extractSnFromMessage;
exports.extractPriceFromMsg = extractPriceFromMsg;
