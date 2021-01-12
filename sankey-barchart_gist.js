/**
 * Renders our sankey barchart, abstracted out
 * so we can call multiple times to render while
 * a person scales their browser/phone/etc.
 *
 * @class SankeyBarchat
 * @constructor
 * @param  {String} domId   The DOM ID selector to use to render into (ie: '#chart')
 * @param  {Mixed} dataset  The dataset to render assumed to be in json array sequence with 'enter' and 'exit' variables.
 * @param  {Mixed} options  Options parameters to control the chart.
 *
 * @example
 *         require(['sankey-barchart'], function(SankeyBarchart) {
 *             var options = { height: 150 };
 *             var dataset = [
 *                 { enter: { value: 19485, label: 'All Sessions' }, exit: { label: 'No Shopping Activity' } },
 *                 { enter: { value: 5455, label: 'Sessions with Product Views' }, exit: { label: 'No Cart Addition' } },
 *                 { enter: { value: 768, label: 'Sessions with Add to Cart' }, exit: { label: 'Cart Abandonment' } }
 *             ];
 *             var bar = new SankeyBarchart('#mychart', dataset, options);
 *         });
 */
var SankeyBarchart = function(domId, dataset, options) {

    // container for exposure to the outside world
    var self = {};

    // add our css tag so we can style canvas as we see fit
    // specifically our headers and footers as well as our responsive design
    // aspects
    $(domId).addClass('sankey-barchart');

    // when we resize the window we simply repaint, we wrap
    // in underscores deferred and debounce methods to avoid
    // eating windows CPU and paints
    $(window).on('resize', _.debounce(function() {
        _.defer(function() {
            $(domId).html('');
            self.render(domId, dataset, options);
        });
    }, 50));

    // core rendering logic which is invoked as the window is resized
    // or when the viz is first loaded
    self.render = function(domId, dataset, options) {

        // calculate abandonment rate per step to show the user in header/footer
        _.each(_.range(dataset.length-1), function(i) {
            var exit_count = dataset[i].enter.value - dataset[i + 1].enter.value;
            dataset[i].exit.value = exit_count;
            dataset[i].exit.rate = exit_count / dataset[i].enter.value;
        });

        // calc aggregate conversion rate to show the user in header/footer
        _.each(_.range(1, dataset.length), function(i) {
            var rate = dataset[i].enter.value / dataset[0].enter.value;
            dataset[i].enter.rate = rate;
        });

        // options the user can use to modify the presentation of the
        // snakey barchat
        options = _.defaults(options || {}, {
            height: 200,
            padding: {
                top: 20,
                right: 20
            },
            range: {
                gap: 0.6,
                padding: 0.5
            },
            axis: {
                y: {
                    ticks: 4,
                    color: "#cccccc",
                    stroke: "#eeeeee",
                    format: ",.0f"
                },
                x: {
                    stroke: "#ddd",
                    dash_array: ("3, 3")
                }
            },
            bar: {
                stroke: "#1cd3a2",//"#6596EB",
                fill:  "#66c2a5" //"#739FEE"
            },
            sankey: {
                color: "#e9e9e9",
                opacity: 0.7
            }
        });

        // height and width, width is always assumed to be
        // the width of the container to elastically and responsively
        // scale to the device width and screen width
        var w = $(domId).width();
        var h = options.height || $(domId).height();

        // ranges/gaps/padding along x
        var xaxis_range_gap = d3.scale
            .ordinal()
            .domain(_.range(dataset.length)) // # of columns
            .rangeRoundBands([0, w - options.padding.right], options.range.gap, options.range.padding); // range, gap, pad

        // ===============================
        // TABLE WIDTH - We want to render columns
        // that match the columns in the SVG barchar so
        // we can align our table headers and footers to
        // these to give some KPIs and describe the data.
        // ===============================
        var table_column_width = function(d, i) {
            var me = xaxis_range_gap(i).toFixed(0);
            if (i < dataset.length - 1) {
                var next = xaxis_range_gap(i + 1).toFixed(0);
                return (next - me).toFixed(0) + 'px';
            } else {
                return (w - me).toFixed(0) + 'px';
            }
        };

        // ===============================
        // BARCHART HEADER
        // ===============================
        var svg = d3.select(domId)
            .append("div")
            .attr("class", "header")
            .style("width", function() {
                return w + 'px';
            })
            .style("position", "relative")
            .style("display", "block")
            .style("clear", "both")
            .selectAll("span")
            .data(dataset)
            .enter()
            .append("span")
            .style("left", function(d, i) {
                var x = xaxis_range_gap(i).toFixed(0);
                return x + 'px';
            })
            .style("width", table_column_width)
            .style("position", "absolute")
            .html(function(d, i) {
                return '<div class="th">' +
                    '<label>' + d.enter.label + '</label>' +
                    '<em class="value">' + d3.format(",.0f")(d.enter.value) + '</em>' +
                    (d.enter.rate ? '<em class="rate">' + d3.format(",.1%")(d.enter.rate) + '</em>' : '') +
                    '</div>';
            });

        // ===============================
        // SVG
        // ===============================
        d3.select(domId)
            .append("svg")
            .attr("width", w)
            .attr("height", h);

        // ===============================
        // BARCHART FOOTER
        // ===============================
        var svg = d3.select(domId)
            .append("div")
            .attr("class", "footer")
            .style("width", function() {
                return w + 'px';
            })
            .style("position", "relative")
            .style("display", "block")
            .style("clear", "both")
            .selectAll("span")
            .data(_.range(dataset.length - 1))
            .enter()
            .append("span")
            .style("left", function(d, i) {
                var x = xaxis_range_gap(i).toFixed(0);
                return x + 'px';
            })
            .style("width", table_column_width)
            .style("position", "absolute")
            .html(function(d, i) {
                var d = dataset[i];
                return '<div class="th">' +
                    '<label>' + d.exit.label + '</label>' +
                    '<em class="value">' + d3.format(",.0f")(d.exit.value) + '</em>' +
                    (d.exit.rate ? '<em class="rate">' + d3.format(",.1%")(d.exit.rate) + '</em>' : '')
                '</div>';
            });

        // ===============================
        // XAXIS
        // ===============================
        var lines = d3.select("svg").append("g")
            .attr("class", "x-lines")
            .attr("transform", "translate(0,0)");

        lines.selectAll("line.x")
            .data(_.range(dataset.length))
            .enter()
            .append("line")
            .attr("class", "x")
            .attr("x1", function(d, i) {
                return xaxis_range_gap(i);
            })
            .attr("y1", 0)
            .attr("y2", h)
            .attr("x2", function(d, i) {
                return xaxis_range_gap(i);
            })
            .style("stroke", options.axis.x.stroke)
            .style("stroke-dasharray", options.axis.x.dash_array);


        // ===============================
        // YAXIS
        // ===============================
        d3.select("svg").append("g")
            .attr("class", "y-lines")
            .attr("transform", "translate(0,0)");

        var yaxis = d3.scale.ordinal()
            .domain(_.range(options.axis.y.ticks))
            .rangeBands([0, h], 0, 0);

        d3.select("svg")
            .select(".y-lines")
            .selectAll("line.y")
            .data(_.range(options.axis.y.ticks))
            .enter()
            .append("line")
            .attr("class", "y")
            .attr("x1", 0)
            .attr("y1", function(d, i) {
                return yaxis(i);
            })
            .attr("y2", function(d, i) {
                return yaxis(i);
            })
            .attr("x2", w)
            .style("stroke", options.axis.y.stroke);

        d3.select("svg")
            .append("g")
            .attr("class", "y-text")
            .attr("transform", "translate(0,0)");

        var max_value = d3.max(dataset, function(d) {
            return d.enter.value
        });

        var bar_height_fx = d3.scale.linear()
            .domain([0, max_value])
            .range([0, h])
            .nice();

        d3.select("svg")
            .select(".y-text")
            .selectAll("text")
            .data(_.range(options.axis.y.ticks + 1))
            .enter().append("text")
            .attr("class", "y")
            .attr("x", 2)
            .attr("y", function(d, i) {
                if (i == options.axis.y.ticks) {
                    return h - 3;
                } else {
                    var y = yaxis(i) - 3;
                    return y;
                }
            })
            .text(function(d, i) {
                if (i == options.axis.y.ticks) {
                    return '0';
                } else {
                    var frmt = d3.format(options.axis.y.format);
                    var y = h - yaxis(i);
                    var v = bar_height_fx.invert(y);
                    return frmt(Math.round(v));
                }
            })
            .style("fill", options.axis.y.color)

        // ===============================
        // BARS
        // ===============================

        d3.select("svg")
            .selectAll("rect")
            .data(dataset)
            .enter()
            .append("rect")
            .attr("x", function(d, i) {
                return xaxis_range_gap(i);
            })
            .attr("y", function(d) {
                return (h - bar_height_fx(d.enter.value));
            })
            .attr("width", xaxis_range_gap.rangeBand())
            .attr("height", function(d) {
                return bar_height_fx(d.enter.value)
            })
            .attr("fill", function(d) {
                return options.bar.fill;
            })
            .style("stroke", options.bar.stroke);

        // ===============================
        // SANKEY FILL
        // Drawing our connections between the bars to visualize
        // the movement between the bars.
        // ===============================
        d3.select("svg")
            .append("g")
            .attr("class", "edges")
            .attr("transform", "translate(0,0)");

        d3.select("svg")
            .select(".edges")
            .selectAll(".edge")
            .data(_.initial(dataset))
            .enter()
            .append("polygon")
            .attr("class", "edge")
            .attr("points", function(this_datapoint, i) {

                var next_datapoint = dataset[i + 1];
                var y1 = h - bar_height_fx(this_datapoint.enter.value);
                var y2 = h - bar_height_fx(next_datapoint.enter.value);
                var x1 = xaxis_range_gap(i);
                var x2 = xaxis_range_gap(i + 1);

                return [
                    x1 + xaxis_range_gap.rangeBand() + 1, y1, // top right of this bar
                    x2, y2, // top left of next bar
                    x2, h + 1, // bottom left of next bar
                    x1 + xaxis_range_gap.rangeBand() + 1, h + 1 // bottom right of this bar
                ].join(" ");
            })
            .style("fill", options.sankey.color)
            .style("opacity", options.sankey.opacity);
    };

    // lets go ahead and render
    self.render(domId, dataset, options);

    return self;
};
