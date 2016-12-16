var DeepViz = function()  {
    this.vis_buffer = [];
    this.mydata = []; // for testing
    var click_state = 1; // register states for rendering in consumer

    this.newHighlightEpisodeRenderer = function(group,data,rgb,click_id)  {
      return new HighlightEpisodeRenderer(group,data,rgb,click_id);
    }

    this.newHighlightRenderer = function(group,data,rgb)  {
      var nHER = new HighlightRenderer(group,data);
      nHER.setRGB(rgb);
      return nHER;
    }

    var HighlightRenderer = function(group,arr)  {
      var frame_period = 400;
    	this.grid_size = 20;
      this.num_span_row = 8;
      this.rgb = [0,0,255];
    	// helper functions to manipulate arrays
    	function map2d(a,func)	{
    		return a.map(function(row) {
    			return row.map(function(col) {
    				return func(col)
    			})
    		});
    	}

      this.setRGB = function(rgb)  {
        this.rgb = rgb;
      }

      this.transition = false;
    	this.group = group;
    	this.normalization = 1;
      this.click_id = 0;
      this.listen_click_state = false;

    	this.setData = function(arr)	{
    		this.numrow = arr.length;
    		this.numcol = arr[0].length;
    		if (this.numcol == null) { this.numcol = 1; }

    		// data[row][col]
    		if (this.numcol == 1)	{
    			this.data = arr.map(function(i) { return [i]})
    		} else {
    			this.data = arr;
    		}
    	}

    	this.setData(arr)

    	this.setNormalization = function(val)	{
    		this.normalization = val
    	}

    	// return the same grid but row/col transposed
    	this.t = function()	{
    		var clone = $.extend({},this)
    		var a = clone.data
    		var at = a[0].map(function (_, c) {
    			return a.map(function (r) {
    				return r[c];
    			});
    		});
    		clone.setData(at);
    		return clone;
    	}

    	// return the max val of grid
    	this.max = function()	{
    		var a = this.data
    		// 1D
    		if (a[0][0] == null) {
    			return Math.max(...a.map(Math.abs))
    		// 2D
    		} else {
    			return Math.max(...a.map(function(i) {
    				return Math.max(...i.map(Math.abs))
    			}))
    		}
    	}

    	// return a normalized grid using val
    	this.norm = function(val) {
    		return new GridRenderer(
    			this.group,
    			map2d(this.data,function(a) { return a/val;})
    		)
    	}

    	this.getVisData = function()	{
    		var max_val = this.normalization
    		var data = new Array();
    		var xpos = 1; //starting xpos and ypos at 1
    		var ypos = 1;
    		var width = this.grid_size*this.num_span_row;
    		var height = this.grid_size;
    		var click = 0;
    		var grid = this.data;
    		var numrow = this.numrow;
    		var numcol = this.numcol;
        var rgb = this.rgb;


    		// iterate for rows
    		for (var row = 0; row < numrow; row++) {
    			data.push( new Array() );

    			// iterate for cells/columns inside rows
    			for (var column = 0; column < numcol; column++) {
    				var val = grid[row][column]
    				data[row].push({
    					x: xpos,
    					y: ypos,
    					val: val,
    					max_val: max_val,
    					width: width,
    					height: height,
    					click: click,
              rgb: rgb
    				})
    				// increment the x position. I.e. move it over by 50 (width variable)
    				xpos += width;
    			}
    			// reset the x position after a row is complete
    			xpos = 1;
    			// increment the y position for the next row.
    			ypos += height;
    		}
    		return data;
    	}

    	this.render = function()	{
    		var group = this.group
    		var max_val = this.normalization
    		var data = this.getVisData(max_val)
        //var clicked = this.clicked
        var click_id = this.click_id
        var listen_click_state = this.listen_click_state
    		var row_data = group.selectAll(".row")
    			.data(data);

    		row_data.exit().remove()

    		var	row = row_data.enter().append("g")
    					.attr("class", "row")
    				.merge(row_data)

    		var column_data = row.selectAll(".square")
    			.data(function(d) { return d; });

    		var column = column_data.enter().append("rect")
    				.attr("class","square").on("click", function() {
                if (!listen_click_state) {
                  click_state = click_id;
                  dv.updateVis(frame-30); // hack for demo
                }
                d3.event.stopPropagation();
            })
    				//.style("stroke", "#222")
    			.merge(column_data)
    				.style("fill", function(d) {
              //console.log("in fill callback");
              if (listen_click_state && (click_state != click_id)) {
                return "rgba(255,255,255,0)"
              } else  {
                return "rgba("+d.rgb[0]+","+d.rgb[1]+","+d.rgb[2]+","+(d.val/d.max_val)+")";
              }

    				})

        // only add a transition after the first render
        if (this.transition)  {
          column = column.transition().duration(frame_period);
        }

        column = column.attr("x", function(d) { return d.x; })
    				.attr("y", function(d) { return d.y; })
    				.attr("width", function(d) {
    					return d.width;
    				})
    				.attr("height", function(d) {
    					return d.height;
    				});
      }
    };

    var HighlightEpisodeRenderer = function(group,data,rgb,click_id)  {
      this.rows = data.map(function(frame) {
        var nHER = new HighlightRenderer(group,frame);
        nHER.setRGB(rgb);
        if (click_id != null) {
          nHER.click_id = click_id;
          if (click_id > 0) { nHER.listen_click_state = true; }
        }
        return nHER;
      });

      this.max_val = Math.max(...this.rows.map(function(r) {
        return r.max();
      }));

    	// update the normalization and transition state of grids
    	for (r in this.rows) { this.rows[r].setNormalization(this.max_val); }

      this.render = function(frame)	{
    		if (frame == null) { frame = 0; }
    		this.rows[frame].render()
        // update transition state after first load
        if (this.init)  {
          for (g in this.rows) { this.rows[g].transition = true; }
          this.init = false;
        }
    	}
    }

    // we build a grid, episodes are arrays of grids
    this.newGridEpisodeRenderer = function(group,data)  {
      return new GridEpisodeRenderer(group,data);
    }

    this.newGridRenderer = function(group,data)  {
      return new GridRenderer(group,data);
    }

    var GridRenderer = function(group,arr)	{
    	var frame_period = 400
    	this.grid_size = 20
    	// helper functions to manipulate arrays
    	function map2d(a,func)	{
    		return a.map(function(row) {
    			return row.map(function(col) {
    				return func(col)
    			})
    		});
    	}

      this.transition = false
    	this.group = group
    	this.normalization = 1

    	this.setData = function(arr)	{
    		this.numrow = arr.length;
    		this.numcol = arr[0].length;
    		if (this.numcol == null) { this.numcol = 1; }

    		// data[row][col]
    		if (this.numcol == 1)	{
    			this.data = arr.map(function(i) { return [i]})
    		} else {
    			this.data = arr;
    		}
    	}

    	this.setData(arr)

    	this.setNormalization = function(val)	{
    		this.normalization = val
    	}

    	// return the same grid but row/col transposed
    	this.t = function()	{
    		var clone = $.extend({},this)
    		var a = clone.data
    		var at = a[0].map(function (_, c) {
    			return a.map(function (r) {
    				return r[c];
    			});
    		});
    		clone.setData(at);
    		return clone;
    	}

    	// return the max val of grid
    	this.max = function()	{
    		var a = this.data
    		// 1D
    		if (a[0][0] == null) {
    			return Math.max(...a.map(Math.abs))
    		// 2D
    		} else {
    			return Math.max(...a.map(function(i) {
    				return Math.max(...i.map(Math.abs))
    			}))
    		}
    	}

    	// return a normalized grid using val
    	this.norm = function(val) {
    		return new GridRenderer(
    			this.group,
    			map2d(this.data,function(a) { return a/val;})
    		)
    	}

    	this.getVisData = function()	{
    		var max_val = this.normalization
    		var data = new Array();
    		var xpos = 1; //starting xpos and ypos at 1
    		var ypos = 1;
    		var width = this.grid_size;
    		var height = this.grid_size;
    		var click = 0;
    		var grid = this.data;
    		var numrow = this.numrow;
    		var numcol = this.numcol;

    		// iterate for rows
    		for (var row = 0; row < numrow; row++) {
    			data.push( new Array() );

    			// iterate for cells/columns inside rows
    			for (var column = 0; column < numcol; column++) {
    				var val = grid[row][column]
    				data[row].push({
    					x: xpos+width*(1-(Math.abs(val)/max_val))/2,
    					y: ypos+height*(1-(Math.abs(val)/max_val))/2,
    					val: val,
    					max_val: max_val,
    					width: width,
    					height: height,
    					click: click
    				})
    				// increment the x position. I.e. move it over by 50 (width variable)
    				xpos += width;
    			}
    			// reset the x position after a row is complete
    			xpos = 1;
    			// increment the y position for the next row.
    			ypos += height;
    		}
    		return data;
    	}

    	this.render = function()	{
    		var group = this.group
    		var max_val = this.normalization
    		var data = this.getVisData(max_val)
    		var row_data = group.selectAll(".row")
    			.data(data);

    		row_data.exit().remove()

    		var	row = row_data.enter().append("g")
    					.attr("class", "row")
    				.merge(row_data)

    		var column_data = row.selectAll(".square")
    			.data(function(d) { return d; });

    		var column = column_data.enter().append("rect")
    				.attr("class","square")
    				.style("stroke", "#222")
    			.merge(column_data)
    				.style("fill", function(d) {
    					if (d.val > 0) {return "#fff"} else {return "#0"}
    				})

        // only add a transition after the first render
        if (this.transition)  {
          column = column.transition().duration(frame_period);
        }

        column = column.attr("x", function(d) { return d.x; })
    				.attr("y", function(d) { return d.y; })
    				.attr("width", function(d) {
    					return d.width*(Math.abs(d.val)/d.max_val);
    				})
    				.attr("height", function(d) {
    					return d.height*(Math.abs(d.val)/d.max_val);
    				});
      }
    };

    var GridEpisodeRenderer = function(group,data)	{
    	// add grids of particular field type to the desired group div
    	this.grids = data.map(function(frame) {
        return new GridRenderer(group,frame);
      });

      this.init = true;
    	this.frames = this.grids.length;
    	//this.name = field;

    	this.max_val = Math.max(...this.grids.map(function(g) {
        return g.max();
      }));

    	// update the normalization and transition state of grids
    	for (g in this.grids) { this.grids[g].setNormalization(this.max_val); }

    	// transpose all the grids in the array
    	this.t = function()	{
    		// extend the object using jQuery (fix up later?)
    		var clone = $.extend({},this)
    		clone.grids = clone.grids.map(function(g) {
    			return g.t();
    		});
    		return clone;
    	}

    	this.render = function(frame)	{
    		if (frame == null) { frame = 0; }
    		this.grids[frame].render()
        // update transition state after first load
        if (this.init)  {
          for (g in this.grids) { this.grids[g].transition = true; }
          this.init = false;
        }

    	}
    };
}

