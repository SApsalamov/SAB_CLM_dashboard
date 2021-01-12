
console.log('svg create');
//Read the data
// data_connectedscatter_target_control.csv
function plotcgtgLine(total_cgtg_lineplot) {
  // set the dimensions and margins of the graph
  var margin2 = {top: 10, right: 100, bottom: 30, left: 30},
     width2 = 460 - margin2.left - margin2.right,
     height2 = 400 - margin2.top - margin2.bottom;
  console.log("my dataviz");
  // append the svg object to the body of the page
  var svg_dv = d3.select("#my_dataviz")
   .append("svg")
     .attr("width", width2 + margin2.left + margin2.right)
     .attr("height", height2 + margin2.top + margin2.bottom)
   .append("g")
     .attr("transform",
           "translate(" + margin2.left + "," + margin2.top + ")");
  d3.csv( total_cgtg_lineplot,
  function(data) {

     // List of groups (here I have one group per column)
     // ["valueA", "valueB", "valueC"]
     var allGroup = ["Target_Group", "Control_Group", "Full_Product"]
     max_time = 0
     max_value = 0
     // Reformat the data: we need an array of arrays of {x, y} tuples
     var dataReady = allGroup.map( function(grpName) { // .map allows to do something for each element of the list
       return {
         name: grpName,
         values: data.map(function(d) {
           if ( +d.time > max_time){
             max_time = +d.time
           }

           if (+d[grpName] > max_value){
             max_value = +d[grpName]
           }
           // console.log(d);
           // console.log(d.time);
           return {time: d.time, value: +d[grpName]};
         })
       };
     });
     // I strongly advise to have a look to dataReady with
     // console.log(dataReady)

     // A color scale: one color for each group
     var myColor = d3.scaleOrdinal()
       .domain(allGroup)
       .range(d3.schemeSet2);

    console.log(dataReady);
    console.log('max_time:' + max_time);
     // Add X axis --> it is a date format
     var xd = d3.scaleLinear()
       .domain([0, max_time])
       .range([ 0, width2 ]);
     svg_dv.append("g")
       .attr("transform", "translate(0," + height2 + ")")
       .call(d3.axisBottom(xd));

     // Add Y axis
     var yd = d3.scaleLinear()
       .domain( [0,max_value+7])
       .range([ height2, 0 ]);
     svg_dv.append("g")
       .call(d3.axisLeft(yd));

     // Add the lines
     var line = d3.line()
       .x(function(d) { return xd(+d.time) })
       .y(function(d) { return yd(+d.value) })
     svg_dv.selectAll("myLines")
       .data(dataReady)
       .enter()
       .append("path")
         .attr("class", function(d){ return d.name })
         .attr("d", function(d){ return line(d.values) } )
         .attr("stroke", function(d){ return myColor(d.name) })
         .style("stroke-width", 4)
         .style("fill", "none")

     // Add the points
     svg_dv
       // First we need to enter in a group
       .selectAll("myDots")
       .data(dataReady)
       .enter()
         .append('g')
         .style("fill", function(d){ return myColor(d.name) })
         .attr("class", function(d){ return d.name })
       // Second we need to enter in the 'values' part of this group
       .selectAll("myPoints")
       .data(function(d){ return d.values })
       .enter()
       .append("circle")
         .attr("cx", function(d) { return xd(d.time) } )
         .attr("cy", function(d) { return yd(d.value) } )
         .attr("r", 5)
         .attr("stroke", "white")

     // Add a label at the end of each line
     svg_dv
       .selectAll("myLabels")
       .data(dataReady)
       .enter()
         .append('g')
         .append("text")
           .attr("class", function(d){ return d.name })
           .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; }) // keep only the last value of each time series
           .attr("transform", function(d) { return "translate(" + xd(d.value.time) + "," + yd(d.value.value) + ")"; }) // Put the text at the position of the last point
           .attr("x", 12) // shift the text a bit more right
           .text(function(d) { return d.name; })
           .style("fill", function(d){ return myColor(d.name) })
           .style("font-size", 15)

     // Add a legend (interactive)
     svg_dv
       .selectAll("myLegend")
       .data(dataReady)
       .enter()
         .append('g')
         .append("text")
           .attr('x', function(d,i){ return 30 + i*120})
           .attr('y', 30)
           .text(function(d) { return d.name; })
           .style("fill", function(d){ return myColor(d.name) })
           .style("font-size", 15)
         .on("click", function(d){
           // is the element currently visible ?
           currentOpacity = d3.selectAll("." + d.name).style("opacity")
           // Change the opacity: from 0 to 1 or from 1 to 0
           d3.selectAll("." + d.name).transition().style("opacity", currentOpacity == 1 ? 0:1)

         })
  })
}
