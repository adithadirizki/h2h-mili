"use strict";

function extractFromMessage(msg, default_pattern, default_match_idx, custom_rule) {
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
        pattern = default_pattern;
        match_idx = default_match_idx;
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

function extractSnFromMessage(msg, custom_rule) {
    const default_pattern = "SN=(.*?);";
    const default_match_idx = 1;

    return extractFromMessage(msg, default_pattern, default_match_idx, custom_rule);
}

function extractPriceFromMsg(msg, custom_rule) {
    const default_pattern = "\\d,HRG=(.*?),ID=";
    const default_match_idx = 1;

    let price = extractFromMessage(msg, default_pattern, default_match_idx, custom_rule);
    price = (typeof price === 'string') ? Number(price.replace(/\./g, '')) : null;
    return price;
}

function extractBalanceFromMsg(msg, custom_rule) {
    const default_pattern = "SAL=([\\d\\.]+)";
    const default_match_idx = 1;

    let balance = extractFromMessage(msg, default_pattern, default_match_idx, custom_rule);
    if (!balance || typeof balance !== 'string') {
        return;
    }

    return Number(balance.replace(/[^\d]/g, ''));
}


exports.extractSnFromMessage = extractSnFromMessage;
exports.extractPriceFromMsg = extractPriceFromMsg;
exports.extractBalanceFromMsg = extractBalanceFromMsg;
