'use strict'
//const canvas = document.getElementById("mainCanvas");
//const ctx = canvas.getContext("2d"); //what about 3d? 
var mousex
var mousey        
window.addEventListener('mousemove', function (e) {
    mousex = e.pageX;
    mousey = e.pageY;
})
var square = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = 400;
        this.canvas.height = 400;
        this.ctx = this.canvas.getContext("2d");
        document.getElementById('square').appendChild(this.canvas);
        //this.ctx.fillStyle = "#C5FBA8";
        this.interval = setInterval(update, 20);
    },
    clear : function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
square.start();

let objects = []

function line(x1,y1,x2,y2){
    square.ctx.moveTo(x1,y1);
    square.ctx.lineTo(x2,y2);
    square.ctx.stroke();
}
class Disk {
    constructor(x,y,r){
        this.x = x
        this.y = y
        this.r = r
        objects.push(this)
        this.color = "#C5FBA8" //a light green
    }
    update(){
        square.ctx.fillStyle = this.color;
        square.ctx.beginPath();
        square.ctx.arc(this.x,this.y,this.r,0,2*Math.PI);
        square.ctx.fill();
        square.ctx.stroke();

        square.ctx.beginPath();
        square.ctx.arc(this.x,this.y,2,0,2*Math.PI);
        square.ctx.stroke();
    }
}

function update(){
    square.clear();
    for (var i in objects){
        objects[i].update();
    }
    square.ctx.strokeRect(0,0,square.canvas.width,square.canvas.height);
}

