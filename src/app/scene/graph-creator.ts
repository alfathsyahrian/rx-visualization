import {AppService} from "../app.service";
declare var d3: any;

export class GraphCreator {
  private consts =  {
    selectedClass: "selected",
    connectClass: "connect-node",
    circleGClass: "conceptG",
    conectorCircle: "conectorCircle",
    graphClass: "graph",
    activeEditId: "active-editing",
    BACKSPACE_KEY: 8,
    DELETE_KEY: 46,
    ENTER_KEY: 13,
    nodeRadius: 50
  };
  private state = {
    selectedNode: null,
    selectedEdge: null,
    mouseDownNode: null,
    mouseDownLink: null,
    justDragged: false,
    justScaleTransGraph: false,
    lastKeyDown: -1,
    shiftNodeDrag: false,
    selectedText: null,
    graphMouseDown:false,
  };

  private nodes = [];
  private edges = [];
  private dragLine;
  private svg;
  private svgG;
  private circles;
  private paths;
  private drag;
  private idct = 0;
  private connectTarget;

  constructor(svg, nodes, edges ,private appService:AppService) {
    const thisGraph = this;
    this.nodes = nodes || [];
    this.edges = edges || [];
    this.svg = svg;
    this.svgG = svg.append("g").classed(thisGraph.consts.graphClass, true);
    this.defineArrows();
    this.bindEvents();
  }

