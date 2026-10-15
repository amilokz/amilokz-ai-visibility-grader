/* hero3d.js — "magical" AI-core scene for the AI Grader hero. No dependencies.
   Layers: pulsing glow core, rotating gold icosahedron shell, tilted orbit rings
   with traveling electrons, constellation particle web, shooting stars, dust.
   Pauses off-screen / tab hidden; respects prefers-reduced-motion. */
(function(){
"use strict";
var canvas = document.getElementById("hero3d");
if(!canvas) return;
try{ if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; }catch(e){}
var ctx = canvas.getContext("2d");
if(!ctx) return;

var GOLD = "146,114,26"; /* light-theme default; refreshed per frame for dark mode */
function refreshGold(){
  try{ GOLD = document.documentElement.getAttribute("data-theme")==="dark" ? "212,175,55" : "146,114,26"; }
  catch(e){ GOLD = "146,114,26"; }
}

/* ---------- icosahedron shell ---------- */
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
for(var i=0;i<verts.length;i++) for(var j=i+1;j<verts.length;j++){
  var dx=verts[i][0]-verts[j][0], dy=verts[i][1]-verts[j][1], dz=verts[i][2]-verts[j][2];
  if(Math.sqrt(dx*dx+dy*dy+dz*dz) < 1.15) edges.push([i,j]);
}

/* ---------- orbit rings (tilted ellipses with electrons) ---------- */
var rings = [
  {rx:1.62, ry:0.52, tilt: 0.55, speed: 0.85, e:[{a:0.0,s:3.2},{a:2.5,s:2.2},{a:4.5,s:2.6}]},
  {rx:2.00, ry:0.64, tilt:-0.38, speed:-0.55, e:[{a:1.2,s:2.6},{a:4.0,s:3.0}]},
  {rx:1.30, ry:0.44, tilt: 1.15, speed: 1.25, e:[{a:2.2,s:2.4},{a:5.1,s:2.0}]}
];

/* ---------- constellation particles ---------- */
var N = 80, cpts = [];
function seedConst(w,h){
  cpts = [];
  for(var k=0;k<N;k++) cpts.push({
    x:Math.random()*w, y:Math.random()*h,
    vx:(Math.random()-0.5)*0.35, vy:(Math.random()-0.5)*0.35,
    r:Math.random()*1.6+0.7
  });
}

/* ---------- ambient dust ---------- */
var M = 55, dust = [];
function seedDust(w,h){
  dust = [];
  for(var k=0;k<M;k++) dust.push({
    x:Math.random()*w, y:Math.random()*h, z:Math.random(),
    r:Math.random()*1.8+0.5, s:Math.random()*0.25+0.06, ph:Math.random()*6.28
  });
}

/* ---------- shooting stars ---------- */
var meteors = [];
function spawnMeteor(w,h){
  var x = w*(0.35+Math.random()*0.6), y = -20;
  meteors.push({x:x, y:y, vx:-(5+Math.random()*4), vy:3+Math.random()*2.5,
                life:1, decay:0.012+Math.random()*0.01, len:60+Math.random()*50});
}

var W=0, H=0;
function resize(){
  var DPR = Math.min(window.devicePixelRatio||1, 2);
  var r = canvas.parentElement.getBoundingClientRect();
  W = Math.max(1,r.width); H = Math.max(1,r.height);
  canvas.width = W*DPR; canvas.height = H*DPR;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  seedConst(W,H); seedDust(W,H);
}
resize();
window.addEventListener("resize", resize);

var mx=0, my=0, tmx=0, tmy=0;
window.addEventListener("pointermove", function(e){
  var r = canvas.getBoundingClientRect();
  if(r.width>0){ tmx=(e.clientX-r.left)/r.width-0.5; tmy=(e.clientY-r.top)/r.height-0.5; }
}, {passive:true});

var running=true, inView=true;
document.addEventListener("visibilitychange", function(){ running=!document.hidden; });
if("IntersectionObserver" in window){
  new IntersectionObserver(function(es){ inView=es[0].isIntersecting; }).observe(canvas);
}

function rot(p, ax, ay){
  var x=p[0], y=p[1], z=p[2];
  var x1=x*Math.cos(ay)+z*Math.sin(ay), z1=-x*Math.sin(ay)+z*Math.cos(ay);
  var y1=y*Math.cos(ax)-z1*Math.sin(ax), z2=y*Math.sin(ax)+z1*Math.cos(ax);
  return [x1,y1,z2];
}

var t=0, meteorT=0;
function frame(){
  requestAnimationFrame(frame);
  if(!running || !inView) return;
  refreshGold();
  t += 0.016;
  mx += (tmx-mx)*0.04; my += (tmy-my)*0.04;
  ctx.clearRect(0,0,W,H);

  var cx = W*0.5, cy = H*0.48; /* centered in the visual stage panel */
  var R = Math.min(W,H)*0.30;
  var pulse = 0.75 + 0.25*Math.sin(t*2.1);

  /* --- glowing core --- */
  var g = ctx.createRadialGradient(cx,cy,0, cx,cy,R*1.7);
  g.addColorStop(0, "rgba("+GOLD+","+(0.34*pulse+0.10).toFixed(3)+")");
  g.addColorStop(0.45, "rgba("+GOLD+","+(0.16*pulse).toFixed(3)+")");
  g.addColorStop(1, "rgba("+GOLD+",0)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx,cy,R*1.7,0,6.2832); ctx.fill();
  /* bright heart */
  var g2 = ctx.createRadialGradient(cx,cy,0, cx,cy,R*0.42*pulse+R*0.1);
  g2.addColorStop(0, "rgba(255,225,150,0.85)");
  g2.addColorStop(0.5, "rgba("+GOLD+",0.35)");
  g2.addColorStop(1, "rgba("+GOLD+",0)");
  ctx.fillStyle = g2;
  ctx.beginPath(); ctx.arc(cx,cy,R*0.42*pulse+R*0.1,0,6.2832); ctx.fill();

  /* --- orbit rings + electrons --- */
  for(var ri=0; ri<rings.length; ri++){
    var rg = rings[ri];
    ctx.save();
    ctx.strokeStyle = "rgba("+GOLD+",0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rg.rx*R, rg.ry*R, rg.tilt, 0, 6.2832);
    ctx.stroke();
    ctx.restore();
    for(var ei=0; ei<rg.e.length; ei++){
      var el = rg.e[ei];
      el.a += rg.speed*0.016;
      var ex = Math.cos(el.a)*rg.rx, ey = Math.sin(el.a)*rg.ry;
      var px = cx + (ex*Math.cos(rg.tilt) - ey*Math.sin(rg.tilt))*R;
      var py = cy + (ex*Math.sin(rg.tilt) + ey*Math.cos(rg.tilt))*R;
      var eg = ctx.createRadialGradient(px,py,0, px,py,el.s*3.2);
      eg.addColorStop(0,"rgba(255,235,180,0.95)");
      eg.addColorStop(0.4,"rgba("+GOLD+",0.55)");
      eg.addColorStop(1,"rgba("+GOLD+",0)");
      ctx.fillStyle = eg;
      ctx.beginPath(); ctx.arc(px,py,el.s*3.2,0,6.2832); ctx.fill();
    }
  }

  /* --- icosahedron wireframe shell --- */
  var ax = t*0.55 + my*0.7, ay = t*0.8 + mx*1.0;
  var fov = 3.4;
  var pts = verts.map(function(v){
    var q = rot([v[0]*R, v[1]*R, v[2]*R], ax, ay);
    var s = fov/(fov + (q[2]/R)*0.9);
    return [cx+q[0]*s, cy+q[1]*s, s, q[2]/R];
  });
  for(var k=0;k<edges.length;k++){
    var e=edges[k], a=pts[e[0]], b=pts[e[1]];
    var depth=(a[3]+b[3])/2;
    var alpha=0.10+0.30*(0.5-depth*0.5);
    ctx.strokeStyle="rgba("+GOLD+","+alpha.toFixed(3)+")";
    ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke();
  }
  for(var vi=0;vi<pts.length;vi++){
    var p=pts[vi];
    ctx.fillStyle="rgba("+GOLD+",0.6)";
    ctx.beginPath(); ctx.arc(p[0],p[1],1.8*p[2],0,6.2832); ctx.fill();
  }

  /* --- constellation web --- */
  var i2, j2, dx2, dy2, d2;
  for(i2=0;i2<cpts.length;i2++){
    var cp=cpts[i2];
    cp.x+=cp.vx; cp.y+=cp.vy;
    if(cp.x<0||cp.x>W) cp.vx*=-1;
    if(cp.y<0||cp.y>H) cp.vy*=-1;
  }
  ctx.lineWidth=1;
  for(i2=0;i2<cpts.length;i2++){
    for(j2=i2+1;j2<cpts.length;j2++){
      dx2=cpts[i2].x-cpts[j2].x; dy2=cpts[i2].y-cpts[j2].y;
      d2=Math.sqrt(dx2*dx2+dy2*dy2);
      if(d2<115){
        ctx.strokeStyle="rgba("+GOLD+","+((1-d2/115)*0.20).toFixed(3)+")";
        ctx.beginPath(); ctx.moveTo(cpts[i2].x,cpts[i2].y); ctx.lineTo(cpts[j2].x,cpts[j2].y); ctx.stroke();
      }
    }
  }
  for(i2=0;i2<cpts.length;i2++){
    ctx.fillStyle="rgba("+GOLD+",0.5)";
    ctx.beginPath(); ctx.arc(cpts[i2].x,cpts[i2].y,cpts[i2].r,0,6.2832); ctx.fill();
  }

  /* --- shooting stars --- */
  meteorT++;
  if(meteorT > 160 && Math.random()<0.02 && meteors.length<2){ spawnMeteor(W,H); meteorT=0; }
  for(var mi=meteors.length-1; mi>=0; mi--){
    var mt=meteors[mi];
    mt.x+=mt.vx; mt.y+=mt.vy; mt.life-=mt.decay;
    if(mt.life<=0 || mt.x<-120 || mt.y>H+120){ meteors.splice(mi,1); continue; }
    var tx=mt.x-mt.vx*mt.len*0.06, ty=mt.y-mt.vy*mt.len*0.06;
    var mg=ctx.createLinearGradient(mt.x,mt.y,tx,ty);
    mg.addColorStop(0,"rgba(255,240,200,"+(0.9*mt.life).toFixed(3)+")");
    mg.addColorStop(1,"rgba("+GOLD+",0)");
    ctx.strokeStyle=mg; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(mt.x,mt.y); ctx.lineTo(tx,ty); ctx.stroke();
  }

  /* --- ambient dust --- */
  for(var d=0;d<dust.length;d++){
    var dp=dust[d];
    dp.y-=dp.s; dp.x+=Math.sin(t*1.4+dp.ph)*0.08;
    if(dp.y<-4){ dp.y=H+4; dp.x=Math.random()*W; }
    var tw=0.25+0.55*Math.abs(Math.sin(t*1.8+dp.ph));
    ctx.fillStyle="rgba("+GOLD+","+(tw*0.5*dp.z+0.07).toFixed(3)+")";
    ctx.beginPath(); ctx.arc(dp.x,dp.y,dp.r*(0.5+dp.z),0,6.2832); ctx.fill();
  }
}
frame();
})();
