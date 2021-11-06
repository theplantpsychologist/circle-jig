"use strict"; //exports.__esModule = true;
//'use strict'

var square = document.getElementById("square");
var ooga = "booga";
var tmd5;
var scale;
var flaps;
var rivers;
var nodes;
var edges;
var paths;

function fileRead() {
  document.getElementById('inputfile').addEventListener('change', function () {
    var fr = new FileReader();

    fr.onload = function () {
      document.getElementById('output'); //.textContent=fr.result;

      tmd5 = fr.result.split("\n");
      scale = tmd5[4]; //console.log(fr.result.split(' ')[0]);
    };

    fr.readAsText(this.files[0]);
  });
} //reads the file 
//creates a list tmd5 where each line is a new item in the list


function extract() {
  flaps = []; //local definitions of flaps and rivers

  rivers = [];
  nodes = ['buffer']; //raw collected from treemaker

  edges = ['buffer']; //buffer because treemaker starts at 1, instead of 0

  paths = [];
  collectNodes(tmd5);
  collectEdges(tmd5);
  collectFlaps(nodes); //buildTree(nodes,edges);

  findChildren(nodes[1]); //node 1 is the root node

  for (var i = 1; i < nodes.length; i++) {
    findAnscestors(nodes[i], nodes[i]);
  }

  collectPaths(flaps);
  collectRivers(edges);

  for (var i = 0; i < rivers.length; i++) {
    decideInnerFindSurrounded(rivers[i]);
  }
} //initializes by storing stuff into lists
//by the end of this, all the nodes should have their parents 


var TreeNode =
/** @class */
function () {
  function TreeNode(index, label, x, y, leaf) {
    this.index = index;
    this.label = label;
    this.x = x;
    this.y = y;
    this.leaf = leaf;
    this.children = [];
    this.ancestry = []; //used for finding distances between flaps
  }

  return TreeNode;
}();

var Edge =
/** @class */
function () {
  function Edge(index, length, node1, node2) {
    this.index = index;
    this.r = length * scale;
    this.x1 = node1.x; //x1 and x2 will the be the center, if it's a circle

    this.y1 = node1.y; //node1 may or may not be leaf, but node 2 will never

    this.x2 = node2.x;
    this.y2 = node2.y;
    this.node1 = node1;
    this.label = node1.label;
    this.node1.r = this.r; /////////////this could be sus...?

    this.node2 = node2;

    if (node1.leaf) {
      this.flap = true;
    } else {
      this.flap = false;
    }
  }

  return Edge;
}(); //technically only leaf paths. Make sure distances update when nodes update


var River =
/** @class */
function () {
  function River(edge) {
    this.r = edge.r;
    this.edge = edge; //this.decideInnerFindSurrounded();
    //maybe make the inner node have the r and river data? that way you don't have two rivers 
    //trying to surround each other (ie have the same inner node)
  }

  return River;
}();

function findSurrounded(inner, outer) {
  var surroundedFlaps = [];

  for (var i = 0; i < inner.children.length; i++) {
    if (inner.children[i].leaf) {
      surroundedFlaps.push(inner.children[i]);
    }

    if (!(inner.children[i].leaf || inner.children[i] == outer)) {
      surroundedFlaps = surroundedFlaps.concat(findSurrounded(inner.children[i], inner));
    }
  }

  if (inner.parent) {
    if (inner.parent.leaf) {
      surroundedFlaps.push(inner.parent);
    }

    if (!(inner.parent.leaf || inner.parent == outer)) {
      surroundedFlaps = surroundedFlaps.concat(findSurrounded(inner.parent, inner));
    }
  }

  return surroundedFlaps;
}

