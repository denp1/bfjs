// started from http://bl.ocks.org/1346410
// Color specifications and designs developed by Cynthia Brewer (http://colorbrewer.org/)
var colorbrewer = {3: ["rgb(252,141,89)", "rgb(255,255,191)", "rgb(153,213,148)"],
      4: ["rgb(215,25,28)", "rgb(253,174,97)", "rgb(171,221,164)", "rgb(43,131,186)"],
      5: ["rgb(215,25,28)", "rgb(253,174,97)", "rgb(255,255,191)", "rgb(171,221,164)", "rgb(43,131,186)"],
      6: ["rgb(213,62,79)", "rgb(252,141,89)", "rgb(254,224,139)", "rgb(230,245,152)",
          "rgb(153,213,148)", "rgb(50,136,189)"],
      7: ["rgb(213,62,79)", "rgb(252,141,89)", "rgb(254,224,139)", "rgb(255,255,191)",
          "rgb(230,245,152)", "rgb(153,213,148)", "rgb(50,136,189)"],
      8: ["rgb(213,62,79)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,139)",
          "rgb(230,245,152)", "rgb(171,221,164)", "rgb(102,194,165)", "rgb(50,136,189)"],
      9: ["rgb(213,62,79)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,139)",
          "rgb(255,255,191)", "rgb(230,245,152)", "rgb(171,221,164)", "rgb(102,194,165)",
          "rgb(50,136,189)"],
      10: ["rgb(158,1,66)", "rgb(213,62,79)", "rgb(244,109,67)", "rgb(253,174,97)",
          "rgb(254,224,139)", "rgb(230,245,152)", "rgb(171,221,164)", "rgb(102,194,165)",
          "rgb(50,136,189)", "rgb(94,79,162)"],
      11: ["rgb(158,1,66)", "rgb(213,62,79)", "rgb(244,109,67)", "rgb(253,174,97)",
          "rgb(254,224,139)", "rgb(255,255,191)", "rgb(230,245,152)", "rgb(171,221,164)",
          "rgb(102,194,165)", "rgb(50,136,189)", "rgb(94,79,162)"]},
    pieWidth = 160,
    pieHeight = 200,
    pieLeftMargin,
    pieRadius = Math.min(pieWidth, pieHeight) / 2,
    pieSections,
    barWidth = 16,
    barMargin,
    tradedVolumeElements,
    runnerList,
    refreshButton,
    priceButtons,
    runnerLabels,
    latestPrices,
    numberOfRunners,
    colour,
    tradedVolume=[],
    timeSlot = 0,
    lastTotal = 0,
    maxVol=100;

// functions for navigating different versions of site
var isChartShowing;

// because safari doesn't allow percent signs in bookmarklets
// and percent encoding upsets some minifiers
function mod(n, d) {return n - (Math.floor(n/d) * d);}

function getMaxPrice(isBackPrice) {return isBackPrice ? 1.0 : 1.0 / 10000.0;}

var colourChooser = [
    function(ix){return d3.rgb(colour(Math.floor(ix/3))).darker(0.3);},  // backable prices
    function(){return colour(numberOfRunners);},                       // spread
    function(ix){return d3.rgb(colour(Math.floor(ix/3))).brighter(0.3);} // layable prices
    ];

function getColour(d, ix) { return colourChooser[mod(ix, 3)](ix);}

function refreshPrices() {
    var e = document.createEvent("MouseEvents");
    e.initEvent("click", true, false);
    refreshButton.dispatchEvent(e);
}
// for old version of the website, has embedded frames that select doesn't navigate
function getMainDoc() {
    return d3.select(d3.select("#site_sports").nodes()[0].contentDocument)
        .select("#main").nodes()[0].contentDocument;
}

function grabPrices() {
    var newPrices = [];

    for (i = 0; i < numberOfRunners; i++) {
        newPrices[i] = {};
        ix = 2 * i;

        newPrices[i].backPrice = getPrice(true, priceButtons[ix]);
        newPrices[i].layPrice  = getPrice(false, priceButtons[ix + 1]);
        newPrices[i].backDepth = getDepth(priceButtons[ix]);
        newPrices[i].layDepth  = getDepth(priceButtons[ix + 1]);
        newPrices[i].spread    = newPrices[i].backPrice - newPrices[i].layPrice;

    }
    return newPrices;
}

function getPrice(isBackPrice, w) {
    if (w === undefined) {
        return getMaxPrice(isBackPrice);
    }
    var txt = w.innerText.split('\n')[0]
    if ((txt === "&nbsp;") || (txt.length === 0) || (txt == '0')) {
        return getMaxPrice(isBackPrice);
    } else {
        return 1.0 / parseFloat(txt);
    }
}

function getDepth(w) {
    var textArray = w.innerText.split('\n');
    return (textArray.length < 2) ? 0.0 : parseFloat(textArray[1].substring(1));
}

