var margin = {
    top: 25,
    right: 25,
    bottom: 25,
    left: 25
};

var width = 800 - margin.left - margin.right;
var height = 400 - margin.bottom - margin.top;
var centered;



var bbVis = {
    x: 30,
    y: 5,
    w: width ,
    h: height
};

var current_year = 2000;

d3.csv("olympic_data.csv",function(data){


	//waiting for the json file to load

	queue()
    .defer(d3.json,"world_data.json")
    .await(initVis);



    //intiializing the visualization 
    function initVis(error,world){

    	//tooltip displaying how many medals the clicked-on country won
    	var tooltip = d3.select("body")
		  .append("div")
		  .style("position", "absolute")
		  .style("z-index", "10")
		  .style("visibility", "hidden")
		  .style("color", "black")
		  .style("font-size", "15px")
		  .attr("class", "tooltip");

    	var years = [];

		data.forEach(function(d){
		 	if(years.indexOf(d['Year']) == -1){
		  		years.push(d['Year']);
		  	}
		});

	  	years.sort();

	  

	  	//generating a drop-down menu to select which year to display data for
			
	    var years = [];

		  data.forEach(function(d){
		  	if(years.indexOf(d['Year']) == -1){
		  		years.push(d['Year']);
		  	}
		  });

		  years.sort();

	  


		var yearDrop = d3.select("#table_container")
		    .data(years)
		    .append("form")
		    .append("select")
		    .on("change", activate);




		var yearOpts = yearDrop.selectAll("option")
	    	.data(years)
	    	.enter()
	    	.append("option")
	      	.text(function (d) { return d; })
	      	.attr("value", function (d) { return d; });
	   
	
	    //colors the countries that have data available for that year


    	function activate(){
	  	paths = d3.selectAll("path");
		    	paths.forEach(function(p){
		    		p.forEach(function(p1){
		    			d3.select(p1).classed("active",false);
		    		});
		    	});
		      	current_year = this.options[this.selectedIndex].value;
		      	data.forEach(function(d){
			      	if (d['Year'] == current_year) {
			      		this_path = d3.select("path[country = '" + d['Country']+ "']");
			      		this_path.forEach(function(p){
			      			d3.select(p[0]).classed("active",true)});

		  			}
		  		});
		 }


		 //svg containing the main visualization

		var svg = d3.select("#vis").append("svg").attr({
		    width: width + margin.left + margin.right,
		    height: height + margin.top + margin.bottom
		}).append("g").attr("id","mainVis").attr({"transform" :  "translate(" + (margin.left) + "," + margin.top + ")"});


		//svg containing the bar chart 


		var svg2 = d3.select("#detailVis1").append("svg").attr({
			width : width + margin.left + margin.right - 300,
			height : height + margin.top + margin.bottom + 100
			}).append("g").attr({
				transform : "translate(" + (margin.left + 100) + "," + (margin.top - 5) + ")"
				});



		//svg containing the line graph

		var svg3 = d3.select("#detailVis2").append("svg").attr({
			width : width + margin.left + margin.right ,
			height : height + margin.top + margin.bottom
		}).append("g").attr({"transform" : "translate(" + margin.left + "," + margin.top + ")"});



		var projectionMethods = [
		    {
		        name:"mercator",
		        method: d3.geo.mercator().translate([width/ 2, height/ 2 + margin.top]).precision(.1)
		    }
		];


		var actualProjectionMethod = 0;


		var newCountries = [];

		var projection = d3.geo.mercator().translate([width / 2 , height / 2 ]).precision(.1)
		var path = d3.geo.path().projection(projectionMethods[0].method);




		//creating the world map

		svg.selectAll("path")
		        .data(world.features.filter(function(d) {return d.id != -99; }))
		        .enter()
		        .append("path")
		        .attr("d", path)
		        .attr("class", "country")
		        .attr("country",function(d){return d.properties.name})
		        .on("click",zoom);


		data.forEach(function(d){
			if (d['Year'] == current_year) {
			    this_path = d3.select("path[country = '" + d['Country']+ "']");
			    this_path.forEach(function(p){
			    d3.select(p[0]).classed("active",true)});

		  		}
		  	});

		

		//zooms in on a country when clicked and displays the corresponding bar chart and line graph

		function zoom (d) {

	    	var country_name = d.properties.name;
	    	make_bars(country_name);
	    	make_line_graph(country_name);
	    	console.log(country_name);
	    	var gold_medals = 0;
	    	var silver_medals = 0;
	    	var bronze_medals = 0;

	    	//aggregating the total number of gold, silver, and bronze medals
	    	data.forEach(function(athlete){
	    		if (athlete['Country'] == country_name) {
	    			if(athlete['Year'] == current_year) {
	    				gold_medals += parseInt(athlete['Gold Medals']);
	    				silver_medals += parseInt(athlete['Silver Medals']);
	    				bronze_medals += parseInt(athlete['Bronze Medals']);
	    			}
	    		}

	    	});
	    	


		  
		  var x, y, k;

		  if (d && centered !== d) {
		  	console.log(tooltip);
		    var centroid = path.centroid(d);
		    x = centroid[0];
		    y = centroid[1];
		    k = 4;
		    centered = d;
		    tooltip.style("left",function (d) {return (bbVis.w/2 + margin.left - 100) + "px"})
		    .style("top",function (d){ return (bbVis.h/2 + margin.top ) + "px"})
		    .style("visibility", "visible")
	        .html("<b>" + country_name + "</b><br><b>"+ gold_medals + "</b> gold medals <br><b>" + silver_medals + "</b> silver medals<br><b>" + bronze_medals + "</b> bronze medals");
		  } else {
		  	tooltip.style("visibility","hidden");
		    x = width / 2;
		    y = height/2;
		    k = 0.9;
		    centered = null;
		  }

		  svg.selectAll("path")
		      .classed("zoomed", centered && function(d) { return d === centered; });

		  svg.transition()
		      .duration(750)
		      .attr("transform", "translate(" + ((width) / 2 ) + "," + ((height ) / 2 ) + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
		      .style("stroke-width", 1.5 / k + "px");

		  //recoloring the countries for which data is available

		  data.forEach(function(e){
			if (e['Year'] == current_year) {
				this_path = d3.select("path[country = '" + d['Country']+ "']");
				this_path.forEach(function(p){
				d3.select(p[0]).classed("active",true)});

			  	}
			});


	}

		

		
	//generates the line graph
	function make_line_graph(country){
		d3.selectAll(".linegraph").remove()

		//aggregating the data
		medals_data = [{medal : "gold", counts : []},{medal : "silver", counts : []}, {medal : "bronze", counts : []}]
		years.forEach(function(y){
			gold = 0;
			silver = 0;
			bronze = 0;
			data.forEach(function (d){

				if (d['Year'] == y && d['Country'] == country){
					gold += +d['Gold Medals'];
					silver += +d['Silver Medals'];
					bronze += +d['Bronze Medals'];
				}

			});

			medals_data.forEach(function (m){
				console.log(m);
				if (m.medal == 'gold'){
					m['counts'].push({year : y, medals : gold});
				}
				if (m.medal == 'silver'){
					m['counts'].push({year : y, medals : silver});
				}
				if (m.medal == 'bronze'){
					m['counts'].push({year : y, medals : bronze});
				}
			})
		});


		var format = d3.time.format('%Y');


		var x = d3.time.scale().range([margin.left,width]).domain([format.parse('2000'),format.parse('2012')]);


		var y = d3.scale.linear().range([0,height]).domain([150,0]);

		var xAxis = d3.svg.axis()
		    .scale(x)
		    .orient("bottom");
		var yAxis = d3.svg.axis()
    		.scale(y)
    		.orient("left");

    	var line = d3.svg.line()
    		.interpolate("linear")

    		.x(function(d) {return x(format.parse(d.year)); })
    		.y(function(d) {return y(d.medals); });

    	var color = d3.scale.ordinal()
		    .range(["#8c7853","#C0C0C0","#FFD700"])
		    .domain(["bronze","silver","gold"]);

		var medals = color.domain().map(function(name) {
    		return {
      			name: name,
      			values: medals_data.map(function(d) {
        		return {year: d.year, medals: +d[medals]};
      			})
    		};
 		});

 		svg3.append("g")
      		.attr("class", "x axis")
      		.attr("transform", "translate(0," + height + ")")
      		.call(xAxis);

  		svg3.append("g")
      		.attr("class", "y axis")
      		.attr("transform","translate(" + margin.left + ",0)")
       		.call(yAxis)
    		.append("text")
      		.attr("transform", "rotate(-90)")
      		.attr("y", 6)
      		.attr("dy", ".71em")
      		.style("text-anchor", "end")
      		.text("Medals");

 		var medal = svg3.selectAll(".medal")
      		.data(medals_data)
    		.enter().append("g")
      		.attr("class", "linegraph");

  		medal.append("path")
      		.attr("class", "line")
      		.attr("class","linegraph")
      		.attr("d", function(d) { return line(d.counts); })
      		.style("fill","none")
      		.style("stroke", function(d) { return color(d.medal); });





	}



	//creates the bar chart 

	function make_bars(country){
		d3.selectAll(".detail").remove();
		var x = d3.scale.ordinal()
			.rangeRoundBands([0,300], .1);

		var y = d3.scale.linear()
			.range([bbVis.h,margin.top])
			.domain([0,75]);

		var yAxis = d3.svg.axis()
			.scale(y)
			.orient("left")
			.ticks(12);

		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom");

		var color = d3.scale.ordinal()
		    .range(["#8c7853","#C0C0C0","#FFD700"]);


		sports = {}
		data.forEach(function(d){
			if (d['Country'] == country && d['Year'] == current_year){
				if (d['Sport'] in sports){
					sports[d['Sport']].gold += +d['Gold Medals'];
					sports[d['Sport']].silver += +d['Silver Medals'];
					sports[d['Sport']].bronze += +d['Bronze Medals'];
					sports[d['Sport']].total += +d['Gold Medals'] + +d['Silver Medals'] + +d['Bronze Medals']
				} else {
					sports[d['Sport']] = {gold : +d['Gold Medals'], silver : +d['Silver Medals'], bronze : +d['Bronze Medals'], total : +d['Gold Medals'] + +d['Silver Medals'] + +d['Bronze Medals']};
				}
			}
		});

		sports_list = [];
		for (s in sports){
			sports_list.push({sport : s, gold : sports[s].gold, silver : sports[s].silver, bronze : sports[s].bronze, total : sports[s].total});
		}

		sports_list.sort(function(a,b){return b.total - a.total});

		color.domain(["bronze","silver","gold"])

		sports_list.forEach(function(d) {
    		var y0 = 0;
    		d.medals = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
    		console.log(d.medals);
    		d.total = d.medals[d.medals.length - 1].y1;
			});

		
		x.domain(sports_list.map(function (d) {return d.sport }));

		svg2.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(" + margin.left + "," + bbVis.h + ")")
			.attr("class", "axis")
			.attr("class","detail")
		    .call(xAxis)
		    .selectAll("text") 
		    .style("text-anchor", "end")
		    .attr("class","detail")
		    .attr("dx", "-.8em")
		    .attr("dy", ".15em")
		    .attr("transform", function(d) {
		        return "rotate(-65)" 
		 });
		svg2.append("g")
	        .attr("class", "y axis")
	        .attr("class", "detail")
	        .attr("class", "axis")
	        .attr("transform", "translate(" + margin.left + ",0)")
	        .call(yAxis)
	        .append("text")
	        .attr("transform", "rotate(-90)")
	        .attr("y", 6)
	        .attr("dy", ".71em")
	        .style("text-anchor", "end")
	        .text("Medals")
	        .attr("x", -30)
	        .attr("class","detail");

	    var sport = svg2.selectAll(".sport")
      		.data(sports_list)
    		.enter().append("g")
      		.attr("class", "g")
      		.attr("class","detail")
     	 	.attr("transform", function(d) { return "translate(" + (margin.left+ x(d.sport)) + ",0)"; });
     	sport.selectAll("rect")
      		.data(function(d) { return d.medals; })
    		.enter().append("rect")
    		.attr("class","detail")
      		.attr("width", x.rangeBand())
      		.attr("y", function(d) { return y(d.y1); })
      		.attr("height", function(d) { return y(d.y0) - y(d.y1); })
     		.style("fill", function(d) { return color(d.name); });




		
				
	}

}

	






});