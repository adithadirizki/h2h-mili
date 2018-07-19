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

    describe('#extractBalanceFromMsg', function() {
        describe('using native ST24 response', function() {
            it('should return correct balance', function()  {
                st24.extractBalanceFromMsg('SN=0516150344145563101; 16/05/18 15:03 ISI TR5 KE 0895350249796, SUKSES.SAL=426.078,HRG=5.250,ID=47285513,SN=0516150344145563101; ..trx lancar').should.equal(426078);
                st24.extractBalanceFromMsg('15/05/18 17:19 ISI SAN10 KE 08535686667, NOMOR YANG ANDA MASUKKAN SALAH, MOHON TELITI KEMBALI..SAL=1.144.578,ID=47250459, ..trx lancar').should.equal(1144578)
            })

            it('should return null if there is no balance info', function() {
                should.not.exists(st24.extractBalanceFromMsg('PENGECEKAN GAGAL'));
            })
        })

        describe('using custom rule', function() {
            const custom_rule = {
                pattern: "SALDO=(\\d+)",
                match_idx: 1
            }

            it('should return correct balance', function() {
                st24.extractBalanceFromMsg('ISI Telkomsel 10 ke 082139822309 BERHASIL.SN=0041002442595407.HRG=10400.SALDO=104911920', custom_rule).should.equal(104911920);
            })

            it('should return null if there is no balance info', function() {
                should.not.exists(st24.extractBalanceFromMsg('ISI Ke 08523548915 GAGAL.TRXID=20180516123010017371', custom_rule))
            })
        })
    })

    describe('#extractPriceFromMsg', function() {
        describe('using native ST24 topUpRequest direct response', function() {
            it('should return correct price', function() {
                st24.extractPriceFromMsg('SN=0041002635395450;;19/07/18 21:01 ISI SPT20 KE 08125100091, SUKSES. SAL=798.500,HRG=19.700,ID=48761075,SN=0041002635395450;; ..trx lancar').should.equal(19700);
                st24.extractPriceFromMsg('SN=0516150344145563101; 16/05/18 15:03 ISI TR5 KE 0895350249796, SUKSES.SAL=426.078,HRG=5.250,ID=47285513,SN=0516150344145563101; ..trx lancar').should.equal(5250);
            });
        })

        describe('using native ST24 topUpInquiry response', function() {
            it('should return correct price', function() {
                st24.extractPriceFromMsg('19/07/18 20:53 ISI SPT20 KE 081264858057, SUKSES.SAL=828.425,HRG=19.700,ID=48761021,SN=0041002635369521;').should.equal(19700);
            })
        })
    })

})