function updateVolumes() {

    newTotal = parseFloat(totalMatched().nodes()[0].textContent.substring(4).replace(/,/g,''));
    if (lastTotal != 0) {
        tradedVolume.shift();
        tradedVolume.push({time: timeSlot++, value: newTotal - lastTotal});
    }
    maxVol = 0;
    for (var i = 0; i<tradedVolumeElements; i++) {
        maxVol = Math.max(maxVol, tradedVolume[i].value);
    }
    lastTotal = newTotal;
}

function updatePrices() {

    updateVolumes();

    latestPrices = grabPrices();
    var totalBack = latestPrices.reduce(function(a, b) {
            return {backPrice: a.backPrice + b.backPrice};
        }).backPrice,
        totalLay = latestPrices.reduce(function(a, b) {
            return {layPrice: a.layPrice  + b.layPrice};
        }).layPrice,
        totalSpread = latestPrices.reduce(function(a, b) {
            return {spread: a.spread  + b.spread};
        }).spread;

    for (i = 0; i < numberOfRunners; i++) {
        var otherLays   = totalLay  - latestPrices[i].layPrice,
            otherBacks  = totalBack - latestPrices[i].backPrice,
            notMoreThan = Math.min(latestPrices[i].backPrice, 1.0 - otherLays),
            notLessThan = Math.max(latestPrices[i].layPrice, 1.0 - otherBacks);

        latestPrices[i].rawRatio = (notMoreThan + notLessThan) / 2.0;
    }

    var overBy = 1.0 - latestPrices.reduce(function(a, b) {return {rawRatio: a.rawRatio + b.rawRatio};}).rawRatio;

    for (i = 0; i < numberOfRunners; i++) {
        latestPrices[i].overBy = latestPrices[i].spread * overBy / totalSpread;
        latestPrices[i].finalArc = latestPrices[i].overBy + latestPrices[i].rawRatio;

        var d1 = latestPrices[i].backDepth;
        var d2 = latestPrices[i].layDepth;

        if ((d1 + d2) === 0.0) {
            d1 = 1.0;
            d2 = 1.0;
        }

        var arcSpread = latestPrices[i].spread * latestPrices[i].finalArc / 2.0;

        pieSections[(i*3)]   = (latestPrices[i].finalArc - arcSpread) * (d1 / (d1 + d2));
        pieSections[(i*3)+1] = arcSpread * 2.0;
        pieSections[(i*3)+2] = (latestPrices[i].finalArc - arcSpread) * (d2 / (d1 + d2));
    }
}