function decideInnerFindSurrounded(river) {
  if (river.edge.node1.innerNode) {
    river.surroundedFlaps = findSurrounded(river.edge.node2, river.edge.node1);
    river.innerNode = river.edge.node2;
    river.outerNode = river.edge.node1;
    river.innerNode.innerNode = true;
    return;
  }

  if (river.edge.node2.innerNode) {
    river.surroundedFlaps = findSurrounded(river.edge.node1, river.edge.node2);
    river.innerNode = river.edge.node1;
    river.outerNode = river.edge.node2;
    river.innerNode.innerNode = true;
    return;
  }

  var surrounded1 = findSurrounded(river.edge.node1, river.edge.node2);
  var surrounded2 = findSurrounded(river.edge.node2, river.edge.node1);

  if (surrounded1.length < surrounded2.length) {
    river.surroundedFlaps = surrounded1;
    river.innerNode = river.edge.node1;
    river.outerNode = river.edge.node2;
    river.innerNode.innerNode = true;
  } else {
    river.surroundedFlaps = surrounded2;
    river.innerNode = river.edge.node2;
    river.outerNode = river.edge.node1;
    river.innerNode.innerNode = true;
  }
}

var Path =
/** @class */
function () {
  function Path(node1, node2) {
    this.node1 = node1;
    this.node2 = node2;
    this.check(this.node1, this.node2);
  }

  Path.prototype.check = function (node1, node2) {
    this.cpDistance = Math.pow(Math.pow(node1.x - node2.x, 2) + Math.pow(node1.y - node2.y, 2), 0.5);

    if (Math.abs(findTreeDistance(node1, node2) - Math.pow(Math.pow(node1.x - node2.x, 2) + Math.pow(node1.y - node2.y, 2), 0.5)) < 0.0005) {
      this.isActive = true;
      this.isInvalid = false;
    } else if (findTreeDistance(node1, node2) > Math.pow(Math.pow(node1.x - node2.x, 2) + Math.pow(node1.y - node2.y, 2), 0.5) + 0.0005) {
      this.isInvalid = true;
      this.isActive = false;
    } else {
      this.isActive = false;
      this.isInvalid = false;
    }
  };

  return Path;
}();

function collectNodes(tmd5) {
  for (var i = 0; i < tmd5.length; i++) {
    if (tmd5[i] == "node") {
      var index = parseInt(tmd5[i + 1]);
      var label = tmd5[i + 2];
      var x = parseFloat(tmd5[i + 3]);
      var y = parseFloat(tmd5[i + 4]);

      if (tmd5[i + 7] == 'true') {
        var leaf = true;
      } else {
        var leaf = false;
      }

      nodes.push(new TreeNode(index, label, x, y, leaf));
    }
  }
}

function collectEdges(tmd5) {
  for (var i = 0; i < tmd5.length; i++) {
    if (tmd5[i] == 'edge') {
      var index = tmd5[i + 1];
      var length = tmd5[i + 3];

      if (!nodes[tmd5[i + 9]].leaf) {
        //if the first is not a leaf
        var node1 = nodes[tmd5[i + 10]]; //then the other may or may not be leaf

        var node2 = nodes[tmd5[i + 9]]; //and this one will be not leaf
      } else {
        var node1 = nodes[tmd5[i + 9]]; //otherwise, the first one is leaf, so node1

        var node2 = nodes[tmd5[i + 10]];
      }

      edges.push(new Edge(index, length, node1, node2));
    }
  }
}

function findChildren(current_node) {
  if (current_node.leaf && current_node.index != 1) {
    //in case node[1], the root, is a leaf
    return;
  }

  for (var i = 1; i < edges.length; i++) {
    if (edges[i].node1 == current_node && edges[i].node2.children.length == 0) {
      //if another edge comes out of this node, but hasn't already been assigned (ie itself)
      current_node.children.push(edges[i].node2);
      edges[i].node2.parent = current_node;
      edges[i].node2.r = edges[i].r; //console.log(edges[i].node2.index,"is child of",current_node.index)

      if (!edges[i].node2.leaf) {
        findChildren(edges[i].node2);
      }
    }

    if (edges[i].node2 == current_node && edges[i].node1.children.length == 0) {
      current_node.children.push(edges[i].node1);
      edges[i].node1.parent = current_node;
      edges[i].node1.r = edges[i].r; //console.log(edges[i].node1.index,"is child of",current_node.index)

      if (!edges[i].node1.leaf) {
        findChildren(edges[i].node1);
      }
    }
  }
}

