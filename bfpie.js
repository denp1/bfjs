// started from http://bl.ocks.org/1346410
// Color specifications and designs developed by Cynthia Brewer (http://colorbrewer.org/)
var colorbrewer = {3: ["rgb(252,141,89)", "rgb(255,255,191)", "rgb(153,213,148)"], 4: ["rgb(215,25,28)", "rgb(253,174,97)", "rgb(171,221,164)", "rgb(43,131,186)"], 5: ["rgb(215,25,28)", "rgb(253,174,97)", "rgb(255,255,191)", "rgb(171,221,164)", "rgb(43,131,186)"], 6: ["rgb(213,62,79)", "rgb(252,141,89)", "rgb(254,224,139)", "rgb(230,245,152)", "rgb(153,213,148)", "rgb(50,136,189)"], 7: ["rgb(213,62,79)", "rgb(252,141,89)", "rgb(254,224,139)", "rgb(255,255,191)", "rgb(230,245,152)", "rgb(153,213,148)", "rgb(50,136,189)"], 8: ["rgb(213,62,79)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,139)", "rgb(230,245,152)", "rgb(171,221,164)", "rgb(102,194,165)", "rgb(50,136,189)"], 9: ["rgb(213,62,79)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,139)", "rgb(255,255,191)", "rgb(230,245,152)", "rgb(171,221,164)", "rgb(102,194,165)", "rgb(50,136,189)"], 10: ["rgb(158,1,66)", "rgb(213,62,79)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,139)", "rgb(230,245,152)", "rgb(171,221,164)", "rgb(102,194,165)", "rgb(50,136,189)", "rgb(94,79,162)"], 11: ["rgb(158,1,66)", "rgb(213,62,79)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,139)", "rgb(255,255,191)", "rgb(230,245,152)", "rgb(171,221,164)", "rgb(102,194,165)", "rgb(50,136,189)", "rgb(94,79,162)"]},
    width = 350,
    height = 200,
    radius = Math.min(width, height) / 2,
    sections,
    runnerList,
    refreshButton,
    priceButtons,
    runnerLabels,
    latestprices,
    numberOfRunners,
    colour;

// functions for navigating different versions of site 
var updatePriceButtons,
    getDepthButton,
    getPriceButton,
    getTooltipContainer,
    isChartShowing;

function isD3Loaded() {return (window.d3 !== undefined);}

// because safari doesn't allow percent signs in bookmarklets
// and percent encoding upsets some minifiers
function mod(n, d) {return n - (Math.floor(n/d) * d);}

function getMaxPrice(isBackPrice) {return isBackPrice ? 1.0 : 1.0 / 10000.0;}

var colourChooser = [
    function(ix){return d3.rgb(colour(Math.floor(ix/3))).darker(0.3);},
    function(ix){return colour(numberOfRunners);},
    function(ix){return d3.rgb(colour(Math.floor(ix/3))).brighter(0.3);}
    ];

function getColour(d, ix) { return colourChooser[mod(ix, 3)](ix);}

function waitTillD3Loaded() {
    if (isD3Loaded()) {
        d3Plot();
    } else {
        setTimeout(waitTillD3Loaded, 250);
    }
}

function refreshPrices() {
    var e = document.createEvent("MouseEvents");
    e.initEvent("click", true, false);
    refreshButton.dispatchEvent(e);
}

function getMainDoc() {
    return d3.select(d3.select("#site_sports")[0][0].contentDocument)
        .select("#main")[0][0].contentDocument;
}

function grabPrices() {
    var newPrices = [];

    for (i = 0; i < numberOfRunners; i++) {
        newPrices[i] = {};
        var b1 = priceButtons[2 * i];
        var b2 = priceButtons[(2 * i) + 1];

        newPrices[i].backPrice = getPrice(true, b1);
        newPrices[i].layPrice  = getPrice(false, b2);
        newPrices[i].spread    = newPrices[i].backPrice - newPrices[i].layPrice;

        newPrices[i].backDepth = getDepth(b1);
        newPrices[i].layDepth  = getDepth(b2);
    }
    return newPrices;
}

function getPrice(isBackPrice, w) {
    var txt = w.childNodes[getPriceButton(w.childNodes.length)].textContent.trim().replace(',', '');
    if ((txt === "&nbsp;") || (txt.length === 0)) {
        return getMaxPrice(isBackPrice);
    } else {
        return 1.0 / parseFloat(txt);
    }
}

function getDepth(w) {
    var txt = w.childNodes[getDepthButton(w.childNodes.length)].textContent.trim().replace(',', '');
    return (txt.length < 2) ? 0.0 : parseFloat(txt.substring(1));
}