function d3Plot() {
    if (window.d3 === undefined) {
        return;
    }

    function nullCheck(aList, aMessage) {
      if ((typeof aList == 'undefined') || (aList.length == 0)) {
        console.log(aMessage);
        return false;
      }
      return true;
    }

    function validateAccess() {
      nullCheck(priceButtons, 'priceButtons are not found');
      nullCheck(runnerList, 'runnerList is not found');
      nullCheck(runnerLabels, 'runnerLabels are not found');
    }

    function setAccessFunctions() {
      pieLeftMargin = 0;
      barMargin = {top: 20, right: 20, bottom: 20, left: 40};
      tradedVolumeElements = 27;

    //   priceButtons  = d3.selectAll('.first-lay-cell .bet-button-price, .last-back-cell .bet-button-price').nodes();
      priceButtons  = d3.selectAll('.first-lay-cell, .last-back-cell').nodes();

      runnerList    = d3.select(".runners-container");
      refreshButton = d3.select(".refresh-btn").nodes()[0];
      runnerLabels  = d3.selectAll(".runner-name").nodes();
      isChartShowing      = function()  {return d3.select('#chartDiv').nodes()[0] !== null;};
      totalMatched = function() {return d3.select('.total-matched');};
      validateAccess();
    }

    setAccessFunctions();

    for (var i = 0; i < tradedVolumeElements; i++) {
        tradedVolume[i] = {time: timeSlot++, value: 0}
    }

    var x = d3.scaleLinear()
        .domain([0, 1])
        .range([0, barWidth]);

    var y = d3.scaleLinear()
        .domain([0, 100])
        .rangeRound([pieHeight - barMargin.top - barMargin.bottom, 0]);

    function drawChart() {

        y.domain([0, Math.max(maxVol,100)]);
        yaxis.call(yAxis);

        var h = pieHeight - barMargin.top - barMargin.bottom;

        var rect = chart.selectAll("rect")
            .data(tradedVolume, function(d) { return d.time; });

        rect.enter().insert("rect", "line")
                .attr("x", function(d, i) { return x(i + 1) - .5; })
                .attr("y", function(d) { return y(d.value) - .5; })
                .attr("width", barWidth)
                .attr("height", function(d) { return h - y(d.value); })
                .attr("fill", "teal")
            .transition()
                .duration(1000)
                .attr("x", function(d, i) { return x(i) - .5; });

        rect.transition()
            .duration(1000)
            .attr("x", function(d, i) { return x(i) - .5; })
            .attr("y", function(d) { return y(d.value) - .5; })
            .attr("height", function(d) { return h - y(d.value); });

        rect.exit().remove();
    }


    var toolTipChooser = [
        function(name, priceset){return "£" + priceset.backDepth + " to Back " + name + " @ " + (1.0 / priceset.backPrice).toFixed(2);},
        function(name){return "Spread for " + name;},
        function(name, priceset){return "£" + priceset.layDepth + " to Lay " + name + " @ " + (1.0 / priceset.layPrice).toFixed(2);}
        ];

    function setToolTipText(d, ix) {
        var name = runnerLabels[Math.floor(ix / 3)].innerHTML;
        var priceset = latestPrices[Math.floor(ix / 3)];

        tooltip.text(toolTipChooser[mod(ix, 3)](name, priceset));
        tooltip.style("visibility", "visible");
    }

    function change() {
        if (!isChartShowing()) {
            return;
        }
        refreshPrices();  // Note prices will be one sample lagged in chart
        updatePrices();
        path.data(pie(pieSections));
        path.transition().duration(750).attrTween("d", arcTween);

        drawChart();
        d3.timerFlush();
        setTimeout(change, 1000);
    }

    function arcTween(a) {
        var i = d3.interpolate(this._current, a);
        this._current = i(0);
        return function(t) {
            return arc(i(t));
        };
    }

    runnerList.insert("div", ":first-child")
        .attr("id", "chartDiv");

    numberOfRunners = priceButtons.length / 2;

    pieSections = [numberOfRunners * 3];

    var chartDiv = runnerList.select("#chartDiv");

    updatePrices();

    if (numberOfRunners < 9) {
         colour = d3.scaleOrdinal().range(colorbrewer[numberOfRunners + 1]);
    } else {

        const colourScheme = d3.schemeCategory10.concat(d3.schemeCategory10).slice(0, 20);
        const colourScaled = d3.scaleOrdinal(colourScheme);
        colour = function(c) {return colourScaled(c);};        
    }

    var pie = d3.pie().sort(null);

    var arc = d3.arc()
        .innerRadius(pieRadius - 40)
        .outerRadius(pieRadius);

    var tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("background-color", "#FAFCC5")
        .style("opacity", "0.85")
        .style("font-size", "12px")
        .style("padding", "3px");

    var svg = chartDiv.append("svg")
        .attr("width", pieWidth + pieLeftMargin)
        .attr("height", pieHeight)
        .append("g")
            .attr("transform", "translate(" + ((pieWidth / 2) + pieLeftMargin) + "," + pieHeight / 2 + ")");

    var path = svg.selectAll("path")
        .data(pie(pieSections))
        .enter().append("path")
        .attr("fill", getColour)
        .on("mouseover", setToolTipText)
        .on("mousemove", function(){return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
        .on("mouseout", function(){return tooltip.style("visibility", "hidden");})
        .attr("d", arc)
        .each(function(d) { this._current = d; });

    var chart = chartDiv.append("svg")
        .attr("class", "chart")
        .attr("width", "75%")
//        .attr("width", (barWidth * tradedVolume.length) + barMargin.left + barMargin.right)
        .attr("height", pieHeight)
        .attr("y", 10)
        .append("g")
            .attr("transform", "translate(" + barMargin.left + ", " + barMargin.top + ")");

    chart.append("line")
        .attr("x1", 0)
        .attr("x2", barWidth * (tradedVolume.length + 1))
        .attr("y1", pieHeight + 0.5)
        .attr("y2", pieHeight + 0.5)
        .attr("stroke-width", 0.5)
        .style("stroke", "#000")
        .attr("transform", "translate(0, -40)");

    var yAxis = d3.axisLeft().scale(y).ticks(3).tickFormat(volumeFormatter);

    function volumeFormatter(d) {
        var dd = d;
        var suf = '';
        var f = d3.format(".0f");

        if (d >= 1000) {
            dd  = d/1000;
            suf = 'k';
            if (mod(d, 1000) !== 0) {
                f = d3.format(".1f");
            }
        } else if (d >= 1000000) {
            dd  = d/1000000;
            suf = 'm';
            if (mod(d, 1000000) !== 0) {
                f = d3.format(".1f");
            }
        }
        return "£" + f(dd) + suf;
    }

    var yaxis = chart.append("g").call(yAxis);

    yaxis.selectAll("path")
        .style("fill", "none")
        .style("stroke", "#000")
        .style("shape-rendering", "crispEdges");

    setTimeout(change, 1000);
}

(function () {
    var scr = document.createElement('script');
    scr.type = "text/javascript";
    scr.async = true;
    scr.addEventListener('load', d3Plot, false);
    scr.src = "https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js";

    document.body.appendChild(scr);
})();