function findAnscestors(original_node, current_node) {
  //console.log("original node",original_node.index,"current node",current_node.index)
  original_node.ancestry.push(current_node);

  if (current_node.parent == undefined) {
    return;
  } else {
    findAnscestors(original_node, current_node.parent);
  }
}

function findTreeDistance(node1, node2) {
  var distance = 0;

  for (var i = 0; i < node1.ancestry.length; i++) {
    //look through node1's ancestors
    if (node2.ancestry.includes(node1.ancestry[i])) {
      //i is the index of the first common ancestor. add up from node1 and node 2 ancestry
      for (var j = 0; j < i; j++) {
        distance += node1.ancestry[j].r;
      }

      var index = node2.ancestry.indexOf(node1.ancestry[i]);

      for (var k = 0; k < index; k++) {
        distance += node2.ancestry[k].r;
      }

      return distance;
    }
  }
}

function collectFlaps(nodes) {
  for (var i = 1; i < nodes.length; i++) {
    if (nodes[i].leaf) {
      flaps.push(nodes[i]);
    }
  }
}

function collectPaths(flaps) {
  for (var i = 0; i < flaps.length; i++) {
    for (var j = i + 1; j < flaps.length; j++) {
      paths.push(new Path(flaps[i], flaps[j]));
    }
  }
}

function collectRivers(edges) {
  for (var i = 1; i < edges.length; i++) {
    if (!edges[i].node1.leaf && !edges[i].node2.leaf) {
      rivers.push(new River(edges[i]));
    }
  }
} //if something changes length, update all paths

/*
calculateOuterPath(){ //for now ignore surrounded rivers
    var tempArcs = [];
    this.outerPath = [];
    if(this.surroundedRivers.length > 0){
        return
    }
    for (var i = 0; i<this.surroundedFlaps.length; i++){
        tempArcs.push(new Arc(
            this.surroundedFlaps[i].x,
            this.surroundedFlaps[i].y,
            this.surroundedFlaps[i].r))
    }//for every surrounded flap, add the circle Arc(xyr) to tempArcs.
    
    //for every surrounded flap, find its intersections with other arcs. keep the intersection if it's legit
    //for all the arcs in tempArcs, find the ones that have two valid intersections

    //find intersection points between circles. save the ones that are >= r + flapr, and save which arcs
    //for each arc, make a list where the first and third elements are the intersection points, and the second one is also on the circle

}
calculateInnerPath(){
    this.innerPath = []
    if(this.outerPath.length == 0){
        return
    }
    //for every arc, create a new arc
}
//outer.subtract(inner);

}

class Arc{
points: Array<paper.Point>; //first two will be actual intersections
x: number;
y: number;
r: number;
theta0: number;
thetaf: number;

constructor(x,y,r){
    this.x = x;
    this.y = y;
    this.r = r;
}
arcConvert(x,y,r,theta0,thetaf){
    /*points new paper.Point(x+r*Math.cos(theta0),x+r*Math.sin(theta0));
    this.midpoint = new paper.Point(x+r*Math.cos((thetaf-theta0)/2),y+r*Math.sin((thetaf-theta0)/2));
    this.point2 = new paper.Point(x+r*Math.cos(thetaf),x+r*Math.sin(thetaf));
}
findIntersections(arc2: Arc){
    var x1 = this.x
    var y1 = this.y
    var r1 = this.r
    var x2 = arc2.x
    var y2 = arc2.y
    var r2 = arc2.r
    var d = ((x1-x2)**2+(y1-y2)**2)**0.5
    var l = (r1**2-r2**2+d**2)/(2*d)
    var h = (r1**2 - l**2)**0.5
    return [
        new paper.Point(
            l/d*(x2-x1) + h/d*(y2-y1)+x1,
            l/d*(y2-y1) - h/d*(x2-x1)+y1),
        new paper.Point(
            l/d*(x2-x1) - h/d*(y2-y1)+x1,
            l/d*(y2-y1) + h/d*(x2-x1)+y1)]
}//pretends the arcs are circles (only uses xyr) and returns an array of two intersection points https://math.stackexchange.com/questions/256100/how-can-i-find-the-points-at-which-two-circles-intersect
} //a piece of a river
*/