DeepViz.prototype.GridRenderer = function(root,data,trans)  {
  var group = this.generateElement(root,trans);
  //console.log(this.vis_buffer)
  return this.newGridRenderer(group,data);
}

DeepViz.prototype.GridEpisodeRenderer = function(root,data,trans)  {
  var group = this.generateElement(root,trans);
  //console.log(this.vis_buffer)
  return this.newGridEpisodeRenderer(group,data);
}

DeepViz.prototype.HighlightRenderer = function(root,data,trans,rgb)  {
  var group = this.generateElement(root,trans);
  //console.log(this.vis_buffer)
  return this.newHighlightRenderer(group,data,rgb);
}

DeepViz.prototype.HighlightEpisodeRenderer = function(root,data,trans,rgb,click_id)  {
  var group = this.generateElement(root,trans);
  return this.newHighlightEpisodeRenderer(group,data,rgb,click_id);
}

// for arrays of objects (like for episodes), return an array of one field
DeepViz.prototype.filter = function(fulldata, field) {
  return fulldata.map(function(frame) {
    return frame[field];
  });
};

DeepViz.prototype.T = function(a)  {
  var at = a[0].map(function (_, c) {
    return a.map(function (r) {
      return r[c];
    });
  });
  return at;
};

// return a function (for using with map)
// the i'th column of array
DeepViz.prototype.gCGen = function(c) {
  return function(i)	{
    return i.map(function(j) { return j[c]; });
  };
};