function updatePrices() {

    priceButtons = updatePriceButtons();

    latestprices = grabPrices();
    var totalBack = latestprices.reduce(function(a, b) {
            return {backPrice: a.backPrice + b.backPrice};
        }).backPrice,
        totalLay = latestprices.reduce(function(a, b) {
            return {layPrice: a.layPrice  + b.layPrice};
        }).layPrice,
        totalSpread = latestprices.reduce(function(a, b) {
            return {spread: a.spread  + b.spread};
        }).spread;

    for (i = 0; i < numberOfRunners; i++) {
        var otherLays   = totalLay  - latestprices[i].layPrice, 
            otherBacks  = totalBack - latestprices[i].backPrice,
            notMoreThan = Math.min(latestprices[i].backPrice, 1.0 - otherLays),
            notLessThan = Math.max(latestprices[i].layPrice, 1.0 - otherBacks);

        latestprices[i].rawRatio = (notMoreThan + notLessThan) / 2.0;
    }

    var overBy = 1.0 - latestprices.reduce(function(a, b) {return {rawRatio: a.rawRatio + b.rawRatio};}).rawRatio;

    for (i = 0; i < numberOfRunners; i++) {
        latestprices[i].overBy = latestprices[i].spread * overBy / totalSpread;
        latestprices[i].finalArc = latestprices[i].overBy + latestprices[i].rawRatio;

        var d1 = latestprices[i].backDepth;
        var d2 = latestprices[i].layDepth;

        if ((d1 + d2) === 0.0) {
            d1 = 1.0;
            d2 = 1.0;
        }

        var arcSpread = latestprices[i].spread * latestprices[i].finalArc / 2.0;

        sections[(i*3)]   = (latestprices[i].finalArc - arcSpread) * (d1 / (d1 + d2));
        sections[(i*3)+1] = arcSpread * 2.0;
        sections[(i*3)+2] = (latestprices[i].finalArc - arcSpread) * (d2 / (d1 + d2));
    }
}

function d3Plot() {

    function setAccessFunctions() {
        if (isYui3) {
            priceButtons  = d3.selectAll('.cta-back, .cta-lay')[0];
            runnerList    = d3.select(".cont-runners");
            refreshButton = d3.select(".mkt-refresh-btn")[0][0];
            runnerLabels  = runnerList.selectAll(".sel-name")[0];        
            updatePriceButtons  = function()  {return priceButtons;};
            getDepthButton      = function(l) {return 3;};
            getPriceButton      = function(l) {return 1;};
            getTooltipContainer = function()  {return d3.select("body");};
            isChartShowing      = function()  {return d3.select('#chartDiv')[0][0] !== null;};
        } else {
            var main_doc  = getMainDoc();
            updatePriceButtons  = function()  {return runnerList.selectAll('.l1 .buttonAppearance,.b1 .buttonAppearance')[0];};
            runnerList    = d3.select(main_doc).select("#runnerList");
            refreshButton = d3.select(main_doc).select("#m1_btnRefresh")[0][0];
            priceButtons  = updatePriceButtons();
            runnerLabels  = runnerList.selectAll(".runnerName")[0];
            getDepthButton      = function(l) {return l - 1;};
            getPriceButton      = function(l) {return l - 2;};
            getTooltipContainer = function()  {return chartDiv;};
            isChartShowing      = function()  {return getMainDoc().getElementById('chartDiv') !== null;};
        }
    }

    var toolTipChooser = [
        function(name, priceset){return "£" + priceset.backDepth + " to Back " + name + " @ " + (1.0 / priceset.backPrice).toFixed(2);},
        function(name, priceset){return "Spread for " + name;},
        function(name, priceset){return "£" + priceset.layDepth + " to Lay " + name + " @ " + (1.0 / priceset.layPrice).toFixed(2);}
        ];

    function setToolTipText(d, ix) {
        var name = runnerLabels[Math.floor(ix / 3)].innerHTML;
        var priceset = latestprices[Math.floor(ix / 3)];

        tooltip.text(toolTipChooser[mod(ix, 3)](name, priceset));
        tooltip.style("visibility", "visible");
    }

    function change() {
        if (!isChartShowing()) {
            return;
        }
        refreshPrices();  // Note prices will be one sample lagged in chart
        updatePrices();
        path.data(pie(sections));
        path.transition().duration(750).attrTween("d", arcTween); 
        setTimeout(change, 1000);
    }

    function arcTween(a) {
        var i = d3.interpolate(this._current, a);
        this._current = i(0);
        return function(t) {
            return arc(i(t));
        };
    }

    var isYui3 = d3.select(".cont-runners")[0][0] !== null;
    setAccessFunctions(isYui3);

    runnerList.insert("div", ":first-child")
        .attr("align", "center")
        .attr("id", "chartDiv");

    numberOfRunners = priceButtons.length / 2;
    sections = [numberOfRunners * 3];

    var chartDiv = runnerList.select("#chartDiv");
   
    updatePrices();
    
    if (numberOfRunners < 9) { 
         colour = d3.scale.ordinal().range(colorbrewer[numberOfRunners + 1]);
    } else {
         colour = d3.scale.category20();
    }

    var pie = d3.layout.pie().sort(null);

    var arc = d3.svg.arc()
        .innerRadius(radius - 60)
        .outerRadius(radius - 20);

    var tooltip = getTooltipContainer().append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("background-color", "#FAFCC5")
        .style("opacity", "0.85")
        .style("font-size", "12px")
        .style("padding", "3px");

    var svg = chartDiv.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
        
    var path = svg.selectAll("path")
        .data(pie(sections))
        .enter().append("path")
        .attr("fill", getColour)
        .on("mouseover", setToolTipText)
        .on("mousemove", function(){return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
        .on("mouseout", function(){return tooltip.style("visibility", "hidden");})
        .attr("d", arc)
        .each(function(d) { this._current = d; }); 

    setTimeout(change, 1000);
}

(function () {
  if (!isD3Loaded()) {
        document.body.appendChild(document.createElement("script")).src = "http://d3js.org/d3.v3.min.js";
    }
    waitTillD3Loaded();
})();