  private defineArrows() {
    // define arrow markers for graph links
    const defs = this.svg.append('svg:defs');
    defs.append('svg:marker')
      .attr('id', 'end-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', "32")
      .attr('markerWidth', 3.5)
      .attr('markerHeight', 3.5)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5');

    // define arrow markers for leading arrow
    defs.append('svg:marker')
      .attr('id', 'mark-end-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 7)
      .attr('markerWidth', 3.5)
      .attr('markerHeight', 3.5)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5');

    // displayed when dragging between nodes
    this.dragLine = this.svgG.append('svg:path')
      .attr('class', 'link dragline hidden')
      .attr('d', 'M0,0L0,0')
      .style('marker-end', 'url(#mark-end-arrow)');
  }
  private bindEvents() {
    const thisGraph = this;
    // svg nodes and edges
    thisGraph.paths = this.svgG.append("g");
    thisGraph.circles = this.svgG.append("g");

    //handle circle drag
    thisGraph.drag = d3.drag()
      .on("drag", this.dragMove)
      .on("end", this.dragEnd);

    // listen for key events
    d3.select(window).on("keydown", this.svgKeyDown)
      .on("keyup", this.svgKeyUp);
    this.svg.on("click", this.svgClick);

    // handle zoom
    thisGraph.svg.call(d3.zoom()
      .scaleExtent([1 / 2, 8])
      .on("zoom", ()=>{
        thisGraph.svgG.attr("transform", d3.event.transform);
      }));
    thisGraph.svg.on("dblclick.zoom", null);

    //get control commands
    thisGraph.appService.getControlChanges().subscribe((data)=>{
      if(data=="clear"){thisGraph.deleteGraph(false);}
    });
  }


  public setIdCt(idct){
    this.idct = idct;
  };

  public serialize() {
    const thisGraph = this;
    const saveEdges = [];
    thisGraph.edges.forEach(function (val, i) {
      saveEdges.push({source: val.source.id, target: val.target.id});
    });
    return JSON.stringify({"nodes": thisGraph.nodes, "edges": saveEdges});
  }
  public deserialize(jsonText){
    const thisGraph = this;
    const jsonObj = JSON.parse(jsonText);
    thisGraph.deleteGraph(true);
    thisGraph.nodes = jsonObj.nodes;
    thisGraph.setIdCt(jsonObj.nodes.length + 1);
    const newEdges = jsonObj.edges;
    newEdges.forEach(function(e, i){
      newEdges[i] = {source: thisGraph.nodes.filter(function(n){return n.id == e.source;})[0],
        target: thisGraph.nodes.filter(function(n){return n.id == e.target;})[0]};
    });
    thisGraph.edges = newEdges;
    thisGraph.updateGraph();
  }

  private dragMove = (d) => {
    this.state.justDragged = true;
    if(this.state.shiftNodeDrag){
      const gMousePos=d3.mouse(this.svgG.node());
      this.dragLine.attr('d', 'M' + d.x + ',' + d.y + 'L' + gMousePos[0] + ',' + gMousePos[1]);
    }
    else{
      d.x += d3.event.dx;
      d.y +=  d3.event.dy;
      this.updateGraph();
    }
  };
  private dragEnd = (d) => {
    const thisGraph = this;
    if(thisGraph.state.shiftNodeDrag){
      if(thisGraph.connectTarget){
        const newEdge = {source: d, target: thisGraph.connectTarget};
        thisGraph.edges.push(newEdge);
        thisGraph.updateGraph();
      }
      thisGraph.state.shiftNodeDrag=false;
      thisGraph.dragLine.classed('hidden', true)
    }
  };

  private deleteGraph(skipPrompt){
    const thisGraph = this;
    let doDelete = true;
    if (!skipPrompt){
      doDelete = window.confirm("Press OK to delete this graph");
    }
    if(doDelete){
      thisGraph.nodes = [];
      thisGraph.edges = [];
      thisGraph.updateGraph();
    }
  };

  /* insert svg line breaks: taken from http://stackoverflow.com/questions/13241475/how-do-i-include-newlines-in-labels-in-d3-charts */
  private insertTitleLinebreaks (gEl, title) {
    const words = title.split(/\s+/g),
      nwords = words.length;
    const el = gEl.append("text")
      .attr("text-anchor","middle")
      .attr("dy", "-" + (nwords-1)*7.5);

    for (let i = 0; i < words.length; i++) {
      const tspan = el.append('tspan').text(words[i]);
      if (i > 0)
        tspan.attr('x', 0).attr('dy', '15');
    }
  };


// remove edges associated with a node
  private spliceLinksForNode(node) {
    const thisGraph = this,
      toSplice = thisGraph.edges.filter(function(l) {
        return (l.source === node || l.target === node);
      });
    toSplice.map(function(l) {
      thisGraph.edges.splice(thisGraph.edges.indexOf(l), 1);
    });
  };

  private replaceSelectEdge(d3Path, edgeData){
    const thisGraph = this;
    d3Path.classed(thisGraph.consts.selectedClass, true);
    if (thisGraph.state.selectedEdge){
      thisGraph.removeSelectFromEdge();
    }
    thisGraph.state.selectedEdge = edgeData;
    this.appService.setSelectedItem(edgeData);
  };

  private replaceSelectNode(d3Node, nodeData){
    const thisGraph = this;
    d3Node.classed(this.consts.selectedClass, true);
    if (thisGraph.state.selectedNode){
      thisGraph.removeSelectFromNode();
    }
    thisGraph.state.selectedNode = nodeData;
    this.appService.setSelectedItem(nodeData);
  };

  private removeSelectFromNode(){
    const thisGraph = this;
    thisGraph.circles.selectAll('g').filter(function(cd){
      return cd.id === thisGraph.state.selectedNode.id;
    }).classed(thisGraph.consts.selectedClass, false);
    thisGraph.state.selectedNode = null;
  };

  private removeSelectFromEdge(){
    const thisGraph = this;
    thisGraph.paths.selectAll('path').filter(function(cd){
      return cd === thisGraph.state.selectedEdge;
    }).classed(thisGraph.consts.selectedClass, false);
    thisGraph.state.selectedEdge = null;
  };

  private pathMouseDown (d3path, d){
    const thisGraph = this,
      state = thisGraph.state;
    // d3.event.stopPropagation();
    state.mouseDownLink = d;

    if (state.selectedNode){
      thisGraph.removeSelectFromNode();
    }

    const prevEdge = state.selectedEdge;
    if (!prevEdge || prevEdge !== d){
      thisGraph.replaceSelectEdge(d3path, d);
    } else{
      thisGraph.removeSelectFromEdge();
    }
  };

// mousedown on node
  private circleMouseDown (d3node, d){
    const thisGraph = this,
      state = thisGraph.state;
    // d3.event.stopPropagation();
    state.mouseDownNode = d;
    state.shiftNodeDrag=false;
    const mousePos=d3.mouse(d3node.node());
    const r=Math.sqrt(mousePos[0]*mousePos[0]+mousePos[1]*mousePos[1]);
    if((r+10)>thisGraph.consts.nodeRadius){
      state.shiftNodeDrag=true;
      thisGraph.dragLine.classed('hidden', false)
        .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
      return;
    }
  };


// mouseup on nodes
  private circleClick(d3node, d){
    const thisGraph = this,
      state = thisGraph.state,
      consts = thisGraph.consts;
    if (state.selectedEdge){
      thisGraph.removeSelectFromEdge();
    }
    const prevNode = state.selectedNode;

    if (!prevNode || prevNode.id !== d.id){
      thisGraph.replaceSelectNode(d3node, d);
    } else{
      thisGraph.removeSelectFromNode();
    }
    state.mouseDownNode = null;
    d3.event.preventDefault();
    d3.event.stopPropagation();
    return false;
  }; // end of circles mouseup

  //click on the main svg
  private svgClick = () => {
    var createOption = this.appService.getCreationOption();
    if (!createOption || createOption == "pan")return;
    else {
      const xycoords = d3.mouse(this.svgG.node()),
        d = {
          id: this.idct++,
          data:createOption,
          x: xycoords[0], y: xycoords[1]
        };
      this.nodes.push(d);
      this.updateGraph();
    }
  }

// keydown on main svg
  private svgKeyDown = () => {
    const thisGraph = this,
      state = thisGraph.state,
      consts = thisGraph.consts;
    // make sure repeated key presses don't register for each keydown
    if(state.lastKeyDown !== -1) return;

    state.lastKeyDown = d3.event.keyCode;
    const selectedNode = state.selectedNode,
      selectedEdge = state.selectedEdge;

    switch(d3.event.keyCode) {
      case consts.BACKSPACE_KEY:
      case consts.DELETE_KEY:
        d3.event.preventDefault();
        if (selectedNode){
          thisGraph.nodes.splice(thisGraph.nodes.indexOf(selectedNode), 1);
          thisGraph.spliceLinksForNode(selectedNode);
          state.selectedNode = null;
          thisGraph.updateGraph();
        } else if (selectedEdge){
          thisGraph.edges.splice(thisGraph.edges.indexOf(selectedEdge), 1);
          state.selectedEdge = null;
          thisGraph.updateGraph();
        }
        break;
    }
  };

  private svgKeyUp = () => {
    this.state.lastKeyDown = -1;
  };

// call to propagate changes to graph
  public updateGraph(){

    const thisGraph = this,
      consts = thisGraph.consts,
      state = thisGraph.state;

    const paths = thisGraph.paths.selectAll("path").data(thisGraph.edges, function(d){
      return String(d.source.id) + "+" + String(d.target.id);
    });
    // update existing paths
    paths.style('marker-end', 'url(#end-arrow)')
      .classed(consts.selectedClass, function(d){
        return d === state.selectedEdge;
      })
      .attr("d", function(d){
        return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
      });

    // add new paths
    paths.enter()
      .append("path")
      .style('marker-end','url(#end-arrow)')
      .classed("link", true)
      .attr("d", function(d){
        return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
      })
      .on("mousedown", function(d){
          thisGraph.pathMouseDown.call(thisGraph, d3.select(this), d);
        })
      .on("mouseup", function(d){
        state.mouseDownLink = null;
      });

    // remove old links
    paths.exit().remove();

    // update existing nodes
    const circles = thisGraph.circles.selectAll("g").data(thisGraph.nodes, function(d){
      return d.id;
    });
    circles.attr("transform", function(d){
      return "translate(" + d.x + "," + d.y + ")";
    });

    // add new nodes
    const newGs= circles.enter()
      .append("g");

    newGs.classed(consts.circleGClass, true)
      .attr("transform", function(d){
        return "translate(" + d.x + "," + d.y + ")";
      })
      .on("mouseover", function(d){
        if (state.shiftNodeDrag){
          if(!thisGraph.connectTarget){
            thisGraph.connectTarget=d;
            d3.select(this).classed(consts.connectClass, true);
          }
        }
      })
      .on("mouseout", function(d){
        if(thisGraph.connectTarget===d){
          thisGraph.connectTarget=undefined;
          d3.select(this).classed(consts.connectClass, false);
        }
      })
      .on("mousedown", function(d){
        thisGraph.circleMouseDown.call(thisGraph, d3.select(this), d);
      })
      .on("click", function(d){
        thisGraph.circleClick.call(thisGraph, d3.select(this), d);
      })
      .call(thisGraph.drag);

    newGs.append("circle")
      .attr("r", String(consts.nodeRadius));
    // newGs.append("circle").classed(consts.conectorCircle,true)
    //   .attr("transform", function(d){
    //     return "translate(" + consts.nodeRadius/1.41 + "," + consts.nodeRadius/1.41 + ")";
    //   })
    //   .attr("r", String(consts.nodeRadius/5))

    newGs.each(function(d){
      thisGraph.insertTitleLinebreaks(d3.select(this), d.data.name);
    });

    // remove old nodes
    thisGraph.circles.exit().remove();
  };

  private zoomed(){
    this.state.justScaleTransGraph = true;
    d3.select("." + this.consts.graphClass)
      .attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
  };

  public updateWindow(width,height){
    this.svg.attr("width", width).attr("height", height);
  };

}