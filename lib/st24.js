"use strict";

function extractSnFromMessage(msg, custom_rule) {
    if (!msg || typeof msg !== 'string') {
        return;
    }

    let pattern;
    let pattern_match_idx;

    if (custom_rule && custom_rule.pattern) {
        pattern = custom_rule.pattern;
        pattern_match_idx = custom_rule.match_idx;
    }
    else {
        pattern = "^SN=(.*?);";
        pattern_match_idx = 1;
    }

    const re = new RegExp(pattern);
    const matches = msg.match(re);

    if (!matches) return;

    if (pattern_match_idx < matches.length) {
        return matches[pattern_match_idx];
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
