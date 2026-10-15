/* hero3d.js — lightweight hand-rolled 3D wireframe for the AI Grader hero.
   No dependencies: rotating gold icosahedron + drifting particles on canvas.
   Pauses when tab hidden / hero off-screen; respects prefers-reduced-motion. */
(function(){
"use strict";
var canvas = document.getElementById("hero3d");
if(!canvas) return;
try{
  if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
}catch(e){}
var ctx = canvas.getContext("2d");
if(!ctx) return;

/* icosahedron: 12 vertices, edges = pairs at edge-length distance */
var PHI = (1 + Math.sqrt(5)) / 2;
var raw = [
  [0,1,PHI],[0,1,-PHI],[0,-1,PHI],[0,-1,-PHI],
  [1,PHI,0],[1,-PHI,0],[-1,PHI,0],[-1,-PHI,0],
  [PHI,0,1],[-PHI,0,1],[PHI,0,-1],[-PHI,0,-1]
];
var verts = raw.map(function(v){
  var l = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
  return [v[0]/l, v[1]/l, v[2]/l];
});
var edges = [];
for(var i=0;i<verts.length;i++){
  for(var j=i+1;j<verts.length;j++){
    var dx=verts[i][0]-verts[j][0], dy=verts[i][1]-verts[j][1], dz=verts[i][2]-verts[j][2];
    if(Math.sqrt(dx*dx+dy*dy+dz*dz) < 1.15) edges.push([i,j]);
  }
}

/* ambient dust particles */
var P = 120, parts = [];
function seedParts(w,h){
  parts = [];
  for(var k=0;k<P;k++) parts.push({
    x:Math.random()*w, y:Math.random()*h,
    z:Math.random(), r:Math.random()*1.7+0.4,
    s:Math.random()*0.22+0.05
  });
}

var W=0, H=0;
function resize(){
  var DPR = Math.min(window.devicePixelRatio||1, 2);
  var r = canvas.parentElement.getBoundingClientRect();
  W = Math.max(1, r.width); H = Math.max(1, r.height);
  canvas.width = W*DPR; canvas.height = H*DPR;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  seedParts(W,H);
}
resize();
window.addEventListener("resize", resize);

/* gentle mouse parallax */
var mx=0, my=0, tmx=0, tmy=0;
window.addEventListener("pointermove", function(e){
  var r = canvas.getBoundingClientRect();
  if(r.width>0){
    tmx = (e.clientX - r.left)/r.width - 0.5;
    tmy = (e.clientY - r.top)/r.height - 0.5;
  }
}, {passive:true});

var running = true, inView = true;
document.addEventListener("visibilitychange", function(){ running = !document.hidden; });
if("IntersectionObserver" in window){
  new IntersectionObserver(function(es){ inView = es[0].isIntersecting; }).observe(canvas);
}

function rot(p, ax, ay){
  var x=p[0], y=p[1], z=p[2];
  var x1 = x*Math.cos(ay) + z*Math.sin(ay);
  var z1 = -x*Math.sin(ay) + z*Math.cos(ay);
  var y1 = y*Math.cos(ax) - z1*Math.sin(ax);
  var z2 = y*Math.sin(ax) + z1*Math.cos(ax);
  return [x1, y1, z2];
}

var t = 0;
function frame(){
  requestAnimationFrame(frame);
  if(!running || !inView) return;
  t += 0.0032;
  mx += (tmx - mx)*0.04; my += (tmy - my)*0.04;
  ctx.clearRect(0,0,W,H);

  var cx = W*0.74, cy = H*0.52;
  if(W < 720){ cx = W*0.5; cy = H*0.66; } /* mobile: tuck it lower */
  var R = Math.min(W,H)*0.30;
  var ax = t*1.3 + my*0.7, ay = t*1.9 + mx*1.0;
  var fov = 3.4;

  var pts = verts.map(function(v){
    var q = rot([v[0]*R, v[1]*R, v[2]*R], ax, ay);
    var s = fov/(fov + (q[2]/R)*0.9);
    return [cx + q[0]*s, cy + q[1]*s, s, q[2]/R];
  });

  var e, a, b, depth, alpha;
  for(var k=0;k<edges.length;k++){
    e = edges[k]; a = pts[e[0]]; b = pts[e[1]];
    depth = (a[3]+b[3])/2; /* -1 (front) .. 1 (back) */
    alpha = 0.08 + 0.30*(0.5 - depth*0.5);
    ctx.strokeStyle = "rgba(212,175,55,"+alpha.toFixed(3)+")";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke();
  }
  for(var v2=0;v2<pts.length;v2++){
    var p = pts[v2];
    ctx.fillStyle = "rgba(212,175,55,0.55)";
    ctx.beginPath(); ctx.arc(p[0],p[1],1.7*p[2],0,6.2832); ctx.fill();
  }

  /* drifting dust */
  for(var d=0;d<parts.length;d++){
    var pt = parts[d];
    pt.y -= pt.s; pt.x += Math.sin(t*40+d)*0.07;
    if(pt.y < -4){ pt.y = H+4; pt.x = Math.random()*W; }
    var tw = 0.22 + 0.55*Math.abs(Math.sin(t*28 + d*1.7));
    ctx.fillStyle = "rgba(212,175,55,"+(tw*0.45*pt.z+0.06).toFixed(3)+")";
    ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r*(0.5+pt.z), 0, 6.2832); ctx.fill();
  }
}
frame();
})();
