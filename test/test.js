var assert = require('assert');
var d3 = require('d3');
var bfspark = require('../bfspark');

var r1BackableButton = {childNodes: [{textContent:'3.6'}, {textContent:'£10.0'}]};
var r1LayableButton  = {childNodes: [{textContent:'3.5'}, {textContent:'£150.0'}]};
var r2BackableButton = {childNodes: [{textContent:'1.21'}, {textContent:'£150.0'}]};
var r2LayableButton  = {childNodes: [{textContent:'1.1'}, {textContent:'£150.0'}]};
var emptyButton  = {childNodes: [{textContent:'&nbsp;'}, {textContent:''}]};


describe('bfspark', function() {
  var bf = bfspark.betfair;
  var r1BackPrice = 1.0 / 3.5;
  var r1LayPrice = 1.0 / 3.6;
  var r2BackPrice = 1.0 / 1.1;
  var r2LayPrice = 1.0 / 1.21;
  var minPrice = 1.0;
  var maxPrice = 1.0/10000.0;

  bf.getPriceButton = function(l) {return 0;}
  bf.getDepthButton = function(l) {return 1;}
  bf.numberOfRunners = 2;
  bf.priceButtons = [r1BackableButton, r1LayableButton, r2BackableButton, r2LayableButton];
  bf.updatePriceButtons = function() {
    return bf.priceButtons;
  };

  describe('#grabPrices()', function() {
    it('should grab some prices', function() {
      var prices = bf.grabPrices();
      assert.equal(2, prices.length);
      assert.equal(r1BackPrice, prices[0].backPrice);
      assert.equal(150.0, prices[0].backDepth);
      assert.equal(r1LayPrice, prices[0].layPrice);
      assert.equal(10.0, prices[0].layDepth);
    });
    it('should extract a price from a button', function() {
      assert.equal(r1BackPrice, bf.getPrice(true, r1LayableButton));
      assert.equal(r1LayPrice, bf.getPrice(false, r1BackableButton));
      assert.equal(minPrice, bf.getPrice(true, emptyButton));
      assert.equal(maxPrice, bf.getPrice(false, emptyButton));
    });
    it('should extract a market depth from a button', function() {
      assert.equal(150.0, bf.getDepth(r1LayableButton));
      assert.equal(0.0, bf.getDepth(emptyButton));
    });
  });
  describe('#updatePrices()', function() {
    it('should update some prices', function() {
      assert.equal(0, bf.latestPrices.length);
      bf.updatePrices();
      assert.equal(2, bf.latestPrices.length);
      assert.equal(r1BackPrice - r1LayPrice, bf.latestPrices[0].spread);
    });
  });
  describe('#sumPrices()', function() {
    it('should add all the backs, all the lays', function() {
      var sums = bf.sumPrices();
      assert.equal(r1BackPrice + r2BackPrice, sums.totalBack);
      assert.equal(r1LayPrice + r2LayPrice, sums.totalLay);
    });
  });
  describe('#getMaxPrice()', function() {
    it('should get a maximum price', function() {
      assert.equal(minPrice, bf.getMaxPrice(true));
      assert.equal(maxPrice, bf.getMaxPrice(false));
    });
  });
});