DeepViz.prototype.getAvgCol = function(a) {
  var mean = function(v) {
    return (v.reduce(function(x,y) { return x+y; } )) / v.length;
  }
  var at = a.map(function(row) { return mean(row); } );
  if (at[0][0] == null) { at = at.map(function(i) { return [i]})}
  return at
};

// takes one-hot and input vectors, returns array of input vectors in order
DeepViz.prototype.getDatasetExemplars = function(gt,input) {
  var maxIndex = gt.map(function(v) { return v.indexOf(Math.max(...v));});
  var exemplars = Array(gt[0].length);
  for (i in [...exemplars.keys()]) {
    exemplars[i] = input[maxIndex.indexOf(Math.floor(i))];
  }

  return exemplars
}

DeepViz.prototype.generateElement = function(root,offset)	{
  	return root.append("g")
  		.attr("transform", "translate("+offset[0]+","+offset[1]+")")
  		//.attr("class", name)
};

DeepViz.prototype.add = function(renderer) {
    this.vis_buffer.push(renderer);
};

DeepViz.prototype.updateVis = function(args)	{
	this.vis_buffer.map(function(c) { c.render(args) })
};

DeepViz.prototype.loadData = function(data_file_path,model,update)  {
    this.clear()
    d3.json(data_file_path, function(data) {
    	model(data);
    });
};

DeepViz.prototype.clear = function(args)	{
	this.vis_buffer = [];
};
