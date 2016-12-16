var dv = new DeepViz()

var svg = d3.select("#workspace")
	.append("svg")
	.attr("width","800px")
	.attr("height","1200px");

// text section
svg.append("text")
	.attr("x",100)
	.attr("y",45)
	.text("Write key")
	.attr("font-family", "sans-serif")
	.attr("font-size", "20px");
svg.append("text")
		.attr("x",100)
		.attr("y",95)
		.text("Read keys")
		.attr("font-family", "sans-serif")
		.attr("font-size", "20px");
svg.append("text")
		.attr("x",300)
		.attr("y",30)
		.text("Memory")
		.attr("font-family", "sans-serif")
		.attr("font-size", "20px");
svg.append("text")
		.attr("x",500)
		.attr("y",95)
		.text("Read Out")
		.attr("font-family", "sans-serif")
		.attr("font-size", "20px");
svg.append("text")
		.attr("x",500)
		.attr("y",215)
		.text("Input Prediction")
		.attr("font-family", "sans-serif")
		.attr("font-size", "20px");
svg.append("text")
		.attr("x",680)
		.attr("y",215)
		.text("GT")
		.attr("font-family", "sans-serif")
		.attr("font-size", "20px");
svg.append("text")
		.attr("x",100)
		.attr("y",315)
		.text("Weight History")
		.attr("font-family", "sans-serif")
		.attr("font-size", "20px");
svg.append("text")
		.attr("x",100)
		.attr("y",555)
		.text("Read Key History")
		.attr("font-family", "sans-serif")
		.attr("font-size", "20px");

var w_indicator = svg.append("rect")
		.attr("x",100)
		.attr("y",320)
		.attr("width",20)
		.attr("height",200)
		.attr("stroke","black")
		.attr("fill","none")
var r_indicator = svg.append("rect")
		.attr("x",100)
		.attr("y",560)
		.attr("width",20)
		.attr("height",620)
		.attr("stroke","black")
		.attr("fill","none")

var consumer = function(data)	{
	dv.mydata = data; // for debug, not necessary

	// 1,2,3,4 ... write
	weight_colors = [[81,101,232],[93,170,255],[73,202,232],[81,255,228],[255,130,119]];

	var k_vec = dv.filter(data,'r_k')

	for (i=0; i < 4; i++)	{
		var read_w = dv.HighlightRenderer(svg,[[1]],[100,100+i*20],weight_colors[i])
		var read_o = dv.HighlightRenderer(svg,[[1]],[500,100+i*20],weight_colors[i]);
		read_w.click_id = i+1;
		read_o.click_id = i+1;
		dv.add(read_w);
		dv.add(read_o);

		var read_weights = dv.filter(data,'read_weights').map(dv.T).map(dv.gCGen(i))
		var read_memory = dv.HighlightEpisodeRenderer(svg,read_weights,[300,32],weight_colors[i],i+1)
		dv.add(read_memory);

		var read_weight_h = dv.T(dv.filter(data,'read_weights').map(dv.T).map(dv.gCGen(i)))
		var history = dv.HighlightRenderer(svg,read_weight_h,[100,320],weight_colors[i]);
		history.listen_click_state = true;
		history.click_id = i+1;
		history.num_span_row = 1;
		dv.add(history);

		var k_h = dv.T(k_vec.map(dv.T).map(dv.gCGen(i)));
		var k_h_r = dv.HighlightRenderer(svg,k_h,[100,540+i*160],weight_colors[i]);
		k_h_r.num_span_row = 1;
		dv.add(k_h_r);
	}

	var write_k = dv.HighlightRenderer(svg,[[1]],[100,50],weight_colors[4]);
	write_k.click_id = 5;
	dv.add(write_k);

	var write_weight_h = dv.T(dv.filter(data,'write_weights').map(dv.T).map(dv.gCGen(0)))
	var write_history = dv.HighlightRenderer(svg,write_weight_h,[100,320],weight_colors[4]);
	write_history.listen_click_state = true;
	write_history.click_id = 5;
	write_history.num_span_row = 1;
	dv.add(write_history);

	var kw_vec = dv.filter(data,'w_k')
	kw_vec = kw_vec.map(function(i) { return [i[0]]; })
	dv.add(dv.GridEpisodeRenderer(svg,kw_vec,[100,50]));

	dv.add(dv.GridEpisodeRenderer(svg,k_vec,[100,100]));

	var read_out = dv.filter(data,'read_out');//.map(dv.T).map(dv.getAvgCol).map(dv.T)
	dv.add(dv.GridEpisodeRenderer(svg,read_out,[500,100]));

	var input = dv.filter(data,'input');
	var input_raw = input.map(function(i) { return i.slice(0,8); })
	var gt = dv.filter(data,'gt');
	var input_reference = dv.getDatasetExemplars(gt,input_raw)

	//var input_pastlabel = input.map(function(i) { return i.slice(8,11); })

	//dv.add(dv.GridEpisodeRenderer(svg,input_pastlabel,[20,100]));
	dv.add(dv.GridEpisodeRenderer(svg,gt,[680,220]));
	dv.add(dv.HighlightEpisodeRenderer(svg,dv.filter(data,'pred_proba'),[500,220],[183,204,54]));
	//dv.add(dv.GridEpisodeRenderer(svg,dv.filter(data,'pred_proba'),[60,250]));
	dv.add(dv.GridRenderer(svg,input_reference,[500,220]));
	//dv.add(dv.GridEpisodeRenderer(svg,input,[630,100]));

	// we'll manipulate the visualizaiton of these sections
	var read_weights = dv.filter(data,'read_weights').map(dv.T);

	//console.log(read_weights_1)

	// we want the transpose of these grids
	var write_weights = dv.filter(data,'write_weights').map(dv.T).map(dv.getAvgCol)
	var write_memory = dv.HighlightEpisodeRenderer(svg,write_weights,[300,32],weight_colors[4],5)
	dv.add(write_memory);

	//make sure memory is on top
	dv.add(dv.GridEpisodeRenderer(svg,dv.filter(data,'memory'),[300,32]));

	dv.updateVis(0);

}

dv.loadData("example_state3.json",consumer)

// controller functions
frame = 30
var tempScrollTop = $(window).scrollTop();
$('#prev').on('click', function (e) {
		tempScrollTop = $(window).scrollTop();
		frame = ((frame-1)%30 + 30);
		w_indicator.attr("x",100+20*(frame-30));
		r_indicator.attr("x",100+20*(frame-30));
  	dv.updateVis(frame-30);
    $('#frame').text('Frame: '+(frame-29))
		$(window).scrollTop(tempScrollTop);
})

$('#next').on('click', function (e) {
		tempScrollTop = $(window).scrollTop();
		frame = ((frame+1)%30 + 30);
		w_indicator.attr("x",100+20*(frame-30));
		r_indicator.attr("x",100+20*(frame-30));
  	dv.updateVis(frame-30);
     $('#frame').text('Frame: '+(frame-29))
		$(window).scrollTop(tempScrollTop);
})
