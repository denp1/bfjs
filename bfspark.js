// started from http://bl.ocks.org/1346410
var Betfair = {
  sparkLeftOffset: 0,
  latestPrices: [],
  numberOfRunners: 0,
  graphPoints: 64,
  sparkWidth: 0,
  isNewSite: true,
  lastPrice: 0.0,
  priceButtons: [],
  runnerContainer: undefined,
  runnerList: undefined,
  refreshButton: undefined,
  runnerLabels: undefined,
  updatePriceButtons: undefined,
  isChartShowing: undefined,
  getDepthButton: undefined,
  getPriceButton: undefined,
  xScale: undefined,
  yScale: undefined,
  graph: undefined,
  line: undefined,
  // load d3 into dom
  loadD3: function(){
    // allow the module to load in tests
    if (typeof document != "undefined") {
      var scr = document.createElement('script');
      scr.type = 'text/javascript';
      scr.async = true;
      scr.addEventListener('load', this.addSparklines.bind(this), false);
      scr.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js';
      document.body.appendChild(scr);1
    }
  },
  // add all the backs, all the lays
  sumPrices: function(){
    var lp = this.latestPrices;
    var ret = {};
    ret.totalBack = lp.reduce(function(a, b) {
        return {backPrice: a.backPrice + b.backPrice};
      }).backPrice;
    ret.totalLay = lp.reduce(function(a, b) {
        return {layPrice: a.layPrice + b.layPrice};
      }).layPrice;
    ret.totalSpread = lp.reduce(function(a, b) {
        return {spread: a.spread + b.spread};
      }).spread;
    return ret;
  },
  // press the refresh button, extract prices
  updatePrices: function() {
    this.updatePriceButtons();

    this.latestPrices = this.grabPrices();
    var lp = this.latestPrices;
    var sums = this.sumPrices();

    for (i = 0; i < this.numberOfRunners; i++) {
      var otherLays = sums.totalLay - lp[i].layPrice,
        otherBacks = sums.totalBack - lp[i].backPrice,
        notMoreThan = Math.min(lp[i].backPrice, 1.0 - otherLays),
        notLessThan = Math.max(lp[i].layPrice, 1.0 - otherBacks);

      lp[i].rawRatio = (notMoreThan + notLessThan) / 2.0;
    }

    var overBy = 1.0 - lp.reduce(function(a, b) {
      return {
        rawRatio: a.rawRatio + b.rawRatio
      };
    }).rawRatio;

    for (i = 0; i < this.numberOfRunners; i++) {
      lp[i].overBy = lp[i].spread * overBy / sums.totalSpread;
      lp[i].finalArc = lp[i].overBy + lp[i].rawRatio;
      // these are not used in current version
      var d1 = lp[i].backDepth;
      var d2 = lp[i].layDepth;

      if ((d1 + d2) === 0.0) {
        d1 = 1.0;
        d2 = 1.0;
      }
    }
  },
  // extract back and lay price and depth data from the price buttons
  grabPrices: function() {
    var newPrices = [];

    for (i = 0; i < this.numberOfRunners; i++) {
      newPrices[i] = {};
      var b1 = this.priceButtons[2 * i];
      var b2 = this.priceButtons[(2 * i) + 1];

      if (this.isNewSite) { // swap them
        var tmp = b1, b1 = b2, b2 = tmp;
      }

      newPrices[i].backPrice = this.getPrice(true, b1);
      newPrices[i].layPrice = this.getPrice(false, b2);
      newPrices[i].backDepth = this.getDepth(b1);
      newPrices[i].layDepth = this.getDepth(b2);
      newPrices[i].spread = newPrices[i].backPrice - newPrices[i].layPrice;
    }
    return newPrices;
  },
  // reset scales etc
  recalcSizes: function() {
    var right = Math.floor(d3.select('.depth-back-0')[0][0].getBoundingClientRect().left);
    var left = d3.select(".runner-list").select('.runner-name')[0][0].getBoundingClientRect().right;
    sparkWidth = right - left;
    // reset the xscale
    this.xScale = d3.scale.linear().domain([0, this.graphPoints - 1]).range([-5, sparkWidth]); // starting point is -5 so the first value doesn't show and slides off the edge as part of the transition
    this.runnerList.select('#chartDiv')[0][0].style.width = sparkWidth + 'px';
  },
  // create functions to access widgets
  setAccessFunctions: function() {
    this.isNewSite = d3.select(".runners-container")[0][0] !== null;
    if (this.isNewSite) {
      this.findNewWidgets();
    } else {
      this.findOldWidgets();
    }
  },
  // extract widgets from post 2014 page
  findNewWidgets: function() {
    this.priceButtons = d3.selectAll('.depth-lay-2, .depth-back-2')[0];
    this.runnerContainer = d3.select(".runner-data-container")[0]
    this.runnerContainer[0].children[0].style.display = 'inline-block';
    sparkLeftOffset = this.runnerContainer[0].children[0].offsetWidth;
    sparkRightEdge = this.runnerContainer[0].children[0].getBoundingClientRect().right;

    this.runnerList = d3.select(".runners-container");
    this.refreshButton = d3.select(".refresh-btn")[0][0];
    this.runnerLabels = this.runnerList.selectAll(".runner-name")[0];
    this.updatePriceButtons = function() {return;};
    this.getDepthButton = function(l) {return 2;};
    this.getPriceButton = function(l) {return 0;};
    this.isChartShowing = function() {return d3.select('#chartDiv')[0][0] !== null;};
    this.totalMatched = function() {return d3.select('.total-matched');};
  },
  // extract widgets from pre 2014 page
  findOldWidgets: function() {
    var main_doc = getMainDoc();
    this.updatePriceButtons = function() {
      this.priceButtons = this.runnerList.selectAll('.l1 .buttonAppearance,.b1 .buttonAppearance')[0];
    };
    this.runnerList = d3.select(main_doc).select("#runnerList");
    this.refreshButton = d3.select(main_doc).select("#m1_btnRefresh")[0][0];
    this.priceButtons = this.updatePriceButtons();
    this.runnerLabels = this.runnerList.selectAll(".runnerName")[0];
    this.getDepthButton = function(l) {return l - 1;};
    this.getPriceButton = function(l) {return l - 2;};
    this.isChartShowing = function() {
      return getMainDoc().getElementById('chartDiv') !== null;
    };
    this.totalMatched = function() {
      return d3.select(main_doc).select('#m1_TotalMoneyMatched');
    };
  },
  // main function to initiate graphics and start timer
  addSparklines: function() {
    if (window.d3 === undefined) {
      return;
    }
    this.setAccessFunctions();

    // var leftMostButton = document.getElementsByClassName('depth-back-0')[0];
    // leftOfButton = leftMostButton.getBoundingClientRect().left;

    cd = document.createElement('span');
    cd.setAttribute('id', 'chartDiv');

    this.runnerContainer[0].insertBefore(cd, this.runnerContainer[0].childNodes[0]);

    this.numberOfRunners = this.priceButtons.length / 2;

    var chartDiv = this.runnerList.select("#chartDiv");
    var height = 20;
    var width = 400;

    this.updatePrices();
    this.graph = chartDiv.append("svg:svg").attr("width", "100%").attr("height", "100%");
    this.graph[0][0].style.marginLeft = sparkLeftOffset + 'px';
    cd.setAttribute('style', 'float: right; z-index: 103; position: absolute; height: 100%');

    this.yScale = d3.scale.linear().domain([0, 10]).range([0, height]);
    // not sure I need this
    var thisProxy = this;
    function xproxy(d, i) {return thisProxy.xScale(d, i);};
    this.recalcSizes();

    this.line = d3.svg.line()
      .x(function(d, i) {return xproxy(i);})
      .y(function(d) {return thisProxy.yScale(d);})
      .interpolate('step-before');
    // initialise the data to be the value of the current price
    this.data = Array.apply(null, {length: this.graphPoints}).map(Function.call, function() {
      return this.latestPrices[0].backPrice * 10
    }.bind(this));

    this.graph.append("svg:path").attr("d", this.line(this.data))
      .style({
        'stroke': 'steelblue',
        'stroke-width': 1,
        'fill': 'none'
      });

    d3.select(window).on('resize', this.resize.bind(this));
    setInterval(this.change.bind(this), 1050);
  },
  // update the prices and redraw
  change: function() {
    if (!this.isChartShowing()) {
      return;
    }
    this.refreshPrices(); // Note prices will be one sample lagged in chart
    this.updatePrices();
    var newPrice = this.latestPrices[0].backPrice * 10;

    if (Math.abs((newPrice - this.lastPrice)) > 0.001) {
      this.lastPrice = newPrice;
      this.data.shift();
      this.data.push(newPrice);
      this.redrawWithAnimation();
    }
  },
  // update scales, update data, slide graph left
  redrawWithAnimation: function() {
    this.yScale.domain([Math.min.apply(1.0, this.data), Math.max.apply(0.0, this.data)]);

    this.graph.selectAll("path")
      .data([this.data]) // set the new data
      .attr("transform", "translate(" + this.xScale(1) + ")") // set the transform to the right by x(1) pixels (6 for the scale we've set) to hide the new value
      .attr("d", this.line) // apply the new data values ... but the new value is hidden at this point off the right of the canvas
      .transition() // start a transition to bring the new value into view
      .ease("basis")
      .duration(1000) // for this demo we want a continual slide so set this to the same as the setInterval amount below
      .attr("transform", "translate(" + this.xScale(0) + ")"); // animate a slide to the left back to x(0) pixels to reveal the new value

    /* thanks to 'barrym' for examples of transform: https://gist.github.com/1137131 */
  },
  // respond to the resize event
  resize: function() {
    this.recalcSizes();
    this.redrawWithAnimation();
  },
  // extract a price from the button
  getPrice: function(isBackPrice, w) {
    var button = w.childNodes[this.getPriceButton(w.childNodes.length)];
    if (button === undefined) {
      return this.getMaxPrice(isBackPrice);
    }
    var txt = button.textContent.trim().replace(',', '');
    if ((txt === "&nbsp;") || (txt.length === 0)) {
      return this.getMaxPrice(isBackPrice);
    } else {
      return 1.0 / parseFloat(txt);
    }
  },
  // extract the market depth from the button
  getDepth: function(w) {
    var button = w.childNodes[this.getDepthButton(w.childNodes.length)];
    if (button === undefined) {
      return 0.0;
    }
    var txt = button.textContent.trim().replace(',', '');
    return (txt.length < 2) ? 0.0 : parseFloat(txt.substring(1));
  },
  // press the refresh button
  refreshPrices: function() {
    var e = document.createEvent("MouseEvents");
    e.initEvent("click", true, false);
    this.refreshButton.dispatchEvent(e);
  },
  // if we are missing a value, what is the highest/lowest value?
  getMaxPrice: function(isBackPrice) {
    return isBackPrice ? 1.0 : 1.0 / 10000.0;
  },
  // for old version of the website, has embedded frames that select doesn't navigate
  getMainDoc: function() {
    return d3.select(d3.select("#site_sports")[0][0].contentDocument)
      .select("#main")[0][0].contentDocument;
  }
}

// load d3 and then the rest of this script
Betfair.loadD3();

if (typeof module != "undefined") {
  module.exports.betfair = Betfair;
}
