//'use strict'
const square = document.getElementById("square");
var squareWidth = Number(square.style.width.slice(0,-2));
var squareHeight = Number(square.style.height.slice(0,-2));
var mousex
var mousey
window.addEventListener('mousemove', function(e) {
	mousex = e.pageX;
	mousey = e.pageY;
})
 
/*
interface Square {
	canvas: HTMLCanvasElement;
	start: () => void;
	clear: () => void;
	ctx: CanvasRenderingContext2D;
} */

//use the tree ancestries to find the disks, or just use the nodes
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
		this.x = edge.x1  //even if length is different, everybody scale the same
		this.y = edge.y1
		this.r = edge.r
		//flaps.push(this)
		this.color = "#C5FBA8" //a light green
	}
} 
class River {
	r: number;
	constructor(edge){
		this.r = edge.r
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
	findChildren(nodes[1]); //node 1 is the root node
	for(var i=1;i<nodes.length;i++){
		findAnscestors(nodes[i],nodes[i]);
	}
}
//initializes by storing stuff into lists
//by the end of this, all the nodes should have their parents 

class TreeNode {
	index: number;
	label: string;
	x: number;
	y: number;
	leaf: boolean;
	r: number;    //initialized once an edge is assigned to it
	children: Array<TreeNode>;
	parent: TreeNode; //assigned when buildTree builds the tree
	ancestry: Array<TreeNode>;
	constructor(index, label, x, y, leaf) {
		this.index = index
		this.label = label
		this.x = x
		this.y = y
		this.leaf = leaf
		this.children = []
		this.ancestry = [] //used for finding distances between flaps
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
function collectNodes(tmd5): void {
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
function collectEdges(tmd5): void {
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
function findChildren(current_node: TreeNode) {
	if (current_node.leaf && current_node.index!=1){ //in case node[1], the root, is a leaf
		return
	}
	for (var i=1; i<edges.length; i++){
		if (edges[i].node1==current_node&&edges[i].node2.children.length==0){
			//if another edge comes out of this node, but hasn't already been assigned (ie itself)
			current_node.children.push(edges[i].node2);
			edges[i].node2.parent = current_node;
			edges[i].node2.r = edges[i].r;
			//console.log(edges[i].node2.index,"is child of",current_node.index)
			if(!edges[i].node2.leaf){
				findChildren(edges[i].node2)
			}
		} 
		if (edges[i].node2==current_node&&edges[i].node1.children.length==0){
			current_node.children.push(edges[i].node1);
			edges[i].node1.parent = current_node;
			edges[i].node1.r = edges[i].r;
			//console.log(edges[i].node1.index,"is child of",current_node.index)
			if(!edges[i].node1.leaf){
				findChildren(edges[i].node1)
			}
		}
	}
}
function findAnscestors(original_node,current_node){
	//console.log("original node",original_node.index,"current node",current_node.index)
	original_node.ancestry.push(current_node);
	if(current_node.parent==undefined){
		return
	} else{
		findAnscestors(original_node,current_node.parent)
	}
}
function findTreeDistance(node1: TreeNode,node2: TreeNode):number{
	var distance = 0;
	for(var i=0;i<node1.ancestry.length;i++){ //look through node1's ancestors
		if (node2.ancestry.includes(node1.ancestry[i])){
			//i is the index of the first common ancestor. add up from node1 and node 2 ancestry
			for(var j=0;j<i;j++){
				distance += node1.ancestry[j].r;
			}
			var index = node2.ancestry.indexOf(node1.ancestry[i]);
			for(var k=0;k<index;k++){
				distance += node2.ancestry[k].r;
			}
			return distance
		}
	}
}
function collectFlaps(tmd5): void {
	for(var i = 1; i < edges.length; i++) {
		if(edges[i].flap) {
			flaps.push(new Disk(edges[i]));
		} else{
			rivers.push(new River(edges[i]));
		}
	}
} //maybe just make the leaf nodes be the flaps directly? give them an update() method?


//if something changes length, update all paths