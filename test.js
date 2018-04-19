"use strict";

const should = require('should');

const st24 = require('./lib/st24');

describe('#st24', function() {

    describe('#extractSnFromMessage', function() {

        describe('#using default st24 rule', function() {
            it('should return correct sn', function() {
                st24.extractSnFromMessage('SN=0419165234155980102;19/04/18 16:52 ISI TR5 KE 0895621829255, SUKSES.SAL=1.323.934,HRG=5.250,ID=46398092,SN=0419165234155980102; ..trx lancar').should.equal('0419165234155980102');
            })
        })

        describe('#using custom rule', function() {
            const custom_rule = {
                pattern: 'SN=(.*?)\\.',
                match_idx: 1
            }

            it('should return correct sn', function() {
                st24.extractSnFromMessage('ISI Telkomsel 10 ke 085261208081 BERHASIL.SN=0041002310111470.HRG=10035.SALDO=54489150', custom_rule).should.equal('0041002310111470');

            })

            it('should return null on message not containing sn', function() {
                should.not.exists(st24.extractSnFromMessage('ISI Ke 081311084419 GAGAL.TRXID=20180403123020042979', custom_rule));
            })

            it('should return null on message empty sn', function() {
                should.not.exists(st24.extractSnFromMessage('ISI Telkomsel 10 ke 085261208081 BERHASIL.SN=.HRG=10035.SALDO=54489150', custom_rule));
            })
        })
    })

})
