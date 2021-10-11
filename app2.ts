//'use strict'
//const canvas = document.getElementById("mainCanvas");
//const ctx = canvas.getContext("2d"); //what about 3d? 
//comment change
var mousex
var mousey
window.addEventListener('mousemove', function(e) {
	mousex = e.pageX;
	mousey = e.pageY;
})
 
interface Square {
	canvas: HTMLCanvasElement;
	start: () => void;
	clear: () => void;
	ctx: CanvasRenderingContext2D;
}

var square: Square = {
	canvas: document.createElement("canvas"),
	start: function() {
		this.canvas.width = 600;
		this.canvas.height = 600;
		this.ctx = this.canvas.getContext("2d");
		document.getElementById('square').appendChild(this.canvas);
		//this.ctx.fillStyle = "#C5FBA8";
		this.interval = setInterval(update, 20);
	},
	clear: function() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
} as Square;
square.start();

function update() {
	square.clear();
	for(var i in flaps) {
		flaps[i].update();
	}
	square.ctx.strokeRect(0, 0, square.canvas.width, square.canvas.height);
}
function line(x1, y1, x2, y2) {
	square.ctx.moveTo(x1, y1);
	square.ctx.lineTo(x2, y2);
	square.ctx.stroke();
}

class Disk {
	index: number;
	label: string;
	x: number;
	y: number;
	r: number;
	color: string;
	constructor(edge) {
		this.index = edge.index
		this.label = edge.label
		this.x = edge.x1 * square.canvas.width //even if length is different, everybody scale the same
		this.y = edge.y1 * square.canvas.width *-1 + square.canvas.height
		this.r = edge.r * square.canvas.width
		//flaps.push(this)
		this.color = "#C5FBA8" //a light green
	}
	update() { 
		square.ctx.fillStyle = this.color;
		square.ctx.beginPath();
		square.ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
		square.ctx.fill();
		square.ctx.stroke();

		square.ctx.beginPath(); //the central circle
		square.ctx.arc(this.x, this.y, 2, 0, 2 * Math.PI);
		square.ctx.stroke();
		
		square.ctx.font = "30px Arial";
		square.ctx.fillText(this.label,this.x+5,this.y-5)
	} 
} //how to display a disk
class River {
	r: number;
	constructor(edge){
		this.r = edge.r *square.canvas.width
	}
}

var tmd5
var scale
var flaps
var rivers
var nodes
var edges
function fileRead() {
	document.getElementById('inputfile')
		.addEventListener('change', function(this: HTMLInputElement) {

			var fr = new FileReader();
			fr.onload = function() {
				document.getElementById('output')
				//.textContent=fr.result;
				tmd5 = (fr.result as string).split("\n");
				scale = tmd5[4];
				//console.log(fr.result.split(' ')[0]);
			}

			fr.readAsText(this.files[0]);
		})
}
//reads the file 
//creates a list tmd5 where each line is a new item in the list
function extract() {
	flaps = [] //local definitions of flaps and rivers
	rivers = []
	nodes = ['buffer'] //raw collected from treemaker
	edges = ['buffer']//buffer because treemaker starts at 1, instead of 0
	collectNodes(tmd5);
	collectEdges(tmd5);
	collectFlaps(tmd5);
	//buildTree(nodes,edges);
	findChildren(nodes[7]); //this needs to not be a leaf
}
//initializes by storing stuff into lists

class TreeNode {
	index: number;
	label: string;
	x: number;
	y: number;
	leaf: boolean;
	r: number;    //initialized once an edge is assigned to it
	children: Array<TreeNode>;
	parent: TreeNode; //assigned when buildTree builds the tree
	constructor(index, label, x, y, leaf) {
		this.index = index
		this.label = label
		this.x = x
		this.y = y
		this.leaf = leaf
		this.children = []
	}
}
class Edge {
	index: number;
	label: string;
	r: number;
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	node1: TreeNode;
	node2: TreeNode;
	flap: Boolean;
	constructor(index, length, node1, node2) {
		this.index = index
		this.r = length * scale
		this.x1 = node1.x //x1 and x2 will the be the center, if it's a circle
		this.y1 = node1.y //node1 may or may not be leaf, but node 2 will never
		this.x2 = node2.x
		this.y2 = node2.y
		this.node1 = node1
		this.label = node1.label
		this.node1.r = this.r /////////////this could be sus...?
		this.node2 = node2
		if(node1.leaf) {
			this.flap = true
		} else { this.flap = false }
	}
}
function collectNodes(tmd5) {
	for(var i = 0; i < tmd5.length; i++) {
		if(tmd5[i] == "node") {
			var index = parseInt(tmd5[i + 1])
			var label = tmd5[i+2]
			var x = parseFloat(tmd5[i + 3])
			var y = parseFloat(tmd5[i + 4])
			if(tmd5[i + 7] == 'true') {
				var leaf = true
			} else { var leaf = false }
			nodes.push(new TreeNode(index, label, x, y, leaf))
		}
	}
}
function collectEdges(tmd5) {
	for(var i = 0; i < tmd5.length; i++) {
		if(tmd5[i] == 'edge') {
			var index = tmd5[i + 1]
			var length = tmd5[i + 3]
			if(!nodes[tmd5[i + 9]].leaf) { //if the first is not a leaf
				var node1 = nodes[tmd5[i + 10]] //then the other may or may not be leaf
				var node2 = nodes[tmd5[i + 9]]//and this one will be not leaf
			} else {
				var node1 = nodes[tmd5[i + 9]] //otherwise, the first one is leaf, so node1
				var node2 = nodes[tmd5[i + 10]]
			}
			edges.push(new Edge(index, length, node1, node2))
		}
	}
}
//function buildTree(nodes,edges) {
function findChildren(current_node) {
	if (current_node.leaf){
		return
	}
	for (var i=1; i<edges.length; i++){
		if (edges[i].node1==current_node&&edges[i].node2.children.length==0){
			//if another edge comes out of this node, but hasn't already been assigned (ie itself)
			current_node.children.push(edges[i].node2);
			edges[i].node2.parent = current_node;
			//console.log(edges[i].node2.index,"is child of",current_node.index)
			if(!edges[i].node2.leaf){
				findChildren(edges[i].node2)
			}
		} 
		if (edges[i].node2==current_node&&edges[i].node1.children.length==0){
			current_node.children.push(edges[i].node1);
			edges[i].node1.parent = current_node;
			//console.log(edges[i].node1.index,"is child of",current_node.index)
			if(!edges[i].node1.leaf){
				findChildren(edges[i].node1)
			}
		}
	}
}
	//findChildren(nodes[1]);
//}
function collectFlaps(tmd5) {
	for(var i = 1; i < edges.length; i++) {
		if(edges[i].flap) {
			flaps.push(new Disk(edges[i]));
		} else{
			rivers.push(new River(edges[i]));
		}
	}
}