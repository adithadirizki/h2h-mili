"use strict";

function extractSnFromMessage(msg, custom_rule) {
    if (!msg || typeof msg !== 'string') {
        return;
    }

    let pattern;
    let match_idx;

    if (custom_rule && custom_rule.pattern) {
        pattern = custom_rule.pattern;
        match_idx = custom_rule.match_idx;
    }
    else {
        pattern = "^SN=(.*?);";
        match_idx = 1;
    }

    const re = new RegExp(pattern);
    const matches = msg.match(re);

    if (!matches) return;

    if (match_idx < matches.length) {
        return matches[match_idx] || null;
    } else {
        return;
    }
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
